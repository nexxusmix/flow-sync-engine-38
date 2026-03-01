import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Clock, Copy, MessageSquare, ArrowRight, AlertTriangle, Calendar, DollarSign, Send, Package, Zap, Users } from "lucide-react";
import { ActionItem } from "@/hooks/useActionItems";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const typeConfig: Record<string, { icon: typeof Check; color: string; label: string }> = {
  follow_up: { icon: Users, color: "text-primary", label: "Follow-up" },
  deadline: { icon: Calendar, color: "text-muted-foreground", label: "Prazo" },
  delivery: { icon: Package, color: "text-primary", label: "Entrega" },
  production_step: { icon: Zap, color: "text-primary/70", label: "Produção" },
  financial: { icon: DollarSign, color: "text-destructive", label: "Financeiro" },
  message_draft: { icon: MessageSquare, color: "text-primary", label: "Mensagem" },
  alert: { icon: AlertTriangle, color: "text-muted-foreground", label: "Alerta" },
  meeting: { icon: Users, color: "text-primary/70", label: "Reunião" },
};

const priorityConfig: Record<string, { bg: string; text: string }> = {
  P0: { bg: "bg-red-500/20", text: "text-red-400" },
  P1: { bg: "bg-amber-500/20", text: "text-amber-400" },
  P2: { bg: "bg-blue-500/20", text: "text-blue-400" },
  P3: { bg: "bg-muted/30", text: "text-muted-foreground" },
};

interface ActionCardProps {
  item: ActionItem;
  onComplete: (id: string) => void;
  onSnooze: (id: string, until: string) => void;
  onGenerateMessage: (item: ActionItem) => void;
  compact?: boolean;
}

export function ActionCard({ item, onComplete, onSnooze, onGenerateMessage, compact }: ActionCardProps) {
  const [showSnooze, setShowSnooze] = useState(false);
  const config = typeConfig[item.type] || typeConfig.alert;
  const prio = priorityConfig[item.priority] || priorityConfig.P2;
  const Icon = config.icon;

  const snoozeOptions = [
    { label: "1h", value: new Date(Date.now() + 3600000).toISOString() },
    { label: "3h", value: new Date(Date.now() + 10800000).toISOString() },
    { label: "Amanhã", value: new Date(Date.now() + 86400000).toISOString() },
    { label: "7 dias", value: new Date(Date.now() + 604800000).toISOString() },
  ];

  const dueLabel = item.due_at
    ? (() => {
        const diff = Math.ceil((new Date(item.due_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (diff < 0) return `D+${Math.abs(diff)} atrasado`;
        if (diff === 0) return "Hoje";
        if (diff === 1) return "Amanhã";
        return `em ${diff}d`;
      })()
    : null;

  if (compact) {
    return (
      <motion.div
        className="glass-card rounded-xl p-3 cursor-pointer group hover:border-primary/30 transition-all min-w-[220px] max-w-[280px] flex-shrink-0"
        whileHover={{ scale: 1.02, y: -2 }}
        
      >
        <div className="flex items-start gap-2.5">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", config.color.replace("text-", "bg-").replace("-400", "-500/15"))}>
            <Icon className={cn("w-4 h-4", config.color)} strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-normal text-foreground truncate">{item.title}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full font-mono uppercase", prio.bg, prio.text)}>{item.priority}</span>
              {dueLabel && <span className="text-[8px] text-muted-foreground font-mono">{dueLabel}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onComplete(item.id); }} className="w-6 h-6 rounded-md bg-emerald-500/15 flex items-center justify-center hover:bg-emerald-500/30 transition-colors" title="Concluir">
            <Check className="w-3 h-3 text-emerald-400" strokeWidth={1.5} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onGenerateMessage(item); }} className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center hover:bg-primary/30 transition-colors" title="Gerar mensagem IA">
            <MessageSquare className="w-3 h-3 text-primary" strokeWidth={1.5} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setShowSnooze(!showSnooze); }} className="w-6 h-6 rounded-md bg-amber-500/15 flex items-center justify-center hover:bg-amber-500/30 transition-colors" title="Adiar">
            <Clock className="w-3 h-3 text-amber-400" strokeWidth={1.5} />
          </button>
        </div>
        {showSnooze && (
          <div className="flex items-center gap-1 mt-1.5">
            {snoozeOptions.map(opt => (
              <button key={opt.label} onClick={(e) => { e.stopPropagation(); onSnooze(item.id, opt.value); setShowSnooze(false); }} className="text-[7px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground hover:bg-muted/60 transition-colors font-mono">
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="glass-card rounded-2xl p-4 group hover:border-primary/20 transition-all"
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", config.color.replace("text-", "bg-").replace("-400", "-500/15"))}>
          <Icon className={cn("w-5 h-5", config.color)} strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full font-mono uppercase", prio.bg, prio.text)}>{item.priority}</span>
            <span className="text-[8px] text-muted-foreground font-mono uppercase">{config.label}</span>
            {item.source === "ai" && <span className="text-[8px] text-primary font-mono uppercase">IA</span>}
          </div>
          <p className="text-sm font-normal text-foreground">{item.title}</p>
          {item.description && <p className="text-[11px] text-muted-foreground font-light mt-1 line-clamp-2">{item.description}</p>}
          {dueLabel && (
            <div className="flex items-center gap-1 mt-2">
              <Calendar className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
              <span className={cn("text-[9px] font-mono", item.due_at && new Date(item.due_at) < new Date() ? "text-red-400" : "text-muted-foreground")}>{dueLabel}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
        <button onClick={() => onComplete(item.id)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-[10px] font-mono uppercase">
          <Check className="w-3 h-3" strokeWidth={1.5} /> Concluir
        </button>
        <button onClick={() => onGenerateMessage(item)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[10px] font-mono uppercase">
          <MessageSquare className="w-3 h-3" strokeWidth={1.5} /> Msg IA
        </button>
        <button onClick={() => setShowSnooze(!showSnooze)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors text-[10px] font-mono uppercase">
          <Clock className="w-3 h-3" strokeWidth={1.5} /> Adiar
        </button>
        {item.metadata?.financialRef && (
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-[10px] font-mono uppercase ml-auto">
            <DollarSign className="w-3 h-3" strokeWidth={1.5} /> Cobrança IA →
          </button>
        )}
      </div>

      {showSnooze && (
        <motion.div
          className="flex items-center gap-2 mt-2"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          {snoozeOptions.map(opt => (
            <button key={opt.label} onClick={() => { onSnooze(item.id, opt.value); setShowSnooze(false); }} className="text-[9px] px-2.5 py-1 rounded-lg bg-muted/30 text-muted-foreground hover:bg-muted/50 transition-colors font-mono">
              {opt.label}
            </button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
