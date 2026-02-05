import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { AIChatSnippet } from "@/components/dashboard/AIChatSnippet";
import { ActionsList } from "@/components/dashboard/ActionsList";
import { DollarSign, TrendingUp, Users, Clapperboard, ArrowRight } from "lucide-react";

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

        {/* Section: Main Layout Split */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Left Column: Projects (8 cols) */}
          <div className="xl:col-span-8">
            <div className="glass-card rounded-[2rem] p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Produção Recente</h2>
                <button className="btn-subtle flex items-center gap-2">
                  Ver todos <ArrowRight className="w-4 h-4" />
                </button>
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
