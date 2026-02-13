import { useState, useRef } from "react";
import { ProjectWithStages } from "@/hooks/useProjects";
import { usePortalLink } from "@/hooks/usePortalLink";
import { useExportPdf } from "@/hooks/useExportPdf";
import { PROJECT_STAGES, STATUS_CONFIG } from "@/data/projectTemplates";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar, 
  DollarSign, 
  Users, 
  ExternalLink,
  Activity,
  Copy,
  Loader2,
  FileDown,
  ImagePlus,
  Pencil,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectsStore } from "@/stores/projectsStore";
import { ProjectActionsMenu } from "@/components/projects/ProjectActionsMenu";
import { ProjectBannerSection } from "./ProjectBannerSection";
import { ProjectCommandCenter } from "@/components/projects/ProjectCommandCenter";
import { UploadMaterialDialog } from "@/components/projects/UploadMaterialDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ProjectHeaderProps {
  project: ProjectWithStages;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const queryClient = useQueryClient();
  const { setSelectedProjectId, setEditProjectModalOpen } = useProjectsStore();
  const [commandCenterOpen, setCommandCenterOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { portalLink, portalUrl, isLoading: portalLoading, createLink } = usePortalLink(project.id, {
    name: project.name,
    clientName: project.client_name || undefined,
  });
  const { isExporting, exportProject } = useExportPdf();
  
  // Upload states
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const logoUrl = (project as any).logo_url;
  const bannerUrl = (project as any).banner_url;
  
  const stageInfo = PROJECT_STAGES.find(s => s.type === project.stage_current);
  const statusConfig = STATUS_CONFIG[project.status as keyof typeof STATUS_CONFIG];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd MMM yyyy", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  const handleEdit = () => {
    setSelectedProjectId(project.id);
    setEditProjectModalOpen(true);
  };

  const handleOpenPortal = async () => {
    if (!portalLink) {
      createLink.mutate(undefined, {
        onSuccess: (data) => {
          const url = `${window.location.origin}/client/${data.share_token}`;
          window.open(url, '_blank');
        }
      });
      return;
    }
    
    if (portalUrl) {
      window.open(portalUrl, '_blank');
    }
  };

  const handleCopyPortalLink = async () => {
    if (!portalLink) {
      createLink.mutate(undefined, {
        onSuccess: (data) => {
          const url = `${window.location.origin}/client/${data.share_token}`;
          navigator.clipboard.writeText(url);
          toast.success('Link copiado para a área de transferência!');
        }
      });
      return;
    }
    
    if (portalUrl) {
      navigator.clipboard.writeText(portalUrl);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingLogo(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `logos/${project.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from("project-files").getPublicUrl(filePath);
      
      const { error: updateError } = await supabase
        .from("projects")
        .update({ logo_url: data.publicUrl })
        .eq("id", project.id);
      
      if (updateError) throw updateError;
      
      queryClient.invalidateQueries({ queryKey: ["project", project.id] });
      toast.success("Logo atualizado!");
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Erro ao enviar logo");
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  return (
    <>
    <div className="space-y-4">
      {/* Main Info Card */}
      <div className="glass-card rounded-2xl md:rounded-3xl overflow-hidden">
        {/* Banner Section with AI Generation */}
        <ProjectBannerSection
          projectId={project.id}
          bannerUrl={bannerUrl}
          logoUrl={logoUrl}
          onEditProject={handleEdit}
        />

        <div className="p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            {/* Left - Project Info */}
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-[10px] md:text-xs px-2 py-1 rounded border font-medium ${statusConfig?.color || 'text-muted-foreground'}`}>
                  {statusConfig?.label || project.status}
                </span>
                <span className="text-[10px] md:text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                  {project.template || 'Projeto'}
                </span>
                <span className="text-[10px] md:text-xs text-primary bg-primary/10 px-2 py-1 rounded font-medium">
                  {stageInfo?.name || project.stage_current}
                </span>
              </div>

              {/* Title with Logo */}
              <div className="flex items-center gap-3">
                {/* Clickable Logo Square */}
                <div className="relative group flex-shrink-0">
                  <input 
                    type="file" 
                    ref={logoInputRef} 
                    hidden 
                    accept="image/*"
                    onChange={handleLogoUpload} 
                  />
                  
                  <button 
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="w-14 h-14 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center transition-all overflow-hidden bg-muted/30"
                  >
                    {isUploadingLogo ? (
                      <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                    ) : logoUrl ? (
                      <>
                        <img 
                          src={logoUrl} 
                          alt="Logo do projeto" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
                          <Pencil className="w-4 h-4 text-white" />
                        </div>
                      </>
                    ) : (
                      <ImagePlus className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    )}
                  </button>
                </div>

                <div className="min-w-0">
                  <h1 className="text-xl md:text-2xl font-normal text-foreground mb-1">{project.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {project.client_name || 'Sem cliente'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right - Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setUploadDialogOpen(true)}
                className="h-9 hidden sm:flex gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Upload className="w-4 h-4" />
                Enviar Material
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCommandCenterOpen(true)}
                className="h-9 hidden sm:flex gap-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                Atualizar com IA
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportProject(project.id)}
                disabled={isExporting}
                className="h-9 hidden sm:flex"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4 mr-2" />
                )}
                Exportar PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyPortalLink} 
                disabled={createLink.isPending}
                className="h-9 hidden sm:flex"
              >
                {createLink.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                {portalLink ? 'Copiar Link' : 'Gerar Link'}
              </Button>
              <Button 
                size="sm" 
                onClick={handleOpenPortal} 
                disabled={createLink.isPending}
                className="h-9 hidden sm:flex"
              >
                {createLink.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Portal do Cliente
              </Button>
              <ProjectActionsMenu
                project={project}
                showOpenOption={false}
              />
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-5 pt-5 border-t border-border/50">
            {/* Contract Value */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-base md:text-lg font-medium text-foreground truncate">{formatCurrency(project.contract_value || 0)}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Valor do Contrato</p>
              </div>
            </div>

            {/* Health Score */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
              <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                (project.health_score || 0) >= 80 ? 'bg-emerald-500/20' : 
                (project.health_score || 0) >= 50 ? 'bg-amber-500/20' : 'bg-red-500/20'
              }`}>
                <Activity className={`w-4 h-4 md:w-5 md:h-5 ${
                  (project.health_score || 0) >= 80 ? 'text-emerald-500' : 
                  (project.health_score || 0) >= 50 ? 'text-amber-500' : 'text-red-500'
                }`} />
              </div>
              <div className="min-w-0">
                <p className="text-base md:text-lg font-medium text-foreground">{project.health_score || 0}%</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Saúde</p>
              </div>
            </div>

            {/* Delivery Date */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-base md:text-lg font-medium text-foreground truncate">{formatDate(project.due_date)}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Entrega</p>
              </div>
            </div>

            {/* Owner */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-violet-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{project.owner_name || 'Não definido'}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Responsável</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* IA Command Center */}
      <ProjectCommandCenter
        open={commandCenterOpen}
        onOpenChange={setCommandCenterOpen}
        projectId={project.id}
        projectName={project.name}
        projectContext={{
          status: statusConfig?.label || project.status,
          stage: stageInfo?.name || project.stage_current,
          clientName: project.client_name || undefined,
          contractValue: project.contract_value || 0,
          healthScore: project.health_score || 0,
        }}
      />

      {/* Upload Material Dialog */}
      <UploadMaterialDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        projectId={project.id}
      />
    </>
  );
}
