import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2, Merge, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Portal } from "@/components/ui/Portal";

interface DuplicateGroup {
  group: string[];
  reason: string;
  keep: string;
  merge_title: string;
  tasks: Array<{ id: string; title: string; category: string; status: string }>;
}

export function TaskDuplicateDetection() {
  const qc = useQueryClient();
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const detect = async () => {
    setLoading(true);
    setShowPanel(true);
    try {
      const { data, error } = await supabase.functions.invoke("detect-duplicate-tasks");
      if (error) throw error;
      setDuplicates(data?.duplicates || []);
      if (!data?.duplicates?.length) toast.info("Nenhuma duplicata encontrada! 🎉");
    } catch (err: any) {
      toast.error(err.message || "Erro na detecção");
    } finally {
      setLoading(false);
    }
  };

  const mergeDuplicates = async (group: DuplicateGroup) => {
    try {
      // Update the kept task with merged title
      const { error: updateErr } = await supabase
        .from("tasks")
        .update({ title: group.merge_title })
        .eq("id", group.keep);
      if (updateErr) throw updateErr;

      // Delete the others
      const toDelete = group.group.filter(id => id !== group.keep);
      for (const id of toDelete) {
        await supabase.from("tasks").delete().eq("id", id);
      }

      setDuplicates(prev => prev.filter(d => d.keep !== group.keep));
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(`${toDelete.length} duplicata(s) removida(s)!`);
    } catch {
      toast.error("Erro ao mesclar");
    }
  };

  const dismissGroup = (keep: string) => {
    setDuplicates(prev => prev.filter(d => d.keep !== keep));
  };

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={detect} disabled={loading}>
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
        <span className="hidden lg:inline">Duplicatas</span>
      </Button>

      <Portal>
      <AnimatePresence>
        {showPanel && duplicates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-4 right-4 z-50 w-[420px] max-h-[60vh] overflow-y-auto rounded-xl border border-white/[0.08] bg-card shadow-2xl"
          >
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Duplicatas Detectadas</h3>
                <p className="text-mono text-muted-foreground">{duplicates.length} grupo(s)</p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowPanel(false)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="p-2 space-y-2">
              {duplicates.map((group, i) => (
                <motion.div
                  key={i}
                  layout
                  className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-2"
                >
                  <div className="space-y-1">
                    {group.tasks.map((t) => (
                      <div
                        key={t.id}
                        className={cn(
                          "flex items-center gap-2 text-xs p-1.5 rounded",
                          t.id === group.keep ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                        )}
                      >
                        {t.id === group.keep && <span className="text-caption uppercase tracking-wider">manter</span>}
                        <span className="truncate flex-1">"{t.title}"</span>
                        <span className="text-caption text-muted-foreground/50">[{t.status}]</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-body-sm text-muted-foreground/60">{group.reason}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-mono text-muted-foreground/40">
                      Título sugerido: "{group.merge_title}"
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 text-muted-foreground" onClick={() => dismissGroup(group.keep)}>
                        Ignorar
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 text-emerald-500" onClick={() => mergeDuplicates(group)}>
                        <Merge className="w-3 h-3" /> Mesclar
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </Portal>
    </>
  );
}
