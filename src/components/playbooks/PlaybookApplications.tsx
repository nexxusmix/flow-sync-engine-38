import { usePlaybooks } from '@/hooks/usePlaybooks';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusMap: Record<string, { label: string; cls: string }> = {
  in_progress: { label: 'Em andamento', cls: 'bg-primary/15 text-primary' },
  completed: { label: 'Concluído', cls: 'bg-emerald-500/15 text-emerald-400' },
  cancelled: { label: 'Cancelado', cls: 'bg-destructive/15 text-destructive' },
};

export function PlaybookApplications() {
  const { playbooks, applications, isLoading } = usePlaybooks();

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-16 space-y-2">
        <span className="material-symbols-rounded text-4xl text-muted-foreground/40">play_circle</span>
        <p className="text-sm text-muted-foreground">Nenhuma aplicação de playbook ainda.</p>
        <p className="text-xs text-muted-foreground/60">Aplique um playbook a um projeto ou cliente para acompanhar aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map(app => {
        const pb = playbooks.find(p => p.id === app.playbook_id);
        const pct = app.total_steps > 0 ? Math.round((app.completed_steps / app.total_steps) * 100) : 0;
        const st = statusMap[app.status] || statusMap.in_progress;

        return (
          <div key={app.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-rounded text-lg text-primary">play_circle</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground truncate">{pb?.title || 'Playbook removido'}</span>
                <Badge className={`text-[10px] py-0 px-1.5 border-0 ${st.cls}`}>{st.label}</Badge>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>{app.applied_to_entity_type}</span>
                <span>•</span>
                <span>{app.completed_steps}/{app.total_steps} etapas</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(app.started_at), { addSuffix: true, locale: ptBR })}</span>
              </div>
              <Progress value={pct} className="h-1.5 mt-2" />
            </div>
            <span className="text-sm font-bold text-primary">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}
