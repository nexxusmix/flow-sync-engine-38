import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useInstagramCampaigns, useInstagramPosts, POST_STATUSES, FORMATS, PILLARS, InstagramPost } from '@/hooks/useInstagramEngine';
import { useInstagramInsights, useInstagramConnection } from '@/hooks/useInstagramAPI';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Target, Calendar, Users, Megaphone, FileText, ChevronRight, TrendingUp, BarChart3, ArrowLeft, Download, Sparkles, Zap, Copy, FileBarChart, GitCompare, LayoutGrid, List, CalendarDays, CheckSquare, BookTemplate, Bell, History, Palette, DollarSign, Smartphone, GanttChart, Flame, Send, MessageSquare, Hash, Shield, FileDown } from 'lucide-react';
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
import { CampaignPostReport } from './CampaignPostReport';
import { CampaignComparison } from './CampaignComparison';
import { CampaignKanban } from './CampaignKanban';
import { CampaignCalendar } from './CampaignCalendar';
import { CampaignApprovalWorkflow } from './CampaignApprovalWorkflow';
import { CampaignGoals } from './CampaignGoals';
import { CampaignTemplateLibrary, SaveCampaignAsTemplateButton } from './CampaignTemplateLibrary';
import { CampaignCreativeBriefing } from './CampaignCreativeBriefing';
import { CampaignAlerts } from './CampaignAlerts';
import { CampaignChangelog } from './CampaignChangelog';
import { CampaignROIDashboard } from './CampaignROIDashboard';
import { CampaignFinalReport } from './CampaignFinalReport';
import { CampaignABComparison } from './CampaignABComparison';
import { CampaignGanttTimeline } from './CampaignGanttTimeline';
import { CampaignFeedPreview } from './CampaignFeedPreview';
import { CampaignAnalyticsAdvanced } from './CampaignAnalyticsAdvanced';
import { CampaignPublishQueue } from './CampaignPublishQueue';
import { CampaignSmartAlerts } from './CampaignSmartAlerts';
import { CampaignCollaboration } from './CampaignCollaboration';
import { CampaignABTesting } from './CampaignABTesting';
import { CampaignHashtagPlanner } from './CampaignHashtagPlanner';
import { CampaignApprovalPipeline } from './CampaignApprovalPipeline';
import { CampaignPDFReport } from './CampaignPDFReport';
import { useProfileConfig } from '@/hooks/useInstagramEngine';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  planning: { label: 'Planejamento', color: 'bg-blue-500/15 text-blue-400' },
  active: { label: 'Ativa', color: 'bg-emerald-500/15 text-emerald-400' },
  completed: { label: 'Concluída', color: 'bg-primary/15 text-primary' },
  paused: { label: 'Pausada', color: 'bg-amber-500/15 text-amber-400' },
};

