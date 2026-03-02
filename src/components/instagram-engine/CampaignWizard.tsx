import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useProfileConfig, useProfileSnapshots } from '@/hooks/useInstagramEngine';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Loader2, Target, Calendar, Users, Megaphone, Palette,
  ChevronRight, ChevronLeft, Check, Zap, TrendingUp, ArrowRight,
  MessageSquare, Hash, LayoutGrid, Film, Image, BookOpen, Lightbulb,
  Clock, DollarSign, Wand2,
} from 'lucide-react';

interface WizardData {
  // Step 1: Objective
  objective: string;
  theme: string;
  // Step 2: Audience & Message
  target_audience: string;
  key_messages: string[];
  tones: string[];
  // Step 3: Formats & Style
  formats: string[];
  pillars: string[];
  style: string;
  // Step 4: Calendar & Budget
  duration_weeks: string;
  posts_per_week: string;
  budget: string;
  start_date: string;
}

interface AISuggestions {
  objectives?: string[];
  themes?: string[];
  audiences?: string[];
  messages?: string[];
  tones?: string[];
  formats?: { key: string; label: string; reason: string }[];
  pillars?: { key: string; label: string; reason: string }[];
  styles?: string[];
  loading?: boolean;
}

const STEPS = [
  { title: 'Objetivo & Tema', icon: Target, description: 'O que você quer alcançar?' },
  { title: 'Público & Mensagem', icon: Users, description: 'Para quem e como falar?' },
  { title: 'Formatos & Estilo', icon: Palette, description: 'Como vai parecer?' },
  { title: 'Calendário', icon: Calendar, description: 'Quando e quanto?' },
  { title: 'Revisão & Geração', icon: Sparkles, description: 'Conferir e gerar!' },
];

const OBJECTIVE_PRESETS = [
  { label: 'Crescer audiência', icon: TrendingUp, desc: 'Aumentar seguidores e alcance orgânico' },
  { label: 'Gerar leads', icon: Target, desc: 'Capturar contatos e oportunidades' },
  { label: 'Lançamento', icon: Zap, desc: 'Campanha de lançamento de produto/serviço' },
  { label: 'Engajamento', icon: MessageSquare, desc: 'Aumentar interações e comunidade' },
  { label: 'Autoridade', icon: BookOpen, desc: 'Posicionar como referência no nicho' },
  { label: 'Vendas diretas', icon: DollarSign, desc: 'Converter seguidores em clientes' },
];

const TONE_OPTIONS = [
  'Profissional', 'Descontraído', 'Inspiracional', 'Educativo', 'Provocativo', 'Íntimo/Pessoal', 'Urgente/FOMO',
];

const FORMAT_OPTIONS = [
  { key: 'reel', label: 'Reels', icon: Film },
  { key: 'carousel', label: 'Carrossel', icon: LayoutGrid },
  { key: 'single', label: 'Foto', icon: Image },
  { key: 'story_sequence', label: 'Stories', icon: BookOpen },
];

const PILLAR_OPTIONS = [
  { key: 'autoridade', label: 'Autoridade', color: 'hsl(210, 80%, 50%)' },
  { key: 'portfolio', label: 'Portfólio', color: 'hsl(280, 60%, 50%)' },
  { key: 'bastidores', label: 'Bastidores', color: 'hsl(30, 80%, 50%)' },
  { key: 'social_proof', label: 'Social Proof', color: 'hsl(140, 60%, 40%)' },
  { key: 'educacao', label: 'Educação', color: 'hsl(350, 60%, 50%)' },
  { key: 'venda', label: 'Venda', color: 'hsl(45, 90%, 50%)' },
];

const STYLE_PRESETS = [
  'Minimalista & Clean', 'Raw & Autêntico', 'Cinematográfico', 'Meme & Humor',
  'Editorial Premium', 'Storytelling Emocional', 'Tutorial Prático',
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCampaignCreated: (id: string) => void;
}

