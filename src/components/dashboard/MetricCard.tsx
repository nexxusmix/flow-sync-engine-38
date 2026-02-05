import { LucideIcon, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

interface MetricCardProps {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
  index?: number;
}

export function MetricCard({ label, value, trend, trendUp, icon: Icon, index = 0 }: MetricCardProps) {
  return (
    <motion.div 
      className="glass-card rounded-[2rem] p-6 group transition-colors duration-500 border border-transparent"
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.1,
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      }}
      whileHover={{ 
        y: -8,
        scale: 1.02,
        borderColor: "rgba(0, 163, 211, 0.2)",
        boxShadow: "0 20px 40px -20px rgba(0, 163, 211, 0.3)",
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between mb-4">
        <motion.div 
          className="icon-box"
          whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.3 }}
        >
          <Icon className="w-5 h-5 text-primary" />
        </motion.div>
        {trend && (
          <motion.span 
            className={`text-[10px] font-normal uppercase tracking-wider flex items-center gap-1 ${trendUp ? 'text-success' : 'text-destructive'}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            {trend}
            <motion.div
              animate={{ y: trendUp ? [0, -2, 0] : [0, 2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowUpRight className={`w-3 h-3 ${!trendUp && 'rotate-90'}`} />
            </motion.div>
          </motion.span>
        )}
      </div>
      <div className="space-y-1">
        <motion.p 
          className="kpi-value"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 + index * 0.1, type: "spring" as const, stiffness: 100 }}
        >
          {value}
        </motion.p>
        <p className="kpi-label">{label}</p>
      </div>
    </motion.div>
  );
}
