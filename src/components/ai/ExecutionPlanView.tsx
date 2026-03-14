import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Loader2, Clock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
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
  search: 'Buscar', upsert: 'Criar/Atualizar', link: 'Vincular',
  update_contract_status: 'Atualizar Contrato', update_status: 'Atualizar Status',
  sync_financial: 'Sincronizar Financeiro', create_tasks: 'Criar Tarefas',
  create_content: 'Criar Conteúdo', create_event: 'Criar Evento', attach_file: 'Anexar Arquivo',
};

const entityLabels: Record<string, string> = {
  contract: 'Contrato', project: 'Projeto', client: 'Cliente', proposal: 'Proposta',
  content: 'Conteúdo', campaign: 'Campanha', milestone: 'Milestone', revenue: 'Receita',
  financial: 'Financeiro', task: 'Tarefa', content_item: 'Conteúdo', knowledge: 'Conhecimento', event: 'Evento',
};

function friendlyError(error: string): string {
  if (error.includes('violates not-null constraint')) {
    const col = error.match(/column "(\w+)"/)?.[1];
    return `Campo obrigatório "${col}" está vazio`;
  }
  if (error.includes('violates check constraint')) {
    const constraint = error.match(/check constraint "(\w+)"/)?.[1];
    return `Valor inválido para ${constraint?.replace(/_check$/, '').replace(/_/g, ' ')}`;
  }
  if (error.includes('does not exist')) return 'Coluna ou tabela não encontrada no banco';
  if (error.includes('schema cache')) {
    const col = error.match(/'(\w+)' column/)?.[1];
    return `Campo "${col}" não existe nesta tabela`;
  }
  return error;
}

