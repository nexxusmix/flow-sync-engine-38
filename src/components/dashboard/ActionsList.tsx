import { CheckCircle2, Clock, AlertCircle, LucideIcon, CheckCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { motion } from "framer-motion";

interface ActionItem {
  icon: LucideIcon;
  color: string;
  title: string;
  sub: string;
  extra?: string;
  action?: string;
}

const actions: ActionItem[] = [
  { 
    icon: CheckCircle2, 
    color: 'text-emerald-500', 
    title: 'Aprovar Roteiro "BMW"', 
    sub: '10:00 - Cliente aguardando' 
  },
  { 
    icon: Clock, 
    color: 'text-amber-500', 
    title: 'Call de Follow-up (IA)', 
    sub: '14:30 - Coco Bambu', 
    extra: 'Auto' 
  },
  { 
    icon: AlertCircle, 
    color: 'text-red-500', 
    title: 'Fatura em Atraso', 
    sub: 'D+3 - Clínica Bem Estar', 
    action: 'Cobrança IA' 
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

export function ActionsList() {
  const hasActions = actions.length > 0;

  return (
    <motion.div 
      className="glass-card rounded-[2rem] p-6 space-y-4 min-h-[200px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <h3 className="text-[11px] font-light text-muted-foreground uppercase tracking-[0.3em]">Próximas Ações</h3>
      
      {hasActions ? (
        <motion.div 
          className="space-y-1"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {actions.map((item, idx) => (
            <motion.div 
              key={idx}
              variants={itemVariant}
              whileHover={{ 
                x: 8, 
                backgroundColor: "rgba(255,255,255,0.05)",
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.98 }}
              className="flex items-start gap-4 p-4 rounded-2xl cursor-pointer group"
            >
              <motion.div 
                className={`icon-box ${item.color.replace('text-', 'bg-').replace('-500', '-500/20')}`}
                whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
              >
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </motion.div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-normal text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </p>
                <p className="text-[11px] text-muted-foreground font-light">{item.sub}</p>
                {item.extra && (
                  <motion.span 
                    className="badge-info"
                    whileHover={{ scale: 1.05 }}
                  >
                    {item.extra}
                  </motion.span>
                )}
                {item.action && (
                  <motion.span 
                    className="badge-warning cursor-pointer"
                    whileHover={{ scale: 1.05, x: 4 }}
                  >
                    {item.action} →
                  </motion.span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div 
          className="flex flex-col items-center justify-center py-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div 
            className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </motion.div>
          <p className="text-sm text-muted-foreground font-light">Sem ações pendentes</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Agenda livre para hoje</p>
        </motion.div>
      )}
    </motion.div>
  );
}