export function CampaignWizard({ open, onOpenChange, onCampaignCreated }: Props) {
  const { data: profile } = useProfileConfig();
  const { data: snapshots } = useProfileSnapshots();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({
    objective: '', theme: '',
    target_audience: '', key_messages: [], tones: [],
    formats: [], pillars: [], style: '',
    duration_weeks: '2', posts_per_week: '4', budget: '', start_date: '',
  });
  const [suggestions, setSuggestions] = useState<AISuggestions>({});
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState({ step: 0, label: '' });
  const [customMessage, setCustomMessage] = useState('');

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep(0);
      setData({
        objective: '', theme: '',
        target_audience: '', key_messages: [], tones: [],
        formats: [], pillars: [], style: '',
        duration_weeks: '2', posts_per_week: '4', budget: '', start_date: '',
      });
      setSuggestions({});
      setGenerating(false);
      setCustomMessage('');
    }
  }, [open]);

  // AI suggestions per step
  const loadSuggestions = useCallback(async (currentStep: number) => {
    setSuggestions(prev => ({ ...prev, loading: true }));
    try {
      const { data: result, error } = await supabase.functions.invoke('instagram-ai', {
        body: {
          action: 'campaign_wizard_suggestions',
          data: {
            step: currentStep,
            wizard_data: data,
            profile_niche: profile?.niche,
            profile_audience: profile?.target_audience,
            profile_pillars: profile?.content_pillars,
            profile_voice: profile?.brand_voice,
            profile_snapshot: snapshots?.[0] ? {
              followers: snapshots[0].followers,
              avg_engagement: snapshots[0].avg_engagement,
              avg_reach: snapshots[0].avg_reach,
              posts_count: snapshots[0].posts_count,
            } : undefined,
          },
        },
      });
      if (!error && result?.result) {
        setSuggestions(prev => ({ ...prev, ...result.result, loading: false }));
      } else {
        setSuggestions(prev => ({ ...prev, loading: false }));
      }
    } catch {
      setSuggestions(prev => ({ ...prev, loading: false }));
    }
  }, [data, profile]);

  useEffect(() => {
    if (open && step < 4) {
      loadSuggestions(step);
    }
  }, [step, open]);

  const canProceed = () => {
    switch (step) {
      case 0: return data.objective.trim().length > 0;
      case 1: return data.target_audience.trim().length > 0;
      case 2: return data.formats.length > 0;
      case 3: return true;
      default: return true;
    }
  };

  const toggleArrayItem = (field: 'formats' | 'pillars' | 'key_messages', item: string) => {
    setData(prev => {
      const arr = prev[field] as string[];
      return { ...prev, [field]: arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item] };
    });
  };

  const addMessage = () => {
    if (customMessage.trim()) {
      setData(prev => ({ ...prev, key_messages: [...prev.key_messages, customMessage.trim()] }));
      setCustomMessage('');
    }
  };

  // Final generation
  const GEN_STEPS = [
    'Analisando contexto e tendências...',
    'Definindo estratégia da campanha...',
    'Criando roteiros e legendas...',
    'Montando calendário editorial...',
    'Inserindo posts no calendário...',
  ];

  const handleGenerate = async () => {
    setGenerating(true);
    setGenProgress({ step: 0, label: GEN_STEPS[0] });

    const progressInterval = setInterval(() => {
      setGenProgress(prev => {
        const next = Math.min(prev.step + 1, 2);
        return { step: next, label: GEN_STEPS[next] };
      });
    }, 4000);

    try {
      const { data: result, error } = await supabase.functions.invoke('instagram-ai', {
        body: {
          action: 'generate_campaign',
          data: {
            theme: data.theme || data.objective,
            duration_weeks: parseInt(data.duration_weeks) || 2,
            budget: data.budget ? parseFloat(data.budget) : undefined,
            // Enhanced wizard context
            wizard_context: {
              objective: data.objective,
              target_audience: data.target_audience,
              key_messages: data.key_messages,
              tone: data.tones.join(', '),
              formats: data.formats,
              pillars: data.pillars,
              style: data.style,
              posts_per_week: parseInt(data.posts_per_week) || 4,
              start_date: data.start_date || undefined,
            },
          },
        },
      });

      clearInterval(progressInterval);
      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      let campaign = result?.result;
      if (campaign?.raw && !campaign?.name) {
        try {
          const jsonMatch = campaign.raw.match(/\{[\s\S]*\}/);
          if (jsonMatch) campaign = JSON.parse(jsonMatch[0]);
        } catch { /* ignore */ }
      }
      if (!campaign?.name) throw new Error('IA não retornou campanha válida.');

      setGenProgress({ step: 3, label: GEN_STEPS[3] });

      // Save campaign
      const { data: inserted, error: insertError } = await supabase.from('instagram_campaigns').insert({
        name: campaign.name,
        objective: campaign.objective || data.objective || null,
        target_audience: campaign.target_audience || data.target_audience || null,
        start_date: campaign.start_date || data.start_date || null,
        end_date: campaign.end_date || null,
        budget: campaign.budget || (data.budget ? parseFloat(data.budget) : null),
        key_messages: campaign.key_messages || data.key_messages || [],
        content_plan: campaign.content_plan || [],
        kpis: { ...(campaign.kpis || {}), strategy_notes: campaign.strategy_notes || null, wizard_context: { tones: data.tones, style: data.style, formats: data.formats, pillars: data.pillars } },
        status: 'planning',
      } as any).select().single();

      if (insertError) throw insertError;

      // Create posts
      setGenProgress({ step: 4, label: GEN_STEPS[4] });
      const contentPlan = campaign.content_plan || [];
      let postsCreated = 0;
      const formatCounts: Record<string, number> = {};

      if (contentPlan.length > 0 && inserted) {
        const postsToInsert = contentPlan.map((post: any, idx: number) => {
          const fmt = post.format || 'reel';
          formatCounts[fmt] = (formatCounts[fmt] || 0) + 1;
          let scheduledAt: string | null = null;
          if (post.scheduled_date) {
            const time = post.suggested_time || '10:00';
            scheduledAt = `${post.scheduled_date}T${time}:00`;
          }
          return {
            title: post.title || `Post ${idx + 1}`,
            format: fmt, pillar: post.pillar || null, objective: post.objective || null,
            status: 'planned', scheduled_at: scheduledAt,
            hook: post.hook || null, script: post.script || null,
            caption_short: post.caption_short || null, caption_medium: post.caption_medium || null,
            caption_long: post.caption_long || null, cta: post.cta || null,
            pinned_comment: post.pinned_comment || null, hashtags: post.hashtags || [],
            cover_suggestion: post.cover_suggestion || null, carousel_slides: post.carousel_slides || [],
            story_sequence: post.story_sequence || [], checklist: post.checklist || [],
            ai_generated: true, campaign_id: inserted.id, position: idx,
          };
        });

        const { error: postsError } = await supabase.from('instagram_posts').insert(postsToInsert as any);
        if (postsError) {
          toast.error('Campanha criada, mas erro nos posts: ' + postsError.message);
        } else {
          postsCreated = postsToInsert.length;
        }
      }

      qc.invalidateQueries({ queryKey: ['instagram-campaigns'] });
      qc.invalidateQueries({ queryKey: ['instagram-posts'] });

      const formatSummary = Object.entries(formatCounts)
        .map(([k, v]) => `${v} ${k === 'reel' ? 'Reels' : k === 'carousel' ? 'Carrosséis' : k === 'single' ? 'Fotos' : k === 'story_sequence' ? 'Stories' : k}`)
        .join(', ');

      toast.success(
        postsCreated > 0
          ? `🎯 Campanha perfeita! ${postsCreated} posts criados (${formatSummary})`
          : 'Campanha criada com IA!',
        { duration: 6000 }
      );

      onOpenChange(false);
      if (inserted) onCampaignCreated(inserted.id);
    } catch (e: any) {
      clearInterval(progressInterval);
      toast.error(e.message || 'Erro ao gerar campanha');
    } finally {
      setGenerating(false);
      setGenProgress({ step: 0, label: '' });
    }
  };

  // Pre-fill from profile
  useEffect(() => {
    if (profile && open && step === 0) {
      setData(prev => ({
        ...prev,
        target_audience: prev.target_audience || profile.target_audience || '',
        tones: prev.tones.length > 0 ? prev.tones : (profile.brand_voice ? [profile.brand_voice] : []),
        pillars: prev.pillars.length > 0 ? prev.pillars :
          (Array.isArray(profile.content_pillars) ? (profile.content_pillars as string[]).slice(0, 3) : []),
      }));
    }
  }, [profile, open]);

  const SuggestionChip = ({ label, selected, onClick, color }: { label: string; selected?: boolean; onClick: () => void; color?: string }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs transition-all border whitespace-normal text-left ${
        selected
          ? 'bg-primary/20 border-primary/50 text-primary shadow-[0_0_10px_-3px_hsl(var(--primary)/0.3)]'
          : 'bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      }`}
      style={color && selected ? { borderColor: color, backgroundColor: `${color}20`, color } : undefined}
    >
      {selected && <Check className="w-3 h-3 inline mr-1" />}
      {label}
    </button>
  );

  const AISuggestionLabel = () => (
    <span className="flex items-center gap-1 text-[10px] text-primary/70 uppercase tracking-wider mb-2">
      <Wand2 className="w-3 h-3" /> Sugestões da IA
      {suggestions.loading && <Loader2 className="w-3 h-3 animate-spin" />}
    </span>
  );

  return (
    <Dialog open={open} onOpenChange={v => { if (!generating) onOpenChange(v); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Criar Campanha Perfeita
          </DialogTitle>
          <DialogDescription>
            {STEPS[step].description}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-1 mb-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-center gap-1 flex-1">
                <button
                  onClick={() => i < step && setStep(i)}
                  disabled={i > step}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] transition-all w-full ${
                    i === step
                      ? 'bg-primary/15 text-primary font-medium'
                      : i < step
                        ? 'bg-emerald-500/10 text-emerald-400 cursor-pointer hover:bg-emerald-500/20'
                        : 'text-muted-foreground/50'
                  }`}
                >
                  {i < step ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                  <span className="hidden md:inline truncate">{s.title}</span>
                </button>
                {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground/30 shrink-0" />}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* STEP 0: Objective & Theme */}
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block font-medium">Qual o objetivo principal?</label>
                  <div className="grid grid-cols-2 gap-2 p-1 -m-1">
                    {OBJECTIVE_PRESETS.map(obj => {
                      const Icon = obj.icon;
                      const selected = data.objective === obj.label;
                      return (
                        <button
                          key={obj.label}
                          onClick={() => setData(d => ({ ...d, objective: obj.label }))}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            selected
                              ? 'border-primary/50 bg-primary/10 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.3)]'
                              : 'border-border/50 bg-muted/20 hover:border-primary/30 hover:bg-muted/40'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className={`w-4 h-4 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className={`text-xs font-medium ${selected ? 'text-primary' : 'text-foreground'}`}>{obj.label}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{obj.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Tema / Foco específico</label>
                  <Textarea
                    placeholder="Ex: Lançamento da coleção verão, Black Friday imobiliária, Semana do empreendedor..."
                    value={data.theme}
                    onChange={e => setData(d => ({ ...d, theme: e.target.value }))}
                    rows={2}
                    className="text-sm"
                  />
                </div>

                {suggestions.themes && suggestions.themes.length > 0 && (
                  <div>
                    <AISuggestionLabel />
                    <div className="flex flex-col gap-2">
                      {suggestions.themes.map(t => (
                        <SuggestionChip
                          key={t}
                          label={t}
                          selected={data.theme.includes(t)}
                          onClick={() => setData(d => ({
                            ...d,
                            theme: d.theme.includes(t)
                              ? d.theme.replace(t, '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim()
                              : d.theme ? `${d.theme}, ${t}` : t,
                          }))}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 1: Audience & Message */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Público-alvo</label>
                  <Textarea
                    placeholder="Descreva quem você quer atingir..."
                    value={data.target_audience}
                    onChange={e => setData(d => ({ ...d, target_audience: e.target.value }))}
                    rows={2}
                    className="text-sm"
                  />
                  {suggestions.audiences && suggestions.audiences.length > 0 && (
                    <div className="mt-2">
                      <AISuggestionLabel />
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.audiences.map(a => (
                          <SuggestionChip
                            key={a}
                            label={a}
                            selected={data.target_audience.includes(a)}
                            onClick={() => setData(d => ({
                              ...d,
                              target_audience: d.target_audience.includes(a)
                                ? d.target_audience.replace(a, '').replace(/\.\s*\./g, '.').replace(/^\.\s*|\.\s*$/g, '').trim()
                                : d.target_audience ? `${d.target_audience}. ${a}` : a,
                            }))}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Tom de voz</label>
                  <div className="flex flex-wrap gap-1.5">
                    {TONE_OPTIONS.map(t => (
                      <SuggestionChip
                        key={t}
                        label={t}
                        selected={data.tones.includes(t)}
                        onClick={() => setData(d => ({
                          ...d,
                          tones: d.tones.includes(t) ? d.tones.filter(x => x !== t) : [...d.tones, t],
                        }))}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                    Mensagens-chave ({data.key_messages.length})
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex: Qualidade premium, Resultados comprovados..."
                      value={customMessage}
                      onChange={e => setCustomMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMessage())}
                      className="text-sm"
                    />
                    <Button size="sm" variant="outline" onClick={addMessage} disabled={!customMessage.trim()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {data.key_messages.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {data.key_messages.map((m, i) => (
                        <Badge key={i} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setData(d => ({ ...d, key_messages: d.key_messages.filter((_, j) => j !== i) }))}>
                          {m} ✕
                        </Badge>
                      ))}
                    </div>
                  )}
                  {suggestions.messages && suggestions.messages.length > 0 && (
                    <div className="mt-2">
                      <AISuggestionLabel />
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.messages.map(m => (
                          <SuggestionChip
                            key={m}
                            label={m}
                            selected={data.key_messages.includes(m)}
                            onClick={() => toggleArrayItem('key_messages', m)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: Formats & Style */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block font-medium">Formatos de conteúdo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {FORMAT_OPTIONS.map(f => {
                      const Icon = f.icon;
                      const selected = data.formats.includes(f.key);
                      const aiSuggestion = suggestions.formats?.find(sf => sf.key === f.key);
                      return (
                        <button
                          key={f.key}
                          onClick={() => toggleArrayItem('formats', f.key)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            selected
                              ? 'border-primary/50 bg-primary/10'
                              : 'border-border/50 bg-muted/20 hover:border-primary/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className={`text-xs font-medium ${selected ? 'text-primary' : 'text-foreground'}`}>{f.label}</span>
                            {selected && <Check className="w-3 h-3 text-primary ml-auto" />}
                          </div>
                          {aiSuggestion && (
                            <p className="text-[9px] text-primary/60 mt-1 flex items-center gap-1">
                              <Wand2 className="w-2.5 h-2.5" /> {aiSuggestion.reason}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block font-medium">Pilares de conteúdo</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PILLAR_OPTIONS.map(p => (
                      <SuggestionChip
                        key={p.key}
                        label={p.label}
                        selected={data.pillars.includes(p.key)}
                        onClick={() => toggleArrayItem('pillars', p.key)}
                        color={p.color}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block font-medium">Estilo visual</label>
                  <div className="flex flex-wrap gap-1.5">
                    {STYLE_PRESETS.map(s => (
                      <SuggestionChip
                        key={s}
                        label={s}
                        selected={data.style === s}
                        onClick={() => setData(d => ({ ...d, style: d.style === s ? '' : s }))}
                      />
                    ))}
                  </div>
                  {suggestions.styles && suggestions.styles.length > 0 && (
                    <div className="mt-2">
                      <AISuggestionLabel />
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.styles.filter(s => !STYLE_PRESETS.includes(s)).map(s => (
                          <SuggestionChip
                            key={s}
                            label={s}
                            selected={data.style === s}
                            onClick={() => setData(d => ({ ...d, style: s }))}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: Calendar & Budget */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Duração</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {['1', '2', '3', '4'].map(w => (
                        <button
                          key={w}
                          onClick={() => setData(d => ({ ...d, duration_weeks: w }))}
                          className={`px-3 py-2 rounded-lg border text-xs transition-all ${
                            data.duration_weeks === w
                              ? 'border-primary/50 bg-primary/10 text-primary font-medium'
                              : 'border-border/50 bg-muted/20 text-muted-foreground hover:border-primary/30'
                          }`}
                        >
                          {w} {w === '1' ? 'semana' : 'semanas'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Posts por semana</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {['3', '4', '5', '7'].map(n => (
                        <button
                          key={n}
                          onClick={() => setData(d => ({ ...d, posts_per_week: n }))}
                          className={`px-3 py-2 rounded-lg border text-xs transition-all ${
                            data.posts_per_week === n
                              ? 'border-primary/50 bg-primary/10 text-primary font-medium'
                              : 'border-border/50 bg-muted/20 text-muted-foreground hover:border-primary/30'
                          }`}
                        >
                          {n}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Data início (opcional)</label>
                    <Input
                      type="date"
                      value={data.start_date}
                      onChange={e => setData(d => ({ ...d, start_date: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Orçamento ads (R$)</label>
                    <Input
                      type="number"
                      placeholder="Opcional"
                      value={data.budget}
                      onChange={e => setData(d => ({ ...d, budget: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Summary preview */}
                <Card className="p-3 border-primary/15 bg-primary/5">
                  <p className="text-[10px] text-primary/70 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" /> Previsão
                  </p>
                  <p className="text-xs text-foreground">
                    ~{parseInt(data.posts_per_week) * parseInt(data.duration_weeks)} posts em {data.duration_weeks} {data.duration_weeks === '1' ? 'semana' : 'semanas'}
                    {data.formats.length > 0 && ` • Formatos: ${data.formats.map(f => FORMAT_OPTIONS.find(fo => fo.key === f)?.label || f).join(', ')}`}
                  </p>
                </Card>
              </div>
            )}

            {/* STEP 4: Review */}
            {step === 4 && (
              <div className="space-y-3">
                <Card className="p-4 space-y-3">
                  <ReviewRow label="Objetivo" value={data.objective} icon={<Target className="w-3.5 h-3.5" />} />
                  {data.theme && <ReviewRow label="Tema" value={data.theme} icon={<Lightbulb className="w-3.5 h-3.5" />} />}
                  <ReviewRow label="Público" value={data.target_audience} icon={<Users className="w-3.5 h-3.5" />} />
                  {data.tones.length > 0 && <ReviewRow label="Tom" value={data.tones.join(', ')} icon={<MessageSquare className="w-3.5 h-3.5" />} />}
                  <ReviewRow label="Formatos" value={data.formats.map(f => FORMAT_OPTIONS.find(fo => fo.key === f)?.label || f).join(', ')} icon={<LayoutGrid className="w-3.5 h-3.5" />} />
                  {data.pillars.length > 0 && (
                    <ReviewRow label="Pilares" value={data.pillars.map(p => PILLAR_OPTIONS.find(po => po.key === p)?.label || p).join(', ')} icon={<Hash className="w-3.5 h-3.5" />} />
                  )}
                  {data.style && <ReviewRow label="Estilo" value={data.style} icon={<Palette className="w-3.5 h-3.5" />} />}
                  <ReviewRow
                    label="Calendário"
                    value={`${data.posts_per_week}x/semana por ${data.duration_weeks} semana(s) = ~${parseInt(data.posts_per_week) * parseInt(data.duration_weeks)} posts`}
                    icon={<Calendar className="w-3.5 h-3.5" />}
                  />
                  {data.key_messages.length > 0 && (
                    <ReviewRow label="Mensagens" value={data.key_messages.join(' • ')} icon={<Megaphone className="w-3.5 h-3.5" />} />
                  )}
                </Card>

                {generating && (
                  <Card className="p-4 border-primary/20 bg-primary/5 space-y-3">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{genProgress.label}</p>
                      </div>
                    </div>
                    <Progress value={((genProgress.step + 1) / GEN_STEPS.length) * 100} className="h-1.5" />
                  </Card>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => step === 0 ? onOpenChange(false) : setStep(s => s - 1)}
            disabled={generating}
          >
            {step === 0 ? 'Cancelar' : <><ChevronLeft className="w-4 h-4 mr-1" /> Voltar</>}
          </Button>

          {step < 4 ? (
            <Button
              size="sm"
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="gap-1.5"
            >
              Próximo <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={generating}
              className="gap-1.5 bg-primary hover:bg-primary/90"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? 'Gerando...' : 'Gerar Campanha Perfeita'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReviewRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-primary mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-xs text-foreground">{value}</p>
      </div>
    </div>
  );
}

// Need the Plus icon for message input
function Plus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
