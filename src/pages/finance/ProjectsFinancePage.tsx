import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useFinancialStore } from "@/stores/financialStore";
import { useRealtimeTable } from "@/hooks/useRealtimeSync";
import { useUrlState } from "@/hooks/useUrlState";
import { usePersistedState, useScrollPersistence } from "@/hooks/usePersistedState";
import { FINANCIAL_STATUS_CONFIG } from "@/types/financial";
import { ProjectActionsMenu } from "@/components/projects/ProjectActionsMenu";
import { ProjectFinanceDetailPanel } from "@/components/finance/ProjectFinanceDetailPanel";
import { 
  Search, AlertTriangle, CheckCircle, AlertCircle,
  TrendingUp, FileText
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function ProjectsFinancePage() {
  const { 
    fetchRevenues, 
    fetchExpenses,
    fetchContracts,
    getProjectFinancials,
    getRevenuesByProject,
    getExpensesByProject,
    getContractByProject,
  } = useFinancialStore();

  // URL-persisted search and selection
  const [search, setSearch] = useUrlState('search', '');
  const [selectedProject, setSelectedProject] = useUrlState('project', '');
  
  // Scroll persistence
  useScrollPersistence('finance-projects');

  // Fetch data on mount
  useEffect(() => {
    fetchRevenues();
    fetchExpenses();
    fetchContracts();
  }, []);

  // Realtime sync - refetch when data changes
  const handleRevenueChange = useCallback(() => {
    fetchRevenues();
  }, [fetchRevenues]);

  const handleExpenseChange = useCallback(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleContractChange = useCallback(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Include payment_milestones as part of contract changes
  const handleMilestoneChange = useCallback(() => {
    fetchContracts(); // Milestones are loaded with contracts
  }, [fetchContracts]);

  useRealtimeTable('revenues', handleRevenueChange, handleRevenueChange, handleRevenueChange);
  useRealtimeTable('expenses', handleExpenseChange, handleExpenseChange, handleExpenseChange);
  useRealtimeTable('contracts', handleContractChange, handleContractChange, handleContractChange);
  useRealtimeTable('payment_milestones' as any, handleMilestoneChange, handleMilestoneChange, handleMilestoneChange);

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
    contract: selectedProject ? getContractByProject(selectedProject) : null,
    revenues: selectedProject ? getRevenuesByProject(selectedProject) : [],
    expenses: selectedProject ? getExpensesByProject(selectedProject) : [],
  } : null;

  const handleRefresh = useCallback(() => {
    fetchRevenues();
    fetchExpenses();
    fetchContracts();
  }, [fetchRevenues, fetchExpenses, fetchContracts]);

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
              const contract = getContractByProject(project.project_id);
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
                        project.status === 'blocked' ? 'bg-destructive/10' : 'bg-amber-500/10'
                      }`}>
                        <Icon className={`w-5 h-5 ${statusConfig.textColor}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">{project.project_name}</h3>
                          {contract ? (
                            <FileText className="w-3 h-3 text-primary" />
                          ) : (
                            <Badge variant="outline" className="text-[10px] py-0 px-1 text-amber-500 border-amber-500/50">
                              Sem contrato
                            </Badge>
                          )}
                        </div>
                        {project.client_name && (
                          <p className="text-xs text-muted-foreground">{project.client_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${statusConfig.color} text-white`}>
                        {statusConfig.label}
                      </Badge>
                      <ProjectActionsMenu
                        projectId={project.project_id}
                        projectName={project.project_name}
                        projectStatus={project.has_overdue ? 'blocked' : 'active'}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Contratado</p>
                      <p className="text-sm font-medium text-foreground">{formatCurrency(project.contracted_value)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Recebido</p>
                      <p className="text-sm font-medium text-emerald-600">{formatCurrency(project.received)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">A receber</p>
                      <p className="text-sm font-medium text-amber-600">{formatCurrency(project.pending)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Despesas</p>
                      <p className="text-sm font-medium text-destructive">{formatCurrency(project.expenses)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Progress value={progress} className="flex-1 h-1.5" />
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {progress.toFixed(0)}%
                    </span>
                  </div>

                  {project.has_overdue && (
                    <div className="mt-3 p-2 rounded-lg bg-destructive/10 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <span className="text-xs text-destructive font-medium">
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
              <ProjectFinanceDetailPanel
                project={selectedProjectData.project}
                contract={selectedProjectData.contract}
                revenues={selectedProjectData.revenues}
                expenses={selectedProjectData.expenses}
                onRefresh={handleRefresh}
              />
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
