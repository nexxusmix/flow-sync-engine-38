import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects, ProjectWithStages } from "@/hooks/useProjects";
import { useProjectsStore } from "@/stores/projectsStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pencil, CheckCircle2, Archive, Trash2, ExternalLink, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProjectActionsMenuProps {
  project?: ProjectWithStages;
  projectId?: string;
  projectName?: string;
  projectStatus?: string;
  variant?: 'icon' | 'dots';
  showOpenOption?: boolean;
}

export function ProjectActionsMenu({ 
  project, 
  projectId: propProjectId,
  projectName: propProjectName,
  projectStatus: propProjectStatus,
  variant = 'dots',
  showOpenOption = true,
}: ProjectActionsMenuProps) {
  // Support both full project object and individual props
  const projectId = project?.id ?? propProjectId ?? '';
  const projectName = project?.name ?? propProjectName ?? '';
  const projectStatus = project?.status ?? propProjectStatus ?? 'active';
  const navigate = useNavigate();
  const { completeProject, archiveProject, deleteProject } = useProjects();
  const { setEditProjectModalOpen, setSelectedProjectId } = useProjectsStore();
  
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSyncingFinance, setIsSyncingFinance] = useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProjectId(projectId);
    setEditProjectModalOpen(true);
  };

  const handleOpenProject = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/projetos/${projectId}`);
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCompleteDialog(true);
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowArchiveDialog(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleSyncFinance = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSyncingFinance(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-project-finances', {
        body: { project_id: projectId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(data?.message || 'Financeiro sincronizado!');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao sincronizar financeiro');
    } finally {
      setIsSyncingFinance(false);
    }
  };

  const confirmComplete = () => {
    completeProject(projectId);
    setShowCompleteDialog(false);
  };

  const confirmArchive = () => {
    archiveProject(projectId);
    setShowArchiveDialog(false);
  };

  const confirmDelete = () => {
    deleteProject(projectId);
    setShowDeleteDialog(false);
  };

  const isCompleted = projectStatus === 'completed';
  const isArchived = projectStatus === 'archived';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {showOpenOption && (
            <DropdownMenuItem onClick={handleOpenProject}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir projeto
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleEdit}>
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleSyncFinance}
            disabled={isSyncingFinance}
            className="text-emerald-600 focus:text-emerald-600"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncingFinance ? 'animate-spin' : ''}`} />
            {isSyncingFinance ? 'Sincronizando...' : 'Sincronizar Financeiro'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {!isCompleted && !isArchived && (
            <DropdownMenuItem onClick={handleComplete} className="text-emerald-500 focus:text-emerald-500">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Finalizar projeto
            </DropdownMenuItem>
          )}
          {!isArchived && (
            <DropdownMenuItem onClick={handleArchive} className="text-amber-500 focus:text-amber-500">
              <Archive className="w-4 h-4 mr-2" />
              Arquivar
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDelete} className="text-red-500 focus:text-red-500">
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Complete Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              O projeto <strong>{projectName}</strong> será marcado como concluído.
              Esta ação pode ser revertida editando o projeto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmComplete} className="bg-emerald-600 hover:bg-emerald-700">
              Finalizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              O projeto <strong>{projectName}</strong> será arquivado e não aparecerá 
              na lista principal. Você poderá restaurá-lo posteriormente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive} className="bg-amber-600 hover:bg-amber-700">
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              O projeto <strong>{projectName}</strong> será permanentemente excluído. 
              Esta ação não pode ser desfeita e todos os dados associados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
