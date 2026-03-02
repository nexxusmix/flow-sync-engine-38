import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInstagramCampaigns, useInstagramPosts, InstagramCampaign, InstagramPost, FORMATS } from '@/hooks/useInstagramEngine';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GitCompare, ArrowUp, ArrowDown, Minus, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface Goal {
  id: string;
  campaign_id: string;
  title: string;
  metric_key: string;
  target_value: number;
  current_value: number;
  unit: string;
}

function CampaignStats({ campaign, posts, goals }: { campaign: InstagramCampaign; posts: InstagramPost[]; goals: Goal[] }) {
  const published = posts.filter(p => p.status === 'published').length;
  const aiGenerated = posts.filter(p => p.ai_generated).length;
  const formats = [...new Set(posts.map(p => p.format))];
  const pillars = [...new Set(posts.filter(p => p.pillar).map(p => p.pillar))];
  const completionRate = posts.length > 0 ? Math.round((published / posts.length) * 100) : 0;
  const goalsAchieved = goals.filter(g => g.current_value >= g.target_value).length;

  return (
    <div className="space-y-2">
      <h5 className="text-[11px] font-semibold text-foreground truncate">{campaign.name}</h5>
      <div className="space-y-1">
        <Row label="Posts" value={posts.length} />
        <Row label="Publicados" value={published} />
        <Row label="Taxa Conclusão" value={`${completionRate}%`} />
        <Row label="Gerados IA" value={aiGenerated} />
        <Row label="Formatos" value={formats.length} />
        <Row label="Pilares" value={pillars.length} />
        <Row label="Budget" value={campaign.budget ? `R$ ${Number(campaign.budget).toLocaleString()}` : '—'} />
        <Row label="Metas" value={`${goalsAchieved}/${goals.length}`} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between text-[10px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function ComparisonIndicator({ a, b }: { a: number; b: number }) {
  if (a > b) return <ArrowUp className="w-3 h-3 text-emerald-400" />;
  if (a < b) return <ArrowDown className="w-3 h-3 text-red-400" />;
  return <Minus className="w-3 h-3 text-muted-foreground" />;
}

export function CampaignABComparison({ open, onOpenChange }: Props) {
  const { data: campaigns } = useInstagramCampaigns();
  const { data: allPosts } = useInstagramPosts();
  const [campA, setCampA] = useState<string>('');
  const [campB, setCampB] = useState<string>('');

  const { data: allGoals } = useQuery({
    queryKey: ['all-campaign-goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_campaign_goals' as any)
        .select('*');
      if (error) throw error;
      return (data || []) as unknown as Goal[];
    },
    enabled: open,
  });

  const campaignA = campaigns?.find(c => c.id === campA);
  const campaignB = campaigns?.find(c => c.id === campB);
  const postsA = useMemo(() => (allPosts || []).filter(p => p.campaign_id === campA), [allPosts, campA]);
  const postsB = useMemo(() => (allPosts || []).filter(p => p.campaign_id === campB), [allPosts, campB]);
  const goalsA = useMemo(() => (allGoals || []).filter(g => g.campaign_id === campA), [allGoals, campA]);
  const goalsB = useMemo(() => (allGoals || []).filter(g => g.campaign_id === campB), [allGoals, campB]);

  const chartData = useMemo(() => {
    if (!campaignA || !campaignB) return [];
    const pubA = postsA.filter(p => p.status === 'published').length;
    const pubB = postsB.filter(p => p.status === 'published').length;
    return [
      { metric: 'Posts', A: postsA.length, B: postsB.length },
      { metric: 'Publicados', A: pubA, B: pubB },
      { metric: 'IA', A: postsA.filter(p => p.ai_generated).length, B: postsB.filter(p => p.ai_generated).length },
      { metric: 'Metas OK', A: goalsA.filter(g => g.current_value >= g.target_value).length, B: goalsB.filter(g => g.current_value >= g.target_value).length },
    ];
  }, [campaignA, campaignB, postsA, postsB, goalsA, goalsB]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <GitCompare className="w-4 h-4 text-primary" />
            Comparativo A/B de Campanhas
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase">Campanha A</label>
            <Select value={campA} onValueChange={setCampA}>
              <SelectTrigger className="mt-0.5"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {(campaigns || []).filter(c => c.id !== campB).map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase">Campanha B</label>
            <Select value={campB} onValueChange={setCampB}>
              <SelectTrigger className="mt-0.5"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {(campaigns || []).filter(c => c.id !== campA).map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {campaignA && campaignB ? (
          <div className="space-y-4">
            {/* Side by side stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="glass-card p-3">
                <CampaignStats campaign={campaignA} posts={postsA} goals={goalsA} />
              </Card>
              <Card className="glass-card p-3">
                <CampaignStats campaign={campaignB} posts={postsB} goals={goalsB} />
              </Card>
            </div>

            {/* Visual comparison chart */}
            <Card className="glass-card p-4">
              <h5 className="text-[10px] text-muted-foreground uppercase mb-3">Comparação Visual</h5>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="metric" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="A" name={campaignA.name.slice(0, 20)} fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="B" name={campaignB.name.slice(0, 20)} fill="hsl(280, 60%, 50%)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Goals comparison */}
            {(goalsA.length > 0 || goalsB.length > 0) && (
              <Card className="glass-card p-4">
                <h5 className="text-[10px] text-muted-foreground uppercase mb-2">Metas Comparadas</h5>
                <div className="space-y-1.5">
                  {/* Match goals by metric_key */}
                  {[...new Set([...goalsA.map(g => g.metric_key), ...goalsB.map(g => g.metric_key)])].map(key => {
                    const gA = goalsA.find(g => g.metric_key === key);
                    const gB = goalsB.find(g => g.metric_key === key);
                    const pctA = gA && gA.target_value > 0 ? Math.round((gA.current_value / gA.target_value) * 100) : 0;
                    const pctB = gB && gB.target_value > 0 ? Math.round((gB.current_value / gB.target_value) * 100) : 0;
                    return (
                      <div key={key} className="flex items-center gap-2 text-[10px]">
                        <span className="text-muted-foreground w-24 truncate">{gA?.title || gB?.title}</span>
                        <span className="font-medium text-foreground w-12 text-right">{pctA}%</span>
                        <ComparisonIndicator a={pctA} b={pctB} />
                        <span className="font-medium text-foreground w-12">{pctB}%</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Selecione duas campanhas para comparar</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
