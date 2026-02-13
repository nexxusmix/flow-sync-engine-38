import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SectionHeaderProps {
  label?: string;
  title: string;
  highlight?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ label, title, highlight, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between mb-6", className)}>
      <div className="space-y-1">
        {label && (
          <div className="section-label">{label}</div>
        )}
        <h2 className="text-xl font-normal tracking-tight text-foreground">
          {title}
          {highlight && <span className="text-primary ml-1">{highlight}</span>}
        </h2>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
