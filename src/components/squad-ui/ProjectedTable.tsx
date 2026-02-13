import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ProjectedTableProps {
  headers: string[];
  children: ReactNode;
  className?: string;
}

export function ProjectedTable({ headers, children, className }: ProjectedTableProps) {
  return (
    <div className={cn("glass-card rounded-2xl overflow-hidden", className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-normal border-b border-border/50 font-mono"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

interface ProjectedTableRowProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ProjectedTableRow({ children, onClick, className }: ProjectedTableRowProps) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "border-b border-border/20 transition-colors duration-200",
        "hover:bg-primary/[0.03]",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </tr>
  );
}

interface ProjectedTableCellProps {
  children: ReactNode;
  className?: string;
}

export function ProjectedTableCell({ children, className }: ProjectedTableCellProps) {
  return (
    <td className={cn("px-4 py-3 text-sm text-muted-foreground", className)}>
      {children}
    </td>
  );
}
