import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useInstagramCampaigns, useInstagramPosts, InstagramCampaign, InstagramPost, POST_STATUSES, FORMATS, PILLARS } from '@/hooks/useInstagramEngine';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend } from 'recharts';
import { GitCompare, Target, FileText, TrendingUp, Calendar } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignComparison({ open, onOpenChange }: Props) {
  const { data: campaigns } = useInstagramCampaigns();
  const { data: posts } = useInstagramPosts();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev);
  };

  const campaignPostsMap = useMemo(() => {
    const map: Record<string, InstagramPost[]> = {};
    (posts || []).forEach(p => {
      if (p.campaign_id) {
        if (!map[p.campaign_id]) map[p.campaign_id] = [];
        map[p.campaign_id].push(p);
      }
    });
    return map;
  }, [posts]);

  const comparisonData = useMemo(() => {
    return selected.map(id => {
      const c = campaigns?.find(x => x.id === id);
      const cp = campaignPostsMap[id] || [];
      const published = cp.filter(p => p.status === 'published').length;
      const aiGen = cp.filter(p => p.ai_generated).length;
      const withHook = cp.filter(p => p.hook).length;
      const withScript = cp.filter(p => p.script).length;
      const withCaption = cp.filter(p => p.caption_short || p.caption_medium || p.caption_long).length;
      const total = cp.length || 1;
      return {
        id,
        name: c?.name || '?',
        total: cp.length,
        published,
        completion: Math.round((published / total) * 100),
        aiRate: Math.round((aiGen / total) * 100),
        hookRate: Math.round((withHook / total) * 100),
        scriptRate: Math.round((withScript / total) * 100),
        captionRate: Math.round((withCaption / total) * 100),
        budget: Number(c?.budget || 0),
        costPerPost: cp.length ? Math.round(Number(c?.budget || 0) / cp.length) : 0,
        formats: [...new Set(cp.map(p => p.format))].length,
        pillars: [...new Set(cp.filter(p => p.pillar).map(p => p.pillar))].length,
      };
    });
  }, [selected, campaigns, campaignPostsMap]);

  const barData = comparisonData.map(c => ({
    name: c.name.substring(0, 15),
    'Total Posts': c.total,
    'Publicados': c.published,
    'Conclusão %': c.completion,
  }));

  const radarData = [
    { metric: 'Conclusão', ...Object.fromEntries(comparisonData.map(c => [c.name.substring(0, 12), c.completion])) },
    { metric: 'IA %', ...Object.fromEntries(comparisonData.map(c => [c.name.substring(0, 12), c.aiRate])) },
    { metric: 'Hooks', ...Object.fromEntries(comparisonData.map(c => [c.name.substring(0, 12), c.hookRate])) },
    { metric: 'Roteiros', ...Object.fromEntries(comparisonData.map(c => [c.name.substring(0, 12), c.scriptRate])) },
    { metric: 'Legendas', ...Object.fromEntries(comparisonData.map(c => [c.name.substring(0, 12), c.captionRate])) },
  ];

  const COLORS = ['hsl(210,80%,50%)', 'hsl(140,60%,40%)', 'hsl(280,60%,50%)', 'hsl(30,80%,50%)'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-primary" />
            Comparativo de Campanhas
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Selector */}
          <div className="w-52 shrink-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Selecione até 4 campanhas</p>
            <ScrollArea className="h-[50vh]">
              <div className="space-y-1 pr-2">
                {(campaigns || []).map(c => (
                  <button
                    key={c.id}
                    onClick={() => toggle(c.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-[11px] transition-colors ${
                      selected.includes(c.id) ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-muted/30 border border-transparent'
                    }`}
                  >
                    <Checkbox checked={selected.includes(c.id)} className="h-3.5 w-3.5" />
                    <span className="truncate">{c.name}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Results */}
          <ScrollArea className="flex-1">
            <div className="pr-3 space-y-4">
              {selected.length < 2 ? (
                <Card className="glass-card p-8 text-center">
                  <GitCompare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Selecione pelo menos 2 campanhas para comparar.</p>
                </Card>
              ) : (
                <>
                  {/* KPI comparison table */}
                  <Card className="glass-card p-4 overflow-x-auto">
                    <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">Métricas Comparativas</h5>
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-border/30">
                          <th className="text-left py-1.5 text-muted-foreground font-medium">Métrica</th>
                          {comparisonData.map(c => (
                            <th key={c.id} className="text-center py-1.5 text-foreground font-medium">{c.name.substring(0, 18)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: 'Total Posts', key: 'total' },
                          { label: 'Publicados', key: 'published' },
                          { label: 'Conclusão', key: 'completion', suffix: '%' },
                          { label: 'Taxa IA', key: 'aiRate', suffix: '%' },
                          { label: 'Orçamento', key: 'budget', prefix: 'R$ ' },
                          { label: 'Custo/Post', key: 'costPerPost', prefix: 'R$ ' },
                          { label: 'Formatos', key: 'formats' },
                          { label: 'Pilares', key: 'pillars' },
                        ].map(row => (
                          <tr key={row.key} className="border-b border-border/10">
                            <td className="py-1.5 text-muted-foreground">{row.label}</td>
                            {comparisonData.map(c => {
                              const val = (c as any)[row.key];
                              const best = Math.max(...comparisonData.map(x => Number((x as any)[row.key]) || 0));
                              const isBest = Number(val) === best && comparisonData.length > 1;
                              return (
                                <td key={c.id} className={`py-1.5 text-center font-medium ${isBest ? 'text-emerald-400' : 'text-foreground'}`}>
                                  {row.prefix || ''}{typeof val === 'number' ? val.toLocaleString() : val}{row.suffix || ''}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>

                  {/* Bar chart */}
                  <Card className="glass-card p-4">
                    <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Posts & Conclusão</h5>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData}>
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Bar dataKey="Total Posts" fill="hsl(210,80%,50%)" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Publicados" fill="hsl(140,60%,40%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Radar chart */}
                  <Card className="glass-card p-4">
                    <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Radar de Completude</h5>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                          {comparisonData.map((c, i) => (
                            <Radar key={c.id} name={c.name.substring(0, 12)} dataKey={c.name.substring(0, 12)} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} />
                          ))}
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
