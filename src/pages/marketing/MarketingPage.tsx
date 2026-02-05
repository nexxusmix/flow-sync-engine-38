import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useMarketingStore } from "@/stores/marketingStore";
import { Timeline3D } from "@/components/marketing/Timeline3D";
import { Link, useNavigate } from "react-router-dom";
import { 
  Plus, CalendarDays, Kanban, Lightbulb, Megaphone, 
  FolderOpen, Sparkles, TrendingUp, AlertTriangle, 
  CheckCircle, Clock, ArrowRight, Instagram
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONTENT_ITEM_STAGES } from "@/types/marketing";
import { motion } from "framer-motion";

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = "text-primary",
  onClick,
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  trend?: string;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div 
      className="glass-card rounded-2xl p-6 cursor-pointer hover:border-primary/20 border border-transparent transition-all"
      whileHover={{ scale: 1.02, translateY: -4 }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
            {trend}
          </span>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-medium text-foreground">{value}</p>
    </motion.div>
  );
}

function ContentItemCard({ item, onClick }: { item: any; onClick: () => void }) {
  const stage = CONTENT_ITEM_STAGES.find(s => s.type === item.status);
  const isOverdue = item.due_at && new Date(item.due_at) < new Date() && !['published', 'archived'].includes(item.status);

  return (
    <motion.button
      className={`w-full text-left glass-card rounded-xl p-4 border-l-2 ${isOverdue ? 'border-l-red-500' : `border-l-${stage?.color.replace('bg-', '')}`} hover:bg-white/5 transition-all`}
      onClick={onClick}
      whileHover={{ scale: 1.01, x: 4 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium text-foreground truncate">{item.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[9px] px-2 py-0.5 rounded ${stage?.color} text-white font-medium`}>
              {stage?.name}
            </span>
            {item.channel && (
              <span className="text-[10px] text-muted-foreground capitalize">{item.channel}</span>
            )}
          </div>
        </div>
        {isOverdue && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
      </div>
    </motion.button>
  );
}

export default function MarketingPage() {
  const navigate = useNavigate();
  const { 
    fetchContentItems, 
    fetchIdeas, 
    fetchCampaigns,
    contentItems,
    getStats,
    setSelectedItem,
  } = useMarketingStore();

  useEffect(() => {
    fetchContentItems();
    fetchIdeas();
    fetchCampaigns();
  }, []);

  const stats = getStats();

  // Get items for different sections
  const inProductionItems = contentItems.filter(i => 
    ['writing', 'recording', 'editing', 'review'].includes(i.status)
  ).slice(0, 5);

  const overdueItems = contentItems.filter(i => 
    i.due_at && new Date(i.due_at) < new Date() && !['published', 'archived'].includes(i.status)
  ).slice(0, 5);

  const recentlyPublished = contentItems.filter(i => 
    i.status === 'published'
  ).slice(0, 3);

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    navigate(`/marketing/item/${item.id}`);
  };

  return (
    <DashboardLayout title="Marketing & Conteúdo">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl font-medium text-foreground tracking-tight">
              Marketing & Conteúdo
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Planeje, produza e publique com consistência
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link to="/marketing/ideas">
                <Lightbulb className="w-4 h-4 mr-2" />
                Ideias
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/marketing/calendar">
                <CalendarDays className="w-4 h-4 mr-2" />
                Calendário
              </Link>
            </Button>
            <Button asChild>
              <Link to="/marketing/pipeline">
                <Kanban className="w-4 h-4 mr-2" />
                Pipeline
              </Link>
            </Button>
          </div>
        </div>

        {/* 3D Timeline */}
        <motion.div 
          className="glass-card rounded-3xl overflow-hidden relative h-[320px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Timeline3D 
            items={contentItems.filter(i => i.scheduled_at || i.due_at)} 
            onItemClick={handleItemClick}
          />
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Em Produção"
            value={stats.inProduction}
            icon={TrendingUp}
            onClick={() => navigate('/marketing/pipeline')}
          />
          <StatCard
            title="Atrasados"
            value={stats.overdue}
            icon={AlertTriangle}
            color={stats.overdue > 0 ? "text-red-500" : "text-muted-foreground"}
            onClick={() => navigate('/marketing/pipeline')}
          />
          <StatCard
            title="Aprovados"
            value={stats.approved}
            icon={CheckCircle}
            color="text-emerald-500"
            onClick={() => navigate('/marketing/pipeline')}
          />
          <StatCard
            title="Agendados"
            value={stats.scheduledThisWeek}
            icon={Clock}
            trend="Esta semana"
            color="text-cyan-500"
          />
          <StatCard
            title="Publicados"
            value={stats.publishedThisMonth}
            icon={Instagram}
            trend="Este mês"
            color="text-primary"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* In Production */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-medium text-foreground">Em Produção</h2>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                  {inProductionItems.length} itens ativos
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/marketing/pipeline">
                  Ver pipeline
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
              {inProductionItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Kanban className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Nenhum conteúdo em produção</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link to="/marketing/pipeline">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar conteúdo
                    </Link>
                  </Button>
                </div>
              ) : (
                inProductionItems.map((item) => (
                  <ContentItemCard 
                    key={item.id} 
                    item={item} 
                    onClick={() => handleItemClick(item)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Quick Actions + At Risk */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-medium text-foreground mb-4">Ações Rápidas</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/marketing/ideas">
                    <Lightbulb className="w-4 h-4 mr-3" />
                    Banco de Ideias
                    <span className="ml-auto text-xs text-muted-foreground">{stats.totalIdeas}</span>
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/marketing/campaigns">
                    <Megaphone className="w-4 h-4 mr-3" />
                    Campanhas
                    <span className="ml-auto text-xs text-muted-foreground">{stats.activeCampaigns}</span>
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/marketing/library">
                    <FolderOpen className="w-4 h-4 mr-3" />
                    Biblioteca
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start text-primary">
                  <Sparkles className="w-4 h-4 mr-3" />
                  Gerar com IA
                </Button>
              </div>
            </div>

            {/* At Risk */}
            {overdueItems.length > 0 && (
              <div className="glass-card rounded-2xl p-6 border border-red-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-medium text-foreground">Em Risco</h3>
                </div>
                <div className="space-y-2">
                  {overdueItems.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      className="w-full text-left p-3 rounded-lg bg-red-500/5 hover:bg-red-500/10 transition-colors"
                      onClick={() => handleItemClick(item)}
                    >
                      <p className="text-sm text-foreground truncate">{item.title}</p>
                      <p className="text-[10px] text-red-500 mt-1">
                        Vencido há {Math.floor((new Date().getTime() - new Date(item.due_at!).getTime()) / (1000 * 60 * 60 * 24))} dias
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recently Published */}
            {recentlyPublished.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-medium text-foreground mb-4">Últimos Publicados</h3>
                <div className="space-y-3">
                  {recentlyPublished.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground truncate">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.published_at && new Date(item.published_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      {item.post_url && (
                        <a 
                          href={item.post_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-[10px]"
                        >
                          Ver
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
