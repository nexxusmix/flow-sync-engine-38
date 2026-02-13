import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  variant?: "glass" | "holographic" | "elevated";
}

export function GlassCard({ children, className, hover = false, onClick, variant = "glass" }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl p-5 transition-all duration-500",
        variant === "glass" && "glass-card",
        variant === "holographic" && "holographic-card",
        variant === "elevated" && "card-elevated",
        hover && "hover:border-primary/25 cursor-pointer",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
