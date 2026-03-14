import { Card } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { sc } from '@/lib/colors';

interface ProjectRisk {
  id: string;
  name: string;
  client_name: string;
  health_score: number;
  riskPct: number;
  tasksPending: number;
  daysToDeadline: number | null;
  status: string;
}

export function ProjectHealthRanking({ projects }: { projects: ProjectRisk[] }) {
  if (!projects || projects.length === 0) return null;

  const sorted = [...projects].sort((a, b) => b.riskPct - a.riskPct);

  return (
    <Card className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">Ranking de Saúde dos Projetos</h3>
      </div>
      <div className="space-y-2">
        {sorted.map((p) => {
          const riskColor = p.riskPct >= 60 ? 'text-destructive' : p.riskPct >= 30 ? 'text-muted-foreground' : 'text-primary';
          const barColor = p.riskPct >= 60 ? 'bg-destructive' : p.riskPct >= 30 ? 'bg-muted-foreground' : 'bg-primary';

          return (
            <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <span className="text-[10px] text-muted-foreground">{p.client_name}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted mt-1.5 overflow-hidden">
                  <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${Math.min(p.riskPct, 100)}%` }} />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`text-sm font-semibold ${riskColor}`}>{p.riskPct.toFixed(0)}%</span>
                <p className="text-[10px] text-muted-foreground">risco</p>
              </div>
              <div className="text-right flex-shrink-0 w-12">
                <span className="text-xs text-foreground">{p.tasksPending}</span>
                <p className="text-[10px] text-muted-foreground">tarefas</p>
              </div>
              {p.daysToDeadline !== null && (
                <div className="text-right flex-shrink-0 w-12">
                  <span className={`text-xs ${p.daysToDeadline < 0 ? 'text-destructive' : 'text-foreground'}`}>{p.daysToDeadline}d</span>
                  <p className="text-[10px] text-muted-foreground">prazo</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
