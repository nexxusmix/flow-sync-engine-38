import { formatCurrencyBRL } from "@/utils/format";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import { MetricCard } from "@/components/dashboard/MetricCard";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { ProjectQuickAccessGrid } from "@/components/dashboard/ProjectQuickAccessGrid";
import { ActionHubRail } from "@/components/action-hub/ActionHubRail";
import { ActionHubOverviewCard } from "@/components/action-hub/ActionHubOverviewCard";
import { TimelineForecast30D } from "@/components/timeline/TimelineForecast30D";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingDialog } from "@/components/onboarding/OnboardingDialog";
import { DollarSign, TrendingUp, Users, Clapperboard, ArrowRight, Calendar, Zap, Activity, Inbox, Eye, HardDrive, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import squadLogo from "@/assets/squad-hub-logo.png";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { isLoading: authLoading, user } = useAuth();
  const { data, isLoading: dataLoading } = useDashboardMetrics();
  const { shouldShow, dismiss } = useOnboarding();
  
  // Loading during auth check or data fetch (hooks handle user existence internally)
  const isLoading = authLoading || dataLoading;
  
  const metrics = data?.metrics;
  const projectsByStage = data?.projectsByStage || [];
  const timeline30Days = data?.timeline30Days || [];
  const recentProjects = data?.recentProjects || [];

  // Transform timeline events to milestones format - map event types to MilestoneType
  const typeMap: Record<string, 'delivery' | 'review' | 'payment' | 'internal' | 'start' | 'end'> = {
    deadline: 'delivery',
    delivery: 'delivery', 
    meeting: 'internal',
    milestone: 'start',
    task: 'internal',
  };
  
  const timelineMilestones = timeline30Days.map(event => ({
    id: event.id,
    title: event.title,
    date: event.date,
    type: typeMap[event.type] || 'internal',
    severity: event.severity,
    projectId: event.project_id || '',
    projectName: undefined,
  }));

  const metricCards = [
    { 
      label: "Receita do Mês", 
      value: formatCurrencyBRL(metrics?.monthlyRevenue || 0), 
      trend: metrics?.pendingPayments ? `${formatCurrencyBRL(metrics.pendingPayments)} pendente` : "Ok", 
      trendUp: !metrics?.pendingPayments, 
      icon: DollarSign 
    },
    { 
      label: "Pipeline Ativo", 
      value: formatCurrencyBRL(metrics?.totalPipelineValue || 0), 
      trend: `Forecast: ${formatCurrencyBRL(metrics?.forecast || 0)}`, 
      trendUp: true, 
      icon: TrendingUp 
    },
    { 
      label: "Deals Ativos", 
      value: String(metrics?.totalDeals || 0), 
      trend: metrics?.dealsByStage ? `${metrics.dealsByStage['fechado']?.count || 0} fechados` : "0 fechados", 
      trendUp: true, 
      icon: Users 
    },
    { 
      label: "Projetos Ativos", 
      value: String(metrics?.totalProjectsActive || 0), 
      trend: metrics?.projectsAtRisk ? `${metrics.projectsAtRisk} em risco` : "Ok", 
      trendUp: !metrics?.projectsAtRisk, 
      icon: Clapperboard 
    },
  ];

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <span className="text-[8px] font-normal text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wide">Ok</span>;
    }
    return <span className="text-[8px] font-normal text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wide">Em Risco</span>;
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-emerald-500';
    if (health >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  // Get only stages with projects for visual board
  const activeStages = projectsByStage.filter(stage => stage.count > 0).slice(0, 4);
  // If less than 4, pad with empty stages
  const displayStages = activeStages.length < 4 
    ? [...activeStages, ...projectsByStage.filter(s => s.count === 0).slice(0, 4 - activeStages.length)]
    : activeStages;

  // Show loading only when actually fetching data
  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <OnboardingDialog open={shouldShow} onClose={dismiss} />
      
      <div className="space-y-10 max-w-[1600px] 2xl:max-w-[1800px] mx-auto">
        {/* Header Title */}
        <motion.div 
          className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6"
          initial={{ opacity: 0, y: -20, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, type: "spring", stiffness: 80 }}
        >
          <motion.div 
            className="flex items-center gap-4"
            whileHover={{ scale: 1.02 }}
          >
            <motion.img 
              src={squadLogo} 
              alt="SQUAD Hub" 
              className="w-10 h-10 object-contain"
              initial={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ type: "spring" as const, stiffness: 150, damping: 15, delay: 0.1 }}
            />
            <motion.h1 
              className="text-4xl md:text-6xl font-normal uppercase tracking-tighter text-foreground"
              initial={{ opacity: 0, x: -20, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            >
              Over<span className="squad-logo-text font-light text-muted-foreground">view</span>
            </motion.h1>
          </motion.div>
          
          <motion.div 
            className="glass-card px-6 py-4 rounded-2xl flex items-center gap-4 flex-shrink-0"
            initial={{ opacity: 0, x: 30, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
            whileHover={{ scale: 1.02 }}
            
          >
            <motion.span 
              className="material-symbols-outlined text-primary"
              initial={{ opacity: 0, scale: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ delay: 0.5 }}
            >
              calendar_today
            </motion.span>
            <div>
              <motion.p 
                className="text-[9px] text-muted-foreground font-light uppercase"
                initial={{ opacity: 0, filter: "blur(3px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ delay: 0.5 }}
              >
                Data Atual
              </motion.p>
              <motion.p 
                className="text-xs text-foreground font-normal"
                initial={{ opacity: 0, filter: "blur(3px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ delay: 0.55 }}
              >
                {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
              </motion.p>
            </div>
          </motion.div>
        </motion.div>

        {/* Section: Metrics */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.25 }}
        >
          {metricCards.map((metric, idx) => (
            <MetricCard
              key={idx}
              label={metric.label}
              value={metric.value}
              trend={metric.trend}
              trendUp={metric.trendUp}
              icon={metric.icon}
              index={idx}
            />
          ))}
        </motion.div>

        {/* Projetos Ativos - Quick Access */}
        <ProjectQuickAccessGrid projects={recentProjects} isLoading={isLoading} />

        {/* Timeline Forecast 30D */}
        <TimelineForecast30D milestones={timelineMilestones} />

        {/* Visual Board Section - PROJETOS */}
        <motion.div 
          className="glass-card rounded-[2rem] p-6 min-h-[400px]"
          initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.35, type: "spring", stiffness: 70, damping: 18 }}
          
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-normal text-foreground">Visual Board</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-light">Controle de Fluxo Operacional</p>
            </div>
            <Link to="/projetos">
              <Button variant="ghost" size="sm" className="text-xs text-primary">
                <Eye className="w-3 h-3 mr-1" />
                Ver Tudo
              </Button>
            </Link>
          </div>
          
          {/* Mini Kanban */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {displayStages.map((stage) => (
              <div key={stage.stage} className="bg-muted/30 rounded-xl p-3 min-h-[140px]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wide">{stage.stageName}</span>
                  <span className="text-[10px] font-normal text-foreground bg-background/50 px-2 py-0.5 rounded-full">{stage.count}</span>
                </div>
                <div className="space-y-2">
                  {stage.projects.length > 0 ? (
                    stage.projects.slice(0, 2).map((proj) => (
                      <Link key={proj.id} to={`/projetos/${proj.id}`} className="block">
                        <div className="bg-background/50 rounded-lg p-2.5 border border-border/50 hover:border-primary/30 transition-colors">
                          <p className="text-[10px] font-normal text-foreground truncate">{proj.name}</p>
                          <p className="text-[8px] text-muted-foreground truncate">{proj.client_name}</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex -space-x-1">
                              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-normal text-primary border border-background">
                                {proj.owner_name?.charAt(0) || 'S'}
                              </div>
                            </div>
                            {getStatusBadge(proj.status)}
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/50">
                      <Inbox className="w-5 h-5 mb-2" />
                      <span className="text-[9px] font-light">Sem projetos</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Timeline 30D & Capacity Monitor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Timeline 30D */}
            <div className="bg-muted/20 rounded-xl p-4 min-h-[180px]">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wide">Timeline Janela 30D</span>
              </div>
              <p className="text-[8px] text-primary font-normal uppercase tracking-widest mb-3">SQUAD ENGINE</p>
              <div className="space-y-2">
                {recentProjects.length > 0 ? (
                  recentProjects.slice(0, 4).map((project) => {
                    const progress = Math.min(100, Math.max(0, project.health_score));
                    const color = progress >= 80 ? 'bg-primary' : progress >= 60 ? 'bg-amber-500' : 'bg-red-500';
                    return (
                      <div key={project.id} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-foreground font-light truncate pr-2">{project.name}</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/50">
                    <Calendar className="w-5 h-5 mb-2" />
                    <span className="text-[9px] font-light">Sem projetos ativos</span>
                  </div>
                )}
              </div>
            </div>

            {/* Capacity Monitor */}
            <div className="bg-muted/20 rounded-xl p-4 min-h-[180px]">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wide">Capacity Monitor</span>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 text-primary" />
                      <span className="text-[10px] text-foreground font-light">Projetos Ativos</span>
                    </div>
                    <span className="text-[10px] font-normal text-primary">{metrics?.totalProjectsActive || 0}</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (metrics?.totalProjectsActive || 0) * 10)}%` }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-3 h-3 text-violet-500" />
                      <span className="text-[10px] text-foreground font-light">Eventos Próx. 30D</span>
                    </div>
                    <span className="text-[10px] font-normal text-violet-500">{metrics?.eventsNext30Days || 0}</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.min(100, (metrics?.eventsNext30Days || 0) * 5)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics Row */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.45 }}
        >
          <div className="glass-card rounded-xl p-4 border-l-2 border-emerald-500 min-h-[100px]">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-[8px] font-normal text-emerald-500 uppercase">Pipeline</span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-1 font-light">Pipeline Ativo</p>
            <p className="text-lg font-normal text-foreground">{formatCurrencyBRL(metrics?.totalPipelineValue || 0)}</p>
          </div>

          <div className="glass-card rounded-xl p-4 border-l-2 border-primary min-h-[100px]">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-[8px] font-normal text-primary uppercase">{metrics?.projectsAtRisk || 0} em risco</span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-1 font-light">Projetos em Workflow</p>
            <p className="text-lg font-normal text-foreground">{metrics?.totalProjectsActive || 0}</p>
          </div>

          <div className="glass-card rounded-xl p-4 border-l-2 border-amber-500 min-h-[100px]">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-[8px] font-normal text-amber-500 uppercase">Deadlines</span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-1 font-light">Próximas Entregas</p>
            <p className="text-lg font-normal text-foreground">{metrics?.upcomingDeadlines || 0}</p>
          </div>

          <div className="glass-card rounded-xl p-4 border-l-2 border-violet-500 min-h-[100px]">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-violet-500" />
              <span className="text-[8px] font-normal text-violet-500 uppercase">Faturamento</span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-1 font-light">Projetos Ativos</p>
            <p className="text-lg font-normal text-foreground">{metrics?.totalProjectsActive || 0}</p>
          </div>
        </motion.div>

        {/* Visão de Contas - Financeiro */}
        <motion.div 
          className="glass-card rounded-[2rem] p-6 min-h-[250px]"
          initial={{ opacity: 0, y: 25, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.5, type: "spring", stiffness: 70, damping: 18 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-normal text-foreground">Visão de Contas</h3>
              <p className="text-[10px] text-muted-foreground font-light">Financeiro</p>
            </div>
          </div>
          
          {recentProjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {recentProjects.slice(0, 4).map((project) => (
                <Link key={project.id} to={`/projetos/${project.id}`}>
                  <div className="bg-muted/20 rounded-xl p-4 hover:bg-muted/30 transition-colors cursor-pointer min-h-[120px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-normal text-primary">{project.client_name}</span>
                      <span className="text-[8px] text-muted-foreground">{project.stage_current}</span>
                    </div>
                    <p className="text-xs font-normal text-foreground mb-3 truncate">{project.name}</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[8px] text-muted-foreground uppercase font-light">Valor</p>
                        <p className="text-[10px] font-normal text-foreground truncate">{formatCurrencyBRL(project.contract_value || 0)}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-muted-foreground uppercase font-light">Fase</p>
                        <p className="text-[10px] font-normal text-foreground">{project.stage_current}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-muted-foreground uppercase font-light">Saúde</p>
                        <p className={`text-[10px] font-normal ${getHealthColor(project.health_score)}`}>{project.health_score}%</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50">
              <DollarSign className="w-8 h-8 mb-3" />
              <p className="text-sm font-light">Nenhuma conta ativa</p>
              <p className="text-xs text-muted-foreground/40 mt-1">Contas aparecerão quando houver projetos</p>
            </div>
          )}
        </motion.div>

        {/* Action Hub Rail - Horizontal Section */}
        <ActionHubRail />

        {/* Section: Main Layout Split */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Left Column: Projects (8 cols) */}
          <div className="xl:col-span-8">
            <div className="glass-card rounded-[2rem] p-6 min-h-[350px]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-normal text-foreground">Projetos Recentes</h2>
                <Link to="/projetos">
                  <button className="btn-subtle flex items-center gap-2">
                    Ver todos <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
              {recentProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recentProjects.slice(0, 4).map((project, idx) => (
                    <ProjectCard
                      key={project.id}
                      title={project.name}
                      client={project.client_name}
                      status={project.status === 'active' ? 'Em Produção' : project.status === 'paused' ? 'Em Pausa' : project.status === 'completed' ? 'Concluído' : 'Arquivado'}
                      image={project.cover_image_url || project.logo_url || undefined}
                      date={`Saúde: ${project.health_score}%`}
                      index={idx}
                      projectId={project.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50">
                  <Clapperboard className="w-10 h-10 mb-3" />
                  <p className="text-sm font-light">Nenhum projeto recente</p>
                  <p className="text-xs text-muted-foreground/40 mt-1">Projetos aparecerão aqui</p>
                  <Link to="/projetos">
                    <Button className="mt-4" size="sm">
                      Criar Primeiro Projeto
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Overview Card (4 cols) */}
          <div className="xl:col-span-4 space-y-6">
            <ActionHubOverviewCard />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
