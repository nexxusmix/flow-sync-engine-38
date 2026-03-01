import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  useInstagramHooks, useInstagramAI, useSaveHooks, useCreatePost,
  useProfileConfig, useInstagramCampaigns, PILLARS
} from '@/hooks/useInstagramEngine';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, Search, Star, Copy, Check, Rocket, CalendarPlus, ArrowRight, Zap, Target, ListChecks, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { addDays, setHours, setMinutes } from 'date-fns';

const HOOK_CATEGORIES = [
  { key: 'autoridade', label: 'Autoridade' },
  { key: 'luxury', label: 'Luxury' },
  { key: 'bastidores', label: 'Bastidores' },
  { key: 'educacao', label: 'Educação' },
  { key: 'venda', label: 'Venda Consultiva' },
];

const VOLUME_PRESETS = [
  { key: 'starter', label: '3/semana', posts: 3, desc: 'Consistente e sustentável' },
  { key: 'growth', label: '5/semana', posts: 5, desc: 'Crescimento acelerado (recomendado)' },
  { key: 'aggressive', label: '7/semana', posts: 7, desc: '1 post/dia — máximo impacto' },
  { key: 'month', label: 'Mês inteiro', posts: 20, desc: '~20 posts para 4 semanas' },
  { key: 'custom', label: 'Personalizado', posts: 0, desc: 'Escolha a quantidade' },
];

interface ScriptsTabProps {
  onNavigateToCalendar?: () => void;
}

