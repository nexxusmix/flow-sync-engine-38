import { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { VoiceInputButton } from './VoiceInputButton';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

interface AiPromptFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  className?: string;
  draftKey?: string;
  /** Feature identifier for draft persistence (e.g. 'studio-brief', 'copilot') */
  featureId?: string;
  /** Entity id for draft scoping */
  entityId?: string;
  /** Show character counter */
  showCounter?: boolean;
  /** Show clear button */
  showClear?: boolean;
  /** Voice input language */
  voiceLang?: string;
}

/**
 * Universal AI prompt field with voice input, draft persistence, character counter
 */
export function AiPromptField({
  value,
  onChange,
  placeholder = 'Descreva o que deseja gerar com IA…',
  disabled = false,
  rows = 4,
  maxLength,
  className,
  draftKey,
  featureId,
  entityId,
  showCounter = true,
  showClear = true,
  voiceLang = 'pt-BR',
}: AiPromptFieldProps) {
  const location = useLocation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [voiceMode, setVoiceMode] = useState<'replace' | 'append'>('replace');

  // Build a stable draft storage key
  const storageKey = draftKey || (featureId
    ? `draft:${location.pathname}:${featureId}${entityId ? `:${entityId}` : ''}`
    : null);

  // Restore draft on mount
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && !value) {
        onChange(saved);
      }
    } catch {}
  }, [storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist draft on change (debounced)
  useEffect(() => {
    if (!storageKey) return;
    const timer = setTimeout(() => {
      try {
        if (value) {
          localStorage.setItem(storageKey, value);
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch {}
    }, 500);
    return () => clearTimeout(timer);
  }, [value, storageKey]);

  const handleVoiceTranscript = useCallback((text: string, mode: 'replace' | 'append') => {
    if (voiceMode === 'append' || mode === 'append') {
      onChange(value ? value + ' ' + text : text);
    } else {
      onChange(text);
    }
  }, [onChange, value, voiceMode]);

  const handleClear = useCallback(() => {
    onChange('');
    if (storageKey) {
      try { localStorage.removeItem(storageKey); } catch {}
    }
    textareaRef.current?.focus();
  }, [onChange, storageKey]);

  return (
    <div className={cn('relative group', className)}>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={cn(
          'pr-20 resize-none transition-colors',
          disabled && 'opacity-60'
        )}
      />

      {/* Action buttons overlay */}
      <div className="absolute right-2 top-2 flex flex-col gap-1">
        <VoiceInputButton
          onTranscript={handleVoiceTranscript}
          mode={voiceMode}
          language={voiceLang}
          disabled={disabled}
          size="icon"
          className="h-7 w-7"
        />
        {showClear && value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            disabled={disabled}
            className="h-7 w-7 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
            aria-label="Limpar campo"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Footer: counter + voice mode toggle */}
      {(showCounter || true) && (
        <div className="flex items-center justify-between mt-1 px-1">
          <button
            type="button"
            onClick={() => setVoiceMode(m => m === 'replace' ? 'append' : 'replace')}
            className="text-mono text-muted-foreground hover:text-foreground transition-colors"
            title={voiceMode === 'replace' ? 'Voz: substituir texto' : 'Voz: anexar ao texto'}
          >
            🎙️ {voiceMode === 'replace' ? 'Substituir' : 'Anexar'}
          </button>
          {showCounter && (
            <span className="text-mono text-muted-foreground">
              {value.length}{maxLength ? `/${maxLength}` : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
