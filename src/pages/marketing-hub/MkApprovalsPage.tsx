import { useEffect, useState } from "react";
import { MkAppShell } from "@/components/marketing-hub/MkAppShell";
import { MkCard, MkStatusBadge, MkEmptyState } from "@/components/marketing-hub/mk-ui";
import { useMarketingStore } from "@/stores/marketingStore";
import { ContentItem } from "@/types/marketing";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function MkApprovalsPage() {
  const { contentItems, fetchContentItems, updateContentStatus } = useMarketingStore();
  const [filter, setFilter] = useState<"review" | "approved" | "all">("review");

  useEffect(() => { fetchContentItems(); }, []);

  const items = contentItems.filter(i => {
    if (filter === "all") return i.status === "review" || i.status === "approved";
    return i.status === filter;
  });

  const approve = (id: string) => { updateContentStatus(id, "approved"); toast.success("Aprovado!"); };
  const requestChange = (id: string) => { updateContentStatus(id, "editing"); toast.info("Devolvido para edição"); };

  return (
    <MkAppShell title="Aprovações">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Aprovações</h1>
          <p className="text-sm text-white/30 mt-1">{items.length} itens para revisão</p>
        </div>
        <div className="flex rounded-xl border border-white/[0.06] overflow-hidden">
          {(["review", "approved", "all"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 text-xs font-medium transition-colors ${filter === f ? "bg-[hsl(210,100%,55%)]/20 text-[hsl(210,100%,65%)]" : "text-white/30 hover:text-white/60"}`}>
              {f === "review" ? "Em Revisão" : f === "approved" ? "Aprovados" : "Todos"}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <MkEmptyState icon="check_circle" title="Nada para aprovar" description="Conteúdos em revisão aparecerão aqui." />
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
              <MkCard className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white/80 truncate">{item.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <MkStatusBadge label={item.status === "review" ? "Em Revisão" : "Aprovado"} variant={item.status === "approved" ? "emerald" : "amber"} />
                    {item.channel && <span className="text-[10px] text-white/25">{item.channel}</span>}
                  </div>
                </div>
                {item.status === "review" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => approve(item.id)} className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => requestChange(item.id)} className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </MkCard>
            </motion.div>
          ))}
        </div>
      )}
    </MkAppShell>
  );
}
