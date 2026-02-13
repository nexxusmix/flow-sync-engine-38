/**
 * ProspectMessageGenerator — WhatsApp message generator with AI
 * 3 variants + copy + deeplink + audio generation (ElevenLabs)
 */
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, Send, Sparkles, Loader2, Volume2, Play, Pause, 
  MessageSquare, Zap, Shield, Check, Mic
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
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

export function ProspectMessageGenerator({ prospect, opportunity, onClose }: Props) {
  const { generateMessages, generateAudio, isGenerating } = useProspectAI();
  const [variants, setVariants] = useState<MessageVariants | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<number>(0);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleGenerate = async () => {
    const result = await generateMessages(prospect?.id, opportunity?.id);
    if (result) {
      setVariants(result);
      setSelectedVariant(0);
      setAudioUrl(null);
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

  const handleWhatsApp = (idx: number) => {
    const text = getVariantText(idx);
    const phone = prospect?.phone?.replace(/\D/g, '') || '';
    const encoded = encodeURIComponent(text);
    const url = phone
      ? `https://wa.me/${phone.startsWith('55') ? phone : '55' + phone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleGenerateAudio = async () => {
    if (!variants?.audio_script) return;
    setIsGeneratingAudio(true);
    const url = await generateAudio(variants.audio_script);
    if (url) {
      setAudioUrl(url);
      toast.success('Áudio gerado!');
    }
    setIsGeneratingAudio(false);
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
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
                className="flex-1 gap-1.5"
                onClick={() => handleWhatsApp(selectedVariant)}
              >
                <Send className="w-3.5 h-3.5" />
                Enviar WhatsApp
              </Button>
            </div>

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
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Mic className="w-3 h-3" />
                  )}
                  {audioUrl ? 'Regerar' : 'Gerar Áudio'}
                </Button>
              </div>

              {audioUrl && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlayback}
                    className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                  </button>
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/50 rounded-full w-0 transition-all" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs text-primary"
                    onClick={() => {
                      if (audioUrl) {
                        const a = document.createElement('a');
                        a.href = audioUrl;
                        a.download = `prospect-audio-${Date.now()}.mp3`;
                        a.click();
                      }
                    }}
                  >
                    <Volume2 className="w-3 h-3" />
                    Baixar
                  </Button>
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
