import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MkCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  variant?: "glass" | "holographic";
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export function MkCard({ children, className, hover = false, onClick, variant = "holographic", draggable, onDragStart, onDragEnd }: MkCardProps) {
  return (
    <div
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "rounded-lg p-5 transition-all duration-300",
        variant === "holographic" && "holographic-card",
        variant === "glass" && "glass-projection",
        hover && "hover:border-primary/20 hover:scale-[1.015] cursor-pointer",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
