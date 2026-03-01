import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check, Clock, MessageSquare, AlertTriangle, Calendar,
  DollarSign, Package, Zap, Users, FileText, Phone,
  Send, Mail, Video, Mic, PenTool, Briefcase,
  Target, Bell, CreditCard, Receipt, Truck,
  ClipboardCheck, Settings, Megaphone, Scissors,
} from "lucide-react";
import { ActionItem } from "@/hooks/useActionItems";
import { cn } from "@/lib/utils";

const typeConfig: Record<string, { icon: typeof Check; label: string }> = {
  follow_up:       { icon: Users,          label: "Follow-up" },
  deadline:        { icon: Calendar,       label: "Prazo" },
  delivery:        { icon: Package,        label: "Entrega" },
  production_step: { icon: Zap,            label: "Produção" },
  financial:       { icon: CreditCard,     label: "Financeiro" },
  message_draft:   { icon: Mail,           label: "Mensagem" },
  alert:           { icon: Bell,           label: "Alerta" },
  meeting:         { icon: Video,          label: "Reunião" },
  call:            { icon: Phone,          label: "Ligação" },
  send:            { icon: Send,           label: "Envio" },
  review:          { icon: ClipboardCheck, label: "Revisão" },
  edit:            { icon: PenTool,        label: "Edição" },
  recording:       { icon: Mic,            label: "Gravação" },
  proposal:        { icon: FileText,       label: "Proposta" },
  campaign:        { icon: Megaphone,      label: "Campanha" },
  cut:             { icon: Scissors,       label: "Corte" },
  contract:        { icon: Briefcase,      label: "Contrato" },
  invoice:         { icon: Receipt,        label: "Fatura" },
  shipping:        { icon: Truck,          label: "Logística" },
  config:          { icon: Settings,       label: "Config" },
  target:          { icon: Target,         label: "Meta" },
};

const priorityConfig: Record<string, { bg: string; text: string }> = {
  P0: { bg: "bg-destructive/20", text: "text-destructive" },
  P1: { bg: "bg-destructive/10", text: "text-destructive/80" },
  P2: { bg: "bg-primary/15", text: "text-primary" },
  P3: { bg: "bg-muted/30", text: "text-muted-foreground" },
};

// Map task type to a contextual icon based on title keywords
function resolveIcon(item: ActionItem) {
  const title = (item.title || "").toLowerCase();
  const type = item.type;

  // Financial subtypes
  if (type === "financial") {
    if (title.includes("fatura") || title.includes("parcela")) return Receipt;
    if (title.includes("cobrança")) return DollarSign;
    return CreditCard;
  }
  // Alert subtypes
  if (type === "alert") {
    if (title.includes("tarefa") && title.includes("atrasada")) return AlertTriangle;
    if (title.includes("revisar") || title.includes("revisão")) return ClipboardCheck;
    if (title.includes("gravar") || title.includes("gravação")) return Mic;
    if (title.includes("editar") || title.includes("edição") || title.includes("motion")) return PenTool;
    if (title.includes("corte")) return Scissors;
    if (title.includes("vídeo") || title.includes("video")) return Video;
    if (title.includes("proposta") || title.includes("enviar")) return Send;
    return Bell;
  }
  // Deadline subtypes
  if (type === "deadline") {
    if (title.includes("vídeo") || title.includes("video")) return Video;
    if (title.includes("entrega")) return Truck;
    return Calendar;
  }
  // Production subtypes
  if (type === "production_step") {
    if (title.includes("gravar")) return Mic;
    if (title.includes("editar") || title.includes("motion")) return PenTool;
    if (title.includes("corte")) return Scissors;
    return Zap;
  }

  return typeConfig[type]?.icon || Bell;
}

