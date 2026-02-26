import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  BarChart3, TrendingUp, Settings, Users, DollarSign,
  Megaphone, FolderKanban, UserCheck, ArrowRight, Target
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const reportTypes = [
  {
    id: 'owner',
    title: 'Visão do Dono',
    description: 'Relatório executivo diário com métricas críticas, riscos e próximas ações',
    icon: BarChart3,
    path: '/relatorios/dono',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    id: '360',
    title: 'Relatório 360°',
    description: 'Visão consolidada: projetos entregues, abertos, atrasados e percentuais por período',
    icon: Target,
    path: '/relatorios/360',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    id: 'sales',
    title: 'Vendas',
    description: 'Funil de vendas, conversões, propostas e motivos de perda',
    icon: TrendingUp,
    path: '/relatorios/vendas',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    id: 'ops',
    title: 'Operação',
    description: 'Projetos por etapa, atrasos, revisões, aprovações e gargalos',
    icon: Settings,
    path: '/relatorios/operacao',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'finance',
    title: 'Financeiro',
    description: 'Receitas, despesas, forecast 30/60/90 e inadimplência',
    icon: DollarSign,
    path: '/relatorios/financeiro',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    id: 'marketing',
    title: 'Marketing',
    description: 'Produção de conteúdo, publicações, campanhas e backlog',
    icon: Megaphone,
    path: '/relatorios/marketing',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
  {
    id: 'projects',
    title: 'Projetos',
    description: 'Visão geral de todos os projetos com drill-down',
    icon: FolderKanban,
    path: '/relatorios/projetos',
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
  },
  {
    id: 'clients',
    title: 'Clientes',
    description: 'Relatório por cliente para reduzir ansiedade e cobrança',
    icon: UserCheck,
    path: '/relatorios/clientes',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  {
    id: 'crm',
    title: 'CRM / Pipeline',
    description: 'Funil de deals, lead scoring, temperatura e conversão',
    icon: TrendingUp,
    path: '/relatorios/crm',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
  },
];

export default function ReportsDashboard() {
  const navigate = useNavigate();

  return (
    <DashboardLayout title="Relatórios">
      <div className="space-y-8 max-w-[1600px] 2xl:max-w-[1800px] mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-light text-foreground tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground mt-2">
            Dashboards e relatórios analíticos com dados reais do sistema
          </p>
        </div>

        {/* Quick Access - Owner Daily */}
        <Card 
          className="glass-card p-6 cursor-pointer hover:border-primary/30 transition-all group"
          onClick={() => navigate('/relatorios/dono')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-foreground">Visão do Dono</h2>
                <p className="text-sm text-muted-foreground">
                  Enxergue o negócio em 2 minutos. Métricas críticas, riscos e ações do dia.
                </p>
              </div>
            </div>
            <Button variant="ghost" className="group-hover:bg-primary/10">
              Abrir
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>

        {/* Report Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {reportTypes.slice(1).map((report) => {
            const Icon = report.icon;
            return (
              <Card
                key={report.id}
                className="glass-card p-5 cursor-pointer hover:border-primary/20 transition-all group"
                onClick={() => navigate(report.path)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${report.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${report.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {report.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {report.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
