import { cn } from "@/lib/utils";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

type ActionState = "idle" | "loading" | "success" | "error";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  state?: ActionState;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

const variantStyles = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.5)]",
  secondary: "border border-border bg-transparent text-foreground hover:bg-foreground/5 hover:border-primary/30",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-[10px] gap-1.5",
  md: "px-5 py-2.5 text-[11px] gap-2",
  lg: "px-6 py-3 text-xs gap-2",
};

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ state = "idle", variant = "primary", size = "md", icon, children, className, disabled, ...props }, ref) => {
    const isDisabled = disabled || state === "loading";

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-normal uppercase tracking-widest transition-all duration-300",
          variantStyles[variant],
          sizeStyles[size],
          isDisabled && "opacity-50 cursor-not-allowed",
          state === "success" && "bg-success text-success-foreground",
          state === "error" && "bg-destructive text-destructive-foreground",
          className
        )}
        {...props}
      >
        {state === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {state === "success" && <Check className="w-3.5 h-3.5" />}
        {state === "error" && <AlertCircle className="w-3.5 h-3.5" />}
        {state === "idle" && icon}
        {children}
      </button>
    );
  }
);

ActionButton.displayName = "ActionButton";