// Icon animation variants per type
const iconAnimations: Record<string, any> = {
  alert:           { rotate: [0, -12, 12, -8, 8, 0], transition: { duration: 0.6, ease: "easeInOut" } },
  financial:       { y: [0, -3, 0], transition: { duration: 0.5, ease: "easeInOut" } },
  deadline:        { scale: [1, 1.15, 1], transition: { duration: 0.5, ease: "easeInOut" } },
  delivery:        { x: [0, 4, 0], transition: { duration: 0.5, ease: "easeInOut" } },
  follow_up:       { scale: [1, 1.1, 1], transition: { duration: 0.4, ease: "easeInOut" } },
  production_step: { rotate: [0, 15, -15, 0], transition: { duration: 0.5, ease: "easeInOut" } },
  meeting:         { scale: [1, 1.1, 1], transition: { duration: 0.4, ease: "easeInOut" } },
  message_draft:   { y: [0, -2, 0], transition: { duration: 0.4, ease: "easeInOut" } },
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
  const [isHovered, setIsHovered] = useState(false);
  const config = typeConfig[item.type] || typeConfig.alert;
  const prio = priorityConfig[item.priority] || priorityConfig.P2;
  const ResolvedIcon = resolveIcon(item);
  const hoverAnim = iconAnimations[item.type] || iconAnimations.alert;

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

  const isOverdue = item.due_at && new Date(item.due_at) < new Date();
  const iconColor = isOverdue ? "text-destructive" : "text-primary";
  const iconBg = isOverdue ? "bg-destructive/10" : "bg-primary/10";

  if (compact) {
    return (
      <motion.div
        className="glass-card rounded-xl p-3 cursor-pointer group hover:border-primary/30 transition-all min-w-[220px] max-w-[280px] flex-shrink-0"
        whileHover={{ scale: 1.02, y: -2 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <div className="flex items-start gap-2.5">
          <motion.div
            className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", iconBg)}
            animate={isHovered ? hoverAnim : {}}
          >
            <ResolvedIcon className={cn("w-4 h-4", iconColor)} strokeWidth={1.5} />
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-normal text-foreground truncate">{item.title}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full font-mono uppercase", prio.bg, prio.text)}>{item.priority}</span>
              {dueLabel && (
                <span className={cn("text-[8px] font-mono", isOverdue ? "text-destructive" : "text-muted-foreground")}>
                  {dueLabel}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onComplete(item.id); }} className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors" title="Concluir">
            <Check className="w-3 h-3 text-primary" strokeWidth={1.5} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onGenerateMessage(item); }} className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors" title="Gerar mensagem IA">
            <MessageSquare className="w-3 h-3 text-primary" strokeWidth={1.5} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setShowSnooze(!showSnooze); }} className="w-6 h-6 rounded-md bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors" title="Adiar">
            <Clock className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
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
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        <motion.div
          className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", iconBg)}
          animate={isHovered ? hoverAnim : {}}
        >
          <ResolvedIcon className={cn("w-5 h-5", iconColor)} strokeWidth={1.5} />
        </motion.div>
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
              <span className={cn("text-[9px] font-mono", isOverdue ? "text-destructive" : "text-muted-foreground")}>{dueLabel}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
        <motion.button
          onClick={() => onComplete(item.id)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[10px] font-mono uppercase"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Check className="w-3 h-3" strokeWidth={1.5} /> Concluir
        </motion.button>
        <motion.button
          onClick={() => onGenerateMessage(item)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[10px] font-mono uppercase"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <MessageSquare className="w-3 h-3" strokeWidth={1.5} /> Msg IA
        </motion.button>
        <motion.button
          onClick={() => setShowSnooze(!showSnooze)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/20 text-muted-foreground hover:bg-muted/40 transition-colors text-[10px] font-mono uppercase"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Clock className="w-3 h-3" strokeWidth={1.5} /> Adiar
        </motion.button>
        {item.metadata?.financialRef && (
          <motion.button
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-[10px] font-mono uppercase ml-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <DollarSign className="w-3 h-3" strokeWidth={1.5} /> Cobrança IA →
          </motion.button>
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
