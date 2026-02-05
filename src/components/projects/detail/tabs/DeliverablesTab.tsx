import { ProjectWithStages } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  FileVideo,
  FileImage,
  FileText,
  File,
  Inbox
} from "lucide-react";
import { toast } from "sonner";

interface DeliverablesTabProps {
  project: ProjectWithStages;
}

export function DeliverablesTab({ project }: DeliverablesTabProps) {
  const handleAddDeliverable = () => {
    toast.info('Funcionalidade de entregáveis será implementada em breve');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Entregáveis</h3>
        <Button size="sm" onClick={handleAddDeliverable}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Entregável
        </Button>
      </div>

      {/* Empty State */}
      <div className="glass-card rounded-2xl p-12 text-center">
        <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">Nenhum entregável criado ainda.</p>
        <Button onClick={handleAddDeliverable}>
          <Plus className="w-4 h-4 mr-2" />
          Criar Primeiro Entregável
        </Button>
      </div>
    </div>
  );
}
