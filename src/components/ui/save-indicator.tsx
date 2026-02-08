/**
 * SaveIndicator - Subtle save status indicator
 */

import { Check, Loader2, AlertCircle, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SaveStatus } from "@/hooks/useAutoSave";

interface SaveIndicatorProps {
  status: SaveStatus;
  className?: string;
  showLabel?: boolean;
}

export function SaveIndicator({ status, className, showLabel = true }: SaveIndicatorProps) {
  if (status === 'idle') return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs transition-opacity duration-300",
        status === 'saving' && "text-muted-foreground",
        status === 'saved' && "text-primary",
        status === 'error' && "text-destructive",
        className
      )}
    >
      {status === 'saving' && (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          {showLabel && <span>Salvando...</span>}
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="w-3 h-3" />
          {showLabel && <span>Salvo</span>}
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="w-3 h-3" />
          {showLabel && <span>Erro ao salvar</span>}
        </>
      )}
    </div>
  );
}

// Draft indicator with restore/discard options
interface DraftIndicatorProps {
  hasDraft: boolean;
  onDiscard: () => void;
  className?: string;
}

export function DraftIndicator({ hasDraft, onDiscard, className }: DraftIndicatorProps) {
  if (!hasDraft) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs text-accent-foreground bg-accent px-2 py-1 rounded",
        className
      )}
    >
      <Cloud className="w-3 h-3" />
      <span>Rascunho não salvo</span>
      <button
        onClick={onDiscard}
        className="text-muted-foreground hover:text-foreground underline"
      >
        Descartar
      </button>
    </div>
  );
}
