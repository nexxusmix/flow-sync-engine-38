import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useInstagramCampaigns, useInstagramPosts, InstagramPost } from '@/hooks/useInstagramEngine';
import { useInstagramInsights, useInstagramConnection } from '@/hooks/useInstagramAPI';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  Loader2, Plus, Target, Calendar, Users, Megaphone, FileText, ChevronRight, ChevronDown,
  TrendingUp, BarChart3, ArrowLeft, Download, Sparkles, Zap, Copy, FileBarChart,
  GitCompare, LayoutGrid, List, CalendarDays, CheckSquare, BookTemplate, Bell, History,
  Palette, DollarSign, Smartphone, GanttChart, Flame, Send, MessageSquare, Hash, Shield,
  FileDown, Map, Scale, FileSpreadsheet, RefreshCw, Calculator, BookMarked, Repeat2,
  HeartPulse, BookOpen, UserCircle, Route, CalendarPlus, MessageCircle, Presentation,
  ShieldAlert, CalendarHeart, KanbanSquare, Search, Layers, ArrowDown, Clock, Gauge,
  UserCheck, Brush, BoltIcon, MoreHorizontal, Wrench, Eye
} from 'lucide-react';
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
import { CampaignContentMap } from './CampaignContentMap';
import { CampaignCompare } from './CampaignCompare';
import { CampaignBriefingGenerator } from './CampaignBriefingGenerator';
import { CampaignRepostAutomation } from './CampaignRepostAutomation';
import { CampaignResultsSimulator } from './CampaignResultsSimulator';
import { CampaignSwipeFiles } from './CampaignSwipeFiles';
import { CampaignAdsCopyGenerator } from './CampaignAdsCopyGenerator';
import { CampaignUnifiedCalendar } from './CampaignUnifiedCalendar';
import { CampaignFunnelView } from './CampaignFunnelView';
import { CampaignSpinGenerator } from './CampaignSpinGenerator';
import { CampaignHeatmap } from './CampaignHeatmap';
import { CampaignCompetitorTracker } from './CampaignCompetitorTracker';
import { CampaignHealthScore } from './CampaignHealthScore';
import { CampaignPostMortem } from './CampaignPostMortem';
import { CampaignPersonaMap } from './CampaignPersonaMap';
import { CampaignCustomerJourney } from './CampaignCustomerJourney';
import { CampaignCrossComparator } from './CampaignCrossComparator';
import { CampaignHashtagIntelligence } from './CampaignHashtagIntelligence';
import { CampaignContentRecycling } from './CampaignContentRecycling';
import { CampaignABTestFramework } from './CampaignABTestFramework';
import { CampaignAutoPlanner } from './CampaignAutoPlanner';
import { CampaignSentimentAnalysis } from './CampaignSentimentAnalysis';
import { CampaignPitchDeck } from './CampaignPitchDeck';
import { CampaignRiskScore } from './CampaignRiskScore';
import { CampaignHolidayCalendar } from './CampaignHolidayCalendar';
import { CampaignCollaborationBoard } from './CampaignCollaborationBoard';
import { CampaignContentGapAnalyzer } from './CampaignContentGapAnalyzer';
import { CampaignCloner } from './CampaignCloner';
import { CampaignContentFunnel } from './CampaignContentFunnel';
import { CampaignTimingOptimizer } from './CampaignTimingOptimizer';
import { CampaignVelocityTracker } from './CampaignVelocityTracker';
import { CampaignClientReview } from './CampaignClientReview';
import { CampaignMoodBoard } from './CampaignMoodBoard';
import { CampaignMicroBlitz } from './CampaignMicroBlitz';
import { CampaignAudienceHeatmap } from './CampaignAudienceHeatmap';
import { CampaignAutopsy } from './CampaignAutopsy';
import { CampaignDNA } from './CampaignDNA';
import { CampaignStoryArc } from './CampaignStoryArc';
import { CampaignBudgetAllocator } from './CampaignBudgetAllocator';
import { CampaignWarRoom } from './CampaignWarRoom';
import { CampaignSeasonal } from './CampaignSeasonal';
import { CampaignSplitContent } from './CampaignSplitContent';
import { CampaignCompetitorShadow } from './CampaignCompetitorShadow';
import { CampaignMoodTracker } from './CampaignMoodTracker';
import { useProfileConfig } from '@/hooks/useInstagramEngine';

