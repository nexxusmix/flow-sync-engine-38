import { useState } from 'react';
import { Contract, ProjectFinancialSummary, Revenue, Expense, ContractStatus } from '@/types/financial';
import { useFinancialStore } from '@/stores/financialStore';
import { MilestonesList } from './MilestonesList';
import { ProjectContractModal } from './ProjectContractModal';
import { ContractAiUploadDialog } from './ContractAiUploadDialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  FileText, TrendingUp, TrendingDown, Plus, Edit2, 
  CheckCircle, AlertTriangle, Sparkles, RefreshCw, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ProjectFinanceDetailPanelProps {
  project: ProjectFinancialSummary;
  contract: Contract | undefined;
  revenues: Revenue[];
  expenses: Expense[];
  onRefresh: () => void;
}

const CONTRACT_STATUS_CONFIG: Record<ContractStatus, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-muted text-muted-foreground' },
  active: { label: 'Ativo', color: 'bg-primary text-primary-foreground' },
  completed: { label: 'Finalizado', color: 'bg-emerald-500 text-white' },
  cancelled: { label: 'Cancelado', color: 'bg-destructive text-destructive-foreground' },
};

export function ProjectFinanceDetailPanel({
  project,
  contract,
  revenues,
  expenses,
  onRefresh,
}: ProjectFinanceDetailPanelProps) {
  const { finalizeContract, fetchContracts } = useFinancialStore();
  
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [isAiUploadOpen, setIsAiUploadOpen] = useState(false);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isSyncingFinance, setIsSyncingFinance] = useState(false);

  const handleSyncFinance = async () => {
    setIsSyncingFinance(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-project-finances`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            project_id: project.project_id,
            contract_id: contract?.id,
            force_regenerate: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data?.error || "Erro ao sincronizar financeiro");
      } else {
        toast.success(data?.message || "Financeiro atualizado com IA!");
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar atualização financeira");
    } finally {
      setIsSyncingFinance(false);
    }
  };

  const handleGenerateContractText = async () => {
    if (!contract) return;
    setIsGeneratingText(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-contract-text`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ contract_id: contract.id }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data?.error || "Erro ao gerar texto jurídico");
      } else {
        toast.success(data?.message || "Texto jurídico gerado com IA!");
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar texto do contrato");
    } finally {
      setIsGeneratingText(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
    }).format(value);
  };

  const handleFinalizeContract = async () => {
    if (!contract) return;
    
    try {
      await finalizeContract(contract.id);
      toast.success('Contrato finalizado');
      setShowFinalizeDialog(false);
      onRefresh();
    } catch (error) {
      toast.error('Erro ao finalizar contrato');
    }
  };

  const handleRefresh = async () => {
    // Refetch all financial data to ensure consistency
    await fetchContracts();
    onRefresh();
  };

  const milestones = contract?.milestones || [];
  const paidMilestones = milestones.filter(m => m.status === 'paid').length;
  const contractProgress = milestones.length > 0 
    ? Math.round((paidMilestones / milestones.length) * 100) 
    : 0;

  return (
    <Card className="glass-card p-6 sticky top-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="font-medium text-foreground">{project.project_name}</h3>
        {project.client_name && (
          <p className="text-sm text-muted-foreground">{project.client_name}</p>
        )}
      </div>

      {/* Contract Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Contrato
          </h4>
          {contract ? (
            <Badge className={CONTRACT_STATUS_CONFIG[contract.status].color}>
              {CONTRACT_STATUS_CONFIG[contract.status].label}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-500 border-amber-500">
              Sem contrato
            </Badge>
          )}
        </div>

        {contract ? (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">Valor do contrato</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(Number(contract.total_value))}
                </span>
              </div>
              {contract.payment_terms && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-muted-foreground">Condições</span>
                  <span className="text-sm text-foreground">{contract.payment_terms}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Progresso</span>
                <span className="text-sm text-foreground">{contractProgress}%</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => setIsContractModalOpen(true)}
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Editar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={handleSyncFinance}
                disabled={isSyncingFinance}
              >
                {isSyncingFinance ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3 mr-1" />
                )}
                {isSyncingFinance ? "Processando..." : "Atualizar com IA"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={handleGenerateContractText}
                disabled={isGeneratingText}
              >
                {isGeneratingText ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 mr-1" />
                )}
                {isGeneratingText ? "Gerando texto jurídico..." : "Gerar Texto Jurídico com IA"}
              </Button>
              {contract.status === 'active' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowFinalizeDialog(true)}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Finalizar
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => setIsContractModalOpen(true)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Criar
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => setIsAiUploadOpen(true)}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Criar com IA
            </Button>
          </div>
        )}
      </div>

      <Separator className="my-4" />

      {/* Milestones Section */}
      {contract && (
        <>
          <MilestonesList
            contractId={contract.id}
            milestones={milestones}
            onRefresh={handleRefresh}
          />
          <Separator className="my-4" />
        </>
      )}

      {/* Summary */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-medium text-foreground">Resumo Financeiro</h4>
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Valor contratado</span>
          <span className="font-medium">{formatCurrency(project.contracted_value)}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Total recebido</span>
          <span className="font-medium text-emerald-600">{formatCurrency(project.received)}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">A receber</span>
          <span className="font-medium text-amber-600">{formatCurrency(project.pending)}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Despesas</span>
          <span className="font-medium text-red-600">{formatCurrency(project.expenses)}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-sm font-medium text-foreground">Lucro</span>
          <span className={`font-semibold ${project.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(project.profit)}
          </span>
        </div>
      </div>

      {/* Revenues */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          Receitas ({revenues.length})
        </h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {revenues.map(r => (
            <div key={r.id} className="flex justify-between items-center text-sm p-2 rounded bg-muted/30">
              <span className="text-muted-foreground truncate mr-2">{r.description}</span>
              <span className={r.status === 'received' ? 'text-emerald-600' : 'text-amber-600'}>
                {formatCurrency(Number(r.amount))}
              </span>
            </div>
          ))}
          {revenues.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">Sem receitas</p>
          )}
        </div>
      </div>

      {/* Expenses */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-red-600" />
          Despesas ({expenses.length})
        </h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {expenses.map(e => (
            <div key={e.id} className="flex justify-between items-center text-sm p-2 rounded bg-muted/30">
              <span className="text-muted-foreground truncate mr-2">{e.description}</span>
              <span className="text-red-600">
                {formatCurrency(Number(e.amount))}
              </span>
            </div>
          ))}
          {expenses.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">Sem despesas</p>
          )}
        </div>
      </div>

      {/* Contract AI Upload Dialog */}
      <ContractAiUploadDialog
        open={isAiUploadOpen}
        onOpenChange={setIsAiUploadOpen}
        projectId={project.project_id}
        projectName={project.project_name}
        onSuccess={handleRefresh}
      />




      {/* Contract Modal */}
      <ProjectContractModal
        open={isContractModalOpen}
        onOpenChange={setIsContractModalOpen}
        projectId={project.project_id}
        projectName={project.project_name}
        clientName={project.client_name}
        existingContract={contract}
        onSuccess={handleRefresh}
      />

      {/* Finalize Dialog */}
      <AlertDialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Finalizar Contrato
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja finalizar este contrato? 
              {paidMilestones < milestones.length && (
                <span className="block mt-2 text-amber-600">
                  Atenção: Existem {milestones.length - paidMilestones} parcela(s) pendente(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalizeContract}>
              Finalizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
