import { cn } from "@/lib/utils";

type BadgeVariant = "verified" | "active" | "processing" | "queued" | "blue" | "amber" | "emerald" | "purple" | "red" | "slate" | "cyan";

const variants: Record<BadgeVariant, string> = {
  verified: "border border-[rgba(0,156,202,0.3)] text-[hsl(195,100%,55%)]",
  active: "border border-[rgba(0,156,202,0.3)] text-[hsl(195,100%,55%)]",
  processing: "border border-white/15 text-white/50",
  queued: "border border-white/10 text-white/30",
  blue: "border border-[rgba(0,156,202,0.3)] text-[hsl(195,100%,55%)]",
  amber: "border border-amber-500/30 text-amber-400",
  emerald: "border border-emerald-500/30 text-emerald-400",
  purple: "border border-purple-500/30 text-purple-400",
  red: "border border-red-500/30 text-red-400",
  slate: "border border-white/10 text-white/40",
  cyan: "border border-cyan-500/30 text-cyan-400",
};

interface MkStatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

export function MkStatusBadge({ label, variant = "verified", className }: MkStatusBadgeProps) {
  return (
    <span className={cn("inline-flex items-center px-3 py-0.5 rounded text-[10px] font-normal tracking-[0.1em] uppercase", variants[variant], className)}>
      {label}
    </span>
  );
}
