import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { AIChatSnippet } from "@/components/dashboard/AIChatSnippet";
import { ActionsList } from "@/components/dashboard/ActionsList";
import { TimelineForecast30D } from "@/components/timeline/TimelineForecast30D";
import { dashboardMilestones } from "@/data/timelineMockData";
import { DollarSign, TrendingUp, Users, Clapperboard, ArrowRight, Calendar, Zap, Activity, Inbox, Eye, HardDrive } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Mock data for Visual Board
const visualBoardData = {
  columns: [
    { 
      name: 'Roteiro', 
      count: 1, 
      projects: [
        { id: 'SF-102', title: 'Legacy Private', client: 'Banco Legacy', initials: ['B', 'M'], status: 'Ok' }
      ]
    },
    { 
      name: 'Captação', 
      count: 1, 
      projects: [
        { id: 'SF-108', title: 'Tour 360', client: 'Vértice Arq', initials: ['C', 'B'], status: 'Ok' }
      ]
    },
    { 
      name: 'Edição', 
      count: 2, 
      projects: [
        { id: 'SF-092', title: 'Manifesto Matta', client: 'Lugasa Group', initials: ['M', 'V'], status: 'Ok' },
        { id: 'SF-095', title: 'Brand Film Exotic', client: 'Sarto Imóveis', initials: ['V', 'R'], status: 'Em Risco' }
      ]
    },
    { 
      name: 'Review', 
      count: 0, 
      projects: []
    }
  ],
  timeline: [
    { name: 'Manifesto Matta', progress: 85, color: 'bg-primary' },
    { name: 'Brand Film Exotic', progress: 45, color: 'bg-amber-500' },
    { name: 'Legacy Private', progress: 25, color: 'bg-emerald-500' },
    { name: 'Tour 360', progress: 60, color: 'bg-violet-500' }
  ],
  accounts: [
    { id: 'SF-092', client: 'Lugasa Group', title: 'Manifesto Matta', value: 85, phase: 'Edição', health: 94 },
    { id: 'SF-095', client: 'Sarto Imóveis', title: 'Brand Film Exotic', value: 45, phase: 'Edição', health: 68 },
    { id: 'SF-102', client: 'Banco Legacy', title: 'Legacy Private', value: 120, phase: 'Roteiro', health: 98 },
    { id: 'SF-108', client: 'Vértice Arq', title: 'Tour 360', value: 32, phase: 'Captação', health: 82 }
  ]
};

