import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MkCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  variant?: "glass" | "holographic";
}

export function MkCard({ children, className, hover = false, onClick, variant = "holographic" }: MkCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-lg p-5 transition-all duration-200",
        variant === "holographic" && "holographic-card",
        variant === "glass" && "glass-projection",
        hover && "hover:border-[rgba(0,156,202,0.25)] cursor-pointer",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
