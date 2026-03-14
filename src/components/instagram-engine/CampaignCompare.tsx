import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InstagramPost, POST_STATUSES, FORMATS, PILLARS, InstagramCampaign } from '@/hooks/useInstagramEngine';
import { useInstagramCampaigns, useInstagramPosts } from '@/hooks/useInstagramEngine';
import { motion } from 'framer-motion';
import { Scale, BarChart3, TrendingUp, Target, Zap, Calendar, Users, Trophy } from 'lucide-react';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

function getCampaignStats(posts: InstagramPost[]) {
  const total = posts.length;
  const published = posts.filter(p => p.status === 'published').length;
  const ready = posts.filter(p => p.status === 'ready').length;
  const ai = posts.filter(p => p.ai_generated).length;
  const withHook = posts.filter(p => p.hook).length;
  const withCaption = posts.filter(p => p.caption_short || p.caption_long).length;
  const withScript = posts.filter(p => p.script).length;
  const pillars = new Set(posts.map(p => p.pillar).filter(Boolean)).size;
  const formats = new Set(posts.map(p => p.format).filter(Boolean)).size;
  const completionRate = total > 0 ? Math.round((published / total) * 100) : 0;
  const readyRate = total > 0 ? Math.round(((published + ready) / total) * 100) : 0;
  const aiRate = total > 0 ? Math.round((ai / total) * 100) : 0;
  const hookRate = total > 0 ? Math.round((withHook / total) * 100) : 0;
  const contentRate = total > 0 ? Math.round((withCaption / total) * 100) : 0;

  return { total, published, ready, ai, withHook, withCaption, withScript, pillars, formats, completionRate, readyRate, aiRate, hookRate, contentRate };
}

