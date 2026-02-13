import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface GlassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function GlassModal({ open, onOpenChange, title, description, children, className }: GlassModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "bg-background/95 backdrop-blur-xl border-primary/15 shadow-[0_0_60px_rgba(0,0,0,0.9)] max-w-2xl",
          className
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-foreground font-normal tracking-tight">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-muted-foreground">{description}</DialogDescription>
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
