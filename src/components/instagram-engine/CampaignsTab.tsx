import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useInstagramCampaigns, useInstagramPosts, POST_STATUSES, FORMATS, PILLARS, InstagramPost } from '@/hooks/useInstagramEngine';
import { useInstagramInsights, useInstagramConnection } from '@/hooks/useInstagramAPI';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Target, Calendar, Users, Megaphone, FileText, ChevronRight, TrendingUp, BarChart3, ArrowLeft, Download, Sparkles, Zap } from 'lucide-react';
import { exportInstagramCampaignPDF } from '@/services/pdfExportService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { AIButton } from '@/components/squad-ui/AIButton';
import { CampaignTimeline } from './CampaignTimeline';
import { CampaignWizard } from './CampaignWizard';
import { CampaignPerformanceDashboard } from './CampaignPerformanceDashboard';
import { CampaignAITools } from './CampaignAITools';
import { CampaignAutomation } from './CampaignAutomation';

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
  const [showAiGen, setShowAiGen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [showAITools, setShowAITools] = useState(false);
  const [showAutomation, setShowAutomation] = useState(false);
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
    const map: Record<string, { published: number; scheduled: number; inProgress: number; total: number }> = {};
    for (const [cId, cPosts] of Object.entries(campaignPostsMap)) {
      let published = 0, scheduled = 0, inProgress = 0;
      for (const p of cPosts) {
        if (p.status === 'published') published++;
        else if (p.status === 'scheduled') scheduled++;
        else if (p.status === 'in_production') inProgress++;
      }
      map[cId] = { published, scheduled, inProgress, total: cPosts.length };
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
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 text-[11px]" onClick={() => setShowAutomation(true)}>
              <Zap className="w-3.5 h-3.5" /> Automações
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-[11px]" onClick={() => setShowAITools(true)}>
              <Sparkles className="w-3.5 h-3.5" /> IA Avançada
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-[11px]" onClick={() => exportInstagramCampaignPDF(selectedCampaign!)}>
              <Download className="w-3.5 h-3.5" /> PDF
            </Button>
          </div>
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

        {/* Performance Dashboard */}
        <CampaignPerformanceDashboard campaign={activeCampaign} posts={activePosts} />

        {/* Timeline / Roadmap */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Calendário Editorial ({activePosts.length} posts)</h4>
          <CampaignTimeline
            posts={activePosts}
            startDate={activeCampaign.start_date}
            endDate={activeCampaign.end_date}
          />
        </div>

        {/* AI Tools Dialog */}
        <CampaignAITools
          campaign={activeCampaign}
          posts={activePosts}
          open={showAITools}
          onOpenChange={setShowAITools}
        />

        {/* Automation Dialog */}
        <CampaignAutomation
          campaign={activeCampaign}
          posts={activePosts}
          open={showAutomation}
          onOpenChange={setShowAutomation}
        />
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
        <div className="flex items-center gap-2">
          <AIButton label="Gerar com IA" onClick={() => setShowAiGen(true)} size="sm" />
          <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> Nova Campanha
          </Button>
        </div>
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
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{postCount} posts</span>
                  {c.target_audience && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.target_audience}</span>}
                  {c.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(c.start_date), 'dd/MM')} — {c.end_date ? format(new Date(c.end_date), 'dd/MM') : '...'}</span>}
                  {c.budget && <span className="flex items-center gap-1"><Target className="w-3 h-3" />R$ {Number(c.budget).toLocaleString()}</span>}
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

      <CampaignWizard
        open={showAiGen}
        onOpenChange={setShowAiGen}
        onCampaignCreated={(id) => setSelectedCampaign(id)}
      />
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
