import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useMarketingStore } from "@/stores/marketingStore";
import { useAggregatedMetrics } from "@/hooks/useContentMetrics";
import { CONTENT_ITEM_STAGES, CONTENT_PILLARS } from "@/types/marketing";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, Sparkles, AlertTriangle, CheckCircle, Clock,
  TrendingUp, Lightbulb, Megaphone, ArrowRight, Plus,
  Instagram, BarChart3, Target, Wand2, Users, Heart, Zap, Image, Mic
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function MarketingDashboard() {
  const navigate = useNavigate();
  const { 
    contentItems, 
    ideas,
    campaigns,
    fetchContentItems, 
    fetchIdeas,
    fetchCampaigns,
    getStats,
    createIdea,
  } = useMarketingStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const { aggregated: metricsAggregated } = useAggregatedMetrics();

  useEffect(() => {
    fetchContentItems();
    fetchIdeas();
    fetchCampaigns();
  }, []);

  const stats = getStats();
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Next 7 days scheduled
  const nextScheduled = contentItems
    .filter(i => i.status === 'scheduled' && i.scheduled_at)
    .filter(i => new Date(i.scheduled_at!) <= weekAhead)
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
    .slice(0, 5);

  // In review
  const inReview = contentItems.filter(i => i.status === 'review').slice(0, 4);

  // Overdue
  const overdue = contentItems.filter(i => 
    i.due_at && new Date(i.due_at) < now && !['published', 'archived'].includes(i.status)
  ).slice(0, 4);

  // Recent published
  const recentPublished = contentItems
    .filter(i => i.status === 'published' && i.published_at)
    .sort((a, b) => new Date(b.published_at!).getTime() - new Date(a.published_at!).getTime())
    .slice(0, 4);

  const handleGenerate30Days = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-30day-plan', {
        body: { 
          postsPerWeek: 4,
          existingIdeas: ideas.map(i => ({ title: i.title }))
        }
      });

      if (error) throw error;

      // Save generated ideas
      for (const idea of data.ideas || []) {
        await createIdea({
          title: idea.title,
          hook: idea.hook,
          angle: idea.angle,
          pillar: idea.pillar,
          format: idea.format,
          channel: idea.channel,
          score: idea.score,
          status: 'backlog',
          ai_generated: true,
        });
      }

      toast.success(`${data.ideas?.length || 0} ideias geradas com sucesso!`);
      fetchIdeas();
    } catch (error: any) {
      console.error('Error generating plan:', error);
      toast.error(error.message || 'Erro ao gerar plano');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DashboardLayout title="Marketing">
      <div className="space-y-6 max-w-[1600px] 2xl:max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-light text-foreground tracking-tight">Marketing & Conteúdo</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visão geral da produção de conteúdo
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/marketing/ideas')}>
              <Lightbulb className="w-4 h-4 mr-2" />
              Ideias
            </Button>
            <Button onClick={handleGenerate30Days} disabled={isGenerating}>
              <Sparkles className="w-4 h-4 mr-2" />
              {isGenerating ? 'Gerando...' : 'Gerar Plano 30 dias'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <StatCard
            title="Em Produção"
            value={stats.inProduction}
            icon={Clock}
            color="bg-blue-500"
          />
          <StatCard
            title="Publicados"
            value={stats.publishedThisMonth}
            subtitle="este mês"
            icon={TrendingUp}
            color="bg-primary"
          />
          <StatCard
            title="Alcance Total"
            value={metricsAggregated.totalReach.toLocaleString('pt-BR')}
            subtitle="com métricas"
            icon={Users}
            color="bg-purple-500"
          />
          <StatCard
            title="Engajamento Médio"
            value={metricsAggregated.averageEngagement.toLocaleString('pt-BR')}
            subtitle="likes + comentários"
            icon={Heart}
            color="bg-red-500"
          />
          <StatCard
            title="Atrasados"
            value={stats.overdue}
            icon={AlertTriangle}
            color="bg-red-500"
            alert={stats.overdue > 0}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Em Revisão"
            value={contentItems.filter(i => i.status === 'review').length}
            icon={Target}
            color="bg-amber-500"
          />
          <StatCard
            title="Aprovados"
            value={stats.approved}
            icon={CheckCircle}
            color="bg-emerald-500"
          />
          <StatCard
            title="Agendados"
            value={stats.scheduledThisWeek}
            subtitle="esta semana"
            icon={Calendar}
            color="bg-cyan-500"
          />
          <StatCard
            title="Ideias"
            value={stats.totalIdeas}
            subtitle="no banco"
            icon={Lightbulb}
            color="bg-purple-500"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Next 7 Days */}
          <Card className="glass-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-foreground">Próximos 7 dias</h3>
                <p className="text-xs text-muted-foreground">Conteúdos agendados</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/marketing/calendar')}>
                Ver calendário
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {nextScheduled.length > 0 ? (
              <div className="space-y-3">
                {nextScheduled.map((item) => (
                  <ScheduledItem key={item.id} item={item} onClick={() => navigate(`/marketing/item/${item.id}`)} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                message="Nenhum conteúdo agendado"
                action="Agendar conteúdo"
                onClick={() => navigate('/marketing/pipeline')}
              />
            )}
          </Card>

          {/* Quick Actions */}
          <Card className="glass-card p-6">
            <h3 className="font-medium text-foreground mb-4">Ações Rápidas</h3>
            <div className="space-y-2">
              <QuickAction 
                icon={Wand2} 
                label="Studio Criativo" 
                onClick={() => navigate('/marketing/studio')} 
              />
              <QuickAction 
                icon={Plus} 
                label="Nova Ideia" 
                onClick={() => navigate('/marketing/ideas')} 
              />
              <QuickAction 
                icon={Calendar} 
                label="Ver Calendário" 
                onClick={() => navigate('/marketing/calendar')} 
              />
              <QuickAction 
                icon={Megaphone} 
                label="Campanhas" 
                onClick={() => navigate('/marketing/campaigns')} 
              />
              <QuickAction 
                icon={Instagram} 
                label="Instagram Preview" 
                onClick={() => navigate('/marketing/instagram')} 
              />
              <QuickAction 
                icon={Image} 
                label="Referências" 
                onClick={() => navigate('/marketing/references')} 
              />
              <QuickAction 
                icon={BarChart3} 
                label="Assets & Brand" 
                onClick={() => navigate('/marketing/assets')} 
              />
              <QuickAction 
                icon={Zap} 
                label="Automações" 
                onClick={() => navigate('/marketing/automacoes')} 
              />
              <QuickAction 
                icon={Mic} 
                label="Transcrição IA" 
                onClick={() => navigate('/marketing/transcricao')} 
              />
            </div>
          </Card>
        </div>

        {/* Secondary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* In Review */}
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Em Revisão</h3>
              <Badge variant="outline">{inReview.length}</Badge>
            </div>
            {inReview.length > 0 ? (
              <div className="space-y-3">
                {inReview.map((item) => (
                  <ContentPreview 
                    key={item.id} 
                    item={item} 
                    onClick={() => navigate(`/marketing/item/${item.id}`)} 
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum em revisão</p>
            )}
          </Card>

          {/* Overdue */}
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                {overdue.length > 0 && <AlertTriangle className="w-4 h-4 text-red-500" />}
                Atrasados
              </h3>
              <Badge variant={overdue.length > 0 ? "destructive" : "outline"}>{overdue.length}</Badge>
            </div>
            {overdue.length > 0 ? (
              <div className="space-y-3">
                {overdue.map((item) => (
                  <ContentPreview 
                    key={item.id} 
                    item={item} 
                    onClick={() => navigate(`/marketing/item/${item.id}`)}
                    overdue 
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Tudo em dia! 🎉</p>
            )}
          </Card>

          {/* Recent Published */}
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Publicados Recentes</h3>
              <Badge variant="outline">{recentPublished.length}</Badge>
            </div>
            {recentPublished.length > 0 ? (
              <div className="space-y-3">
                {recentPublished.map((item) => (
                  <ContentPreview 
                    key={item.id} 
                    item={item} 
                    onClick={() => navigate(`/marketing/item/${item.id}`)} 
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum publicado recentemente</p>
            )}
          </Card>
        </div>

        {/* Active Campaigns */}
        {campaigns.filter(c => c.status === 'active').length > 0 && (
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Campanhas Ativas</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/marketing/campaigns')}>
                Ver todas
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.filter(c => c.status === 'active').slice(0, 3).map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} onClick={() => navigate('/marketing/campaigns')} />
              ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color, alert }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass-card p-4 rounded-xl",
        alert && "border-red-500/50"
      )}
    >
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", color + "/10")}>
        <Icon className={cn("w-4 h-4", color.replace('bg-', 'text-'))} />
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{title}</p>
      {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
    </motion.div>
  );
}

function ScheduledItem({ item, onClick }: any) {
  const stage = CONTENT_ITEM_STAGES.find(s => s.type === item.status);
  return (
    <div 
      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="text-center min-w-[40px]">
          <p className="text-lg font-semibold text-foreground">
            {new Date(item.scheduled_at).getDate()}
          </p>
          <p className="text-[9px] text-muted-foreground uppercase">
            {new Date(item.scheduled_at).toLocaleDateString('pt-BR', { weekday: 'short' })}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{item.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {item.channel && (
              <Badge variant="outline" className="text-[9px] py-0">{item.channel}</Badge>
            )}
            {item.format && (
              <Badge variant="outline" className="text-[9px] py-0">{item.format}</Badge>
            )}
          </div>
        </div>
      </div>
      <div className={cn("w-2 h-2 rounded-full", stage?.color)} />
    </div>
  );
}

function ContentPreview({ item, onClick, overdue }: any) {
  return (
    <div 
      className={cn(
        "p-3 rounded-lg cursor-pointer transition-colors",
        overdue ? "bg-red-500/10 hover:bg-red-500/20" : "bg-muted/30 hover:bg-muted/50"
      )}
      onClick={onClick}
    >
      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
      <div className="flex items-center gap-2 mt-1">
        {item.channel && <Badge variant="outline" className="text-[9px] py-0">{item.channel}</Badge>}
        {item.due_at && (
          <span className={cn("text-[10px]", overdue ? "text-red-500" : "text-muted-foreground")}>
            {new Date(item.due_at).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }: any) {
  return (
    <button
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
      onClick={onClick}
    >
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm text-foreground">{label}</span>
    </button>
  );
}

function CampaignCard({ campaign, onClick }: any) {
  return (
    <div 
      className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <h4 className="font-medium text-foreground">{campaign.name}</h4>
      {campaign.objective && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{campaign.objective}</p>
      )}
      <div className="flex items-center gap-2 mt-3">
        <Badge className="bg-emerald-500 text-white text-[9px]">Ativa</Badge>
        {campaign.content_items_count && (
          <span className="text-[10px] text-muted-foreground">{campaign.content_items_count} conteúdos</span>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message, action, onClick }: any) {
  return (
    <div className="text-center py-8">
      <Icon className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
      <p className="text-sm text-muted-foreground mb-3">{message}</p>
      <Button variant="outline" size="sm" onClick={onClick}>
        {action}
      </Button>
    </div>
  );
}
