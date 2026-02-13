import { motion } from "framer-motion";
import { Zap, ArrowRight, AlertTriangle } from "lucide-react";
import { useActionItems } from "@/hooks/useActionItems";
import { Link } from "react-router-dom";

export function ActionHubOverviewCard() {
  const { items } = useActionItems();
  const openCount = items.filter(i => i.status === "open").length;
  const p0Items = items.filter(i => i.priority === "P0");
  const criticalItem = p0Items[0];

  return (
    <motion.div
      className="glass-card rounded-2xl p-5 hover:border-primary/20 transition-all"
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
          <Zap className="w-5 h-5 text-primary" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-normal text-foreground uppercase tracking-wider">Central de Ações</h3>
          <span className="text-[9px] text-muted-foreground font-mono">{openCount} ações abertas</span>
        </div>
        {p0Items.length > 0 && (
          <span className="text-[8px] px-2 py-1 rounded-full bg-red-500/20 text-red-400 font-mono animate-pulse">
            {p0Items.length} P0
          </span>
        )}
      </div>

      {criticalItem && (
        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" strokeWidth={1.5} />
            <p className="text-[11px] text-red-400 truncate">{criticalItem.title}</p>
          </div>
        </div>
      )}

      <Link
        to="/central-acoes"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[10px] font-mono uppercase"
      >
        Abrir Central <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
      </Link>
    </motion.div>
  );
}
