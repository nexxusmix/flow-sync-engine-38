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
import { MoreVertical, Pencil, CheckCircle2, Archive, Trash2, ExternalLink, RefreshCw, Wand2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ProjectActionsMenuProps {
  project?: ProjectWithStages;
  projectId?: string;
  projectName?: string;
  projectStatus?: string;
  contractValue?: number;
  variant?: 'icon' | 'dots';
  showOpenOption?: boolean;
}

export function ProjectActionsMenu({ 
  project, 
  projectId: propProjectId,
  projectName: propProjectName,
  projectStatus: propProjectStatus,
  contractValue: propContractValue,
  variant = 'dots',
  showOpenOption = true,
}: ProjectActionsMenuProps) {
  // Support both full project object and individual props
  const projectId = project?.id ?? propProjectId ?? '';
  const projectName = project?.name ?? propProjectName ?? '';
  const projectStatus = project?.status ?? propProjectStatus ?? 'active';
  const contractValue = project?.contract_value ?? propContractValue ?? 0;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { completeProject, archiveProject, deleteProject } = useProjects();
  const { setEditProjectModalOpen, setSelectedProjectId } = useProjectsStore();
  
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSyncingFinance, setIsSyncingFinance] = useState(false);
  const [isAutoUpdating, setIsAutoUpdating] = useState(false);
  const [isGeneratingClient, setIsGeneratingClient] = useState(false);

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
    // Validate contract_value regardless of how the component was instantiated
    if (!contractValue || contractValue <= 0) {
      toast.warning('Defina o valor do contrato no projeto antes de sincronizar o financeiro.', {
        description: 'O valor do contrato deve ser maior que zero para gerar as parcelas financeiras.',
        action: {
          label: 'Editar projeto',
          onClick: () => {
            setSelectedProjectId(projectId);
            setEditProjectModalOpen(true);
          },
        },
        duration: 6000,
      });
      return;
    }
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

  const handleAutoUpdate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAutoUpdating(true);
    const toastId = toast.loading('Analisando projeto com IA...');
    try {
      const { data, error } = await supabase.functions.invoke('auto-update-project', {
        body: { project_id: projectId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.dismiss(toastId);
      toast.success(data?.summary || 'Projeto atualizado!', { duration: 6000 });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-finance', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err?.message || 'Erro ao executar Auto Update');
    } finally {
      setIsAutoUpdating(false);
    }
  };

  const handleGenerateClient = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGeneratingClient(true);
    const toastId = toast.loading('Gerando cliente e pipeline com IA...');
    try {
      const { data, error } = await supabase.functions.invoke('generate-client-from-project', {
        body: { project_id: projectId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.dismiss(toastId);
      toast.success(data?.summary || 'Cliente e pipeline gerados!', { duration: 8000 });
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err?.message || 'Erro ao gerar cliente e pipeline');
    } finally {
      setIsGeneratingClient(false);
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
          <DropdownMenuItem
            onClick={handleAutoUpdate}
            disabled={isAutoUpdating}
            className="text-primary focus:text-primary"
          >
            <Wand2 className={`w-4 h-4 mr-2 ${isAutoUpdating ? 'animate-spin' : ''}`} />
            {isAutoUpdating ? 'Atualizando...' : 'Auto Update IA'}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleGenerateClient}
            disabled={isGeneratingClient}
            className="text-primary focus:text-primary"
          >
            <Sparkles className={`w-4 h-4 mr-2 ${isGeneratingClient ? 'animate-pulse' : ''}`} />
            {isGeneratingClient ? 'Gerando...' : 'Gerar Cliente + Pipeline'}
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
