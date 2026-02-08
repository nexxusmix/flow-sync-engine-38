import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExecutionPlan, ActionResult } from '@/types/agent';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ExecutionPlanViewProps {
  plan: ExecutionPlan;
  results?: ActionResult[];
  isExecuting?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  needsConfirmation?: boolean;
}

const actionLabels: Record<string, string> = {
  search: 'Buscar',
  upsert: 'Criar/Atualizar',
  link: 'Vincular',
  update_contract_status: 'Atualizar Contrato',
  update_status: 'Atualizar Status',
  sync_financial: 'Sincronizar Financeiro',
  create_tasks: 'Criar Tarefas',
  attach_file: 'Anexar Arquivo',
};

const entityLabels: Record<string, string> = {
  contract: 'Contrato',
  project: 'Projeto',
  client: 'Cliente',
  proposal: 'Proposta',
  content: 'Conteúdo',
  campaign: 'Campanha',
  milestone: 'Milestone',
  revenue: 'Receita',
  financial: 'Financeiro',
  task: 'Tarefa',
  content_item: 'Conteúdo',
};

export function ExecutionPlanView({
  plan,
  results,
  isExecuting,
  onConfirm,
  onCancel,
  needsConfirmation,
}: ExecutionPlanViewProps) {
  const [isOpen, setIsOpen] = useState(true);

  const getStepStatus = (index: number): 'pending' | 'success' | 'error' | 'skipped' => {
    if (!results) return 'pending';
    const result = results.find(r => r.step_index === index);
    return result?.status || 'pending';
  };

  const getStepIcon = (index: number) => {
    const status = getStepStatus(index);
    const isCurrentlyExecuting = isExecuting && !results?.find(r => r.step_index === index);
    
    if (isCurrentlyExecuting && index === (results?.length || 0)) {
      return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
    }
    
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const riskColors: Record<string, string> = {
    low: 'bg-green-500/10 text-green-500 border-green-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    high: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <div className="bg-muted/50 border border-border rounded-xl overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-3 hover:bg-muted/80 transition-colors">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">
                {isExecuting ? 'sync' : 'checklist'}
              </span>
              <span className="text-sm font-medium">
                {plan.summary || `${plan.steps.length} ${plan.steps.length === 1 ? 'ação' : 'ações'}`}
              </span>
              <span className={cn(
                'text-[10px] font-semibold uppercase px-2 py-0.5 rounded border',
                riskColors[plan.risk_level]
              )}>
                {plan.risk_level === 'low' ? '⚡' : plan.risk_level === 'medium' ? '⚠️' : '🔴'}
              </span>
            </div>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2">
            {/* Context */}
            {Object.keys(plan.context).length > 0 && (
              <div className="text-xs text-muted-foreground bg-background/50 rounded-lg p-2">
                <span className="font-medium">Contexto:</span>{' '}
                {Object.entries(plan.context)
                  .filter(([, v]) => v)
                  .map(([k, v]) => `${k.replace('_id', '')}: ${String(v).slice(0, 8)}...`)
                  .join(' | ')}
              </div>
            )}

            {/* Steps */}
            <div className="space-y-1">
              {plan.steps.map((step, index) => {
                const status = getStepStatus(index);
                const result = results?.find(r => r.step_index === index);
                const isCurrentStep = isExecuting && !result && index === (results?.length || 0);

                return (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg text-xs transition-colors',
                      status === 'success' && 'bg-green-500/5',
                      status === 'error' && 'bg-red-500/5',
                      isCurrentStep && 'bg-primary/5',
                    )}
                  >
                    {getStepIcon(index)}
                    <span className="font-medium">
                      {actionLabels[step.action] || step.action}
                    </span>
                    {step.entity && (
                      <span className="text-muted-foreground">
                        {entityLabels[step.entity] || step.entity}
                      </span>
                    )}
                    {step.query && (
                      <span className="text-muted-foreground truncate max-w-[100px]">
                        "{step.query}"
                      </span>
                    )}
                    {result?.error_message && (
                      <span className="text-destructive ml-auto truncate max-w-[150px]">
                        {result.error_message}
                      </span>
                    )}
                    {result?.duration_ms && (
                      <span className="text-muted-foreground ml-auto">
                        {result.duration_ms}ms
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Confirmation buttons for high-risk actions */}
            {needsConfirmation && !isExecuting && !results && (
              <div className="flex gap-2 pt-2 border-t border-border mt-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onCancel}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={onConfirm}
                  className="flex-1"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Confirmar e Executar
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
