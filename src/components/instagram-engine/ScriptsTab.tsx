import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  useInstagramHooks, useInstagramAI, useSaveHooks, useCreatePost,
  useProfileConfig, PILLARS
} from '@/hooks/useInstagramEngine';
import { Loader2, Sparkles, Search, Star, Copy, Check, Rocket, CalendarPlus, ArrowRight } from 'lucide-react';
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
  const [autopilotRunning, setAutopilotRunning] = useState(false);
  const [autopilotStep, setAutopilotStep] = useState('');
  const [autopilotProgress, setAutopilotProgress] = useState(0);
  const [autopilotDone, setAutopilotDone] = useState(false);
  const [autopilotStats, setAutopilotStats] = useState<{ hooks: number; posts: number } | null>(null);

  const filteredHooks = (hooks || []).filter(h => {
    if (search && !h.hook_text.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory !== 'all' && h.category !== filterCategory) return false;
    return true;
  });

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
    setAutopilotRunning(true);
    setAutopilotDone(false);
    setAutopilotStats(null);
    setAutopilotProgress(10);
    setAutopilotStep('🧠 Analisando perfil e planejando semana...');

    try {
      // Step 1: Generate everything with AI
      setAutopilotProgress(20);
      setAutopilotStep('✨ Gerando hooks, roteiros, legendas e agendamento...');

      const profileContext = profileConfig ? {
        handle: profileConfig.profile_handle,
        niche: profileConfig.niche,
        target_audience: profileConfig.target_audience,
      } : undefined;

      const result = await aiMutation.mutateAsync({
        action: 'autopilot_full',
        data: {
          pillars: profileConfig?.content_pillars?.map((p: any) => p.key) || undefined,
          posts_count: 5,
          profile_context: profileContext,
        },
      });

      if (!result) throw new Error('IA não retornou resultado');

      // Step 2: Save hooks
      setAutopilotProgress(50);
      setAutopilotStep('💾 Salvando hooks na biblioteca...');

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

      // Step 3: Create posts with scheduled dates
      setAutopilotProgress(70);
      setAutopilotStep('📅 Criando posts e agendando no calendário...');

      const generatedPosts = result.posts || [];
      const now = new Date();

      for (let i = 0; i < generatedPosts.length; i++) {
        const p = generatedPosts[i];
        const dayOffset = p.scheduled_day_offset || (i + 1);
        const [hour, minute] = (p.scheduled_time || '10:00').split(':').map(Number);
        const scheduledDate = setMinutes(setHours(addDays(now, dayOffset), hour || 10), minute || 0);

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
          story_sequence: p.story_sequence || [],
          ai_generated: true,
          position: i,
        } as any);

        setAutopilotProgress(70 + Math.round((i + 1) / generatedPosts.length * 25));
      }

      setAutopilotProgress(100);
      setAutopilotStep('✅ Autopilot concluído!');
      setAutopilotStats({ hooks: generatedHooks.length, posts: generatedPosts.length });
      setAutopilotDone(true);

      toast.success(`Autopilot: ${generatedHooks.length} hooks + ${generatedPosts.length} posts criados e agendados! 🚀`);
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
      {/* Autopilot Banner */}
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
                  className="flex flex-wrap items-center gap-3 mt-2"
                >
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Sparkles className="w-3 h-3" /> {autopilotStats.hooks} hooks
                  </Badge>
                  <Badge variant="secondary" className="text-xs gap-1">
                    <CalendarPlus className="w-3 h-3" /> {autopilotStats.posts} posts agendados
                  </Badge>
                  {onNavigateToCalendar && (
                    <Button size="sm" className="ml-auto gap-1.5 text-xs" onClick={onNavigateToCalendar}>
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
            onClick={handleAutopilot}
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
          <Button size="sm" onClick={handleAutopilot} disabled={autopilotRunning} className="gap-1.5">
            {autopilotRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
            Gerar Tudo + Agendar
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
                      <Badge className="bg-amber-500/15 text-amber-400 text-[9px] gap-0.5">
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
    </div>
  );
}
