import { useState, useEffect } from 'react';
import { Brain, Loader2, Trash2, FileDown, Clock, CheckCircle2, RotateCcw, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { exportFocusPDF } from '@/services/pdfExportService';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface FocusPlan {
  id: string;
  title: string;
  plan_data: any;
  completed_tasks: string[];
  status: string;
  created_at: string;
}

export function SavedFocusPlans() {
  const [plans, setPlans] = useState<FocusPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_focus_plans')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPlans((data || []).map(p => ({
        ...p,
        completed_tasks: Array.isArray(p.completed_tasks) ? p.completed_tasks as string[] : [],
      })));
    } catch {
      toast.error('Erro ao carregar planos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await supabase.from('saved_focus_plans').delete().eq('id', deleteId);
      setPlans(prev => prev.filter(p => p.id !== deleteId));
      toast.success('Plano excluído');
    } catch { toast.error('Erro ao excluir'); }
    setDeleteId(null);
  };

  const handleArchive = async (id: string) => {
    try {
      await supabase.from('saved_focus_plans').update({ status: 'archived' }).eq('id', id);
      setPlans(prev => prev.map(p => p.id === id ? { ...p, status: 'archived' } : p));
      toast.success('Plano arquivado');
    } catch { toast.error('Erro ao arquivar'); }
  };

  const handleRestore = async (id: string) => {
    try {
      await supabase.from('saved_focus_plans').update({ status: 'active' }).eq('id', id);
      setPlans(prev => prev.map(p => p.id === id ? { ...p, status: 'active' } : p));
      toast.success('Plano restaurado');
    } catch { toast.error('Erro ao restaurar'); }
  };

  const blockTypeConfig: Record<string, { color: string; bg: string }> = {
    deep_work: { color: 'text-purple-500', bg: 'bg-purple-500/10' },
    shallow_work: { color: 'text-blue-500', bg: 'bg-blue-500/10' },
    break: { color: 'text-green-500', bg: 'bg-green-500/10' },
  };

  const activePlans = plans.filter(p => p.status === 'active');
  const archivedPlans = plans.filter(p => p.status === 'archived');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <Brain className="w-10 h-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Nenhum plano de foco salvo</p>
        <p className="text-xs text-muted-foreground max-w-xs">Use o <strong>Modo Foco</strong> para gerar um plano e salve-o aqui para consulta posterior.</p>
      </div>
    );
  }

  const renderPlanCard = (plan: FocusPlan) => {
    const blocks = plan.plan_data?.blocks || [];
    const totalTasks = blocks.reduce((s: number, b: any) => s + (b.tasks?.length || 0), 0);
    const completedCount = plan.completed_tasks.length;
    const progressPct = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;
    const totalMinutes = plan.plan_data?.total_estimated_minutes || 0;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const timeStr = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
    const isExpanded = expandedId === plan.id;
    const dateStr = new Date(plan.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
      <motion.div
        key={plan.id}
        className="rounded-xl border border-border bg-card p-4 space-y-3 transition-all hover:border-primary/20"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : plan.id)}>
            <h3 className="text-sm font-semibold text-foreground truncate">{plan.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{dateStr}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <FileDown className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportFocusPDF(plan.plan_data, 'landscape')}>PDF Horizontal</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportFocusPDF(plan.plan_data, 'portrait')}>PDF Vertical</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {plan.status === 'active' ? (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleArchive(plan.id)}>
                <Archive className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleRestore(plan.id)}>
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteId(plan.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> {blocks.length} blocos</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {completedCount}/{totalTasks}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeStr}</span>
        </div>
        <Progress value={progressPct} className="h-1.5" />

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="space-y-2 pt-2 border-t border-border"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              {blocks.map((block: any, bIdx: number) => {
                const cfg = blockTypeConfig[block.type] || blockTypeConfig.shallow_work;
                return (
                  <div key={block.id || bIdx} className={cn("rounded-lg p-2.5 space-y-1", cfg.bg)}>
                    <div className="flex items-center justify-between">
                      <span className={cn("text-xs font-semibold", cfg.color)}>{block.title}</span>
                      <span className="text-[10px] text-muted-foreground">{block.duration_minutes}min</span>
                    </div>
                    {block.tasks?.map((task: any) => {
                      const isDone = plan.completed_tasks.includes(task.id);
                      return (
                        <div key={task.id} className={cn("flex items-center gap-2 text-xs", isDone && "line-through text-muted-foreground")}>
                          <span className={cn("w-2 h-2 rounded-full shrink-0", isDone ? "bg-green-500" : "bg-muted-foreground/30")} />
                          <span className="flex-1">{task.title}</span>
                          <span className="text-muted-foreground">{task.estimated_minutes}min</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {activePlans.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Planos Ativos</h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {activePlans.map(renderPlanCard)}
          </div>
        </div>
      )}
      {archivedPlans.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Arquivados</h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 opacity-60">
            {archivedPlans.map(renderPlanCard)}
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano de foco?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
