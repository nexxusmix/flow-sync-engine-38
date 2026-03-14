import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InstagramPost, FORMATS, PILLARS, InstagramCampaign } from '@/hooks/useInstagramEngine';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Sparkles, Loader2, Copy, TrendingUp, Clock, Zap, CheckCircle2, Calendar } from 'lucide-react';
import { formatDistanceToNow, differenceInDays, addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

interface RepostSuggestion {
  post: InstagramPost;
  reason: string;
  score: number;
  daysSincePublished: number;
  newHook?: string;
  newCaption?: string;
}

export function CampaignRepostAutomation({ campaign, posts }: Props) {
  const qc = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [variations, setVariations] = useState<Record<string, { hook: string; caption: string }>>({});
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  // Find evergreen candidates: published posts older than 14 days
  const suggestions = useMemo(() => {
    const published = posts.filter(p => p.status === 'published' && p.published_at);
    const results: RepostSuggestion[] = [];

    published.forEach(post => {
      const days = differenceInDays(new Date(), new Date(post.published_at!));
      if (days < 14) return;

      let score = 0;
      let reasons: string[] = [];

      // Content completeness bonus
      if (post.hook) { score += 15; reasons.push('tem hook forte'); }
      if (post.caption_short || post.caption_long) { score += 15; reasons.push('legenda completa'); }
      if (post.script) { score += 10; reasons.push('tem roteiro'); }
      if (post.cta) { score += 10; reasons.push('CTA definido'); }
      if (post.ai_generated) { score += 5; }

      // Age bonus (older = more opportunity)
      score += Math.min(days * 0.5, 20);

      // Pillar diversity bonus
      const pillar = PILLARS.find(p => p.key === post.pillar);
      if (pillar) { score += 10; reasons.push(`pilar: ${pillar.label}`); }

      if (score > 20) {
        results.push({
          post,
          reason: reasons.join(' · '),
          score: Math.round(Math.min(score, 100)),
          daysSincePublished: days,
        });
      }
    });

    return results.sort((a, b) => b.score - a.score);
  }, [posts]);

  const handleGenerateVariation = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    setGeneratingFor(postId);
    try {
      const { data, error } = await supabase.functions.invoke('instagram-ai', {
        body: {
          action: 'repost_variation',
          context: {
            campaign_name: campaign.name,
            original_hook: post.hook,
            original_caption: post.caption_short || post.caption_long,
            original_cta: post.cta,
            pillar: post.pillar,
            format: post.format,
            target_audience: campaign.target_audience,
          }
        }
      });
      if (error) throw error;
      const out = data?.output || data;
      setVariations(prev => ({
        ...prev,
        [postId]: {
          hook: out.new_hook || `${post.hook} (Atualizado)`,
          caption: out.new_caption || `${(post.caption_short || post.caption_long || '').slice(0, 100)}... [versão atualizada]`,
        }
      }));
    } catch {
      // Fallback
      setVariations(prev => ({
        ...prev,
        [postId]: {
          hook: post.hook ? `🔄 ${post.hook.replace(/^./, c => c.toUpperCase())}` : 'Você pediu, voltou! 🔥',
          caption: `Esse conteúdo voltou porque vocês amaram! ${(post.caption_short || post.caption_long || '').slice(0, 80)}...`,
        }
      }));
    } finally {
      setGeneratingFor(null);
    }
  };

  const handleDuplicate = async (suggestion: RepostSuggestion) => {
    setDuplicating(suggestion.post.id);
    try {
      const variation = variations[suggestion.post.id];
      const scheduledDate = format(addDays(new Date(), 3), 'yyyy-MM-dd');

      await supabase.from('instagram_posts').insert({
        campaign_id: campaign.id,
        title: `[Repost] ${suggestion.post.title}`,
        hook: variation?.hook || suggestion.post.hook,
        caption_short: variation?.caption || suggestion.post.caption_short,
        caption_long: suggestion.post.caption_long,
        cta: suggestion.post.cta,
        script: suggestion.post.script,
        format: suggestion.post.format,
        pillar: suggestion.post.pillar,
        hashtags: suggestion.post.hashtags,
        status: 'ready',
        ai_generated: true,
        scheduled_at: scheduledDate,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      });

      qc.invalidateQueries({ queryKey: ['instagram-posts'] });
      toast.success('Post duplicado com variação para repostagem!');
    } catch {
      toast.error('Erro ao duplicar');
    } finally {
      setDuplicating(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
          <RefreshCw className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Automação de Repostagem</h4>
          <p className="text-[10px] text-muted-foreground">{suggestions.length} posts evergreen detectados</p>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <Card className="glass-card p-8 text-center">
          <RefreshCw className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-[10px] text-muted-foreground">Nenhum post elegível para repostagem.</p>
          <p className="text-[9px] text-muted-foreground/50 mt-1">Posts publicados há mais de 14 dias aparecerão aqui.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s, i) => {
            const variation = variations[s.post.id];
            const fmt = FORMATS.find(f => f.key === s.post.format);
            const pillar = PILLARS.find(p => p.key === s.post.pillar);

            return (
              <motion.div key={s.post.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className="glass-card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-semibold text-foreground truncate">{s.post.title}</span>
                        <Badge className="bg-primary/15 text-primary text-[7px] shrink-0">Score {s.score}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[8px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{s.daysSincePublished} dias atrás</span>
                        {fmt && <><span>·</span><span>{fmt.label}</span></>}
                        {pillar && <><span>·</span><span>{pillar.label}</span></>}
                      </div>
                      <p className="text-[8px] text-muted-foreground/70 mt-1">{s.reason}</p>
                    </div>
                  </div>

                  {/* Original content */}
                  {s.post.hook && (
                    <div className="p-2 bg-muted/10 rounded-lg mb-2">
                      <span className="text-[7px] text-muted-foreground uppercase">Hook original</span>
                      <p className="text-[9px] text-foreground/70">{s.post.hook}</p>
                    </div>
                  )}

                  {/* Variation */}
                  <AnimatePresence>
                    {variation && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 mb-2">
                        <div className="p-2 bg-teal-500/5 rounded-lg border border-teal-500/20">
                          <span className="text-[7px] text-teal-400 uppercase">Nova variação</span>
                          <p className="text-[9px] text-foreground/80 font-medium">{variation.hook}</p>
                          <p className="text-[8px] text-foreground/60 mt-1">{variation.caption}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions */}
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" className="flex-1 gap-1 text-[9px] h-7" onClick={() => handleGenerateVariation(s.post.id)} disabled={generatingFor === s.post.id}>
                      {generatingFor === s.post.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {variation ? 'Refazer' : 'Gerar'} Variação
                    </Button>
                    <Button size="sm" className="flex-1 gap-1 text-[9px] h-7" onClick={() => handleDuplicate(s)} disabled={duplicating === s.post.id}>
                      {duplicating === s.post.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Copy className="w-3 h-3" />}
                      Repostar
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
