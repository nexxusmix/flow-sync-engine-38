import { ProjectWithStages } from "@/hooks/useProjects";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Inbox, Calendar, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useProjects } from "@/hooks/useProjects";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TasksTabProps {
  project: ProjectWithStages;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  done: { label: "Concluído", variant: "default" },
  in_progress: { label: "Em andamento", variant: "secondary" },
  blocked: { label: "Bloqueado", variant: "destructive" },
  not_started: { label: "Não iniciado", variant: "outline" },
};

export function TasksTab({ project }: TasksTabProps) {
  const { updateStage } = useProjects();

  const stages = project.stages || [];
  const completedCount = stages.filter(s => s.status === "done").length;
  const progressPercent = stages.length > 0 ? Math.round((completedCount / stages.length) * 100) : 0;

  const handleToggle = (stageId: string, currentStatus: string | null) => {
    const newStatus = currentStatus === "done" ? "not_started" : "done";
    updateStage(
      {
        stageId,
        data: {
          status: newStatus,
          ...(newStatus === "done" ? { actual_end: new Date().toISOString() } : { actual_end: null }),
        },
      },
      {
        onSuccess: () => toast.success(newStatus === "done" ? "Etapa concluída!" : "Etapa reaberta"),
        onError: () => toast.error("Erro ao atualizar etapa"),
      }
    );
  };

  const handleStatusChange = (stageId: string, newStatus: string) => {
    updateStage(
      {
        stageId,
        data: {
          status: newStatus,
          ...(newStatus === "done" ? { actual_end: new Date().toISOString() } : {}),
        },
      },
      {
        onSuccess: () => toast.success("Status atualizado!"),
        onError: () => toast.error("Erro ao atualizar status"),
      }
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), "dd MMM", { locale: ptBR });
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress overview */}
      {stages.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Progresso geral</span>
            <span className="text-sm text-muted-foreground">{completedCount}/{stages.length} etapas</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      )}

      {stages.length > 0 ? (
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border/50">
          {stages.map((stage) => {
            const config = STATUS_CONFIG[stage.status || "not_started"] || STATUS_CONFIG.not_started;
            const plannedStart = formatDate(stage.planned_start);
            const plannedEnd = formatDate(stage.planned_end);
            const actualEnd = formatDate(stage.actual_end);

            return (
              <div key={stage.id} className="p-4 flex items-start gap-4 hover:bg-muted/20 transition-colors">
                <Checkbox
                  checked={stage.status === "done"}
                  onCheckedChange={() => handleToggle(stage.id, stage.status)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-medium ${
                      stage.status === "done" ? "text-muted-foreground line-through" : "text-foreground"
                    }`}>
                      {stage.title}
                    </span>
                    <Badge variant={config.variant} className="text-[10px] px-1.5 py-0">
                      {config.label}
                    </Badge>
                  </div>
                  {(plannedStart || plannedEnd || actualEnd) && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {plannedStart && plannedEnd && <span>{plannedStart} → {plannedEnd}</span>}
                      {actualEnd && <span className="text-primary">✓ {actualEnd}</span>}
                    </div>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <DropdownMenuItem
                        key={key}
                        onClick={() => handleStatusChange(stage.id, key)}
                        disabled={stage.status === key}
                      >
                        {cfg.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma etapa encontrada para este projeto.</p>
        </div>
      )}
    </div>
  );
}
