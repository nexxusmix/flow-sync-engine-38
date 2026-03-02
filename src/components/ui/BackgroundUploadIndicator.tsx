import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2, X, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useBackgroundUploadStore } from '@/stores/useBackgroundUploadStore';
import { Progress } from '@/components/ui/progress';

export function BackgroundUploadIndicator() {
  const { items, isProcessing, minimized, setMinimized, dismiss } = useBackgroundUploadStore();

  if (items.length === 0) return null;

  const doneCount = items.filter(i => i.status === 'done').length;
  const errorCount = items.filter(i => i.status === 'error').length;
  const totalCount = items.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const allDone = !isProcessing && doneCount + errorCount === totalCount;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 60, scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[9999] w-80 bg-[#0c0c12] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            {isProcessing ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            ) : allDone && errorCount === 0 ? (
              <CheckCircle2 className="w-4 h-4 text-primary" />
            ) : (
              <AlertCircle className="w-4 h-4 text-destructive" />
            )}
            <span className="text-xs font-medium text-white/70">
              {isProcessing
                ? `Enviando ${doneCount}/${totalCount}...`
                : errorCount > 0
                  ? `${doneCount} enviados, ${errorCount} falharam`
                  : `${doneCount} enviado(s) ✓`
              }
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized(!minimized)}
              className="p-1 text-white/30 hover:text-white/60 transition-colors"
            >
              {minimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {!isProcessing && (
              <button
                onClick={dismiss}
                className="p-1 text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {isProcessing && (
          <div className="px-4 py-2">
            <Progress value={progressPct} className="h-1" />
          </div>
        )}

        {/* Item list (when expanded) */}
        <AnimatePresence>
          {!minimized && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="max-h-48 overflow-y-auto px-4 py-2 space-y-1.5">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-2 py-1">
                    <div className="flex-shrink-0">
                      {item.status === 'done' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      ) : item.status === 'uploading' ? (
                        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                      ) : item.status === 'error' ? (
                        <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-white/20" />
                      )}
                    </div>
                    <span className="text-[11px] text-white/50 truncate flex-1">
                      {item.fileName}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
