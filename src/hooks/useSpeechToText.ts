import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseSpeechToTextOptions {
  lang?: string;
  continuous?: boolean;
  onResult?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface UseSpeechToTextReturn {
  isSupported: boolean;
  isRecording: boolean;
  isTranscribing: boolean;
  partialText: string;
  finalText: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  cancel: () => void;
}

/**
 * Universal Speech-to-Text hook
 * Uses Web Speech API with server-side fallback via transcribe-media edge function
 */
export function useSpeechToText(options: UseSpeechToTextOptions = {}): UseSpeechToTextReturn {
  const { lang = 'pt-BR', continuous = true, onResult, onError } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [partialText, setPartialText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const usingFallbackRef = useRef(false);
  const accumulatedRef = useRef('');

  // Check WebSpeech support
  const SpeechRecognition = typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

  const isSupported = !!SpeechRecognition || !!(typeof window !== 'undefined' && navigator.mediaDevices);

  // Server-side fallback transcription
  const transcribeViaServer = useCallback(async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setError(null);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // strip data:...;base64,
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const { data, error: fnError } = await supabase.functions.invoke('transcribe-media', {
        body: {
          audioBase64: base64,
          mimeType: audioBlob.type || 'audio/webm',
          fileName: 'voice-input.webm',
        },
      });

      if (fnError) throw fnError;
      const text = data?.transcription || '';
      setFinalText(text);
      accumulatedRef.current = text;
      onResult?.(text, true);
    } catch (e: any) {
      const msg = 'Erro na transcrição. Tente novamente.';
      setError(msg);
      onError?.(msg);
    } finally {
      setIsTranscribing(false);
    }
  }, [onResult, onError]);

  // Start recording with fallback
  const startFallback = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          await transcribeViaServer(blob);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // collect chunks every second
      usingFallbackRef.current = true;
      setIsRecording(true);
      setPartialText('');
      setError(null);
    } catch (e: any) {
      const msg = e.name === 'NotAllowedError'
        ? 'Permissão de microfone negada. Vá em Ajustes > Safari > Microfone e permita o acesso.'
        : 'Erro ao acessar microfone.';
      setError(msg);
      onError?.(msg);
    }
  }, [transcribeViaServer, onError]);

  const start = useCallback(() => {
    setError(null);
    setPartialText('');
    setFinalText('');
    accumulatedRef.current = '';

    // Try WebSpeech first
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = lang;
        recognition.interimResults = true;
        recognition.continuous = continuous;
        recognition.maxAlternatives = 1;

        let errorCount = 0;

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript;
            } else {
              interim += transcript;
            }
          }

          if (final) {
            accumulatedRef.current += (accumulatedRef.current ? ' ' : '') + final;
            setFinalText(accumulatedRef.current);
            onResult?.(accumulatedRef.current, true);
          }
          setPartialText(interim);
          if (interim) {
            onResult?.(accumulatedRef.current + (accumulatedRef.current ? ' ' : '') + interim, false);
          }
        };

        recognition.onerror = (event: any) => {
          errorCount++;
          console.warn('SpeechRecognition error:', event.error);
          
          if (event.error === 'not-allowed') {
            setError('Permissão de microfone negada. Vá em Ajustes > Safari > Microfone e permita o acesso.');
            setIsRecording(false);
            return;
          }

          // After 2 errors, fall back to server
          if (errorCount >= 2) {
            recognition.abort();
            setIsRecording(false);
            startFallback();
          }
        };

        recognition.onend = () => {
          // If continuous and still recording, restart
          if (isRecording && continuous && !usingFallbackRef.current) {
            try { recognition.start(); } catch {}
          } else {
            setIsRecording(false);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
        usingFallbackRef.current = false;
        setIsRecording(true);
      } catch {
        // WebSpeech failed to init, use fallback
        startFallback();
      }
    } else {
      // No WebSpeech support, use fallback directly
      startFallback();
    }
  }, [SpeechRecognition, lang, continuous, onResult, onError, startFallback, isRecording]);

  const stop = useCallback(() => {
    if (recognitionRef.current && !usingFallbackRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && usingFallbackRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const cancel = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
    }
    usingFallbackRef.current = false;
    setIsRecording(false);
    setPartialText('');
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
        } catch {}
      }
    };
  }, []);

  return {
    isSupported,
    isRecording,
    isTranscribing,
    partialText,
    finalText,
    error,
    start,
    stop,
    cancel,
  };
}
