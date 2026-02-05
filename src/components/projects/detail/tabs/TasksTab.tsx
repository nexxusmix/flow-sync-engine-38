import { ProjectWithStages } from "@/hooks/useProjects";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Inbox } from "lucide-react";
import { toast } from "sonner";

interface TasksTabProps {
  project: ProjectWithStages;
}

export function TasksTab({ project }: TasksTabProps) {
  const handleToggleItem = () => {
    toast.info('Funcionalidade de checklist será implementada em breve');
  };

  // Group stages by status for display
  const stages = project.stages || [];

  return (
    <div className="space-y-6">
      {stages.length > 0 ? (
        stages.map((stage) => (
          <div key={stage.id} className="glass-card rounded-2xl overflow-hidden">
            {/* Stage Header */}
            <div className="p-4 border-b border-border/50 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-foreground">{stage.title}</h3>
                  <Badge variant={
                    stage.status === 'completed' ? 'default' :
                    stage.status === 'in_progress' ? 'secondary' :
                    stage.status === 'blocked' ? 'destructive' : 'outline'
                  }>
                    {stage.status === 'completed' ? 'Concluído' :
                     stage.status === 'in_progress' ? 'Em andamento' :
                     stage.status === 'blocked' ? 'Bloqueado' : 'Não iniciado'}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  Ordem: {stage.order_index}
                </span>
              </div>
            </div>

            {/* Stage Item */}
            <div className="divide-y divide-border/50">
              <div className="p-4 flex items-start gap-4 hover:bg-muted/20 transition-colors">
                <Checkbox
                  checked={stage.status === 'completed'}
                  onCheckedChange={handleToggleItem}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${
                      stage.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'
                    }`}>
                      {stage.title}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma etapa encontrada para este projeto.</p>
        </div>
      )}
    </div>
  );
}
