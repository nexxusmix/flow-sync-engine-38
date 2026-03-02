import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInstagramCampaigns, useInstagramPosts, InstagramCampaign, InstagramPost, PILLARS, FORMATS } from '@/hooks/useInstagramEngine';
import { BarChart3, TrendingUp, ArrowUpRight, ArrowDownRight, Minus, Scale, Sparkles } from 'lucide-react';

interface CampaignStats {
  totalPosts: number;
  published: number;
  avgPerDay: number;
  pillars: Record<string, number>;
  formats: Record<string, number>;
  statuses: Record<string, number>;
  completionRate: number;
  aiRate: number;
  hashtagCount: number;
  avgHashtags: number;
}

function computeStats(campaign: InstagramCampaign, posts: InstagramPost[]): CampaignStats {
  const cPosts = posts.filter(p => p.campaign_id === campaign.id);
  const published = cPosts.filter(p => p.status === 'published').length;
  const pillars: Record<string, number> = {};
  const formats: Record<string, number> = {};
  const statuses: Record<string, number> = {};
  let totalHashtags = 0;

  cPosts.forEach(p => {
    if (p.pillar) pillars[p.pillar] = (pillars[p.pillar] || 0) + 1;
    if (p.format) formats[p.format] = (formats[p.format] || 0) + 1;
    statuses[p.status] = (statuses[p.status] || 0) + 1;
    totalHashtags += (p.hashtags || []).length;
  });

  let days = 1;
  if (campaign.start_date && campaign.end_date) {
    days = Math.max(1, Math.ceil((new Date(campaign.end_date).getTime() - new Date(campaign.start_date).getTime()) / 86400000));
  }

  return {
    totalPosts: cPosts.length,
    published,
    avgPerDay: cPosts.length / days,
    pillars,
    formats,
    statuses,
    completionRate: cPosts.length ? (published / cPosts.length) * 100 : 0,
    aiRate: cPosts.length ? (cPosts.filter(p => p.ai_generated).length / cPosts.length) * 100 : 0,
    hashtagCount: totalHashtags,
    avgHashtags: cPosts.length ? totalHashtags / cPosts.length : 0,
  };
}

function CompareIndicator({ a, b, label, format = 'number' }: { a: number; b: number; label: string; format?: 'number' | 'percent' }) {
  const diff = a - b;
  const icon = diff > 0 ? <ArrowUpRight className="w-3 h-3 text-emerald-400" /> : diff < 0 ? <ArrowDownRight className="w-3 h-3 text-red-400" /> : <Minus className="w-3 h-3 text-muted-foreground" />;
  const fmt = (v: number) => format === 'percent' ? `${v.toFixed(1)}%` : v.toFixed(1);

  return (
    <div className="grid grid-cols-3 items-center gap-2 py-2 border-b border-border/30 last:border-b-0">
      <span className="text-xs font-medium text-right text-primary">{fmt(a)}</span>
      <div className="flex items-center justify-center gap-1">
        {icon}
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <span className="text-xs font-medium text-left text-amber-400">{fmt(b)}</span>
    </div>
  );
}

export function CampaignCrossComparator() {
  const { data: campaigns } = useInstagramCampaigns();
  const { data: posts } = useInstagramPosts();
  const [campA, setCampA] = useState<string>('');
  const [campB, setCampB] = useState<string>('');

  const campaignA = campaigns?.find(c => c.id === campA);
  const campaignB = campaigns?.find(c => c.id === campB);
  const statsA = useMemo(() => campaignA && posts ? computeStats(campaignA, posts) : null, [campaignA, posts]);
  const statsB = useMemo(() => campaignB && posts ? computeStats(campaignB, posts) : null, [campaignB, posts]);

  const allCampaigns = campaigns || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Scale className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Cross-Campaign Comparator</h3>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] text-primary font-semibold uppercase tracking-wider mb-1 block">Campanha A</label>
          <Select value={campA} onValueChange={setCampA}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
            <SelectContent>
              {allCampaigns.filter(c => c.id !== campB).map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider mb-1 block">Campanha B</label>
          <Select value={campB} onValueChange={setCampB}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
            <SelectContent>
              {allCampaigns.filter(c => c.id !== campA).map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {statsA && statsB ? (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Key Metrics */}
          <Card className="p-4 bg-card/50 border-border/30">
            <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-primary" /> Métricas Principais
            </h4>
            <CompareIndicator a={statsA.totalPosts} b={statsB.totalPosts} label="Total Posts" />
            <CompareIndicator a={statsA.published} b={statsB.published} label="Publicados" />
            <CompareIndicator a={statsA.completionRate} b={statsB.completionRate} label="Conclusão" format="percent" />
            <CompareIndicator a={statsA.avgPerDay} b={statsB.avgPerDay} label="Posts/Dia" />
            <CompareIndicator a={statsA.aiRate} b={statsB.aiRate} label="Uso IA" format="percent" />
            <CompareIndicator a={statsA.avgHashtags} b={statsB.avgHashtags} label="Hashtags/Post" />
          </Card>

          {/* Pillar distribution */}
          <Card className="p-4 bg-card/50 border-border/30">
            <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-primary" /> Distribuição por Pilar
            </h4>
            {PILLARS.map(p => (
              <CompareIndicator
                key={p.key}
                a={statsA.pillars[p.key] || 0}
                b={statsB.pillars[p.key] || 0}
                label={p.label}
              />
            ))}
          </Card>

          {/* Format distribution */}
          <Card className="p-4 bg-card/50 border-border/30">
            <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Distribuição por Formato
            </h4>
            {FORMATS.map(f => (
              <CompareIndicator
                key={f.key}
                a={statsA.formats[f.key] || 0}
                b={statsB.formats[f.key] || 0}
                label={f.label}
              />
            ))}
          </Card>

          {/* Winner summary */}
          <Card className="p-4 bg-card/50 border-border/30">
            <h4 className="text-xs font-semibold text-foreground mb-3">📊 Resumo</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>
                <span className="text-primary font-medium">{campaignA?.name}</span> tem {statsA.totalPosts > statsB.totalPosts ? 'mais' : 'menos'} conteúdo
                ({statsA.totalPosts} vs {statsB.totalPosts}) e taxa de conclusão de{' '}
                <span className="font-medium">{statsA.completionRate.toFixed(0)}%</span>.
              </p>
              <p>
                <span className="text-amber-400 font-medium">{campaignB?.name}</span> tem taxa de conclusão de{' '}
                <span className="font-medium">{statsB.completionRate.toFixed(0)}%</span> com{' '}
                {Object.keys(statsB.pillars).length} pilares ativos.
              </p>
              {statsA.aiRate > statsB.aiRate ? (
                <p className="text-emerald-400">✨ Campanha A usa mais IA ({statsA.aiRate.toFixed(0)}% vs {statsB.aiRate.toFixed(0)}%)</p>
              ) : statsB.aiRate > statsA.aiRate ? (
                <p className="text-emerald-400">✨ Campanha B usa mais IA ({statsB.aiRate.toFixed(0)}% vs {statsA.aiRate.toFixed(0)}%)</p>
              ) : null}
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-8 bg-card/30 border-border/20 text-center">
          <Scale className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Selecione duas campanhas para comparar lado a lado</p>
        </Card>
      )}
    </div>
  );
}
