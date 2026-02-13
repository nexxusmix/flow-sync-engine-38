/**
 * ProspectMessageGenerator — WhatsApp message generator with AI
 * 3 variants + copy + deeplink + audio generation (ElevenLabs)
 * WhatsApp send works on PC (wa.me) and Mobile (whatsapp://) with device detection
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, Send, Sparkles, Loader2, Volume2, Play, Pause, 
  MessageSquare, Zap, Shield, Check, Mic, Download,
  Smartphone, Monitor, AlertCircle, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProspectAI, MessageVariants } from '@/hooks/useProspectAI';
import type { Prospect, ProspectOpportunity } from '@/types/prospecting';

interface Props {
  prospect?: Prospect | null;
  opportunity?: ProspectOpportunity | null;
  onClose?: () => void;
}

const VARIANT_META = [
  { key: 'variant_curta' as const, label: 'Curta & Direta', icon: Zap, desc: '1-3 linhas' },
  { key: 'variant_media' as const, label: 'Calma & Explicativa', icon: MessageSquare, desc: '3-5 linhas' },
  { key: 'variant_firme' as const, label: 'Firme com Prazo', icon: Shield, desc: '3-5 linhas' },
];

// Detect mobile device
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Format phone to E.164 (Brazil default)
function formatPhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55')) return digits;
  if (digits.length >= 10) return `55${digits}`;
  return digits;
}

export function ProspectMessageGenerator({ prospect, opportunity, onClose }: Props) {
  const { generateMessages, isGenerating } = useProspectAI();
  const [variants, setVariants] = useState<MessageVariants | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<number>(0);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMobile = isMobileDevice();

  // Audio progress tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => {
      if (audio.duration) setAudioProgress((audio.currentTime / audio.duration) * 100);
    };
    const onLoaded = () => setAudioDuration(audio.duration);
    const onEnded = () => { setIsPlaying(false); setAudioProgress(0); };
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl]);

  const handleGenerate = async () => {
    const result = await generateMessages(prospect?.id, opportunity?.id);
    if (result) {
      setVariants(result);
      setSelectedVariant(0);
      setAudioUrl(null);
      setAudioError(null);
    }
  };

  const getVariantText = (idx: number) => {
    if (!variants) return '';
    const key = VARIANT_META[idx].key;
    return variants[key] || '';
  };

  const handleCopy = (idx: number) => {
    const text = getVariantText(idx);
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success('Copiado!');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleWhatsApp = useCallback((idx: number) => {
    const text = getVariantText(idx);
    if (!text) {
      toast.error('Nenhuma mensagem para enviar');
      return;
    }

    const phone = prospect?.phone ? formatPhoneE164(prospect.phone) : '';
    const encoded = encodeURIComponent(text);

    if (!phone) {
      // No phone — copy and open wa.me
      navigator.clipboard.writeText(text);
      toast.info('Mensagem copiada! Sem telefone cadastrado — cole no WhatsApp.');
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
      return;
    }

    if (isMobile) {
      // Mobile: try whatsapp:// protocol first, fallback to wa.me
      const waUrl = `whatsapp://send?phone=${phone}&text=${encoded}`;
      window.location.href = waUrl;
      // Fallback after 500ms if app didn't open
      setTimeout(() => {
        window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
      }, 500);
    } else {
      // Desktop: wa.me opens WhatsApp Web/Desktop
      window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
    }

    toast.success('WhatsApp aberto!');
  }, [prospect, variants, selectedVariant, isMobile]);

  const handleGenerateAudio = async () => {
    const script = variants?.audio_script || getVariantText(selectedVariant);
    if (!script) {
      toast.error('Gere a mensagem primeiro');
      return;
    }

    setIsGeneratingAudio(true);
    setAudioError(null);
    setAudioUrl(null);

    try {
      // Use supabase.functions.invoke — handles auth automatically
      // But we need binary response, so use fetch directly
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/prospect-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ text: script }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(errData.error || `Erro ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        // Edge function returned JSON error
        const errData = await response.json();
        throw new Error(errData.error || 'Erro desconhecido');
      }

      const audioBlob = await response.blob();
      if (audioBlob.size < 100) {
        throw new Error('Áudio gerado é muito pequeno — verifique o texto.');
      }

      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      toast.success('Áudio gerado com sucesso!');
    } catch (err: any) {
      console.error('Audio generation error:', err);
      const msg = err?.message || 'Falha ao gerar áudio';
      setAudioError(msg);
      toast.error(msg);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => toast.error('Erro ao reproduzir'));
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `audio-${prospect?.company_name || 'prospect'}-${Date.now()}.mp3`;
    a.click();
    toast.success('Download iniciado');
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">Mensagem WhatsApp</h3>
          {prospect && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Para: {prospect.decision_maker_name || prospect.company_name}
              {prospect.phone && (
                <span className="ml-1.5 text-primary/70">({prospect.phone})</span>
              )}
            </p>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="gap-2"
        >
          {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {variants ? 'Regenerar' : 'Gerar com IA'}
        </Button>
      </div>

      {/* Variants */}
      <AnimatePresence mode="wait">
        {variants && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Variant Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              {VARIANT_META.map((v, i) => (
                <button
                  key={v.key}
                  onClick={() => setSelectedVariant(i)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-medium uppercase tracking-wider transition-all ${
                    selectedVariant === i
                      ? 'bg-primary/20 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <v.icon className="w-3 h-3" />
                  {v.label}
                </button>
              ))}
            </div>

            {/* Message Preview (WhatsApp bubble) */}
            <div className="relative">
              <div className="bg-[#005c4b] rounded-2xl rounded-tr-sm p-4 max-w-full">
                <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">
                  {getVariantText(selectedVariant)}
                </p>
                <div className="flex items-center justify-end gap-1 mt-2">
                  <span className="text-[9px] text-white/50">
                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => handleCopy(selectedVariant)}
              >
                {copiedIdx === selectedVariant ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedIdx === selectedVariant ? 'Copiado' : 'Copiar'}
              </Button>
              <Button
                size="sm"
                className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleWhatsApp(selectedVariant)}
              >
                {isMobile ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                <Send className="w-3.5 h-3.5" />
                Enviar WhatsApp
              </Button>
            </div>

            {/* Device hint */}
            <p className="text-[9px] text-muted-foreground/60 text-center">
              {isMobile ? '📱 Abrirá o app WhatsApp' : '🖥️ Abrirá o WhatsApp Web/Desktop'}
              {!prospect?.phone && ' • ⚠️ Sem telefone cadastrado'}
            </p>

            {/* Audio Section */}
            <div className="border border-white/[0.05] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Áudio ElevenLabs</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={handleGenerateAudio}
                  disabled={isGeneratingAudio}
                >
                  {isGeneratingAudio ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Gerando...
                    </>
                  ) : audioError ? (
                    <>
                      <RefreshCw className="w-3 h-3" />
                      Tentar Novamente
                    </>
                  ) : (
                    <>
                      <Mic className="w-3 h-3" />
                      {audioUrl ? 'Regerar' : 'Gerar Áudio'}
                    </>
                  )}
                </Button>
              </div>

              {/* Processing indicator */}
              {isGeneratingAudio && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                  <span className="text-[10px] text-primary">Processando com ElevenLabs...</span>
                </div>
              )}

              {/* Error state */}
              {audioError && !isGeneratingAudio && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                  <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                  <span className="text-[10px] text-destructive">{audioError}</span>
                </div>
              )}

              {/* Audio player */}
              {audioUrl && !isGeneratingAudio && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlayback}
                      className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition-colors"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary/60 rounded-full transition-all duration-200" 
                        style={{ width: `${audioProgress}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground w-10 text-right font-mono">
                      {audioDuration ? formatDuration(audioDuration) : '--:--'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs text-primary flex-1"
                      onClick={handleDownloadAudio}
                    >
                      <Download className="w-3 h-3" />
                      Baixar MP3
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs text-emerald-400 flex-1"
                      onClick={() => {
                        handleWhatsApp(selectedVariant);
                        toast.info('Envie o áudio manualmente após abrir o WhatsApp');
                      }}
                    >
                      <Send className="w-3 h-3" />
                      WhatsApp + Áudio
                    </Button>
                  </div>
                  <audio ref={audioRef} src={audioUrl} preload="metadata" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
