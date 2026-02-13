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
      <h2 className="text-[11px] uppercase tracking-[0.15em] text-white/30 font-medium">{title}</h2>
      {action}
    </div>
  );
}