export default function Dashboard() {
  const metrics = [
    { label: "Receita do Mês", value: "R$ 421.5k", trend: "+23%", trendUp: true, icon: DollarSign },
    { label: "Pipeline Ativo", value: "R$ 1.2M", trend: "+8%", trendUp: true, icon: TrendingUp },
    { label: "Novos Leads", value: "42", trend: "+12%", trendUp: true, icon: Users },
    { label: "Projetos Ativos", value: "8", trend: "2 atrasados", trendUp: false, icon: Clapperboard },
  ];

  const projects = [
    {
      title: "Campanha BMW",
      client: "BMW Brasil",
      status: "Em Produção",
      image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&h=600&fit=crop",
      date: "Entrega: 15 Mar",
    },
    {
      title: "Vídeo Manifesto",
      client: "Reserva",
      status: "Pós-Produção",
      image: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&h=600&fit=crop",
      date: "Entrega: 22 Mar",
    },
  ];

  const getStatusBadge = (status: string) => {
    if (status === 'Ok') {
      return <span className="text-[8px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Ok</span>;
    }
    return <span className="text-[8px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">Em Risco</span>;
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-emerald-500';
    if (health >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-10 animate-fade-in">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold uppercase tracking-tighter text-foreground">
              Visão <span className="squad-logo-text font-normal text-muted-foreground">Geral</span>
            </h1>
          </div>
          
          <div className="glass-card px-6 py-4 rounded-2xl flex items-center gap-4">
            <span className="material-symbols-outlined text-primary">calendar_today</span>
            <div>
              <p className="text-[9px] text-muted-foreground font-black uppercase">Data Atual</p>
              <p className="text-xs text-foreground font-bold">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Section: Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, idx) => (
            <MetricCard
              key={idx}
              label={metric.label}
              value={metric.value}
              trend={metric.trend}
              trendUp={metric.trendUp}
              icon={metric.icon}
            />
          ))}
        </div>

        {/* Timeline Forecast 30D */}
        <TimelineForecast30D milestones={dashboardMilestones} />

        {/* Visual Board Section - PROJETOS */}
        <div className="glass-card rounded-[2rem] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">Visual Board</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Controle de Fluxo Operacional</p>
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
            {visualBoardData.columns.map((column) => (
              <div key={column.name} className="bg-muted/30 rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{column.name}</span>
                  <span className="text-[10px] font-bold text-foreground bg-background/50 px-2 py-0.5 rounded-full">{column.count}</span>
                </div>
                <div className="space-y-2">
                  {column.projects.length > 0 ? (
                    column.projects.map((proj) => (
                      <Link key={proj.id} to={`/projetos/${proj.id}`} className="block">
                        <div className="bg-background/50 rounded-lg p-2.5 border border-border/50 hover:border-primary/30 transition-colors">
                          <p className="text-[10px] font-bold text-foreground truncate">{proj.title}</p>
                          <p className="text-[8px] text-muted-foreground truncate">{proj.client}</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex -space-x-1">
                              {proj.initials.map((initial, idx) => (
                                <div key={idx} className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary border border-background">
                                  {initial}
                                </div>
                              ))}
                            </div>
                            {getStatusBadge(proj.status)}
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="flex items-center justify-center py-4 text-muted-foreground">
                      <Inbox className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Timeline 30D & Capacity Monitor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Timeline 30D */}
            <div className="bg-muted/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Timeline Janela 30D</span>
              </div>
              <p className="text-[8px] text-primary font-bold uppercase tracking-widest mb-3">SQUAD ENGINE</p>
              <div className="space-y-2">
                {visualBoardData.timeline.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-foreground font-medium truncate pr-2">{item.name}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Capacity Monitor */}
            <div className="bg-muted/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Capacity Monitor</span>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 text-primary" />
                      <span className="text-[10px] text-foreground font-medium">Workload Editores</span>
                    </div>
                    <span className="text-[10px] font-bold text-primary">92%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '92%' }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-3 h-3 text-violet-500" />
                      <span className="text-[10px] text-foreground font-medium">Cloud Storage 10Gbps</span>
                    </div>
                    <span className="text-[10px] font-bold text-violet-500">78%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: '78%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="glass-card rounded-xl p-4 border-l-2 border-emerald-500">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-[8px] font-bold text-emerald-500 uppercase">+24.5%</span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-1">Pipeline Ativo</p>
            <p className="text-lg font-bold text-foreground">R$ 1.2M</p>
          </div>

          <div className="glass-card rounded-xl p-4 border-l-2 border-primary">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-[8px] font-bold text-primary uppercase">92% On-time</span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-1">Projetos em Workflow</p>
            <p className="text-lg font-bold text-foreground">18</p>
          </div>

          <div className="glass-card rounded-xl p-4 border-l-2 border-amber-500">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-[8px] font-bold text-amber-500 uppercase">High Perf</span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-1">Eficiência Squad</p>
            <p className="text-lg font-bold text-foreground">98%</p>
          </div>

          <div className="glass-card rounded-xl p-4 border-l-2 border-violet-500">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-violet-500" />
              <span className="text-[8px] font-bold text-violet-500 uppercase">Financial OK</span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-1">Margem Líquida</p>
            <p className="text-lg font-bold text-foreground">34.2%</p>
          </div>
        </div>

        {/* Visão de Contas - Financeiro */}
        <div className="glass-card rounded-[2rem] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Visão de Contas</h3>
              <p className="text-[10px] text-muted-foreground">Financeiro</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {visualBoardData.accounts.map((account) => (
              <Link key={account.id} to={`/projetos/${account.id}`}>
                <div className="bg-muted/20 rounded-xl p-4 hover:bg-muted/30 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-bold text-primary">{account.client}</span>
                    <span className="text-[8px] text-muted-foreground">{account.id}</span>
                  </div>
                  <p className="text-xs font-bold text-foreground mb-3 truncate">{account.title}</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[8px] text-muted-foreground uppercase">Valor</p>
                      <p className="text-[10px] font-bold text-foreground">R$ {account.value}k</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-muted-foreground uppercase">Fase</p>
                      <p className="text-[10px] font-bold text-foreground">{account.phase}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-muted-foreground uppercase">Saúde</p>
                      <p className={`text-[10px] font-bold ${getHealthColor(account.health)}`}>{account.health}%</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Section: Main Layout Split */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Left Column: Projects (8 cols) */}
          <div className="xl:col-span-8">
            <div className="glass-card rounded-[2rem] p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Projetos Recentes</h2>
                <Link to="/projetos">
                  <button className="btn-subtle flex items-center gap-2">
                    Ver todos <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((project, idx) => (
                  <ProjectCard
                    key={idx}
                    title={project.title}
                    client={project.client}
                    status={project.status}
                    image={project.image}
                    date={project.date}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AI & Actions (4 cols) */}
          <div className="xl:col-span-4 space-y-6">
            <AIChatSnippet />
            <ActionsList />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
