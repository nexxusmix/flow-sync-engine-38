import { cn } from "@/lib/utils";
import { Sparkles, Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface AIButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  label?: string;
  loadingLabel?: string;
  size?: "sm" | "md";
}

export const AIButton = forwardRef<HTMLButtonElement, AIButtonProps>(
  ({ isLoading = false, label = "Gerar com IA", loadingLabel = "Gerando...", size = "md", className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 text-primary transition-all duration-300",
          "hover:bg-primary/20 hover:border-primary/50 hover:shadow-[0_0_20px_-5px_hsl(var(--primary)/0.3)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          size === "sm" ? "px-3 py-1.5 text-[10px]" : "px-4 py-2 text-[11px]",
          "font-normal uppercase tracking-widest",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" />
        )}
        {isLoading ? loadingLabel : label}
      </button>
    );
  }
);

AIButton.displayName = "AIButton";
