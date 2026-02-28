import { useState } from 'react';
import { Task } from '@/hooks/useTasksUnified';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Archive, ChevronDown, ChevronRight, RotateCcw, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ArchivedTasksSectionProps {
  archivedTasks: (Task & { archived_at?: string })[];
  isLoading: boolean;
  onRestore: (id: string) => void;
  onDeletePermanently: (id: string) => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'border-l-destructive',
  high: 'border-l-orange-500',
  normal: 'border-l-primary',
  low: 'border-l-muted-foreground/40',
};

export function ArchivedTasksSection({ archivedTasks, isLoading, onRestore, onDeletePermanently }: ArchivedTasksSectionProps) {
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return <Skeleton className="h-10 w-full rounded-xl" />;
  }

  if (archivedTasks.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between h-10 rounded-xl text-muted-foreground hover:text-foreground"
        >
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4" />
            <span className="text-sm">Arquivadas</span>
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
              {archivedTasks.length}
            </Badge>
          </div>
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-1.5 animate-fade-in">
        {archivedTasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30 border-l-2 group',
              PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.normal
            )}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground line-through truncate">{task.title}</p>
              <p className="text-[10px] text-muted-foreground/60">
                Arquivada {task.archived_at && formatDistanceToNow(new Date(task.archived_at), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1"
                onClick={() => onRestore(task.id)}
              >
                <RotateCcw className="w-3 h-3" />
                Restaurar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
                    <AlertDialogDescription>
                      A tarefa "{task.title}" será excluída permanentemente. Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => onDeletePermanently(task.id)}
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
