import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InstagramPost, InstagramCampaign, PILLARS, FORMATS } from '@/hooks/useInstagramEngine';
import { motion } from 'framer-motion';
import { ArrowDown, Eye, Heart, MessageSquare, ShoppingBag, Users, TrendingUp, AlertTriangle } from 'lucide-react';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

type FunnelStage = 'tofu' | 'mofu' | 'bofu';

const FUNNEL_CONFIG: Record<FunnelStage, { label: string; description: string; color: string; bg: string; icon: React.ReactNode; pillars: string[] }> = {
  tofu: {
    label: 'TOPO (Awareness)',
    description: 'Alcance e descoberta',
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    icon: <Eye className="w-5 h-5" />,
    pillars: ['educacao', 'bastidores', 'autoridade'],
  },
  mofu: {
    label: 'MEIO (Consideração)',
    description: 'Engajamento e confiança',
    color: 'text-primary/70',
    bg: 'bg-primary/10',
    icon: <Heart className="w-5 h-5" />,
    pillars: ['autoridade', 'social_proof', 'portfolio'],
  },
  bofu: {
    label: 'FUNDO (Conversão)',
    description: 'Decisão e venda',
    color: 'text-primary',
    bg: 'bg-primary/15',
    icon: <ShoppingBag className="w-5 h-5" />,
    pillars: ['venda', 'social_proof'],
  },
};

function classifyPost(post: InstagramPost): FunnelStage {
  const pillar = post.pillar || '';
  if (['venda'].includes(pillar)) return 'bofu';
  if (['social_proof', 'portfolio'].includes(pillar)) return 'mofu';
  if (['educacao', 'bastidores', 'autoridade'].includes(pillar)) return 'tofu';
  // Fallback: status-based
  if (post.objective?.toLowerCase().includes('venda') || post.objective?.toLowerCase().includes('convers')) return 'bofu';
  if (post.objective?.toLowerCase().includes('engaj')) return 'mofu';
  return 'tofu';
}

export function CampaignFunnelView({ campaign, posts }: Props) {
  const funnelData = useMemo(() => {
    const stages: Record<FunnelStage, InstagramPost[]> = { tofu: [], mofu: [], bofu: [] };
    posts.forEach(p => stages[classifyPost(p)].push(p));

    const total = posts.length || 1;
    const tofuPct = Math.round((stages.tofu.length / total) * 100);
    const mofuPct = Math.round((stages.mofu.length / total) * 100);
    const bofuPct = Math.round((stages.bofu.length / total) * 100);

    // Conversion rates between stages
    const tofuToMofu = stages.tofu.length > 0 ? Math.round((stages.mofu.length / stages.tofu.length) * 100) : 0;
    const mofuToBofu = stages.mofu.length > 0 ? Math.round((stages.bofu.length / stages.mofu.length) * 100) : 0;

    // Health indicators
    const issues: string[] = [];
    if (stages.bofu.length === 0 && posts.length > 3) issues.push('Sem posts de conversão (BOFU)');
    if (stages.tofu.length === 0 && posts.length > 3) issues.push('Sem posts de awareness (TOFU)');
    if (tofuPct > 70) issues.push('Funil muito top-heavy — mais conteúdo de conversão');
    if (bofuPct > 50) issues.push('Funil muito agressivo — equilibre com conteúdo educativo');

    return { stages, tofuPct, mofuPct, bofuPct, tofuToMofu, mofuToBofu, issues };
  }, [posts]);

  const stageOrder: FunnelStage[] = ['tofu', 'mofu', 'bofu'];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Funil de Conversão</h4>
          <p className="text-[10px] text-muted-foreground">{posts.length} posts mapeados em 3 etapas do funil</p>
        </div>
      </div>

      {/* Issues */}
      {funnelData.issues.length > 0 && (
        <Card className="glass-card p-3 border-amber-500/20">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-medium text-amber-400">Alertas do Funil</span>
          </div>
          <div className="space-y-1">
            {funnelData.issues.map((issue, i) => (
              <p key={i} className="text-[9px] text-muted-foreground">• {issue}</p>
            ))}
          </div>
        </Card>
      )}

      {/* Visual Funnel */}
      <div className="space-y-0">
        {stageOrder.map((stage, i) => {
          const config = FUNNEL_CONFIG[stage];
          const stagePosts = funnelData.stages[stage];
          const pct = stage === 'tofu' ? funnelData.tofuPct : stage === 'mofu' ? funnelData.mofuPct : funnelData.bofuPct;
          const widthPct = Math.max(pct, 25);

          return (
            <div key={stage}>
              <motion.div
                initial={{ opacity: 0, scaleX: 0.5 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
                className="mx-auto"
                style={{ width: `${widthPct}%`, minWidth: '200px' }}
              >
                <Card className={`glass-card p-4 ${config.bg} border-none`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={config.color}>{config.icon}</div>
                      <div>
                        <p className={`text-[10px] font-bold ${config.color}`}>{config.label}</p>
                        <p className="text-[8px] text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${config.color}`}>{stagePosts.length}</p>
                      <p className="text-[8px] text-muted-foreground">{pct}% do total</p>
                    </div>
                  </div>

                  {/* Posts in this stage */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {stagePosts.slice(0, 8).map(p => (
                      <Badge key={p.id} variant="outline" className="text-[7px] bg-background/30">
                        {p.title.slice(0, 18)}{p.title.length > 18 ? '…' : ''}
                      </Badge>
                    ))}
                    {stagePosts.length > 8 && (
                      <Badge variant="outline" className="text-[7px]">+{stagePosts.length - 8}</Badge>
                    )}
                  </div>

                  {/* Pillar breakdown */}
                  <div className="flex gap-1 mt-2">
                    {PILLARS.filter(pl => stagePosts.some(p => p.pillar === pl.key)).map(pl => {
                      const count = stagePosts.filter(p => p.pillar === pl.key).length;
                      return (
                        <Badge key={pl.key} className="text-[7px]" style={{ backgroundColor: `${pl.color}20`, color: pl.color }}>
                          {pl.label}: {count}
                        </Badge>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>

              {/* Conversion arrow */}
              {i < stageOrder.length - 1 && (
                <motion.div
                  className="flex flex-col items-center py-1.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.15 + 0.3 }}
                >
                  <ArrowDown className="w-4 h-4 text-muted-foreground" />
                  <Badge variant="outline" className="text-[8px] mt-0.5">
                    {i === 0 ? funnelData.tofuToMofu : funnelData.mofuToBofu}% conversão
                  </Badge>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        {stageOrder.map(stage => {
          const config = FUNNEL_CONFIG[stage];
          const count = funnelData.stages[stage].length;
          const published = funnelData.stages[stage].filter(p => p.status === 'published').length;
          return (
            <Card key={stage} className="glass-card p-3 text-center">
              <div className={`${config.color} mx-auto mb-1`}>{config.icon}</div>
              <p className="text-lg font-bold text-foreground">{count}</p>
              <p className="text-[8px] text-muted-foreground">{published} publicados</p>
              <p className={`text-[7px] ${config.color}`}>{stage.toUpperCase()}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
