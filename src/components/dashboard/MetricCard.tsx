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
      initial={{ opacity: 0, y: 30, scale: 0.92, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{ 
        delay: index * 0.1,
        type: "spring" as const,
        stiffness: 80,
        damping: 18,
      }}
      whileHover={{ 
        y: -4,
        scale: 1.01,
      }}
      whileTap={{ scale: 0.98 }}
      
    >
      <div className="flex items-start justify-between mb-4">
        <motion.div 
          className="icon-box"
           initial={{ opacity: 0, scale: 0, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 200 }}
          whileHover={{ scale: 1.15, rotate: [0, -8, 8, 0] }}
        >
          <Icon className="w-5 h-5 text-primary" />
        </motion.div>
        {trend && (
          <motion.span 
            className={`text-[11px] font-normal uppercase tracking-wider flex items-center gap-1 ${trendUp ? 'text-success' : 'text-destructive'}`}
            initial={{ opacity: 0, x: 15, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.4 + index * 0.1 }}
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
          initial={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.3 + index * 0.1, type: "spring" as const, stiffness: 100 }}
        >
          {value}
        </motion.p>
        <motion.p 
          className="kpi-label"
          initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.4 + index * 0.1 }}
        >
          {label}
        </motion.p>
      </div>
    </motion.div>
  );
}
