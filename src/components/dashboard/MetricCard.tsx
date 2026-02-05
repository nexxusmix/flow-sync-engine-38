import { LucideIcon, ArrowUpRight } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
}

export function MetricCard({ label, value, trend, trendUp, icon: Icon }: MetricCardProps) {
  return (
    <div className="glass-card rounded-[2rem] p-6 group hover:border-primary/20 transition-all duration-500">
      <div className="flex items-start justify-between mb-4">
        <div className="icon-box">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {trend && (
          <span className={`text-[10px] font-normal uppercase tracking-wider flex items-center gap-1 ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend}
            <ArrowUpRight className={`w-3 h-3 ${!trendUp && 'rotate-90'}`} />
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="kpi-value">{value}</p>
        <p className="kpi-label">{label}</p>
      </div>
    </div>
  );
}
