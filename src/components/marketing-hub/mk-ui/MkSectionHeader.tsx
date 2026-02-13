import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MkSectionHeaderProps {
  title: string;
  action?: ReactNode;
  className?: string;
}

export function MkSectionHeader({ title, action, className }: MkSectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[hsl(195,100%,45%)]" />
        <h2 className="text-[11px] uppercase tracking-[0.12em] text-white/30 font-normal">{title}</h2>
      </div>
      {action}
    </div>
  );
}
