import { cn } from "@/lib/utils";

type BadgeVariant = "blue" | "amber" | "emerald" | "purple" | "red" | "slate" | "cyan";

const variants: Record<BadgeVariant, string> = {
  blue: "bg-[hsl(210,100%,55%)]/15 text-[hsl(210,100%,70%)]",
  amber: "bg-amber-500/15 text-amber-400",
  emerald: "bg-emerald-500/15 text-emerald-400",
  purple: "bg-purple-500/15 text-purple-400",
  red: "bg-red-500/15 text-red-400",
  slate: "bg-white/[0.06] text-white/50",
  cyan: "bg-cyan-500/15 text-cyan-400",
};

interface MkStatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

export function MkStatusBadge({ label, variant = "blue", className }: MkStatusBadgeProps) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide", variants[variant], className)}>
      {label}
    </span>
  );
}
