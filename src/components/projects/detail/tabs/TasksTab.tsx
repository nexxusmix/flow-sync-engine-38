import { Project } from "@/types/projects";
import { PROJECT_STAGES } from "@/data/projectTemplates";
import { useProjectsStore } from "@/stores/projectsStore";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface TasksTabProps {
  project: Project;
}

export function TasksTab({ project }: TasksTabProps) {
  const { updateChecklistItem } = useProjectsStore();

  const groupedChecklist = PROJECT_STAGES
    .filter(stage => project.stages.some(s => s.type === stage.type))
    .map(stage => {
      const projectStage = project.stages.find(s => s.type === stage.type);
      const items = project.checklist.filter(item => {
        const itemStage = project.stages.find(s => s.id === item.stageId);
        return itemStage?.type === stage.type;
      });
      return {
        stage,
        projectStage,
        items,
      };
    })
    .filter(group => group.items.length > 0);

  const handleToggleItem = (itemId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'concluido' ? 'pendente' : 'concluido';
    updateChecklistItem(project.id, itemId, { status: newStatus });
  };

  return (
    <div className="space-y-6">
      {groupedChecklist.map(({ stage, projectStage, items }) => (
        <div key={stage.type} className="glass-card rounded-2xl overflow-hidden">
          {/* Stage Header */}
          <div className="p-4 border-b border-border/50 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-foreground">{stage.name}</h3>
                <Badge variant={
                  projectStage?.status === 'concluido' ? 'default' :
                  projectStage?.status === 'em_andamento' ? 'secondary' :
                  projectStage?.status === 'bloqueado' ? 'destructive' : 'outline'
                }>
                  {projectStage?.status === 'concluido' ? 'Concluído' :
                   projectStage?.status === 'em_andamento' ? 'Em andamento' :
                   projectStage?.status === 'bloqueado' ? 'Bloqueado' : 'Não iniciado'}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {items.filter(i => i.status === 'concluido').length} / {items.length}
              </span>
            </div>
          </div>

          {/* Checklist Items */}
          <div className="divide-y divide-border/50">
            {items.map((item) => (
              <div 
                key={item.id}
                className="p-4 flex items-start gap-4 hover:bg-muted/20 transition-colors"
              >
                <Checkbox
                  checked={item.status === 'concluido'}
                  onCheckedChange={() => handleToggleItem(item.id, item.status)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${
                      item.status === 'concluido' ? 'text-muted-foreground line-through' : 'text-foreground'
                    }`}>
                      {item.title}
                    </span>
                    {item.isCritical && (
                      <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  )}
                  {item.assignee && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-[10px] font-medium text-primary">{item.assignee.initials}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.assignee.name}</span>
                    </div>
                  )}
                </div>
                {item.isCritical && item.status !== 'concluido' && (
                  <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-[10px]">
                    Crítico
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {groupedChecklist.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">Nenhuma tarefa encontrada para este projeto.</p>
        </div>
      )}
    </div>
  );
}
