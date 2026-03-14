import { useState, useRef } from "react";
import { ProjectWithStages } from "@/hooks/useProjects";
import { SendToClientModal } from "@/components/projects/SendToClientModal";
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
  Send,
  RefreshCw,
  Wand2,
  Check,
  X,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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
  const [sendToClientOpen, setSendToClientOpen] = useState(false);
  const [isSyncingFinance, setIsSyncingFinance] = useState(false);
  const [isAutoUpdating, setIsAutoUpdating] = useState(false);
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isSavingValue, setIsSavingValue] = useState(false);
  const { portalLink, portalUrl, isLoading: portalLoading, createLink } = usePortalLink(project.id, {
    name: project.name,
    clientName: project.client_name || undefined,
  });
  const { isExporting, exportProject } = useExportPdf();
  
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

  const handleStartEditValue = () => {
    setEditValue(String(project.contract_value || ""));
    setIsEditingValue(true);
  };

  const handleCancelEditValue = () => {
    setIsEditingValue(false);
    setEditValue("");
  };

  const handleSaveValue = async () => {
    const parsed = parseFloat(editValue.replace(",", "."));
    if (isNaN(parsed) || parsed < 0) {
      toast.error("Valor inválido");
      return;
    }
    setIsSavingValue(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({ contract_value: parsed })
        .eq("id", project.id);
      if (error) throw error;
      toast.success("Valor atualizado!");
      queryClient.invalidateQueries({ queryKey: ["project", project.id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsEditingValue(false);
    } catch {
      toast.error("Erro ao salvar valor");
    } finally {
      setIsSavingValue(false);
    }
  };

  const handleSyncFinance = async () => {
    if (!project.contract_value || project.contract_value === 0) {
      toast.warning('Defina o valor do contrato antes de sincronizar.', {
        description: 'Clique no valor "R$ 0" no header para editar inline.',
        action: { label: 'Editar inline', onClick: handleStartEditValue },
        duration: 6000,
      });
      return;
    }

    setIsSyncingFinance(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-project-finances`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ project_id: project.id }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Erro ${res.status}`);
      toast.success(data?.message || 'Financeiro sincronizado!');
      queryClient.invalidateQueries({ queryKey: ['project-finance', project.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao sincronizar financeiro');
    } finally {
      setIsSyncingFinance(false);
    }
  };

  const handleAutoUpdate = async () => {
    setIsAutoUpdating(true);
    const toastId = toast.loading('Analisando projeto com IA...');
    try {
      const { data, error } = await supabase.functions.invoke('auto-update-project', {
        body: { project_id: project.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.dismiss(toastId);

      const actions = data?.actions as { action: string; status: string; detail?: string }[] | undefined;
      if (actions && actions.length > 0) {
        const okActions = actions.filter(a => a.status === 'ok');
        const errorActions = actions.filter(a => a.status === 'error');
        const lines: string[] = [];
        okActions.forEach(a => lines.push(`✓ ${a.action}${a.detail ? ` — ${a.detail}` : ''}`));
        errorActions.forEach(a => lines.push(`✗ ${a.action}${a.detail ? ` — ${a.detail}` : ''}`));
        
        toast.success('Projeto atualizado!', {
          description: lines.join('\n'),
          duration: 8000,
        });
      } else {
        toast.success(data?.summary || 'Projeto atualizado com sucesso!', { duration: 6000 });
      }

      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      queryClient.invalidateQueries({ queryKey: ['project-finance', project.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err?.message || 'Erro ao executar atualização automática');
    } finally {
      setIsAutoUpdating(false);
    }
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
      <div className="glass-card rounded-2xl md:rounded-3xl overflow-hidden">
        <ProjectBannerSection
          projectId={project.id}
          bannerUrl={bannerUrl}
          logoUrl={logoUrl}
          onEditProject={handleEdit}
        />

        <div className="p-4 md:p-6">
          <div className="flex flex-col gap-4">
            {/* Action bar — 3 tiers: Primary CTA | Secondary group | Ferramentas dropdown + overflow */}
            <div className="flex items-center justify-end gap-2 flex-wrap">
              {/* Tier 1 — Primary CTA */}
              <Button
                size="sm"
                onClick={handleAutoUpdate}
                disabled={isAutoUpdating}
                className="h-9 gap-2 shadow-lg shadow-primary/20"
              >
                {isAutoUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isAutoUpdating ? 'Atualizando...' : 'Atualizar Projeto'}
              </Button>

              {/* Tier 2 — Secondary visible actions */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSendToClientOpen(true)}
                className="h-9 hidden sm:flex gap-2"
              >
                <Send className="w-4 h-4" />
                Enviar ao Cliente
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setUploadDialogOpen(true)}
                className="h-9 hidden sm:flex gap-2"
              >
                <Upload className="w-4 h-4" />
                Material
              </Button>

              {/* Tier 3 — Ferramentas consolidated dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-9 gap-2">
                    <Wrench className="w-4 h-4" />
                    <span className="hidden sm:inline">Ferramentas</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {/* AI section */}
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Inteligência Artificial</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setCommandCenterOpen(true)}>
                    <Wand2 className="w-4 h-4 mr-2 text-primary" />
                    Comando IA
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleSyncFinance}
                    disabled={isSyncingFinance}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 text-primary ${isSyncingFinance ? 'animate-spin' : ''}`} />
                    {isSyncingFinance ? 'Sincronizando...' : 'Sincronizar Financeiro'}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Sharing & Export section */}
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Compartilhar</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={handleOpenPortal}
                    disabled={createLink.isPending}
                  >
                    {createLink.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-2" />}
                    Portal do Cliente
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleCopyPortalLink}
                    disabled={createLink.isPending}
                  >
                    {createLink.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
                    Copiar Link
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => exportProject(project.id)}
                    disabled={isExporting}
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                    Exportar PDF
                  </DropdownMenuItem>

                  {/* Mobile-only: actions hidden on desktop */}
                  <div className="sm:hidden">
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSendToClientOpen(true)}>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar ao Cliente
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setUploadDialogOpen(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar Material
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Overflow — lifecycle actions (edit, archive, delete) */}
              <ProjectActionsMenu project={project} showOpenOption={false} />
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
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

            {/* Project identity */}
            <div className="flex items-center gap-3">
              <div className="relative group flex-shrink-0">
                <input type="file" ref={logoInputRef} hidden accept="image/*" onChange={handleLogoUpload} />
                <button 
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="w-14 h-14 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center transition-all overflow-hidden bg-muted/30"
                >
                  {isUploadingLogo ? (
                    <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                  ) : logoUrl ? (
                    <>
                      <img src={logoUrl} alt="Logo do projeto" className="w-full h-full object-contain p-1" />
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
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-muted-foreground">{project.client_name || 'Sem cliente'}</p>
                  {(project as any).brand_name && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                      {(project as any).brand_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-5 pt-5 border-t border-border/50">
            {/* Contract Value — inline editable */}
            <div
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 group cursor-pointer"
              onClick={() => { if (!isEditingValue) handleStartEditValue(); }}
              title="Clique para editar o valor do contrato"
            >
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                {isEditingValue ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-muted-foreground shrink-0">R$</span>
                    <Input
                      autoFocus
                      type="number"
                      min={0}
                      step={0.01}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveValue();
                        if (e.key === "Escape") handleCancelEditValue();
                      }}
                      className="h-7 text-sm px-1.5 w-28 bg-background"
                    />
                    <button
                      onClick={handleSaveValue}
                      disabled={isSavingValue}
                      className="text-emerald-500 hover:text-emerald-400 p-0.5"
                    >
                      {isSavingValue ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={handleCancelEditValue}
                      className="text-muted-foreground hover:text-foreground p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <p className="text-base md:text-lg font-medium text-foreground truncate">
                      {formatCurrency(project.contract_value || 0)}
                    </p>
                    <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                )}
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
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-primary" />
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

      <UploadMaterialDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        projectId={project.id}
      />

      <SendToClientModal
        open={sendToClientOpen}
        onOpenChange={setSendToClientOpen}
        project={project}
      />
    </>
  );
}
