import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiProcessingOverlayProps {
  isVisible: boolean;
  phase: 'idle' | 'analyzing' | 'generating' | 'done';
  progress: number;
  fileCount: number;
}

const PHASE_MESSAGES = {
  idle: '',
  analyzing: 'Analisando arquivos...',
  generating: 'Gerando títulos e descrições com IA...',
  done: 'Preenchimento concluído!',
};

export function AiProcessingOverlay({ isVisible, phase, progress, fileCount }: AiProcessingOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setVisible(true);
    } else {
      const t = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(t);
    }
  }, [isVisible]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-50 flex items-center justify-center transition-all duration-400",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.85)' }}
    >
      <div className="flex flex-col items-center gap-5 max-w-sm text-center px-6">
        {/* Icon */}
        <div className={cn(
          "relative w-20 h-20 rounded-full flex items-center justify-center",
          phase === 'done'
            ? "bg-emerald-500/10 border border-emerald-500/30"
            : "bg-[rgba(0,156,202,0.08)] border border-[rgba(0,156,202,0.2)]"
        )}>
          {phase === 'done' ? (
            <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-in zoom-in-50 duration-300" />
          ) : (
            <>
              <Sparkles className="w-8 h-8 text-[hsl(195,100%,55%)]" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[hsl(195,100%,50%)] animate-spin" />
            </>
          )}
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h3
            className="text-base font-medium text-white/80"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {phase === 'done' ? 'Concluído!' : 'Processando com IA'}
          </h3>
          <p className="text-sm text-white/40">
            {PHASE_MESSAGES[phase]}
          </p>
          {phase !== 'done' && (
            <p className="text-[10px] text-white/20">
              {fileCount} arquivo{fileCount > 1 ? 's' : ''} sendo processado{fileCount > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Progress bar */}
        {phase !== 'idle' && (
          <div className="w-full max-w-[240px]">
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700 ease-out",
                  phase === 'done' ? "bg-emerald-400" : "bg-[hsl(195,100%,50%)]"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-white/20 mt-2">{Math.round(progress)}%</p>
          </div>
        )}
      </div>
    </div>
  );
}
