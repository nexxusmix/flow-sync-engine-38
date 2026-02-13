import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MkCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function MkCard({ children, className, hover = false, onClick }: MkCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 transition-all duration-200",
        hover && "hover:border-[hsl(210,100%,55%)]/30 hover:bg-white/[0.05] cursor-pointer",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
