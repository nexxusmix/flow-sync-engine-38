import { useState } from "react";
import { useWebhooks, AVAILABLE_EVENTS } from "@/hooks/useWebhooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Copy, Webhook, CheckCircle2, XCircle, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export function WebhookManager() {
  const { webhooks, isLoading, createWebhook, updateWebhook, deleteWebhook } = useWebhooks();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([]);

  const handleCreate = () => {
    if (!name.trim() || !url.trim()) return;
    createWebhook.mutate(
      { name: name.trim(), url: url.trim(), events },
      { onSuccess: () => { setName(""); setUrl(""); setEvents([]); setCreateOpen(false); } }
    );
  };

  const toggleEvent = (event: string) => {
    setEvents((prev) => prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]);
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success("Secret copiado");
  };

  const inboundUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-inbound`;

  if (isLoading) {
    return <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-light text-foreground">Webhooks</h3>
          <p className="text-xs text-muted-foreground mt-1">Envie e receba dados de sistemas externos</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" />Novo Webhook</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-light">Criar Webhook</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Nome</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: n8n Automação" className="mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">URL de destino</label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Eventos</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {AVAILABLE_EVENTS.map((ev) => (
                    <label key={ev} className="flex items-center gap-2 text-xs cursor-pointer">
                      <Checkbox checked={events.includes(ev)} onCheckedChange={() => toggleEvent(ev)} />
                      <span className="text-muted-foreground">{ev}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} disabled={!name.trim() || !url.trim() || createWebhook.isPending} className="w-full">
                {createWebhook.isPending ? "Criando..." : "Criar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Inbound URL */}
      <div className="p-3 rounded-lg bg-card/50 border border-border/50">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">URL de Webhook de Entrada</p>
        <div className="flex items-center gap-2">
          <code className="text-xs text-primary flex-1 truncate">{inboundUrl}?token=SEU_TOKEN</code>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(inboundUrl); toast.success("URL copiada"); }}>
            <Copy className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Webhooks list */}
      <div className="space-y-2">
        <AnimatePresence>
          {webhooks.map((wh, i) => (
            <motion.div
              key={wh.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="p-4 rounded-xl bg-card/50 border border-border/50 hover:border-border transition-colors"
            >
              <div className="flex items-center gap-3">
                <Webhook className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{wh.name}</span>
                    <Switch
                      checked={wh.is_active}
                      onCheckedChange={(v) => updateWebhook.mutate({ id: wh.id, is_active: v })}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{wh.url}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copySecret(wh.secret)}>
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive"
                    onClick={() => deleteWebhook.mutate(wh.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {wh.events.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 ml-8">
                  {wh.events.map((ev) => (
                    <Badge key={ev} variant="outline" className="text-[10px] bg-primary/5 border-primary/20 text-primary">
                      {ev}
                    </Badge>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {webhooks.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            Nenhum webhook configurado ainda.
          </div>
        )}
      </div>
    </div>
  );
}
