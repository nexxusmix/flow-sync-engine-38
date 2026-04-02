import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InstagramCampaign, InstagramPost, useInstagramAI } from '@/hooks/useInstagramEngine';
import { MessageCircle, Sparkles, Loader2, SmilePlus, Frown, Meh, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

interface WordFreq {
  word: string;
  count: number;
}

const STOP_WORDS = new Set(['de', 'a', 'o', 'e', 'que', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'era', 'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus', 'quem', 'nas', 'me', 'esse', 'eles', 'estão', 'você', 'the', 'and', 'to', 'of', 'in', 'is', 'it', 'for', 'on', 'are', 'was', 'with', 'this', 'that']);

export function CampaignSentimentAnalysis({ campaign, posts }: Props) {
  const ai = useInstagramAI();
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  // Build word cloud from all text content
  const wordCloud = useMemo(() => {
    const freq: Record<string, number> = {};
    posts.forEach(p => {
      const texts = [p.hook, p.caption_short, p.caption_long, p.caption_medium, p.cta, p.script].filter(Boolean);
      texts.forEach(t => {
        const words = (t as string).toLowerCase().replace(/[^\wàáâãéêíóôõúç\s]/g, '').split(/\s+/);
        words.forEach(w => {
          if (w.length > 2 && !STOP_WORDS.has(w)) {
            freq[w] = (freq[w] || 0) + 1;
          }
        });
      });
    });
    return Object.entries(freq)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);
  }, [posts]);

  // Simple sentiment per post
  const postSentiments = useMemo(() => {
    const positive = ['sucesso', 'incrível', 'resultado', 'conquista', 'feliz', 'melhor', 'excelente', 'perfeito', 'ótimo', 'maravilhoso', 'top', 'lucro', 'crescimento', 'transformação', 'poder', 'liberdade'];
    const negative = ['problema', 'erro', 'ruim', 'difícil', 'medo', 'perda', 'nunca', 'pior', 'desistir', 'fracasso', 'crise'];

    return posts.map(p => {
      const text = [p.hook, p.caption_short, p.caption_long, p.cta].filter(Boolean).join(' ').toLowerCase();
      let score = 0;
      positive.forEach(w => { if (text.includes(w)) score++; });
      negative.forEach(w => { if (text.includes(w)) score--; });
      return { post: p, score, sentiment: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral' };
    });
  }, [posts]);

  const sentimentCounts = useMemo(() => {
    const counts = { positive: 0, negative: 0, neutral: 0 };
    postSentiments.forEach(ps => counts[ps.sentiment as keyof typeof counts]++);
    return counts;
  }, [postSentiments]);

  const handleAIAnalysis = async () => {
    try {
      const sampleTexts = posts.slice(0, 15).map(p =>
        `[${p.format}] ${p.hook || ''} | ${p.caption_short || ''}`
      ).join('\n');

      const result = await ai.mutateAsync({
        action: 'generate_from_context',
        data: {
          command: `Analise o sentimento e tom dos textos desta campanha "${campaign.name}".

Textos:
${sampleTexts}

Retorne JSON com:
- overall_sentiment: "positivo" | "neutro" | "negativo"
- overall_score: 0-100
- tone_tags: array de tags de tom (ex: "motivacional", "urgente", "educativo", etc)
- emotion_map: objeto com emoções e porcentagens (ex: {"inspiração": 40, "curiosidade": 30, "urgência": 20, "medo": 10})
- recommendations: array de 3 recomendações para melhorar o tom
- strengths: array de 2 pontos fortes do tom atual`,
          format: 'analysis',
        },
      });
      setAiAnalysis(result);
      toast.success('Análise de sentimento gerada!');
    } catch {
      // handled
    }
  };

  const maxCount = wordCloud[0]?.count || 1;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Análise de Sentimento & Word Cloud</h3>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8" onClick={handleAIAnalysis} disabled={ai.isPending}>
          {ai.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Análise Profunda IA
        </Button>
      </div>

      {/* Sentiment Overview */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 bg-card/50 border-border/30 text-center">
          <SmilePlus className="w-5 h-5 text-primary mx-auto mb-1" />
          <div className="text-lg font-bold text-primary">{sentimentCounts.positive}</div>
          <div className="text-[10px] text-muted-foreground">Positivo</div>
        </Card>
        <Card className="p-3 bg-card/50 border-border/30 text-center">
          <Meh className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">{sentimentCounts.neutral}</div>
          <div className="text-[10px] text-muted-foreground">Neutro</div>
        </Card>
        <Card className="p-3 bg-card/50 border-border/30 text-center">
          <Frown className="w-5 h-5 text-destructive mx-auto mb-1" />
          <div className="text-lg font-bold text-destructive">{sentimentCounts.negative}</div>
          <div className="text-[10px] text-muted-foreground">Negativo</div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Word Cloud */}
        <Card className="p-4 bg-card/50 border-border/30">
          <h4 className="text-xs font-semibold text-foreground mb-3">☁️ Word Cloud</h4>
          <div className="flex flex-wrap gap-1.5 items-center justify-center min-h-[120px]">
            {wordCloud.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum texto disponível</p>
            ) : (
              wordCloud.map(w => {
                const size = Math.max(10, Math.min(24, 10 + (w.count / maxCount) * 14));
                const opacity = 0.4 + (w.count / maxCount) * 0.6;
                return (
                  <span
                    key={w.word}
                    className="text-primary cursor-default transition-transform hover:scale-110"
                    style={{ fontSize: `${size}px`, opacity }}
                    title={`${w.word}: ${w.count}x`}
                  >
                    {w.word}
                  </span>
                );
              })
            )}
          </div>
        </Card>

        {/* Sentiment per post */}
        <Card className="p-4 bg-card/50 border-border/30">
          <h4 className="text-xs font-semibold text-foreground mb-3">📊 Sentimento por Post</h4>
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
            {postSentiments.slice(0, 15).map(ps => (
              <div key={ps.post.id} className="flex items-center gap-2">
                {ps.sentiment === 'positive' && <SmilePlus className="w-3 h-3 text-primary shrink-0" />}
                {ps.sentiment === 'neutral' && <Meh className="w-3 h-3 text-muted-foreground shrink-0" />}
                {ps.sentiment === 'negative' && <Frown className="w-3 h-3 text-destructive shrink-0" />}
                <span className="text-xs text-foreground truncate flex-1">{ps.post.title}</span>
                <span className="text-[10px] text-muted-foreground">{ps.score > 0 ? '+' : ''}{ps.score}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI Analysis */}
      {aiAnalysis && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Score & Tone */}
          <Card className="p-4 bg-card/50 border-border/30">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <div>
                <span className="text-2xl font-bold text-foreground">{aiAnalysis.overall_score || '—'}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
              {aiAnalysis.overall_sentiment && (
                <Badge variant="outline" className="text-[10px]">{aiAnalysis.overall_sentiment}</Badge>
              )}
            </div>
            {Array.isArray(aiAnalysis.tone_tags) && (
              <div className="flex flex-wrap gap-1 mb-3">
                {aiAnalysis.tone_tags.map((tag: string) => (
                  <Badge key={tag} className="bg-primary/10 text-primary text-[9px]">{tag}</Badge>
                ))}
              </div>
            )}
            {aiAnalysis.emotion_map && typeof aiAnalysis.emotion_map === 'object' && (
              <div className="space-y-1.5">
                {Object.entries(aiAnalysis.emotion_map).map(([emotion, pct]) => (
                  <div key={emotion} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-20 text-right">{emotion}</span>
                    <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-8">{String(pct)}%</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recommendations */}
          <Card className="p-4 bg-card/50 border-border/30">
            {Array.isArray(aiAnalysis.strengths) && aiAnalysis.strengths.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-primary mb-1.5">✅ Pontos Fortes</h4>
                <ul className="space-y-1">
                  {aiAnalysis.strengths.map((s: string, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground">• {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray(aiAnalysis.recommendations) && aiAnalysis.recommendations.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">💡 Recomendações</h4>
                <ul className="space-y-1">
                  {aiAnalysis.recommendations.map((r: string, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground">• {r}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
