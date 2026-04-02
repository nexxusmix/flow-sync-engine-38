import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InstagramCampaign, InstagramPost, PILLARS, FORMATS } from '@/hooks/useInstagramEngine';
import { ArrowDown, Users, Eye, ShoppingCart } from 'lucide-react';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

const FUNNEL_STAGES = [
  { key: 'topo', label: 'Topo — Descoberta', icon: <Eye className="w-4 h-4" />, pillars: ['educacao', 'bastidores'], color: 'from-primary/20 to-primary/5', border: 'border-primary/30', text: 'text-primary' },
  { key: 'meio', label: 'Meio — Consideração', icon: <Users className="w-4 h-4" />, pillars: ['autoridade', 'social_proof'], color: 'from-primary/15 to-primary/5', border: 'border-primary/20', text: 'text-primary/70' },
  { key: 'fundo', label: 'Fundo — Conversão', icon: <ShoppingCart className="w-4 h-4" />, pillars: ['venda', 'portfolio'], color: 'from-primary/10 to-primary/5', border: 'border-primary/15', text: 'text-primary/50' },
];

export function CampaignContentFunnel({ campaign, posts }: Props) {
  const stages = useMemo(() => {
    return FUNNEL_STAGES.map(stage => {
      const stagePosts = posts.filter(p => stage.pillars.includes(p.pillar || ''));
      const published = stagePosts.filter(p => p.status === 'published').length;
      const formats: Record<string, number> = {};
      stagePosts.forEach(p => { if (p.format) formats[p.format] = (formats[p.format] || 0) + 1; });
      return { ...stage, posts: stagePosts, published, formats };
    });
  }, [posts]);

  const totalPosts = posts.length || 1;
  const unassigned = posts.filter(p => !FUNNEL_STAGES.some(s => s.pillars.includes(p.pillar || '')));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <ArrowDown className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Funil de Conteúdo Visual</h3>
      </div>

      {/* Funnel */}
      <div className="space-y-1">
        {stages.map((stage, i) => {
          const widthPct = 100 - (i * 15);
          const pct = ((stage.posts.length / totalPosts) * 100).toFixed(0);
          return (
            <div key={stage.key}>
              <div
                className={`mx-auto bg-gradient-to-b ${stage.color} border ${stage.border} rounded-xl p-4 transition-all`}
                style={{ width: `${widthPct}%` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={stage.text}>{stage.icon}</span>
                    <span className={`text-xs font-semibold ${stage.text}`}>{stage.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[9px] ${stage.text}`}>{stage.posts.length} posts</Badge>
                    <span className="text-[10px] text-muted-foreground">{pct}%</span>
                  </div>
                </div>

                {/* Posts in stage */}
                <div className="flex flex-wrap gap-1.5">
                  {stage.posts.slice(0, 8).map(p => {
                    const fmtLabel = FORMATS.find(f => f.key === p.format)?.label || p.format;
                    return (
                      <div key={p.id} className="flex items-center gap-1 bg-background/40 rounded px-1.5 py-0.5">
                        <span className="text-[9px] text-foreground truncate max-w-[100px]">{p.title}</span>
                        <Badge variant="outline" className="text-[7px] h-3">{fmtLabel}</Badge>
                      </div>
                    );
                  })}
                  {stage.posts.length > 8 && (
                    <span className="text-[9px] text-muted-foreground">+{stage.posts.length - 8}</span>
                  )}
                </div>

                {/* Format breakdown */}
                {Object.keys(stage.formats).length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {Object.entries(stage.formats).map(([fmt, count]) => (
                      <span key={fmt} className="text-[9px] text-muted-foreground">
                        {FORMATS.find(f => f.key === fmt)?.label || fmt}: {count}
                      </span>
                    ))}
                  </div>
                )}

                {/* Conversion arrow */}
                {stage.published > 0 && (
                  <div className="text-[10px] text-muted-foreground mt-1">
                    ✅ {stage.published} publicados
                  </div>
                )}
              </div>
              {i < stages.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <ArrowDown className="w-4 h-4 text-muted-foreground/30" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Unassigned */}
      {unassigned.length > 0 && (
        <Card className="p-3 bg-card/50 border-border/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-muted-foreground">⚠️ Sem etapa definida ({unassigned.length})</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {unassigned.slice(0, 10).map(p => (
              <Badge key={p.id} variant="outline" className="text-[9px]">{p.title}</Badge>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground mt-1">Defina um pilar para esses posts aparecerem no funil</p>
        </Card>
      )}
    </div>
  );
}
