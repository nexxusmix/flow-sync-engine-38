import { useEffect, useState } from "react";
import { MkAppShell } from "@/components/marketing-hub/MkAppShell";
import { MkCard, MkStatusBadge, MkEmptyState } from "@/components/marketing-hub/mk-ui";
import { useMarketingStore } from "@/stores/marketingStore";
import { ContentItem, CONTENT_ITEM_STAGES, ContentItemStatus, CONTENT_CHANNELS } from "@/types/marketing";
import { motion } from "framer-motion";
import { Plus, Search, List, LayoutGrid } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const stageVariant: Record<string, "blue" | "amber" | "emerald" | "purple" | "red" | "slate" | "cyan"> = {
  briefing: "slate",
  writing: "blue",
  recording: "purple",
  editing: "amber",
  review: "amber",
  approved: "emerald",
  scheduled: "cyan",
  published: "blue",
  archived: "slate",
};

export default function MkContentsPage() {
  const { contentItems, fetchContentItems, createContentItem, updateContentStatus, deleteContentItem, campaigns, fetchCampaigns } = useMarketingStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [view, setView] = useState<"grid" | "kanban">("grid");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", channel: "", format: "", status: "briefing" });

  useEffect(() => { fetchContentItems(); fetchCampaigns(); }, []);

  const filtered = contentItems.filter(i => {
    if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    return true;
  });

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error("Título obrigatório"); return; }
    await createContentItem({ title: form.title, channel: (form.channel || undefined) as any, format: (form.format || undefined) as any, status: form.status as ContentItemStatus });
    toast.success("Conteúdo criado!");
    setDialogOpen(false);
    setForm({ title: "", channel: "", format: "", status: "briefing" });
  };

  return (
    <MkAppShell title="Conteúdos">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Pipeline de Conteúdos</h1>
          <p className="text-sm text-white/30 mt-1">{contentItems.length} itens no total</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[hsl(210,100%,55%)]/40" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="py-2.5 px-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/60 focus:outline-none">
            <option value="all">Todos</option>
            {CONTENT_ITEM_STAGES.map(s => <option key={s.type} value={s.type}>{s.name}</option>)}
          </select>
          <div className="flex rounded-xl border border-white/[0.06] overflow-hidden">
            <button onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-[hsl(210,100%,55%)]/20 text-[hsl(210,100%,65%)]" : "text-white/30 hover:text-white/60"}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setView("kanban")} className={`p-2 ${view === "kanban" ? "bg-[hsl(210,100%,55%)]/20 text-[hsl(210,100%,65%)]" : "text-white/30 hover:text-white/60"}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(210,100%,55%)] text-white text-sm font-medium hover:bg-[hsl(210,100%,50%)] transition-colors shrink-0">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <MkEmptyState icon="article" title="Nenhum conteúdo" description="Crie seu primeiro conteúdo para começar o pipeline." action={{ label: "Novo Conteúdo", onClick: () => setDialogOpen(true) }} />
      ) : view === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {CONTENT_ITEM_STAGES.map(stage => {
            const items = filtered.filter(i => i.status === stage.type);
            return (
              <div key={stage.type} className="min-w-[280px] flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <MkStatusBadge label={stage.name} variant={stageVariant[stage.type] || "slate"} />
                  <span className="text-[11px] text-white/20">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map(item => <ContentCard key={item.id} item={item} onStatusChange={updateContentStatus} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <ContentCard item={item} onStatusChange={updateContentStatus} />
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111114] border-white/[0.08] text-white max-w-lg">
          <DialogHeader><DialogTitle className="text-lg font-semibold text-white/90">Novo Conteúdo</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-white/50 text-xs">Título *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-white/[0.04] border-white/[0.08] text-white mt-1" placeholder="Reel de lançamento" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/50 text-xs">Canal</Label>
                <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                  className="w-full mt-1 py-2.5 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white/70">
                  <option value="">Selecionar</option>
                  {CONTENT_CHANNELS.map(c => <option key={c.type} value={c.type}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-white/50 text-xs">Status</Label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full mt-1 py-2.5 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white/70">
                  {CONTENT_ITEM_STAGES.map(s => <option key={s.type} value={s.type}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <button onClick={handleCreate} className="w-full py-2.5 rounded-xl bg-[hsl(210,100%,55%)] text-white text-sm font-medium hover:bg-[hsl(210,100%,50%)] transition-colors">
              Criar Conteúdo
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </MkAppShell>
  );
}

function ContentCard({ item, onStatusChange }: { item: ContentItem; onStatusChange: (id: string, status: ContentItemStatus) => void }) {
  const stage = CONTENT_ITEM_STAGES.find(s => s.type === item.status);
  const channel = CONTENT_CHANNELS.find(c => c.type === item.channel);
  return (
    <MkCard hover className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <MkStatusBadge label={stage?.name || item.status} variant={stageVariant[item.status] || "slate"} />
        {channel && <span className="text-[10px] text-white/30">{channel.name}</span>}
      </div>
      <h4 className="text-sm font-medium text-white/80 line-clamp-2">{item.title}</h4>
      <div className="flex items-center gap-3 text-[11px] text-white/25 mt-auto pt-2 border-t border-white/[0.04]">
        {item.due_at && <span>{format(new Date(item.due_at), "dd MMM", { locale: ptBR })}</span>}
        {item.owner_initials && (
          <span className="ml-auto w-6 h-6 rounded-full bg-[hsl(210,100%,55%)]/15 text-[hsl(210,100%,65%)] flex items-center justify-center text-[9px] font-medium">
            {item.owner_initials}
          </span>
        )}
      </div>
    </MkCard>
  );
}
