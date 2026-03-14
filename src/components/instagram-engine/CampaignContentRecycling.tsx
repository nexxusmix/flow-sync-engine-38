import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InstagramCampaign, InstagramPost, useInstagramAI, useCreatePost, PILLARS, FORMATS } from '@/hooks/useInstagramEngine';
import { Recycle, Sparkles, Loader2, ArrowRight, Star, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

interface RecycleCandidate {
  post: InstagramPost;
  score: number;
  reason: string;
  daysSince: number;
}

export function CampaignContentRecycling({ campaign, posts }: Props) {
  const ai = useInstagramAI();
  const createPost = useCreatePost();
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [recycling, setRecycling] = useState<string | null>(null);

  // Find top performers eligible for recycling (published > 14 days ago)
  const candidates = useMemo(() => {
    const now = Date.now();
    return posts
      .filter(p => p.status === 'published' && p.published_at)
      .map(p => {
        const daysSince = Math.floor((now - new Date(p.published_at!).getTime()) / 86400000);
        // Score: completeness + age bonus
        let score = 0;
        if (p.hook) score += 15;
        if (p.script) score += 15;
        if (p.caption_short) score += 10;
        if (p.caption_long) score += 10;
        if (p.cta) score += 10;
        if ((p.hashtags || []).length > 5) score += 10;
        if (daysSince > 30) score += 20;
        else if (daysSince > 14) score += 10;
        if (p.ai_generated) score += 5; // proven AI quality
        // Penalty if very recent
        if (daysSince < 14) score -= 30;

        let reason = '';
        if (daysSince > 60) reason = 'Conteúdo evergreen — 60+ dias, ideal para reciclagem';
        else if (daysSince > 30) reason = 'Conteúdo maduro — pode ser reaproveitado com novo ângulo';
        else if (daysSince > 14) reason = 'Conteúdo recente — considerar atualização';
        else reason = 'Muito recente para reciclar';

        return { post: p, score, reason, daysSince } as RecycleCandidate;
      })
      .filter(c => c.daysSince >= 14)
      .sort((a, b) => b.score - a.score);
  }, [posts]);

  const handleAIRecycle = async (candidate: RecycleCandidate) => {
    setRecycling(candidate.post.id);
    try {
      const result = await ai.mutateAsync({
        action: 'generate_from_context',
        data: {
          command: `Recicle este post antigo criando uma versão NOVA e ATUALIZADA.
Post original:
- Título: ${candidate.post.title}
- Hook: ${candidate.post.hook || 'N/A'}
- Formato: ${candidate.post.format}
- Pilar: ${candidate.post.pillar || 'N/A'}
- Legenda: ${candidate.post.caption_short || candidate.post.caption_long || 'N/A'}

Gere uma versão completamente reescrita com novo ângulo mantendo a essência do tema.
Retorne JSON com: title, hook, script, caption_short, caption_medium, caption_long, cta, hashtags (array), cover_suggestion.
Sugira um formato diferente se fizer sentido.`,
          format: candidate.post.format,
          pillar: candidate.post.pillar || undefined,
        },
      });

      if (result) {
        setAiSuggestions(prev => [...prev, { originalId: candidate.post.id, ...result }]);
        toast.success('Versão reciclada gerada!');
      }
    } catch {
      // handled by mutation
    } finally {
      setRecycling(null);
    }
  };

  const handleCreateRecycled = async (suggestion: any) => {
    try {
      await createPost.mutateAsync({
        title: suggestion.title || 'Post Reciclado',
        format: suggestion.format || 'reel',
        pillar: suggestion.pillar || null,
        status: 'idea',
        hook: suggestion.hook || null,
        script: suggestion.script || null,
        caption_short: suggestion.caption_short || null,
        caption_medium: suggestion.caption_medium || null,
        caption_long: suggestion.caption_long || null,
        cta: suggestion.cta || null,
        hashtags: suggestion.hashtags || [],
        cover_suggestion: suggestion.cover_suggestion || null,
        campaign_id: campaign.id,
        ai_generated: true,
      } as any);
      toast.success('Post reciclado criado na campanha!');
    } catch {
      // handled
    }
  };

  const getPillarLabel = (key: string | null) => PILLARS.find(p => p.key === key)?.label || key || '-';
  const getFormatLabel = (key: string) => FORMATS.find(f => f.key === key)?.label || key;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Recycle className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Reciclagem Inteligente de Conteúdo</h3>
        <Badge variant="outline" className="text-[10px]">{candidates.length} candidatos</Badge>
      </div>

      {candidates.length === 0 ? (
        <Card className="p-8 bg-card/30 border-border/20 text-center">
          <Recycle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Nenhum post publicado há mais de 14 dias para reciclar</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {candidates.slice(0, 10).map(c => {
            const suggestion = aiSuggestions.find(s => s.originalId === c.post.id);
            return (
              <Card key={c.post.id} className="p-4 bg-card/50 border-border/30">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-xs font-semibold text-foreground truncate">{c.post.title}</h4>
                      <Badge variant="outline" className="text-[9px]">{getFormatLabel(c.post.format)}</Badge>
                      {c.post.pillar && <Badge variant="outline" className="text-[9px]">{getPillarLabel(c.post.pillar)}</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.daysSince} dias atrás</span>
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-primary" /> Score: {c.score}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{c.reason}</p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-[10px] h-7 shrink-0"
                    onClick={() => handleAIRecycle(c)}
                    disabled={recycling === c.post.id || ai.isPending}
                  >
                    {recycling === c.post.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    Reciclar com IA
                  </Button>
                </div>

                {/* AI Suggestion */}
                {suggestion && (
                  <div className="mt-3 pt-3 border-t border-border/20">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRight className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] font-semibold text-emerald-400">Versão Reciclada</span>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {suggestion.title && <p><span className="text-foreground font-medium">Título:</span> {suggestion.title}</p>}
                      {suggestion.hook && <p><span className="text-foreground font-medium">Hook:</span> {suggestion.hook}</p>}
                      {suggestion.caption_short && <p><span className="text-foreground font-medium">Legenda:</span> {suggestion.caption_short}</p>}
                    </div>
                    <Button
                      size="sm"
                      className="mt-2 gap-1 text-[10px] h-7"
                      onClick={() => handleCreateRecycled(suggestion)}
                      disabled={createPost.isPending}
                    >
                      <CheckCircle className="w-3 h-3" /> Criar Post
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