export function ExecutionPlanView({ plan, results, isExecuting, onConfirm, onCancel, needsConfirmation }: ExecutionPlanViewProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);

  // Timer during execution
  useEffect(() => {
    if (isExecuting) {
      startRef.current = Date.now();
      timerRef.current = setInterval(() => setElapsedMs(Date.now() - startRef.current), 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isExecuting]);

  const toggleErrorDetail = (index: number) => {
    setExpandedErrors(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  const getStepStatus = (index: number): 'pending' | 'success' | 'error' | 'skipped' => {
    if (!results) return 'pending';
    return results.find(r => r.step_index === index)?.status || 'pending';
  };

  const completedCount = results?.length || 0;
  const totalSteps = plan.steps.length;
  const progressPct = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;
  const successCount = results?.filter(r => r.status === 'success').length || 0;
  const errorCount = results?.filter(r => r.status === 'error').length || 0;
  const hasResults = results && results.length > 0;

  const riskColors: Record<string, string> = {
    low: 'bg-primary/10 text-primary border-primary/20',
    medium: 'bg-muted text-muted-foreground border-border',
    high: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  return (
    <div className="bg-muted/50 border border-border rounded-xl overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-3 hover:bg-muted/80 transition-colors">
            <div className="flex items-center gap-2">
              <span className={cn("material-symbols-outlined text-primary text-lg", isExecuting && "animate-spin")}>
                {isExecuting ? 'sync' : 'checklist'}
              </span>
              <span className="text-sm font-medium">
                {plan.summary || `${totalSteps} ${totalSteps === 1 ? 'ação' : 'ações'}`}
              </span>
              <span className={cn('text-mono font-semibold uppercase px-2 py-0.5 rounded border', riskColors[plan.risk_level])}>
                {plan.risk_level === 'low' ? '⚡' : plan.risk_level === 'medium' ? '⚠️' : '🔴'}
              </span>
              {isExecuting && (
                <span className="text-mono font-mono text-muted-foreground tabular-nums">
                  {(elapsedMs / 1000).toFixed(1)}s
                </span>
              )}
            </div>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2">
            {/* Progress bar during execution */}
            {(isExecuting || hasResults) && (
              <div className="space-y-1">
                <Progress value={progressPct} className="h-1.5" />
                <p className="text-mono text-muted-foreground text-right">
                  {completedCount}/{totalSteps} concluídas
                </p>
              </div>
            )}

            {/* Execution Summary */}
            {hasResults && !isExecuting && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  'text-xs rounded-lg p-2.5 flex items-center gap-2 border',
                  errorCount === 0
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'bg-destructive/10 border-destructive/20 text-destructive'
                )}
              >
                {errorCount === 0 ? (
                  <><CheckCircle2 className="w-4 h-4 shrink-0" /><span className="font-semibold">Todas as {successCount} ações executadas com sucesso!</span></>
                ) : (
                  <><AlertCircle className="w-4 h-4 shrink-0" /><span className="font-semibold">{successCount} de {results.length} ações ok • {errorCount} {errorCount === 1 ? 'falhou' : 'falharam'}</span></>
                )}
              </motion.div>
            )}

            {/* Context */}
            {Object.keys(plan.context).length > 0 && (
              <div className="text-xs text-muted-foreground bg-background/50 rounded-lg p-2">
                <span className="font-medium">Contexto:</span>{' '}
                {Object.entries(plan.context).filter(([, v]) => v).map(([k, v]) => `${k.replace('_id', '')}: ${String(v).slice(0, 8)}...`).join(' | ')}
              </div>
            )}

            {/* Steps */}
            <div className="space-y-1">
              {plan.steps.map((step, index) => {
                const status = getStepStatus(index);
                const result = results?.find(r => r.step_index === index);
                const isCurrentStep = isExecuting && !result && index === completedCount;
                const hasError = result?.error_message;
                const isErrorExpanded = expandedErrors.has(index);

                return (
                  <motion.div
                    key={index}
                    className="space-y-0"
                    initial={false}
                    animate={status === 'success' ? { opacity: 1 } : status === 'error' ? { opacity: 1 } : {}}
                  >
                    <div
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg text-xs transition-all',
                        status === 'success' && 'bg-primary/5',
                        status === 'error' && 'bg-destructive/5',
                        isCurrentStep && 'bg-primary/10 ring-1 ring-primary/20 animate-pulse',
                        hasError && 'cursor-pointer',
                      )}
                      onClick={hasError ? () => toggleErrorDetail(index) : undefined}
                    >
                      {isCurrentStep ? (
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      ) : status === 'success' ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </motion.div>
                      ) : status === 'error' ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <AlertCircle className="w-4 h-4 text-destructive" />
                        </motion.div>
                      ) : (
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">{actionLabels[step.action] || step.action}</span>
                      {step.entity && <span className="text-muted-foreground">{entityLabels[step.entity] || step.entity}</span>}
                      {step.data?.title && <span className="text-muted-foreground truncate max-w-[120px]" title={String(step.data.title)}>"{String(step.data.title)}"</span>}
                      {step.query && <span className="text-muted-foreground truncate max-w-[100px]">"{step.query}"</span>}
                      {hasError && (
                        <span className="text-destructive ml-auto text-mono font-semibold flex items-center gap-1">
                          <Info className="w-3 h-3" />{friendlyError(result.error_message!)}
                        </span>
                      )}
                      {!hasError && result?.duration_ms && <span className="text-muted-foreground ml-auto">{result.duration_ms}ms</span>}
                    </div>
                    <AnimatePresence>
                      {hasError && isErrorExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="ml-6 mr-2 mb-1 p-2 rounded bg-destructive/5 border border-destructive/10 text-mono text-destructive/80 font-mono break-all overflow-hidden"
                        >
                          {result.error_message}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Confirmation buttons */}
            {needsConfirmation && !isExecuting && !results && (
              <div className="flex gap-2 pt-2 border-t border-border mt-2">
                <Button size="sm" variant="destructive" onClick={onCancel} className="flex-1">Cancelar</Button>
                <Button size="sm" onClick={onConfirm} className="flex-1">
                  <CheckCircle2 className="w-4 h-4 mr-1" />Confirmar e Executar
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
