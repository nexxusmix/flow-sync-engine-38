import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useCallback, useEffect, useRef } from 'react';

interface VoiceInputButtonProps {
  onTranscript: (text: string, mode: 'replace' | 'append') => void;
  mode?: 'replace' | 'append';
  language?: string;
  disabled?: boolean;
  className?: string;
  size?: 'default' | 'sm' | 'icon';
}

/**
 * Universal voice input button for AI prompt fields
 * Uses WebSpeech API with server-side fallback
 */
export function VoiceInputButton({
  onTranscript,
  mode = 'replace',
  language = 'pt-BR',
  disabled = false,
  className,
  size = 'icon',
}: VoiceInputButtonProps) {
  const lastDeliveredRef = useRef('');

  const handleResult = useCallback((text: string, isFinal: boolean) => {
    if (text && text !== lastDeliveredRef.current) {
      lastDeliveredRef.current = text;
      onTranscript(text, mode);
    }
  }, [onTranscript, mode]);

  const {
    isSupported,
    isRecording,
    isTranscribing,
    error,
    start,
    stop,
    cancel,
  } = useSpeechToText({
    lang: language,
    onResult: handleResult,
  });

  const handleClick = useCallback(() => {
    if (isRecording) {
      stop();
    } else {
      lastDeliveredRef.current = '';
      start();
    }
  }, [isRecording, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { cancel(); };
  }, [cancel]);

  if (!isSupported) return null;

  const label = isRecording
    ? 'Parar gravação'
    : isTranscribing
      ? 'Transcrevendo…'
      : error
        ? error
        : 'Falar para preencher';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={isRecording ? 'destructive' : 'ghost'}
          size={size}
          disabled={disabled || isTranscribing}
          onClick={handleClick}
          className={cn(
            'relative shrink-0 transition-all',
            isRecording && 'animate-pulse shadow-[0_0_12px_hsl(var(--destructive)/0.4)]',
            className
          )}
          aria-label={label}
        >
          {isTranscribing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
          {isRecording && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-destructive animate-ping" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-[200px]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
