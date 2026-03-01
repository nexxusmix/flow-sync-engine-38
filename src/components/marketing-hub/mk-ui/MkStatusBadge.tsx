import { cn } from "@/lib/utils";

type BadgeVariant = "verified" | "active" | "processing" | "queued" | "blue" | "amber" | "emerald" | "purple" | "red" | "slate" | "cyan";

const variants: Record<BadgeVariant, string> = {
  verified: "border border-[rgba(0,156,202,0.3)] text-[hsl(195,100%,55%)]",
  active: "border border-[rgba(0,156,202,0.3)] text-[hsl(195,100%,55%)]",
  processing: "border border-white/15 text-white/50",
  queued: "border border-white/10 text-white/30",
  blue: "border border-[rgba(0,156,202,0.3)] text-[hsl(195,100%,55%)]",
  amber: "border border-white/15 text-white/50",
  emerald: "border border-[rgba(0,156,202,0.3)] text-[hsl(195,100%,55%)]",
  purple: "border border-[rgba(0,156,202,0.25)] text-[hsl(195,100%,55%)]",
  red: "border border-destructive/30 text-destructive",
  slate: "border border-white/10 text-white/40",
  cyan: "border border-[rgba(0,156,202,0.3)] text-[hsl(195,100%,55%)]",
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
