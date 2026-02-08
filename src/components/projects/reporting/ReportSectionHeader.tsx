/**
 * ReportSectionHeader - Premium section header for report-style layouts
 * Matches the "01 — RESUMO EXECUTIVO" style from the HTML template
 */

import { cn } from "@/lib/utils";

interface ReportSectionHeaderProps {
  index: string;
  title: string;
  className?: string;
  children?: React.ReactNode;
}

export function ReportSectionHeader({ 
  index, 
  title, 
  className,
  children 
}: ReportSectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-8", className)}>
      <span className="text-primary text-[10px] uppercase tracking-[0.4em] font-bold">
        {index} — {title}
      </span>
      {children}
    </div>
  );
}
