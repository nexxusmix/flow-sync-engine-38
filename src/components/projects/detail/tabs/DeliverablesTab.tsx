import { Project, Deliverable } from "@/types/projects";
import { useProjectsStore } from "@/stores/projectsStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Upload, 
  Eye, 
  CheckCircle, 
  Send, 
  Archive,
  MoreVertical,
  FileVideo,
  FileImage,
  FileText,
  File
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DeliverablesTabProps {
  project: Project;
}

const STATUS_CONFIG = {
  rascunho: { label: 'Rascunho', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
  revisao: { label: 'Em Revisão', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  aprovado: { label: 'Aprovado', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  entregue: { label: 'Entregue', color: 'bg-primary/20 text-primary border-primary/30' },
  arquivado: { label: 'Arquivado', color: 'bg-muted text-muted-foreground border-border' },
};

const TYPE_ICONS = {
  video: FileVideo,
  imagem: FileImage,
  pdf: FileText,
  zip: File,
  audio: File,
  outro: File,
};

function DeliverableCard({ deliverable, project }: { deliverable: Deliverable; project: Project }) {
  const { updateDeliverable, addDeliverableVersion } = useProjectsStore();
  const statusConfig = STATUS_CONFIG[deliverable.status];
  const TypeIcon = TYPE_ICONS[deliverable.type] || File;

  const handleTogglePortalVisibility = () => {
    updateDeliverable(project.id, deliverable.id, { 
      visibleInPortal: !deliverable.visibleInPortal 
    });
  };

  const handleStatusChange = (newStatus: Deliverable['status']) => {
    updateDeliverable(project.id, deliverable.id, { status: newStatus });
  };

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <TypeIcon className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground truncate">{deliverable.title}</h4>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className={`text-[10px] ${statusConfig.color}`}>
                {statusConfig.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                v{deliverable.currentVersion}
              </span>
              <span className="text-xs text-muted-foreground">
                • {deliverable.revisionsUsed}/{deliverable.revisionLimit} revisões
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Portal Visibility Toggle */}
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <Switch
              checked={deliverable.visibleInPortal}
              onCheckedChange={handleTogglePortalVisibility}
            />
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Upload className="w-4 h-4 mr-2" />
                Nova Versão
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('revisao')}>
                <Send className="w-4 h-4 mr-2" />
                Enviar para Revisão
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('aprovado')}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Marcar como Aprovado
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleStatusChange('arquivado')}>
                <Archive className="w-4 h-4 mr-2" />
                Arquivar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Versions */}
      {deliverable.versions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2">Histórico de Versões</p>
          <div className="space-y-2">
            {deliverable.versions.slice(-3).reverse().map((version) => (
              <div 
                key={version.id}
                className="flex items-center justify-between text-xs bg-muted/30 rounded-lg p-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">v{version.versionNumber}</span>
                  <span className="text-muted-foreground">por {version.author.name}</span>
                </div>
                <span className="text-muted-foreground">
                  {format(new Date(version.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DeliverablesTab({ project }: DeliverablesTabProps) {
  const { addDeliverable } = useProjectsStore();

  const handleAddDeliverable = () => {
    addDeliverable(project.id, {
      title: 'Novo Entregável',
      type: 'video',
    });
  };

  const activeDeliverables = project.deliverables.filter(d => d.status !== 'arquivado');
  const archivedDeliverables = project.deliverables.filter(d => d.status === 'arquivado');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Entregáveis ({activeDeliverables.length})</h3>
        <Button size="sm" onClick={handleAddDeliverable}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Entregável
        </Button>
      </div>

      {/* Active Deliverables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeDeliverables.map((deliverable) => (
          <DeliverableCard 
            key={deliverable.id} 
            deliverable={deliverable} 
            project={project}
          />
        ))}
      </div>

      {activeDeliverables.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-muted-foreground mb-4">Nenhum entregável criado ainda.</p>
          <Button onClick={handleAddDeliverable}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Entregável
          </Button>
        </div>
      )}

      {/* Archived */}
      {archivedDeliverables.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">
            Arquivados ({archivedDeliverables.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
            {archivedDeliverables.map((deliverable) => (
              <DeliverableCard 
                key={deliverable.id} 
                deliverable={deliverable} 
                project={project}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
