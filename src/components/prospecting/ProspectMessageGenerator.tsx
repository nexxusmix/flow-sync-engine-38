/**
 * ProspectMessageGenerator — WhatsApp message generator with AI
 * 3 variants + copy + deeplink + audio generation (ElevenLabs)
 * WhatsApp send works on PC (wa.me) and Mobile (whatsapp://) with device detection
 * Now: persists audio in storage, registers WhatsApp sends in event_logs, auto follow-up
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, Send, Sparkles, Loader2, Play, Pause, 
  MessageSquare, Zap, Shield, Check, Mic, Download,
  Smartphone, Monitor, AlertCircle, RefreshCw, History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProspectAI, MessageVariants, AudioResult } from '@/hooks/useProspectAI';
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

function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function formatPhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55')) return digits;
  if (digits.length >= 10) return `55${digits}`;
  return digits;
}

export function ProspectMessageGenerator({ prospect, opportunity, onClose }: Props) {
  const { generateMessages, generateAudio, isGenerating } = useProspectAI();
  const [variants, setVariants] = useState<MessageVariants | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<number>(0);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [audioResult, setAudioResult] = useState<AudioResult | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [audioHistory, setAudioHistory] = useState<Array<{ id: string; audio_url: string; created_at: string; duration_seconds: number | null }>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMobile = isMobileDevice();

  // Load audio history for this prospect
  useEffect(() => {
    if (!prospect?.id) return;
    supabase
      .from('prospect_audio' as any)
      .select('id, audio_url, created_at, duration_seconds')
      .eq('prospect_id', prospect.id)
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setAudioHistory(data as any);
      });
  }, [prospect?.id, audioResult]);

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
  }, [audioResult?.audio_url]);

  const handleGenerate = async () => {
    const result = await generateMessages(prospect?.id, opportunity?.id);
    if (result) {
      setVariants(result);
      setSelectedVariant(0);
      setAudioResult(null);
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

  // Register WhatsApp send in event_logs + create follow-up activity
  const registerWhatsAppSend = async (messageText: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Log event
      await supabase.from('event_logs').insert({
        action: 'whatsapp.sent',
        entity_type: 'prospect',
        entity_id: prospect?.id || '',
        actor_id: user?.id,
        actor_name: user?.email?.split('@')[0] || 'sistema',
        payload: {
          prospect_name: prospect?.company_name,
          phone: prospect?.phone,
          message_preview: messageText.substring(0, 100),
          variant: VARIANT_META[selectedVariant].label,
          opportunity_id: opportunity?.id,
        } as any,
      });

      // Create follow-up activity if opportunity exists
      if (opportunity?.id) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 3);

        await supabase.from('prospect_activities').insert({
          opportunity_id: opportunity.id,
          type: 'followup',
          title: `Follow-up: ${prospect?.company_name || 'Prospect'}`,
          description: 'Verificar resposta após mensagem WhatsApp',
          due_at: dueDate.toISOString(),
          channel: 'whatsapp',
        });
      }
    } catch (err) {
      console.error('Failed to register WhatsApp send:', err);
      // Don't block sending on registration failure
    }
  };

  const handleWhatsApp = useCallback(async (idx: number) => {
    const text = getVariantText(idx);
    if (!text) {
      toast.error('Nenhuma mensagem para enviar');
      return;
    }

    setIsSendingWhatsApp(true);

    try {
      // Register the send
      await registerWhatsAppSend(text);

      const phone = prospect?.phone ? formatPhoneE164(prospect.phone) : '';
      const encoded = encodeURIComponent(text);

      if (!phone) {
        navigator.clipboard.writeText(text);
        toast.info('Mensagem copiada! Sem telefone cadastrado — cole no WhatsApp.');
        window.open(`https://wa.me/?text=${encoded}`, '_blank');
      } else if (isMobile) {
        const waUrl = `whatsapp://send?phone=${phone}&text=${encoded}`;
        window.location.href = waUrl;
        setTimeout(() => {
          window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
        }, 500);
      } else {
        window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
      }

      toast.success('WhatsApp aberto! Envio registrado ✓');
    } catch (err) {
      toast.error('Erro ao registrar envio');
    } finally {
      setIsSendingWhatsApp(false);
    }
  }, [prospect, variants, selectedVariant, isMobile, opportunity]);

  const handleGenerateAudio = async () => {
    const script = variants?.audio_script || getVariantText(selectedVariant);
    if (!script) {
      toast.error('Gere a mensagem primeiro');
      return;
    }

    setIsGeneratingAudio(true);
    setAudioError(null);
    setAudioResult(null);

    const traceId = crypto.randomUUID();
    const idempotencyKey = `${prospect?.id || 'no-prospect'}_${Date.now()}`;

    try {
      const result = await generateAudio(script, undefined, {
        prospect_id: prospect?.id,
        opportunity_id: opportunity?.id,
        idempotency_key: idempotencyKey,
        trace_id: traceId,
      });

      if (result) {
        setAudioResult(result);
        if (result.cached) {
          toast.success('Áudio recuperado do cache!');
        } else {
          toast.success('Áudio gerado com sucesso!');
        }
      } else {
        setAudioError('Falha ao gerar áudio. Verifique a conexão ElevenLabs.');
      }
    } catch (err: any) {
      console.error('Audio generation error:', err);
      const msg = err?.message || 'Falha ao gerar áudio';
      setAudioError(`${msg} (trace: ${traceId.slice(0, 8)})`);
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
    if (!audioResult?.audio_url) return;
    const a = document.createElement('a');
    a.href = audioResult.audio_url;
    a.download = `audio-${prospect?.company_name || 'prospect'}-${Date.now()}.mp3`;
    a.target = '_blank';
    a.click();
    toast.success('Download iniciado');
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const playHistoryAudio = (url: string) => {
    setAudioResult({ audio_url: url, duration: 0, trace_id: '' });
    setAudioError(null);
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
                disabled={isSendingWhatsApp}
              >
                {isSendingWhatsApp ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isMobile ? (
                  <Smartphone className="w-3.5 h-3.5" />
                ) : (
                  <Monitor className="w-3.5 h-3.5" />
                )}
                <Send className="w-3.5 h-3.5" />
                {isSendingWhatsApp ? 'Registrando...' : 'Enviar WhatsApp'}
              </Button>
            </div>

            {/* Device hint */}
            <p className="text-[9px] text-muted-foreground/60 text-center">
              {isMobile ? '📱 Abrirá o app WhatsApp' : '🖥️ Abrirá o WhatsApp Web/Desktop'}
              {!prospect?.phone && ' • ⚠️ Sem telefone cadastrado'}
              {' • Envio será registrado automaticamente'}
            </p>

            {/* Audio Section */}
            <div className="border border-white/[0.05] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Áudio ElevenLabs</span>
                <div className="flex items-center gap-1">
                  {audioHistory.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs text-muted-foreground"
                      onClick={() => setShowHistory(!showHistory)}
                    >
                      <History className="w-3 h-3" />
                      {audioHistory.length}
                    </Button>
                  )}
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
                        {audioResult ? 'Regerar' : 'Gerar Áudio'}
                      </>
                    )}
                  </Button>
                </div>
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
                <div className="flex items-start gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                  <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-destructive block">{audioError}</span>
                  </div>
                </div>
              )}

              {/* Audio player */}
              {audioResult?.audio_url && !isGeneratingAudio && (
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
                      disabled={isSendingWhatsApp}
                    >
                      <Send className="w-3 h-3" />
                      WhatsApp + Áudio
                    </Button>
                  </div>
                  <audio ref={audioRef} src={audioResult.audio_url} preload="metadata" />
                </div>
              )}

              {/* Audio History */}
              {showHistory && audioHistory.length > 0 && (
                <div className="border-t border-white/[0.05] pt-2 space-y-1">
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Histórico</span>
                  {audioHistory.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => playHistoryAudio(item.audio_url)}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.03] transition-colors text-left"
                    >
                      <Play className="w-3 h-3 text-primary shrink-0" />
                      <span className="text-[10px] text-foreground flex-1">
                        {new Date(item.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {item.duration_seconds && (
                        <span className="text-[9px] text-muted-foreground font-mono">
                          {formatDuration(Number(item.duration_seconds))}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
