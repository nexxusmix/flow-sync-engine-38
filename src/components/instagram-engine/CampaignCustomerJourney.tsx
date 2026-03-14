import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InstagramPost, InstagramCampaign, PILLARS, FORMATS, POST_STATUSES } from '@/hooks/useInstagramEngine';
import { motion } from 'framer-motion';
import { Route, Eye, Heart, MessageSquare, ShoppingBag, ArrowRight, CheckCircle } from 'lucide-react';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

type JourneyStage = 'discovery' | 'engagement' | 'trust' | 'conversion';

const STAGES: { key: JourneyStage; label: string; description: string; icon: React.ReactNode; color: string; bg: string; pillars: string[] }[] = [
  { key: 'discovery', label: 'Descoberta', description: 'O seguidor encontra você', icon: <Eye className="w-5 h-5" />, color: 'text-primary', bg: 'bg-primary/15', pillars: ['educacao', 'bastidores'] },
  { key: 'engagement', label: 'Engajamento', description: 'Interage com o conteúdo', icon: <Heart className="w-5 h-5" />, color: 'text-primary/80', bg: 'bg-primary/10', pillars: ['autoridade', 'educacao'] },
  { key: 'trust', label: 'Confiança', description: 'Passa a confiar na marca', icon: <MessageSquare className="w-5 h-5" />, color: 'text-muted-foreground', bg: 'bg-muted', pillars: ['social_proof', 'portfolio', 'bastidores'] },
  { key: 'conversion', label: 'Conversão', description: 'Toma a decisão de compra', icon: <ShoppingBag className="w-5 h-5" />, color: 'text-primary', bg: 'bg-primary/20', pillars: ['venda', 'social_proof'] },
];

function classifyJourneyStage(post: InstagramPost): JourneyStage {
  const pillar = post.pillar || '';
  if (['venda'].includes(pillar)) return 'conversion';
  if (['social_proof', 'portfolio'].includes(pillar)) return 'trust';
  if (['autoridade'].includes(pillar)) return 'engagement';
  return 'discovery';
}

export function CampaignCustomerJourney({ campaign, posts }: Props) {
  const journeyData = useMemo(() => {
    const stages: Record<JourneyStage, InstagramPost[]> = { discovery: [], engagement: [], trust: [], conversion: [] };
    posts.forEach(p => stages[classifyJourneyStage(p)].push(p));

    const total = posts.length || 1;
    const coverage = STAGES.filter(s => stages[s.key].length > 0).length;
    const gaps = STAGES.filter(s => stages[s.key].length === 0).map(s => s.label);

    return { stages, coverage, gaps };
  }, [posts]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
          <Route className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Jornada do Seguidor</h4>
          <p className="text-[10px] text-muted-foreground">
            {journeyData.coverage}/4 etapas cobertas
            {journeyData.gaps.length > 0 && <span className="text-muted-foreground ml-1">· Gaps: {journeyData.gaps.join(', ')}</span>}
          </p>
        </div>
      </div>

      {/* Coverage bar */}
      <Card className="glass-card p-4">
        <div className="flex items-center gap-1">
          {STAGES.map((stage, i) => {
            const count = journeyData.stages[stage.key].length;
            const hasContent = count > 0;
            return (
              <div key={stage.key} className="flex items-center flex-1">
                <motion.div
                  className={`flex-1 h-2 rounded-full ${hasContent ? 'bg-gradient-to-r from-primary/60 to-primary' : 'bg-muted/10'}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: i * 0.15, duration: 0.4 }}
                />
                {i < STAGES.length - 1 && (
                  <ArrowRight className={`w-3 h-3 mx-0.5 shrink-0 ${hasContent ? 'text-primary' : 'text-muted/20'}`} />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1.5">
          {STAGES.map(s => (
            <span key={s.key} className={`text-[7px] ${journeyData.stages[s.key].length > 0 ? s.color : 'text-muted/30'}`}>
              {s.label}
            </span>
          ))}
        </div>
      </Card>

      {/* Journey stages */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border/20" />

        <div className="space-y-4">
          {STAGES.map((stage, i) => {
            const stagePosts = journeyData.stages[stage.key];
            const isEmpty = stagePosts.length === 0;

            return (
              <motion.div
                key={stage.key}
                className="relative pl-10"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.12 }}
              >
                {/* Node */}
                <div className={`absolute left-0 top-0 w-9 h-9 rounded-full ${stage.bg} flex items-center justify-center z-10 ${isEmpty ? 'opacity-30' : ''}`}>
                  <div className={stage.color}>{stage.icon}</div>
                </div>

                <Card className={`glass-card p-4 ${isEmpty ? 'opacity-40 border-dashed' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className={`text-[11px] font-semibold ${stage.color}`}>{stage.label}</p>
                      <p className="text-[8px] text-muted-foreground">{stage.description}</p>
                    </div>
                    <Badge variant="outline" className="text-[8px]">
                      {stagePosts.length} post{stagePosts.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {isEmpty ? (
                    <p className="text-[9px] text-muted-foreground italic">
                      Nenhum post nesta etapa — considere adicionar conteúdo de {stage.pillars.map(p => PILLARS.find(pl => pl.key === p)?.label || p).join(' ou ')}
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {stagePosts.slice(0, 5).map(post => {
                        const st = POST_STATUSES.find(s => s.key === post.status);
                        return (
                          <div key={post.id} className="flex items-center gap-2 py-1 border-b border-border/5 last:border-0">
                            {post.status === 'published' ? (
                              <CheckCircle className="w-3 h-3 text-primary shrink-0" />
                            ) : (
                              <div className="w-3 h-3 rounded-full border border-muted-foreground/30 shrink-0" />
                            )}
                            <span className="text-[9px] text-foreground flex-1 truncate">{post.title}</span>
                            {post.format && (
                              <Badge variant="outline" className="text-[6px]">{FORMATS.find(f => f.key === post.format)?.label}</Badge>
                            )}
                            {st && <Badge className={`${st.color} text-[6px]`}>{st.label}</Badge>}
                          </div>
                        );
                      })}
                      {stagePosts.length > 5 && (
                        <p className="text-[8px] text-muted-foreground">+{stagePosts.length - 5} mais</p>
                      )}
                    </div>
                  )}

                  {/* Recommended pillars */}
                  <div className="flex gap-1 mt-2">
                    {stage.pillars.map(p => {
                      const pillar = PILLARS.find(pl => pl.key === p);
                      if (!pillar) return null;
                      const used = stagePosts.some(post => post.pillar === p);
                      return (
                        <Badge
                          key={p}
                          className="text-[6px]"
                          style={{
                            backgroundColor: used ? `${pillar.color}20` : 'transparent',
                            color: pillar.color,
                            border: `1px solid ${pillar.color}${used ? '40' : '15'}`,
                            opacity: used ? 1 : 0.4,
                          }}
                        >
                          {pillar.label} {used ? '✓' : ''}
                        </Badge>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <Card className="glass-card p-3 text-center">
        <p className="text-[9px] text-muted-foreground">
          Cobertura: <span className="font-bold text-foreground">{journeyData.coverage}/4</span> etapas ·
          {journeyData.gaps.length === 0
            ? <span className="text-emerald-400 ml-1">Jornada completa ✓</span>
            : <span className="text-amber-400 ml-1">Preencha: {journeyData.gaps.join(', ')}</span>
          }
        </p>
      </Card>
    </div>
  );
}