export function CampaignCompare({ campaign: currentCampaign, posts: currentPosts }: Props) {
  const { data: allCampaigns } = useInstagramCampaigns();
  const { data: allPosts } = useInstagramPosts();
  const [compareId, setCompareId] = useState<string>('');

  const otherCampaigns = useMemo(() =>
    (allCampaigns || []).filter(c => c.id !== currentCampaign.id),
    [allCampaigns, currentCampaign.id]
  );

  const compareCampaign = otherCampaigns.find(c => c.id === compareId);
  const comparePosts = useMemo(() =>
    (allPosts || []).filter(p => p.campaign_id === compareId),
    [allPosts, compareId]
  );

  const statsA = getCampaignStats(currentPosts);
  const statsB = compareId ? getCampaignStats(comparePosts) : null;

  const metrics = [
    { label: 'Total Posts', a: statsA.total, b: statsB?.total, icon: <BarChart3 className="w-3 h-3" /> },
    { label: 'Publicados', a: statsA.published, b: statsB?.published, icon: <TrendingUp className="w-3 h-3" /> },
    { label: 'Conclusão', a: `${statsA.completionRate}%`, b: statsB ? `${statsB.completionRate}%` : undefined, icon: <Target className="w-3 h-3" />, isPercent: true, aVal: statsA.completionRate, bVal: statsB?.completionRate },
    { label: 'Prontos', a: `${statsA.readyRate}%`, b: statsB ? `${statsB.readyRate}%` : undefined, isPercent: true, aVal: statsA.readyRate, bVal: statsB?.readyRate },
    { label: 'Gerado IA', a: `${statsA.aiRate}%`, b: statsB ? `${statsB.aiRate}%` : undefined, icon: <Zap className="w-3 h-3" />, isPercent: true, aVal: statsA.aiRate, bVal: statsB?.aiRate },
    { label: 'Com Hook', a: `${statsA.hookRate}%`, b: statsB ? `${statsB.hookRate}%` : undefined, isPercent: true, aVal: statsA.hookRate, bVal: statsB?.hookRate },
    { label: 'Com Legenda', a: `${statsA.contentRate}%`, b: statsB ? `${statsB.contentRate}%` : undefined, isPercent: true, aVal: statsA.contentRate, bVal: statsB?.contentRate },
    { label: 'Pilares', a: statsA.pillars, b: statsB?.pillars },
    { label: 'Formatos', a: statsA.formats, b: statsB?.formats },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-500/15 flex items-center justify-center">
            <Scale className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Comparar Campanhas</h4>
            <p className="text-[10px] text-muted-foreground">Lado a lado: volume, qualidade, pilares</p>
          </div>
        </div>
      </div>

      {/* Selector */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card p-3 ring-2 ring-blue-500/30">
          <Badge className="bg-blue-500/15 text-blue-400 text-[8px] mb-1">Campanha A</Badge>
          <p className="text-[11px] font-semibold text-foreground">{currentCampaign.name}</p>
          <p className="text-[9px] text-muted-foreground">{statsA.total} posts</p>
        </Card>
        <Card className="glass-card p-3">
          <Badge className="bg-muted text-muted-foreground text-[8px] mb-1">Campanha B</Badge>
          <Select value={compareId} onValueChange={setCompareId}>
            <SelectTrigger className="text-[10px] h-7">
              <SelectValue placeholder="Selecione para comparar..." />
            </SelectTrigger>
            <SelectContent>
              {otherCampaigns.map(c => (
                <SelectItem key={c.id} value={c.id} className="text-[10px]">{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>
      </div>

      {/* Metrics comparison */}
      <Card className="glass-card p-4">
        <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">Métricas</h5>
        <div className="space-y-3">
          {metrics.map((m, i) => {
            const aNum = m.isPercent ? (m.aVal ?? 0) : (typeof m.a === 'number' ? m.a : 0);
            const bNum = m.isPercent ? (m.bVal ?? 0) : (typeof m.b === 'number' ? m.b : 0);
            const winner = statsB ? (aNum > bNum ? 'A' : bNum > aNum ? 'B' : 'tie') : null;

            return (
              <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    {m.icon && <span className="text-muted-foreground">{m.icon}</span>}
                    <span className="text-[9px] text-muted-foreground">{m.label}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[9px]">
                    <span className={`font-semibold ${winner === 'A' ? 'text-primary' : 'text-primary/60'}`}>{m.a}</span>
                    {m.b !== undefined ? (
                      <span className={`font-semibold ${winner === 'B' ? 'text-primary' : 'text-muted-foreground'}`}>{m.b}</span>
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </div>
                </div>
                {statsB && (
                  <div className="flex gap-1 h-1.5 rounded-full overflow-hidden">
                    <motion.div
                      className="bg-primary rounded-l-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${aNum + bNum > 0 ? (aNum / (aNum + bNum)) * 100 : 50}%` }}
                      transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
                    />
                    <motion.div
                      className="bg-muted-foreground rounded-r-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${aNum + bNum > 0 ? (bNum / (aNum + bNum)) * 100 : 50}%` }}
                      transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Pillar comparison */}
      {statsB && (
        <Card className="glass-card p-4">
          <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">Pilares por Campanha</h5>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[8px] text-primary font-semibold mb-1">{currentCampaign.name}</p>
              {PILLARS.filter(p => currentPosts.some(post => post.pillar === p.key)).map(p => (
                <div key={p.key} className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} /><span className="text-[8px] text-foreground">{p.label}</span></div>
                  <span className="text-[8px] font-semibold text-foreground">{currentPosts.filter(post => post.pillar === p.key).length}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[8px] text-muted-foreground font-semibold mb-1">{compareCampaign?.name}</p>
              {PILLARS.filter(p => comparePosts.some(post => post.pillar === p.key)).map(p => (
                <div key={p.key} className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} /><span className="text-[8px] text-foreground">{p.label}</span></div>
                  <span className="text-[8px] font-semibold text-foreground">{comparePosts.filter(post => post.pillar === p.key).length}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {!compareId && (
        <div className="text-center py-8">
          <Scale className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-[10px] text-muted-foreground">Selecione uma campanha B para comparar</p>
        </div>
      )}
    </div>
  );
}