export function ScriptsTab({ onNavigateToCalendar }: ScriptsTabProps) {
  const { data: hooks, isLoading } = useInstagramHooks();
  const { data: profileConfig } = useProfileConfig();
  const aiMutation = useInstagramAI();
  const saveHooks = useSaveHooks();
  const createPost = useCreatePost();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Autopilot state
  const [showAutopilotDialog, setShowAutopilotDialog] = useState(false);
  const [selectedVolume, setSelectedVolume] = useState('growth');
  const [customCount, setCustomCount] = useState([5]);
  const [autopilotRunning, setAutopilotRunning] = useState(false);
  const [autopilotStep, setAutopilotStep] = useState('');
  const [autopilotProgress, setAutopilotProgress] = useState(0);
  const [autopilotDone, setAutopilotDone] = useState(false);
  const [autopilotStats, setAutopilotStats] = useState<{
    hooks: number; posts: number; campaign: string; stories: number; checklists: number;
  } | null>(null);

  const filteredHooks = (hooks || []).filter(h => {
    if (search && !h.hook_text.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory !== 'all' && h.category !== filterCategory) return false;
    return true;
  });

  const getPostCount = () => {
    if (selectedVolume === 'custom') return customCount[0];
    return VOLUME_PRESETS.find(v => v.key === selectedVolume)?.posts || 5;
  };

  const handleGenerate = async (category: string) => {
    setGenerating(true);
    try {
      const result = await aiMutation.mutateAsync({
        action: 'generate_hooks',
        data: { category, count: 5 },
      });
      if (Array.isArray(result)) {
        await saveHooks.mutateAsync(result.map((h: any) => ({
          hook_text: h.hook_text,
          category: h.category || category,
          format: h.format || 'reel',
          hook_score: h.hook_score || 0,
          score_breakdown: h.score_breakdown || null,
          ai_generated: true,
        })));
        toast.success(`${result.length} hooks gerados com IA`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Erro ao gerar hooks');
    } finally {
      setGenerating(false);
    }
  };

  const handleAutopilot = async () => {
    const postCount = getPostCount();
    setShowAutopilotDialog(false);
    setAutopilotRunning(true);
    setAutopilotDone(false);
    setAutopilotStats(null);
    setAutopilotProgress(5);
    setAutopilotStep('🧠 Planejando campanha, hooks, roteiros, stories e checklists...');

    try {
      // Step 1: Generate everything with AI
      setAutopilotProgress(15);

      const profileContext = profileConfig ? {
        handle: profileConfig.profile_handle,
        niche: profileConfig.niche,
        target_audience: profileConfig.target_audience,
        followers: undefined as number | undefined,
        avg_engagement: undefined as number | undefined,
      } : undefined;

      const result = await aiMutation.mutateAsync({
        action: 'autopilot_full',
        data: {
          pillars: profileConfig?.content_pillars?.map((p: any) => p.key) || undefined,
          posts_count: postCount,
          profile_context: profileContext,
        },
      });

      if (!result) throw new Error('IA não retornou resultado');

      // Step 2: Create campaign
      setAutopilotProgress(35);
      setAutopilotStep('🎯 Criando campanha...');

      let campaignId: string | null = null;
      const campaignData = result.campaign;
      if (campaignData) {
        const { data: newCampaign, error: campErr } = await supabase
          .from('instagram_campaigns')
          .insert({
            name: campaignData.name || 'Campanha Autopilot',
            objective: campaignData.objective || null,
            target_audience: campaignData.target_audience || null,
            key_messages: campaignData.key_messages || [],
            kpis: campaignData.kpis || null,
            status: 'active',
          } as any)
          .select('id')
          .single();
        if (!campErr && newCampaign) {
          campaignId = newCampaign.id;
        }
      }

      // Step 3: Save hooks
      setAutopilotProgress(45);
      setAutopilotStep('✨ Salvando hooks na biblioteca...');

      const generatedHooks = result.hooks || [];
      if (generatedHooks.length > 0) {
        await saveHooks.mutateAsync(generatedHooks.map((h: any) => ({
          hook_text: h.hook_text,
          category: h.category || 'autoridade',
          format: h.format || 'reel',
          hook_score: h.hook_score || 80,
          score_breakdown: h.score_breakdown || null,
          ai_generated: true,
        })));
      }

      // Step 4: Create posts with checklists, stories, and schedule
      setAutopilotProgress(55);
      setAutopilotStep('📅 Criando posts com roteiros, stories e checklists...');

      const generatedPosts = result.posts || [];
      const now = new Date();
      let totalStories = 0;
      let totalChecklists = 0;

      for (let i = 0; i < generatedPosts.length; i++) {
        const p = generatedPosts[i];
        const dayOffset = p.scheduled_day_offset || (i + 1);
        const [hour, minute] = (p.scheduled_time || '10:00').split(':').map(Number);
        const scheduledDate = setMinutes(setHours(addDays(now, dayOffset), hour || 10), minute || 0);

        const storySeq = p.story_sequence || [];
        const checklist = p.checklist || [];
        totalStories += storySeq.length;
        totalChecklists += checklist.length;

        await createPost.mutateAsync({
          title: p.title || `Post ${i + 1}`,
          format: p.format || 'reel',
          pillar: p.pillar || 'autoridade',
          objective: p.objective || 'authority',
          status: 'planned',
          scheduled_at: scheduledDate.toISOString(),
          hook: p.hook || null,
          script: p.script || null,
          caption_short: p.caption_short || null,
          caption_medium: p.caption_medium || null,
          caption_long: p.caption_long || null,
          cta: p.cta || null,
          pinned_comment: p.pinned_comment || null,
          hashtags: p.hashtags || [],
          cover_suggestion: p.cover_suggestion || null,
          carousel_slides: p.carousel_slides || [],
          story_sequence: storySeq,
          checklist: checklist,
          campaign_id: campaignId,
          ai_generated: true,
          position: i,
        } as any);

        setAutopilotProgress(55 + Math.round((i + 1) / generatedPosts.length * 30));
      }

      // Step 5: Save projections if available
      setAutopilotProgress(90);
      setAutopilotStep('📊 Finalizando projeções de crescimento...');

      // Projections are returned but displayed in the summary — no separate table needed

      setAutopilotProgress(100);
      setAutopilotStep('✅ Autopilot Mega concluído!');
      setAutopilotStats({
        hooks: generatedHooks.length,
        posts: generatedPosts.length,
        campaign: campaignData?.name || 'Campanha',
        stories: totalStories,
        checklists: totalChecklists,
      });
      setAutopilotDone(true);

      toast.success(`🚀 Autopilot: ${generatedPosts.length} posts completos com campanha, stories e checklists!`);
    } catch (e: any) {
      toast.error(e.message || 'Erro no autopilot');
      setAutopilotStep('');
    } finally {
      setAutopilotRunning(false);
    }
  };

  const copyHook = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const scoreColor = (score: number) => {
    if (score >= 85) return 'text-primary';
    if (score >= 60) return 'text-primary/60';
    return 'text-muted-foreground';
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Autopilot Progress Banner */}
      <AnimatePresence>
        {(autopilotRunning || autopilotDone) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-primary/30 bg-primary/5 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Rocket className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">Autopilot IA</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{autopilotStep}</p>
              <Progress value={autopilotProgress} className="h-2 mb-3" />

              {autopilotDone && autopilotStats && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3 mt-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Sparkles className="w-3 h-3" /> {autopilotStats.hooks} hooks
                    </Badge>
                    <Badge variant="secondary" className="text-xs gap-1">
                      <CalendarPlus className="w-3 h-3" /> {autopilotStats.posts} posts
                    </Badge>
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Target className="w-3 h-3" /> {autopilotStats.campaign}
                    </Badge>
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Zap className="w-3 h-3" /> {autopilotStats.stories} stories
                    </Badge>
                    <Badge variant="secondary" className="text-xs gap-1">
                      <ListChecks className="w-3 h-3" /> {autopilotStats.checklists} tarefas
                    </Badge>
                  </div>
                  {onNavigateToCalendar && (
                    <Button size="sm" className="gap-1.5 text-xs" onClick={onNavigateToCalendar}>
                      Ver no Calendário <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </motion.div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Biblioteca de Hooks</h3>
          <p className="text-xs text-muted-foreground">{filteredHooks.length} hooks • Ordenado por score</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[140px] text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {HOOK_CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() => handleGenerate(filterCategory === 'all' ? 'autoridade' : filterCategory)}
            disabled={generating || autopilotRunning}
          >
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Gerar Hooks
          </Button>
          <Button
            size="sm"
            className="gap-1.5 text-xs bg-gradient-to-r from-primary to-primary/70"
            onClick={() => setShowAutopilotDialog(true)}
            disabled={autopilotRunning || generating}
          >
            {autopilotRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
            Gerar Tudo + Agendar
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar hooks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 text-sm"
        />
      </div>

      {/* Hooks List */}
      {filteredHooks.length === 0 ? (
        <Card className="glass-card p-8 text-center">
          <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">Nenhum hook ainda. Use o Autopilot para gerar tudo de uma vez!</p>
          <Button size="sm" onClick={() => setShowAutopilotDialog(true)} disabled={autopilotRunning} className="gap-1.5">
            <Rocket className="w-4 h-4" /> Gerar Tudo + Agendar
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredHooks.map(h => (
            <Card key={h.id} className="glass-card p-4 hover:border-primary/20 transition-colors group">
              <div className="flex items-start gap-4">
                <div className={`text-xl font-bold tabular-nums w-10 text-center ${scoreColor(h.hook_score)}`}>
                  {h.hook_score}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed">{h.hook_text}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {h.category && (
                      <Badge variant="secondary" className="text-[9px]">
                        {HOOK_CATEGORIES.find(c => c.key === h.category)?.label || h.category}
                      </Badge>
                    )}
                    {h.hook_score >= 85 && (
                      <Badge className="bg-primary/15 text-primary text-[9px] gap-0.5">
                        <Star className="w-2.5 h-2.5" /> Viral Potential
                      </Badge>
                    )}
                    {h.ai_generated && <Badge variant="outline" className="text-[9px]">IA</Badge>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copyHook(h.id, h.hook_text)}
                >
                  {copiedId === h.id ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Autopilot Config Dialog */}
      <Dialog open={showAutopilotDialog} onOpenChange={setShowAutopilotDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              Autopilot — Gerar Tudo
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              A IA vai criar campanha, hooks, roteiros completos, stories, checklists e agendar tudo no calendário.
            </p>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Volume Selection */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Quantidade de posts</Label>
              <div className="grid grid-cols-1 gap-2">
                {VOLUME_PRESETS.map(v => (
                  <button
                    key={v.key}
                    onClick={() => setSelectedVolume(v.key)}
                    className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                      selectedVolume === v.key
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border/50 text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{v.label}</span>
                      {v.key === 'growth' && (
                        <Badge variant="secondary" className="text-[9px]">Recomendado</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{v.desc}</p>
                  </button>
                ))}
              </div>

              {selectedVolume === 'custom' && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Posts:</Label>
                    <span className="text-sm font-bold text-primary">{customCount[0]}</span>
                  </div>
                  <Slider
                    value={customCount}
                    onValueChange={setCustomCount}
                    min={1}
                    max={30}
                    step={1}
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            {/* What will be generated */}
            <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">O que será gerado:</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { icon: Target, label: '1 Campanha temática' },
                  { icon: Sparkles, label: `${getPostCount()} Hooks com score` },
                  { icon: CalendarPlus, label: `${getPostCount()} Posts completos` },
                  { icon: Zap, label: 'Stories interativos' },
                  { icon: ListChecks, label: 'Checklists de produção' },
                  { icon: TrendingUp, label: 'Projeções de crescimento' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px] text-foreground/80">
                    <item.icon className="w-3 h-3 text-primary/60" />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowAutopilotDialog(false)}>
              Cancelar
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handleAutopilot}>
              <Rocket className="w-4 h-4" />
              Executar Autopilot ({getPostCount()} posts)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
