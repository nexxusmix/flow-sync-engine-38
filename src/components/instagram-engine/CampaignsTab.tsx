import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInstagramCampaigns, useInstagramPosts, POST_STATUSES, FORMATS, PILLARS, InstagramPost } from '@/hooks/useInstagramEngine';
import { useInstagramInsights, useInstagramConnection } from '@/hooks/useInstagramAPI';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Target, Calendar, Users, Megaphone, FileText, ChevronRight, ChevronDown, Eye, Heart, MessageCircle, Share2, Bookmark, TrendingUp, BarChart3, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  planning: { label: 'Planejamento', color: 'bg-blue-500/15 text-blue-400' },
  active: { label: 'Ativa', color: 'bg-emerald-500/15 text-emerald-400' },
  completed: { label: 'Concluída', color: 'bg-primary/15 text-primary' },
  paused: { label: 'Pausada', color: 'bg-amber-500/15 text-amber-400' },
};

export function CampaignsTab() {
  const { data: campaigns, isLoading } = useInstagramCampaigns();
  const { data: posts } = useInstagramPosts();
  const { data: connection } = useInstagramConnection();
  const { data: insights } = useInstagramInsights(connection?.id);
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', objective: '', target_audience: '', start_date: '', end_date: '', budget: '' });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('instagram_campaigns').insert({
        name: form.name,
        objective: form.objective || null,
        target_audience: form.target_audience || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        budget: form.budget ? parseFloat(form.budget) : null,
      } as any);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['instagram-campaigns'] });
      toast.success('Campanha criada');
      setShowCreate(false);
      setForm({ name: '', objective: '', target_audience: '', start_date: '', end_date: '', budget: '' });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Posts grouped by campaign
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

  // Campaign aggregate metrics
  const campaignMetrics = useMemo(() => {
    const map: Record<string, { published: number; scheduled: number; inProgress: number; total: number; statusBreakdown: Record<string, number>; formatBreakdown: Record<string, number>; pillarBreakdown: Record<string, number> }> = {};
    for (const [cId, cPosts] of Object.entries(campaignPostsMap)) {
      const statusBreakdown: Record<string, number> = {};
      const formatBreakdown: Record<string, number> = {};
      const pillarBreakdown: Record<string, number> = {};
      let published = 0, scheduled = 0, inProgress = 0;
      for (const p of cPosts) {
        statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1;
        formatBreakdown[p.format] = (formatBreakdown[p.format] || 0) + 1;
        if (p.pillar) pillarBreakdown[p.pillar] = (pillarBreakdown[p.pillar] || 0) + 1;
        if (p.status === 'published') published++;
        else if (p.status === 'scheduled') scheduled++;
        else if (p.status === 'in_production') inProgress++;
      }
      map[cId] = { published, scheduled, inProgress, total: cPosts.length, statusBreakdown, formatBreakdown, pillarBreakdown };
    }
    return map;
  }, [campaignPostsMap]);

  const activeCampaign = campaigns?.find(c => c.id === selectedCampaign);
  const activePosts = selectedCampaign ? (campaignPostsMap[selectedCampaign] || []) : [];
  const activeMetrics = selectedCampaign ? campaignMetrics[selectedCampaign] : null;

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  // Detail view
  if (activeCampaign && selectedCampaign) {
    const status = STATUS_MAP[activeCampaign.status] || STATUS_MAP.planning;
    const completionRate = activeMetrics && activeMetrics.total > 0
      ? Math.round((activeMetrics.published / activeMetrics.total) * 100)
      : 0;

    return (
      <div className="space-y-5">
        {/* Back + Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedCampaign(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">{activeCampaign.name}</h3>
              <Badge className={`${status.color} text-[9px]`}>{status.label}</Badge>
            </div>
            {activeCampaign.objective && (
              <p className="text-xs text-muted-foreground mt-0.5">{activeCampaign.objective}</p>
            )}
          </div>
        </div>

        {/* Campaign KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiCard label="Total Posts" value={activeMetrics?.total || 0} icon={<FileText className="w-4 h-4" />} />
          <KpiCard label="Publicados" value={activeMetrics?.published || 0} icon={<TrendingUp className="w-4 h-4" />} highlight />
          <KpiCard label="Agendados" value={activeMetrics?.scheduled || 0} icon={<Calendar className="w-4 h-4" />} />
          <KpiCard label="Em Produção" value={activeMetrics?.inProgress || 0} icon={<BarChart3 className="w-4 h-4" />} />
          <KpiCard label="Conclusão" value={`${completionRate}%`} icon={<Target className="w-4 h-4" />} highlight={completionRate >= 80} />
        </div>

        {/* Campaign Info Row */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          {activeCampaign.target_audience && (
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {activeCampaign.target_audience}</span>
          )}
          {activeCampaign.start_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(activeCampaign.start_date), "dd MMM", { locale: ptBR })} — {activeCampaign.end_date ? format(new Date(activeCampaign.end_date), "dd MMM yyyy", { locale: ptBR }) : '...'}
            </span>
          )}
          {activeCampaign.budget && (
            <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> R$ {Number(activeCampaign.budget).toLocaleString()}</span>
          )}
        </div>

        {/* Breakdowns */}
        {activeMetrics && activeMetrics.total > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status breakdown */}
            <Card className="glass-card p-4">
              <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">Por Status</h5>
              <div className="space-y-2">
                {Object.entries(activeMetrics.statusBreakdown).map(([key, count]) => {
                  const s = POST_STATUSES.find(st => st.key === key);
                  const pct = Math.round((count / activeMetrics.total) * 100);
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span className="text-foreground">{s?.label || key}</span>
                          <span className="text-muted-foreground">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${s?.color?.split(' ')[0] || 'bg-primary'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Format breakdown */}
            <Card className="glass-card p-4">
              <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">Por Formato</h5>
              <div className="space-y-2">
                {Object.entries(activeMetrics.formatBreakdown).map(([key, count]) => {
                  const f = FORMATS.find(fm => fm.key === key);
                  const pct = Math.round((count / activeMetrics.total) * 100);
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[14px]">{f?.icon || 'image'}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span className="text-foreground">{f?.label || key}</span>
                          <span className="text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Pillar breakdown */}
            <Card className="glass-card p-4">
              <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">Por Pilar</h5>
              <div className="space-y-2">
                {Object.entries(activeMetrics.pillarBreakdown).map(([key, count]) => {
                  const pl = PILLARS.find(p => p.key === key);
                  const pct = Math.round((count / activeMetrics.total) * 100);
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pl?.color || 'hsl(var(--primary))' }} />
                      <div className="flex-1">
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span className="text-foreground">{pl?.label || key}</span>
                          <span className="text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ backgroundColor: pl?.color || 'hsl(var(--primary))' , width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* Posts list */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Posts Vinculados ({activePosts.length})</h4>
          {activePosts.length === 0 ? (
            <Card className="glass-card p-6 text-center">
              <p className="text-xs text-muted-foreground">Nenhum post vinculado a esta campanha.</p>
              <p className="text-[10px] text-muted-foreground mt-1">Vincule posts no Calendário ao criar ou editar conteúdo.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {activePosts
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map(p => {
                  const s = POST_STATUSES.find(st => st.key === p.status);
                  const f = FORMATS.find(fm => fm.key === p.format);
                  const pl = PILLARS.find(pi => pi.key === p.pillar);
                  const dateStr = p.published_at
                    ? format(new Date(p.published_at), "dd/MM/yy", { locale: ptBR })
                    : p.scheduled_at
                    ? format(new Date(p.scheduled_at), "dd/MM/yy", { locale: ptBR })
                    : null;

                  return (
                    <Card key={p.id} className="glass-card p-3 hover:border-primary/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-lg shrink-0">
                          {f?.icon || 'image'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground font-medium truncate">{p.title}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {s && <Badge className={`${s.color} text-[9px]`}>{s.label}</Badge>}
                            {f && <Badge variant="secondary" className="text-[9px]">{f.label}</Badge>}
                            {pl && <Badge variant="outline" className="text-[9px]">{pl.label}</Badge>}
                            {dateStr && <span className="text-[9px] text-muted-foreground">{dateStr}</span>}
                          </div>
                        </div>
                        {p.status === 'published' && (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] shrink-0">
                            ✓ Publicado
                          </Badge>
                        )}
                      </div>
                    </Card>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Campanhas Instagram</h3>
          <p className="text-xs text-muted-foreground">{campaigns?.length || 0} campanhas</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> Nova Campanha
        </Button>
      </div>

      {(!campaigns || campaigns.length === 0) ? (
        <Card className="glass-card p-8 text-center">
          <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">Nenhuma campanha criada. Crie uma campanha para organizar conteúdo estrategicamente.</p>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> Criar Campanha
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map(c => {
            const status = STATUS_MAP[c.status] || STATUS_MAP.planning;
            const metrics = campaignMetrics[c.id];
            const postCount = metrics?.total || 0;
            const publishedCount = metrics?.published || 0;
            const completionRate = postCount > 0 ? Math.round((publishedCount / postCount) * 100) : 0;

            return (
              <Card
                key={c.id}
                className="glass-card p-5 hover:border-primary/20 transition-colors cursor-pointer group"
                onClick={() => setSelectedCampaign(c.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{c.name}</h4>
                  <div className="flex items-center gap-1.5">
                    <Badge className={`${status.color} text-[9px]`}>{status.label}</Badge>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
                {c.objective && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{c.objective}</p>}

                {/* Mini progress bar */}
                {postCount > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>{publishedCount}/{postCount} publicados</span>
                      <span>{completionRate}%</span>
                    </div>
                    <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${completionRate}%` }} />
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {postCount} posts
                  </span>
                  {c.target_audience && (
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.target_audience}</span>
                  )}
                  {c.start_date && (
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(c.start_date), 'dd/MM')} — {c.end_date ? format(new Date(c.end_date), 'dd/MM') : '...'}</span>
                  )}
                  {c.budget && (
                    <span className="flex items-center gap-1"><Target className="w-3 h-3" />R$ {Number(c.budget).toLocaleString()}</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Campanha Instagram</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome da campanha" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Textarea placeholder="Objetivo (ex: gerar leads para lançamentos imobiliários)" value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} rows={2} />
            <Input placeholder="Público-alvo" value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
            <Input type="number" placeholder="Orçamento (R$)" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiCard({ label, value, icon, highlight }: { label: string; value: number | string; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <Card className="glass-card p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className={highlight ? 'text-emerald-400' : 'text-primary'}>{icon}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-lg font-bold ${highlight ? 'text-emerald-400' : 'text-foreground'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </Card>
  );
}
