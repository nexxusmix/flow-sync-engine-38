import { cn } from "@/lib/utils";

type BadgeVariant =
  | "verified" | "active" | "processing" | "queued"
  | "success" | "warning" | "danger" | "info"
  | "blue" | "amber" | "emerald" | "purple" | "red" | "slate" | "cyan";

const variantStyles: Record<BadgeVariant, string> = {
  verified: "border-primary/30 text-primary",
  active: "border-primary/30 text-primary",
  processing: "border-foreground/15 text-foreground/50",
  queued: "border-foreground/10 text-foreground/30",
  success: "border-success/30 text-success",
  warning: "border-warning/30 text-warning",
  danger: "border-destructive/30 text-destructive",
  info: "border-primary/30 text-primary",
  blue: "border-primary/30 text-primary",
  amber: "border-warning/30 text-warning",
  emerald: "border-success/30 text-success",
  purple: "border-purple-500/30 text-purple-400",
  red: "border-destructive/30 text-destructive",
  slate: "border-foreground/10 text-foreground/40",
  cyan: "border-cyan-500/30 text-cyan-400",
};

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

export function StatusBadge({ label, variant = "verified", dot = false, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-0.5 rounded text-[10px] font-normal tracking-[0.1em] uppercase border",
        variantStyles[variant],
        className
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {label}
    </span>
  );
}
