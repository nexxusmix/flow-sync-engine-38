import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useFinancialStore } from "@/stores/financialStore";
import { FINANCIAL_STATUS_CONFIG } from "@/types/financial";
import { useNavigate } from "react-router-dom";
import { 
  Search, AlertTriangle, CheckCircle, AlertCircle,
  TrendingUp, TrendingDown, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

export default function ProjectsFinancePage() {
  const navigate = useNavigate();
  const { 
    fetchRevenues, 
    fetchExpenses,
    fetchContracts,
    getProjectFinancials,
    getRevenuesByProject,
    getExpensesByProject,
  } = useFinancialStore();

  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    fetchRevenues();
    fetchExpenses();
    fetchContracts();
  }, []);

  const projectFinancials = getProjectFinancials();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
    }).format(value);
  };

  const filteredProjects = projectFinancials.filter(p => {
    if (search && !p.project_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectedProjectData = selectedProject ? {
    project: projectFinancials.find(p => p.project_id === selectedProject),
    revenues: getRevenuesByProject(selectedProject),
    expenses: getExpensesByProject(selectedProject),
  } : null;

  const StatusIcon = {
    ok: CheckCircle,
    attention: AlertCircle,
    blocked: AlertTriangle,
  };

  return (
    <DashboardLayout title="Financeiro por Projeto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-medium text-foreground tracking-tight">Financeiro por Projeto</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {projectFinancials.length} projetos com movimentação financeira
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar projetos..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects List */}
          <div className="lg:col-span-2 space-y-3">
            {filteredProjects.map((project) => {
              const statusConfig = FINANCIAL_STATUS_CONFIG[project.status];
              const Icon = StatusIcon[project.status];
              const progress = project.contracted_value > 0 
                ? (project.received / project.contracted_value) * 100 
                : 0;

              return (
                <Card 
                  key={project.project_id}
                  className={`glass-card p-4 cursor-pointer hover:border-primary/30 transition-all ${
                    selectedProject === project.project_id ? 'border-primary' : ''
                  }`}
                  onClick={() => setSelectedProject(project.project_id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        project.status === 'ok' ? 'bg-emerald-500/10' :
                        project.status === 'blocked' ? 'bg-red-500/10' : 'bg-amber-500/10'
                      }`}>
                        <Icon className={`w-5 h-5 ${statusConfig.textColor}`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{project.project_name}</h3>
                        {project.client_name && (
                          <p className="text-xs text-muted-foreground">{project.client_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${statusConfig.color} text-white`}>
                        {statusConfig.label}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Contratado</p>
                      <p className="text-sm font-medium text-foreground">{formatCurrency(project.contracted_value)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Recebido</p>
                      <p className="text-sm font-medium text-emerald-500">{formatCurrency(project.received)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">A receber</p>
                      <p className="text-sm font-medium text-amber-500">{formatCurrency(project.pending)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Despesas</p>
                      <p className="text-sm font-medium text-red-500">{formatCurrency(project.expenses)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Progress value={progress} className="flex-1 h-1.5" />
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {progress.toFixed(0)}%
                    </span>
                  </div>

                  {project.has_overdue && (
                    <div className="mt-3 p-2 rounded-lg bg-red-500/10 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-xs text-red-500 font-medium">
                        Pagamento vencido - Projeto bloqueado
                      </span>
                    </div>
                  )}
                </Card>
              );
            })}

            {filteredProjects.length === 0 && (
              <Card className="glass-card p-12 text-center text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum projeto com movimentação financeira</p>
              </Card>
            )}
          </div>

          {/* Project Detail */}
          <div>
            {selectedProjectData?.project ? (
              <Card className="glass-card p-6 sticky top-6">
                <h3 className="font-medium text-foreground mb-4">
                  {selectedProjectData.project.project_name}
                </h3>

                {/* Summary */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Valor contratado</span>
                    <span className="font-medium">{formatCurrency(selectedProjectData.project.contracted_value)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Total recebido</span>
                    <span className="font-medium text-emerald-500">{formatCurrency(selectedProjectData.project.received)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">A receber</span>
                    <span className="font-medium text-amber-500">{formatCurrency(selectedProjectData.project.pending)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Despesas</span>
                    <span className="font-medium text-red-500">{formatCurrency(selectedProjectData.project.expenses)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-foreground">Lucro</span>
                    <span className={`font-semibold ${selectedProjectData.project.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {formatCurrency(selectedProjectData.project.profit)}
                    </span>
                  </div>
                </div>

                {/* Revenues */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Receitas ({selectedProjectData.revenues.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedProjectData.revenues.map(r => (
                      <div key={r.id} className="flex justify-between items-center text-sm p-2 rounded bg-muted/30">
                        <span className="text-muted-foreground truncate mr-2">{r.description}</span>
                        <span className={r.status === 'received' ? 'text-emerald-500' : 'text-amber-500'}>
                          {formatCurrency(Number(r.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expenses */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    Despesas ({selectedProjectData.expenses.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedProjectData.expenses.map(e => (
                      <div key={e.id} className="flex justify-between items-center text-sm p-2 rounded bg-muted/30">
                        <span className="text-muted-foreground truncate mr-2">{e.description}</span>
                        <span className="text-red-500">
                          {formatCurrency(Number(e.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="glass-card p-6 text-center text-muted-foreground">
                <p className="text-sm">Selecione um projeto para ver detalhes</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