export function CampaignsTab() {
  const { data: campaigns, isLoading } = useInstagramCampaigns();
  const { data: posts } = useInstagramPosts();
  const { data: profileConfig } = useProfileConfig();
  const { data: connection } = useInstagramConnection();
  const { data: insights } = useInstagramInsights(connection?.id);
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showAiGen, setShowAiGen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [showAITools, setShowAITools] = useState(false);
  const [showAutomation, setShowAutomation] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [detailView, setDetailView] = useState<'dashboard' | 'kanban' | 'timeline' | 'gantt' | 'calendar' | 'approval' | 'goals' | 'alerts' | 'changelog' | 'roi' | 'feed' | 'analytics' | 'queue' | 'smart_alerts' | 'collab' | 'ab_test' | 'hashtags' | 'approval_pipeline' | 'pdf_report'>('dashboard');
  const [showFinalReport, setShowFinalReport] = useState(false);
  const [showABComparison, setShowABComparison] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [briefingPost, setBriefingPost] = useState<InstagramPost | null>(null);
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

  const handleDuplicate = async (campaignId: string) => {
    const campaign = campaigns?.find(c => c.id === campaignId);
    if (!campaign) return;
    setDuplicating(true);
    try {
      // Create new campaign
      const { data: newCampaign, error: cErr } = await supabase.from('instagram_campaigns').insert({
        name: `${campaign.name} (Cópia)`,
        objective: campaign.objective,
        target_audience: campaign.target_audience,
        budget: campaign.budget,
        status: 'planning',
        key_messages: campaign.key_messages,
        content_plan: campaign.content_plan,
        kpis: campaign.kpis,
      } as any).select().single();
      if (cErr) throw cErr;

      // Clone posts
      const campaignPosts = (posts || []).filter(p => p.campaign_id === campaignId);
      if (campaignPosts.length > 0) {
        const clonedPosts = campaignPosts.map(p => ({
          title: p.title,
          format: p.format,
          pillar: p.pillar,
          objective: p.objective,
          status: 'idea',
          hook: p.hook,
          script: p.script,
          caption_short: p.caption_short,
          caption_medium: p.caption_medium,
          caption_long: p.caption_long,
          cta: p.cta,
          pinned_comment: p.pinned_comment,
          hashtags: p.hashtags,
          cover_suggestion: p.cover_suggestion,
          carousel_slides: p.carousel_slides,
          story_sequence: p.story_sequence,
          checklist: p.checklist,
          ai_generated: p.ai_generated,
          campaign_id: (newCampaign as any).id,
          position: p.position,
        }));
        const { error: pErr } = await supabase.from('instagram_posts').insert(clonedPosts as any);
        if (pErr) throw pErr;
      }

      qc.invalidateQueries({ queryKey: ['instagram-campaigns'] });
      qc.invalidateQueries({ queryKey: ['instagram-posts'] });
      toast.success(`Campanha duplicada com ${campaignPosts.length} posts!`);
      setSelectedCampaign((newCampaign as any).id);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDuplicating(false);
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

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  // Detail view
  if (activeCampaign && selectedCampaign) {
    const status = STATUS_MAP[activeCampaign.status] || STATUS_MAP.planning;

    return (
      <div className="space-y-5">
        {/* Back + Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="icon" onClick={() => setSelectedCampaign(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground truncate">{activeCampaign.name}</h3>
              <Badge className={`${status.color} text-[9px]`}>{status.label}</Badge>
            </div>
            {activeCampaign.objective && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{activeCampaign.objective}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7" onClick={() => setShowFinalReport(true)}>
              <FileBarChart className="w-3.5 h-3.5" /> Relatório Final
            </Button>
            <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7" onClick={() => setShowReport(true)}>
              <FileBarChart className="w-3.5 h-3.5" /> Relatório
            </Button>
            <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7" onClick={() => setShowAutomation(true)}>
              <Zap className="w-3.5 h-3.5" /> Automações
            </Button>
            <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7" onClick={() => setShowAITools(true)}>
              <Sparkles className="w-3.5 h-3.5" /> IA Avançada
            </Button>
            <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7" onClick={() => handleDuplicate(selectedCampaign)} disabled={duplicating}>
              {duplicating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />} Duplicar
            </Button>
            <SaveCampaignAsTemplateButton campaign={activeCampaign} postCount={activePosts.length} />
            <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7" onClick={() => exportInstagramCampaignPDF(selectedCampaign!)}>
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

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-muted/20 rounded-lg p-0.5 w-fit flex-wrap">
          {([
            { key: 'dashboard' as const, label: 'Dashboard', icon: <BarChart3 className="w-3.5 h-3.5" /> },
            { key: 'kanban' as const, label: 'Kanban', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
            { key: 'calendar' as const, label: 'Calendário', icon: <CalendarDays className="w-3.5 h-3.5" /> },
            { key: 'approval' as const, label: 'Aprovação', icon: <CheckSquare className="w-3.5 h-3.5" /> },
            { key: 'goals' as const, label: 'Metas', icon: <Target className="w-3.5 h-3.5" /> },
            { key: 'roi' as const, label: 'ROI', icon: <DollarSign className="w-3.5 h-3.5" /> },
            { key: 'analytics' as const, label: 'Analytics', icon: <Flame className="w-3.5 h-3.5" /> },
            { key: 'queue' as const, label: 'Publicação', icon: <Send className="w-3.5 h-3.5" /> },
            { key: 'smart_alerts' as const, label: 'Alertas IA', icon: <Bell className="w-3.5 h-3.5" /> },
            { key: 'collab' as const, label: 'Colaboração', icon: <MessageSquare className="w-3.5 h-3.5" /> },
            { key: 'ab_test' as const, label: 'Teste A/B', icon: <GitCompare className="w-3.5 h-3.5" /> },
            { key: 'hashtags' as const, label: 'Hashtags', icon: <Hash className="w-3.5 h-3.5" /> },
            { key: 'approval_pipeline' as const, label: 'Workflow', icon: <Shield className="w-3.5 h-3.5" /> },
            { key: 'pdf_report' as const, label: 'Relatório', icon: <FileDown className="w-3.5 h-3.5" /> },
            { key: 'gantt' as const, label: 'Gantt', icon: <List className="w-3.5 h-3.5" /> },
            { key: 'feed' as const, label: 'Feed', icon: <Smartphone className="w-3.5 h-3.5" /> },
            { key: 'alerts' as const, label: 'Lembretes', icon: <Bell className="w-3.5 h-3.5" /> },
            { key: 'changelog' as const, label: 'Histórico', icon: <History className="w-3.5 h-3.5" /> },
            { key: 'timeline' as const, label: 'Timeline', icon: <List className="w-3.5 h-3.5" /> },
          ]).map(v => (
            <Button
              key={v.key}
              size="sm"
              variant={detailView === v.key ? 'default' : 'ghost'}
              className="gap-1 text-[10px] h-7"
              onClick={() => setDetailView(v.key)}
            >
              {v.icon} {v.label}
            </Button>
          ))}
        </div>

        {/* Content views */}
        {detailView === 'dashboard' && (
          <CampaignPerformanceDashboard campaign={activeCampaign} posts={activePosts} />
        )}

        {detailView === 'kanban' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-foreground">Produção ({activePosts.length} posts)</h4>
              {activePosts.length > 0 && (
                <div className="flex gap-1">
                  {activePosts.filter(p => p.status === 'in_production' || p.status === 'ready').slice(0, 3).map(p => (
                    <Button key={p.id} size="sm" variant="ghost" className="gap-1 text-[9px] h-6" onClick={() => setBriefingPost(p)}>
                      <Palette className="w-3 h-3" /> Briefing: {p.title.slice(0, 15)}...
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <CampaignKanban posts={activePosts} />
          </div>
        )}

        {detailView === 'calendar' && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Calendário da Campanha</h4>
            <CampaignCalendar posts={activePosts} startDate={activeCampaign.start_date} endDate={activeCampaign.end_date} />
          </div>
        )}

        {detailView === 'approval' && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Workflow de Aprovação</h4>
            <CampaignApprovalWorkflow posts={activePosts} />
          </div>
        )}

        {detailView === 'goals' && (
          <CampaignGoals campaignId={selectedCampaign} />
        )}

        {detailView === 'roi' && (
          <CampaignROIDashboard campaign={activeCampaign} posts={activePosts} />
        )}

        {detailView === 'analytics' && (
          <CampaignAnalyticsAdvanced campaign={activeCampaign} posts={activePosts} />
        )}

        {detailView === 'queue' && (
          <CampaignPublishQueue campaign={activeCampaign} posts={activePosts} />
        )}

        {detailView === 'smart_alerts' && (
          <CampaignSmartAlerts campaign={activeCampaign} posts={activePosts} />
        )}

        {detailView === 'collab' && (
          <CampaignCollaboration campaign={activeCampaign} posts={activePosts} />
        )}

        {detailView === 'ab_test' && (
          <CampaignABTesting campaign={activeCampaign} posts={activePosts} />
        )}

        {detailView === 'hashtags' && (
          <CampaignHashtagPlanner campaign={activeCampaign} posts={activePosts} />
        )}

        {detailView === 'approval_pipeline' && (
          <CampaignApprovalPipeline campaign={activeCampaign} posts={activePosts} />
        )}

        {detailView === 'pdf_report' && (
          <CampaignPDFReport campaign={activeCampaign} posts={activePosts} />
        )}

        {detailView === 'gantt' && (
          <CampaignGanttTimeline posts={activePosts} startDate={activeCampaign.start_date} endDate={activeCampaign.end_date} />
        )}

        {detailView === 'feed' && (
          <CampaignFeedPreview posts={activePosts} profileHandle={profileConfig?.profile_handle || undefined} profileName={profileConfig?.profile_name || undefined} avatarUrl={profileConfig?.avatar_url || undefined} />
        )}

        {detailView === 'alerts' && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Notificações & Lembretes</h4>
            <CampaignAlerts campaign={activeCampaign} posts={activePosts} />
          </div>
        )}

        {detailView === 'changelog' && (
          <CampaignChangelog posts={activePosts} />
        )}

        {detailView === 'timeline' && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Calendário Editorial ({activePosts.length} posts)</h4>
            <CampaignTimeline
              posts={activePosts}
              startDate={activeCampaign.start_date}
              endDate={activeCampaign.end_date}
            />
          </div>
        )}

        {/* Dialogs */}
        <CampaignAITools campaign={activeCampaign} posts={activePosts} open={showAITools} onOpenChange={setShowAITools} />
        <CampaignAutomation campaign={activeCampaign} posts={activePosts} open={showAutomation} onOpenChange={setShowAutomation} />
        <CampaignPostReport campaign={activeCampaign} posts={activePosts} open={showReport} onOpenChange={setShowReport} />
        <CampaignFinalReport campaign={activeCampaign} posts={activePosts} open={showFinalReport} onOpenChange={setShowFinalReport} />
        {briefingPost && (
          <CampaignCreativeBriefing post={briefingPost} open={!!briefingPost} onOpenChange={o => !o && setBriefingPost(null)} />
        )}
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
          <Button size="sm" variant="outline" className="gap-1.5 text-[11px]" onClick={() => setShowTemplates(true)}>
            <BookTemplate className="w-3.5 h-3.5" /> Templates
          </Button>
          {(campaigns?.length || 0) >= 2 && (
            <Button size="sm" variant="outline" className="gap-1.5 text-[11px]" onClick={() => setShowABComparison(true)}>
              <GitCompare className="w-3.5 h-3.5" /> Comparar
            </Button>
          )}
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

      <CampaignWizard open={showAiGen} onOpenChange={setShowAiGen} onCampaignCreated={(id) => setSelectedCampaign(id)} />
      <CampaignComparison open={showComparison} onOpenChange={setShowComparison} />
      <CampaignABComparison open={showABComparison} onOpenChange={setShowABComparison} />
      <CampaignTemplateLibrary open={showTemplates} onOpenChange={setShowTemplates} onApplyTemplate={(id) => setSelectedCampaign(id)} />
    </div>
  );
}
