import { LucideIcon, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "bento-card group cursor-pointer glow-hover",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-secondary">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
        {trend && (
          <p
            className={cn(
              "text-sm font-medium",
              trend.isPositive ? "text-success" : "text-destructive"
            )}
          >
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}% vs mês anterior
          </p>
        )}
      </div>
    </div>
  );
}
