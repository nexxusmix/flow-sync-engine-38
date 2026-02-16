import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, Square, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskTimerProps {
  initialSeconds?: number;
  onTimeUpdate?: (totalSeconds: number) => void;
  compact?: boolean;
  className?: string;
}

function formatTime(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) return `${hrs}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function TaskTimer({ initialSeconds = 0, onTimeUpdate, compact, className }: TaskTimerProps) {
  const [elapsed, setElapsed] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedRef = useRef(initialSeconds);

  useEffect(() => {
    setElapsed(initialSeconds);
    accumulatedRef.current = initialSeconds;
  }, [initialSeconds]);

  const tick = useCallback(() => {
    const now = Date.now();
    const diff = Math.floor((now - startTimeRef.current) / 1000);
    const total = accumulatedRef.current + diff;
    setElapsed(total);
  }, []);

  const start = useCallback(() => {
    if (isRunning) return;
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(tick, 1000);
    setIsRunning(true);
  }, [isRunning, tick]);

  const pause = useCallback(() => {
    if (!isRunning) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    accumulatedRef.current = elapsed;
    setIsRunning(false);
    onTimeUpdate?.(elapsed);
  }, [isRunning, elapsed, onTimeUpdate]);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    onTimeUpdate?.(elapsed);
  }, [elapsed, onTimeUpdate]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Timer className="w-3 h-3 text-muted-foreground" />
        <span className={cn("font-mono text-xs tabular-nums", isRunning && "text-primary animate-pulse")}>
          {formatTime(elapsed)}
        </span>
        {!isRunning ? (
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={start}>
            <Play className="w-3 h-3" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={pause}>
            <Pause className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 p-3 rounded-xl border border-border bg-muted/50", className)}>
      <Timer className="w-4 h-4 text-primary" />
      <span className={cn("font-mono text-base font-semibold tabular-nums flex-1", isRunning && "text-primary")}>
        {formatTime(elapsed)}
      </span>
      <div className="flex gap-1">
        {!isRunning ? (
          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={start}>
            <Play className="w-3 h-3" /> Iniciar
          </Button>
        ) : (
          <>
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={pause}>
              <Pause className="w-3 h-3" /> Pausar
            </Button>
            <Button variant="destructive" size="sm" className="h-7 gap-1 text-xs" onClick={stop}>
              <Square className="w-3 h-3" /> Parar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export { formatTime };