// --- Sonance palette: monocromático azul/branco/cinza ---
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  planning: { label: 'Planejamento', color: 'bg-primary/10 text-primary/70 border border-primary/20' },
  active: { label: 'Ativa', color: 'bg-primary/15 text-primary border border-primary/30' },
  completed: { label: 'Concluída', color: 'bg-muted text-muted-foreground border border-border' },
  paused: { label: 'Pausada', color: 'bg-muted/50 text-muted-foreground/60 border border-border/50' },
};

type DetailView = 'dashboard' | 'kanban' | 'timeline' | 'gantt' | 'calendar' | 'approval' | 'goals' | 'alerts' | 'changelog' | 'roi' | 'feed' | 'analytics' | 'queue' | 'smart_alerts' | 'collab' | 'ab_test' | 'hashtags' | 'approval_pipeline' | 'pdf_report' | 'content_map' | 'compare' | 'briefing' | 'repost' | 'simulator' | 'swipe_files' | 'ads_copy' | 'unified_calendar' | 'funnel' | 'spin' | 'heatmap' | 'competitors' | 'health' | 'postmortem' | 'personas' | 'journey' | 'cross_compare' | 'hashtag_intel' | 'recycle' | 'ab_framework' | 'auto_planner' | 'sentiment' | 'pitch_deck' | 'risk_score' | 'holidays' | 'collab_board' | 'content_gap' | 'cloner' | 'content_funnel' | 'timing' | 'velocity' | 'client_review' | 'mood_board' | 'micro_blitz' | 'audience_heatmap' | 'autopsy' | 'dna' | 'story_arc' | 'budget_allocator' | 'war_room' | 'seasonal' | 'split_content' | 'competitor_shadow' | 'mood_tracker';

// --- Mega-menu categorizado ---
interface NavCategory {
  label: string;
  icon: React.ReactNode;
  items: { key: DetailView; label: string; icon: React.ReactNode }[];
}

