import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface DataGlowProps {
  children: ReactNode;
  className?: string;
  intensity?: "low" | "medium" | "high";
}

export function DataGlow({ children, className, intensity = "medium" }: DataGlowProps) {
  return (
    <span
      className={cn(
        intensity === "low" && "data-glow [text-shadow:0_0_8px_hsl(var(--glow)/0.3)]",
        intensity === "medium" && "data-glow",
        intensity === "high" && "[text-shadow:0_0_12px_hsl(var(--glow)/0.6),0_0_30px_hsl(var(--glow)/0.3)]",
        className
      )}
    >
      {children}
    </span>
  );
}