const NAV_CATEGORIES: NavCategory[] = [
  {
    label: 'Produção',
    icon: <LayoutGrid className="w-3.5 h-3.5" />,
    items: [
      { key: 'kanban', label: 'Kanban', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
      { key: 'approval', label: 'Aprovação', icon: <CheckSquare className="w-3.5 h-3.5" /> },
      { key: 'approval_pipeline', label: 'Workflow', icon: <Shield className="w-3.5 h-3.5" /> },
      { key: 'queue', label: 'Publicação', icon: <Send className="w-3.5 h-3.5" /> },
      { key: 'feed', label: 'Feed Preview', icon: <Smartphone className="w-3.5 h-3.5" /> },
      { key: 'timeline', label: 'Timeline', icon: <List className="w-3.5 h-3.5" /> },
    ],
  },
  {
    label: 'Calendário',
    icon: <CalendarDays className="w-3.5 h-3.5" />,
    items: [
      { key: 'calendar', label: 'Calendário', icon: <CalendarDays className="w-3.5 h-3.5" /> },
      { key: 'unified_calendar', label: 'Cal. Unificado', icon: <CalendarDays className="w-3.5 h-3.5" /> },
      { key: 'gantt', label: 'Gantt', icon: <List className="w-3.5 h-3.5" /> },
      { key: 'timing', label: 'Timing', icon: <Clock className="w-3.5 h-3.5" /> },
      { key: 'holidays', label: 'Feriados', icon: <CalendarHeart className="w-3.5 h-3.5" /> },
      { key: 'seasonal', label: 'Sazonal', icon: <CalendarHeart className="w-3.5 h-3.5" /> },
    ],
  },
  {
    label: 'Analytics',
    icon: <BarChart3 className="w-3.5 h-3.5" />,
    items: [
      { key: 'analytics', label: 'Analytics', icon: <Flame className="w-3.5 h-3.5" /> },
      { key: 'roi', label: 'ROI', icon: <DollarSign className="w-3.5 h-3.5" /> },
      { key: 'heatmap', label: 'Heatmap', icon: <Flame className="w-3.5 h-3.5" /> },
      { key: 'health', label: 'Saúde', icon: <HeartPulse className="w-3.5 h-3.5" /> },
      { key: 'velocity', label: 'Velocity', icon: <Gauge className="w-3.5 h-3.5" /> },
      { key: 'sentiment', label: 'Sentimento', icon: <MessageCircle className="w-3.5 h-3.5" /> },
      { key: 'mood_tracker', label: 'Mood Tracker', icon: <HeartPulse className="w-3.5 h-3.5" /> },
    ],
  },
  {
    label: 'Estratégia',
    icon: <Target className="w-3.5 h-3.5" />,
    items: [
      { key: 'goals', label: 'Metas', icon: <Target className="w-3.5 h-3.5" /> },
      { key: 'funnel', label: 'Funil', icon: <TrendingUp className="w-3.5 h-3.5" /> },
      { key: 'content_funnel', label: 'Content Funnel', icon: <ArrowDown className="w-3.5 h-3.5" /> },
      { key: 'content_map', label: 'Content Map', icon: <Map className="w-3.5 h-3.5" /> },
      { key: 'personas', label: 'Personas', icon: <UserCircle className="w-3.5 h-3.5" /> },
      { key: 'journey', label: 'Jornada', icon: <Route className="w-3.5 h-3.5" /> },
      { key: 'story_arc', label: 'Story Arc', icon: <FileText className="w-3.5 h-3.5" /> },
      { key: 'dna', label: 'DNA', icon: <Copy className="w-3.5 h-3.5" /> },
    ],
  },
  {
    label: 'IA Tools',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    items: [
      { key: 'smart_alerts', label: 'Alertas IA', icon: <Bell className="w-3.5 h-3.5" /> },
      { key: 'simulator', label: 'Simulador', icon: <Calculator className="w-3.5 h-3.5" /> },
      { key: 'auto_planner', label: 'Auto-Planner', icon: <CalendarPlus className="w-3.5 h-3.5" /> },
      { key: 'briefing', label: 'Briefing', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
      { key: 'ads_copy', label: 'Ads Copy', icon: <Megaphone className="w-3.5 h-3.5" /> },
      { key: 'spin', label: 'Spin', icon: <Repeat2 className="w-3.5 h-3.5" /> },
      { key: 'hashtags', label: 'Hashtags', icon: <Hash className="w-3.5 h-3.5" /> },
      { key: 'hashtag_intel', label: 'Hashtag Intel', icon: <Hash className="w-3.5 h-3.5" /> },
      { key: 'ab_test', label: 'A/B Test', icon: <GitCompare className="w-3.5 h-3.5" /> },
      { key: 'ab_framework', label: 'A/B Framework', icon: <GitCompare className="w-3.5 h-3.5" /> },
      { key: 'risk_score', label: 'Risk Score', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
      { key: 'content_gap', label: 'Gap Analysis', icon: <Search className="w-3.5 h-3.5" /> },
      { key: 'pitch_deck', label: 'Pitch Deck', icon: <Presentation className="w-3.5 h-3.5" /> },
      { key: 'budget_allocator', label: 'Budget', icon: <DollarSign className="w-3.5 h-3.5" /> },
    ],
  },
  {
    label: 'Colaboração',
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    items: [
      { key: 'collab', label: 'Colaboração', icon: <MessageSquare className="w-3.5 h-3.5" /> },
      { key: 'collab_board', label: 'Tarefas', icon: <KanbanSquare className="w-3.5 h-3.5" /> },
      { key: 'client_review', label: 'Revisão', icon: <UserCheck className="w-3.5 h-3.5" /> },
      { key: 'war_room', label: 'War Room', icon: <Shield className="w-3.5 h-3.5" /> },
      { key: 'audience_heatmap', label: 'Audiência', icon: <Users className="w-3.5 h-3.5" /> },
    ],
  },
  {
    label: 'Exportar',
    icon: <Download className="w-3.5 h-3.5" />,
    items: [
      { key: 'pdf_report', label: 'Relatório', icon: <FileDown className="w-3.5 h-3.5" /> },
      { key: 'compare', label: 'Comparar', icon: <Scale className="w-3.5 h-3.5" /> },
      { key: 'cross_compare', label: 'Cross-Compare', icon: <Scale className="w-3.5 h-3.5" /> },
      { key: 'postmortem', label: 'Post-Mortem', icon: <BookOpen className="w-3.5 h-3.5" /> },
      { key: 'autopsy', label: 'Autopsia', icon: <BookOpen className="w-3.5 h-3.5" /> },
      { key: 'cloner', label: 'Clonar', icon: <Layers className="w-3.5 h-3.5" /> },
      { key: 'swipe_files', label: 'Swipe Files', icon: <BookMarked className="w-3.5 h-3.5" /> },
      { key: 'repost', label: 'Repost', icon: <RefreshCw className="w-3.5 h-3.5" /> },
      { key: 'recycle', label: 'Reciclagem', icon: <RefreshCw className="w-3.5 h-3.5" /> },
      { key: 'split_content', label: 'Repurpose', icon: <Layers className="w-3.5 h-3.5" /> },
      { key: 'competitors', label: 'Concorrentes', icon: <Users className="w-3.5 h-3.5" /> },
      { key: 'competitor_shadow', label: 'Shadow', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
      { key: 'micro_blitz', label: 'Blitz 24h', icon: <Zap className="w-3.5 h-3.5" /> },
      { key: 'mood_board', label: 'Mood Board', icon: <Palette className="w-3.5 h-3.5" /> },
      { key: 'alerts', label: 'Lembretes', icon: <Bell className="w-3.5 h-3.5" /> },
      { key: 'changelog', label: 'Histórico', icon: <History className="w-3.5 h-3.5" /> },
    ],
  },
];

// --- SVG ring de progresso circular ---
function ProgressRing({ progress, size = 36, stroke = 3 }: { progress: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} opacity={0.3} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
    </svg>
  );
}

// --- Componente de categoria do mega-menu ---
function NavCategoryDropdown({
  category,
  activeView,
  onSelect,
}: {
  category: NavCategory;
  activeView: DetailView;
  onSelect: (key: DetailView) => void;
}) {
  const isActive = category.items.some(i => i.key === activeView);
  const activeItem = category.items.find(i => i.key === activeView);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant={isActive ? 'default' : 'ghost'}
          className="gap-1.5 text-[11px] h-8 px-3"
        >
          {category.icon}
          <span>{activeItem ? activeItem.label : category.label}</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[180px]">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
          {category.label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {category.items.map(item => (
          <DropdownMenuItem
            key={item.key}
            onClick={() => onSelect(item.key)}
            className={`gap-2 text-[11px] cursor-pointer ${activeView === item.key ? 'bg-primary/10 text-primary' : ''}`}
          >
            {item.icon}
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
  const [detailView, setDetailView] = useState<DetailView>('dashboard');
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

      const campaignPosts = (posts || []).filter(p => p.campaign_id === campaignId);
      if (campaignPosts.length > 0) {
        const clonedPosts = campaignPosts.map(p => ({
          title: p.title, format: p.format, pillar: p.pillar, objective: p.objective,
          status: 'idea', hook: p.hook, script: p.script, caption_short: p.caption_short,
          caption_medium: p.caption_medium, caption_long: p.caption_long, cta: p.cta,
          pinned_comment: p.pinned_comment, hashtags: p.hashtags, cover_suggestion: p.cover_suggestion,
          carousel_slides: p.carousel_slides, story_sequence: p.story_sequence, checklist: p.checklist,
          ai_generated: p.ai_generated, campaign_id: (newCampaign as any).id, position: p.position,
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

  // ========== DETAIL VIEW ==========
  if (activeCampaign && selectedCampaign) {
    const status = STATUS_MAP[activeCampaign.status] || STATUS_MAP.planning;
    const postCount = activePosts.length;
    const publishedCount = activePosts.filter(p => p.status === 'published').length;
    const completionRate = postCount > 0 ? Math.round((publishedCount / postCount) * 100) : 0;

    return (
      <div className="space-y-4">
        {/* ===== HEADER PREMIUM ===== */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedCampaign(null)} className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0 flex items-center gap-3">
            {/* Mini ring de progresso */}
            <div className="relative shrink-0">
              <ProgressRing progress={completionRate} size={40} stroke={3} />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-primary">
                {completionRate}%
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground truncate">{activeCampaign.name}</h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-normal tracking-wider uppercase ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                {activeCampaign.target_audience && (
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {activeCampaign.target_audience}</span>
                )}
                {activeCampaign.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(activeCampaign.start_date), "dd MMM", { locale: ptBR })} — {activeCampaign.end_date ? format(new Date(activeCampaign.end_date), "dd MMM", { locale: ptBR }) : '...'}
                  </span>
                )}
                {activeCampaign.budget && (
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> R$ {Number(activeCampaign.budget).toLocaleString()}</span>
                )}
                <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {postCount} posts</span>
              </div>
            </div>
          </div>

          {/* Ações primárias + menu "..." */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7" onClick={() => setShowAutomation(true)}>
              <Zap className="w-3.5 h-3.5" /> Automações
            </Button>
            <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7" onClick={() => setShowAITools(true)}>
              <Sparkles className="w-3.5 h-3.5" /> IA Avançada
            </Button>
            {/* Menu de ações secundárias */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[180px]">
                <DropdownMenuItem onClick={() => setShowFinalReport(true)} className="gap-2 text-[11px] cursor-pointer">
                  <FileBarChart className="w-3.5 h-3.5" /> Relatório Final
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowReport(true)} className="gap-2 text-[11px] cursor-pointer">
                  <FileBarChart className="w-3.5 h-3.5" /> Relatório
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleDuplicate(selectedCampaign)} disabled={duplicating} className="gap-2 text-[11px] cursor-pointer">
                  {duplicating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />} Duplicar Campanha
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="p-0">
                  <div className="w-full">
                    <SaveCampaignAsTemplateButton campaign={activeCampaign} postCount={activePosts.length} />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => exportInstagramCampaignPDF(selectedCampaign!)} className="gap-2 text-[11px] cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> Exportar PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ===== MEGA-MENU CATEGORIZADO ===== */}
        <div className="flex items-center gap-1 flex-wrap border-b border-border/40 pb-2">
          {/* Dashboard como botão direto */}
          <Button
            size="sm"
            variant={detailView === 'dashboard' ? 'default' : 'ghost'}
            className="gap-1.5 text-[11px] h-8 px-3"
            onClick={() => setDetailView('dashboard')}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Dashboard
          </Button>

          {/* Dropdowns de categorias */}
          {NAV_CATEGORIES.map(cat => (
            <NavCategoryDropdown
              key={cat.label}
              category={cat}
              activeView={detailView}
              onSelect={setDetailView}
            />
          ))}
        </div>

        {/* ===== CONTENT VIEWS ===== */}
        {detailView === 'dashboard' && <CampaignPerformanceDashboard campaign={activeCampaign} posts={activePosts} />}

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

        {detailView === 'calendar' && <CampaignCalendar posts={activePosts} startDate={activeCampaign.start_date} endDate={activeCampaign.end_date} />}
        {detailView === 'approval' && <CampaignApprovalWorkflow posts={activePosts} />}
        {detailView === 'goals' && <CampaignGoals campaignId={selectedCampaign} />}
        {detailView === 'roi' && <CampaignROIDashboard campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'analytics' && <CampaignAnalyticsAdvanced campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'queue' && <CampaignPublishQueue campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'smart_alerts' && <CampaignSmartAlerts campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'collab' && <CampaignCollaboration campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'ab_test' && <CampaignABTesting campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'hashtags' && <CampaignHashtagPlanner campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'approval_pipeline' && <CampaignApprovalPipeline campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'pdf_report' && <CampaignPDFReport campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'content_map' && <CampaignContentMap campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'compare' && <CampaignCompare campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'briefing' && <CampaignBriefingGenerator campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'repost' && <CampaignRepostAutomation campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'simulator' && <CampaignResultsSimulator campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'swipe_files' && <CampaignSwipeFiles campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'ads_copy' && <CampaignAdsCopyGenerator campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'unified_calendar' && <CampaignUnifiedCalendar campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'funnel' && <CampaignFunnelView campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'spin' && <CampaignSpinGenerator campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'heatmap' && <CampaignHeatmap campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'competitors' && <CampaignCompetitorTracker campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'health' && <CampaignHealthScore campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'postmortem' && <CampaignPostMortem campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'personas' && <CampaignPersonaMap campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'journey' && <CampaignCustomerJourney campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'cross_compare' && <CampaignCrossComparator />}
        {detailView === 'hashtag_intel' && <CampaignHashtagIntelligence campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'recycle' && <CampaignContentRecycling campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'ab_framework' && <CampaignABTestFramework campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'auto_planner' && <CampaignAutoPlanner campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'sentiment' && <CampaignSentimentAnalysis campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'pitch_deck' && <CampaignPitchDeck campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'risk_score' && <CampaignRiskScore campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'holidays' && <CampaignHolidayCalendar campaigns={campaigns || []} />}
        {detailView === 'collab_board' && <CampaignCollaborationBoard campaign={activeCampaign} />}
        {detailView === 'content_gap' && <CampaignContentGapAnalyzer campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'cloner' && <CampaignCloner campaigns={campaigns || []} posts={posts || []} />}
        {detailView === 'content_funnel' && <CampaignContentFunnel campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'timing' && <CampaignTimingOptimizer campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'velocity' && <CampaignVelocityTracker campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'client_review' && <CampaignClientReview campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'mood_board' && <CampaignMoodBoard campaign={activeCampaign} />}
        {detailView === 'micro_blitz' && <CampaignMicroBlitz campaign={activeCampaign} />}
        {detailView === 'audience_heatmap' && <CampaignAudienceHeatmap campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'autopsy' && <CampaignAutopsy campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'dna' && <CampaignDNA campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'story_arc' && <CampaignStoryArc campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'budget_allocator' && <CampaignBudgetAllocator campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'war_room' && <CampaignWarRoom campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'seasonal' && <CampaignSeasonal campaign={activeCampaign} />}
        {detailView === 'split_content' && <CampaignSplitContent campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'competitor_shadow' && <CampaignCompetitorShadow campaign={activeCampaign} />}
        {detailView === 'mood_tracker' && <CampaignMoodTracker campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'gantt' && <CampaignGanttTimeline posts={activePosts} startDate={activeCampaign.start_date} endDate={activeCampaign.end_date} />}
        {detailView === 'feed' && <CampaignFeedPreview posts={activePosts} profileHandle={profileConfig?.profile_handle || undefined} profileName={profileConfig?.profile_name || undefined} avatarUrl={profileConfig?.avatar_url || undefined} />}
        {detailView === 'alerts' && <CampaignAlerts campaign={activeCampaign} posts={activePosts} />}
        {detailView === 'changelog' && <CampaignChangelog posts={activePosts} />}
        {detailView === 'timeline' && (
          <CampaignTimeline posts={activePosts} startDate={activeCampaign.start_date} endDate={activeCampaign.end_date} />
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

  // ========== LIST VIEW (Cards Premium) ==========
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
                className="glass-card p-5 hover:border-primary/20 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                onClick={() => setSelectedCampaign(c.id)}
              >
                {/* Glow sutil no hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-primary/5 via-transparent to-transparent" />

                <div className="relative flex items-start gap-3">
                  {/* Ring de progresso circular */}
                  <div className="relative shrink-0 mt-0.5">
                    <ProgressRing progress={completionRate} size={44} stroke={3} />
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-primary">
                      {completionRate}%
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate pr-2">
                        {c.name}
                      </h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-normal tracking-wider uppercase ${status.color}`}>
                          {status.label}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>

                    {c.objective && (
                      <p className="text-[11px] text-muted-foreground mb-2.5 line-clamp-2">{c.objective}</p>
                    )}

                    <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{postCount} posts</span>
                      {c.target_audience && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.target_audience}</span>}
                      {c.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(c.start_date), 'dd/MM')} — {c.end_date ? format(new Date(c.end_date), 'dd/MM') : '...'}
                        </span>
                      )}
                      {c.budget && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />R$ {Number(c.budget).toLocaleString()}</span>}
                    </div>
                  </div>
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
