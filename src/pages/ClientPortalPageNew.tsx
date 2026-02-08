/**
 * ClientPortalPage - Portal do Cliente (acesso externo)
 * 
 * Página pública acessível via token (/client/:shareToken)
 * 
 * Funcionalidades:
 * - Visualização de materiais/vídeos do projeto
 * - Comentários em tempo real
 * - Aprovação de entregas
 * - Solicitação de ajustes
 * - Timeline de versões
 * 
 * Realtime: Atualiza automaticamente quando gestor publica nova versão
 */

import { useParams } from "react-router-dom";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  AlertTriangle, 
  Lock, 
  Loader2, 
  Play, 
  FileText, 
  Image, 
  Download,
  DollarSign,
  Activity,
  Calendar,
  User,
  CheckCircle2,
  MessageSquare,
  ExternalLink,
  Film
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import squadHubLogo from "@/assets/squad-hub-logo.png";
import { useClientPortalEnhanced } from "@/hooks/useClientPortalEnhanced";
import { PortalMaterialsSection, PortalMaterial } from "@/components/client-portal/PortalMaterialsSection";
import { PortalFeedbackPanel } from "@/components/client-portal/PortalFeedbackPanel";
import { PortalChangeRequests, ChangeRequest } from "@/components/client-portal/PortalChangeRequests";
import { PortalVersionsTimeline, DeliverableVersion } from "@/components/client-portal/PortalVersionsTimeline";
import { PortalOverviewSection } from "@/components/client-portal/PortalOverviewSection";
import { PortalProjectStages } from "@/components/client-portal/PortalProjectStages";

// Stage name mapping
const STAGE_NAMES: Record<string, string> = {
  briefing: 'Briefing',
  roteiro: 'Roteiro',
  pre_producao: 'Pré-Produção',
  captacao: 'Captação',
  edicao: 'Edição',
  revisao: 'Revisão',
  aprovacao: 'Aprovação',
  entrega: 'Entrega',
  pos_venda: 'Pós-Venda',
};

// Format currency
function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(value);
}

export default function ClientPortalPage() {
  const { shareToken } = useParams();
  const {
    data,
    isLoading,
    error,
    addComment,
    isAddingComment,
    approveDeliverable,
    isApproving,
    requestRevision,
    isRequestingRevision,
    createChangeRequest,
    isCreatingChangeRequest,
  } = useClientPortalEnhanced(shareToken);

  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);

  // All hooks must be called before any conditional returns
  // Extract data safely with fallbacks
  const portal = data?.portal;
  const project = data?.project;
  const stages = data?.stages || [];
  const deliverables = data?.deliverables || [];
  const files = data?.files || [];
  const comments = data?.comments || [];
  const approvals = data?.approvals || [];
  const changeRequests = data?.changeRequests || [];
  const versions = data?.versions || [];

  const hasPaymentBlock = portal?.blocked_by_payment || project?.has_payment_block;
  const stageName = project?.stage_current ? (STAGE_NAMES[project.stage_current] || project.stage_current) : null;

  // Combine deliverables and files into materials
  const materials: PortalMaterial[] = useMemo(() => {
    const fromDeliverables: PortalMaterial[] = deliverables.map(d => ({
      id: d.id,
      type: d.youtube_url ? 'youtube' : d.external_url ? 'link' : d.type?.includes('video') ? 'video' : 'file',
      title: d.title,
      description: d.description,
      file_url: d.file_url,
      youtube_url: d.youtube_url,
      external_url: d.external_url,
      thumbnail_url: d.thumbnail_url,
      status: d.status,
      awaiting_approval: d.awaiting_approval,
      current_version: d.current_version,
      created_at: d.created_at,
    }));

    const fromFiles: PortalMaterial[] = files.map(f => ({
      id: f.id,
      type: 'file' as const,
      title: f.name,
      file_url: f.file_url,
      file_type: f.file_type,
      status: 'pending',
      folder: f.folder,
      created_at: f.created_at,
    }));

    // Sort by created_at descending
    return [...fromDeliverables, ...fromFiles].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [deliverables, files]);

  // Get approved IDs
  const approvedIds = useMemo(() => {
    const ids = new Set<string>();
    approvals.forEach(a => {
      if (a.deliverable_id) ids.add(a.deliverable_id);
      if (a.project_file_id) ids.add(a.project_file_id);
    });
    return Array.from(ids);
  }, [approvals]);

  // Get comment counts
  const commentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    comments.forEach(c => {
      const key = c.deliverable_id || c.project_file_id;
      if (key) {
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [comments]);

  // Selected material data
  const selectedMaterial = materials.find(m => m.id === selectedMaterialId);
  const selectedComments = comments.filter(c => 
    c.deliverable_id === selectedMaterialId || c.project_file_id === selectedMaterialId
  );
  const selectedApproval = approvals.find(a => 
    a.deliverable_id === selectedMaterialId || a.project_file_id === selectedMaterialId
  );
  const selectedVersions = versions.filter(v => v.deliverable_id === selectedMaterialId);

  // Determine if selected is a deliverable or file
  const isDeliverable = deliverables.some(d => d.id === selectedMaterialId);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando portal...</p>
        </div>
      </div>
    );
  }

  // Invalid or expired link
  if (error || !data || !portal) {
    const errorMessage = error?.message || 'Portal not found';
    const isExpired = errorMessage.includes('expired');
    const isInactive = errorMessage.includes('inactive');

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl p-8 max-w-md text-center space-y-4">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mx-auto",
            isInactive ? "bg-muted" : isExpired ? "bg-amber-500/20" : "bg-destructive/20"
          )}>
            {isInactive ? (
              <Lock className="w-8 h-8 text-muted-foreground" />
            ) : (
              <AlertTriangle className={cn("w-8 h-8", isExpired ? "text-amber-500" : "text-destructive")} />
            )}
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {isInactive ? 'Portal Desativado' : isExpired ? 'Link Expirado' : 'Link Inválido'}
          </h1>
          <p className="text-muted-foreground">
            {isInactive 
              ? 'O acesso ao portal está temporariamente desativado.'
              : isExpired 
                ? 'O link de acesso expirou. Solicite um novo link à equipe.'
                : 'Este link não é válido. Entre em contato com a equipe.'}
          </p>
        </div>
      </div>
    );
  }

  // Handlers
  const handleAddComment = ({ authorName, authorEmail, content }: { authorName: string; authorEmail?: string; content: string }) => {
    if (!selectedMaterialId) return;
    addComment({
      deliverableId: isDeliverable ? selectedMaterialId : undefined,
      fileId: !isDeliverable ? selectedMaterialId : undefined,
      authorName,
      authorEmail,
      content,
    });
  };

  const handleApprove = ({ approvedByName, approvedByEmail, notes }: { approvedByName: string; approvedByEmail?: string; notes?: string }) => {
    if (!selectedMaterialId) return;
    approveDeliverable({
      deliverableId: isDeliverable ? selectedMaterialId : undefined,
      fileId: !isDeliverable ? selectedMaterialId : undefined,
      approvedByName,
      approvedByEmail,
      notes,
    });
  };

  const handleRequestRevision = ({ authorName, authorEmail, content }: { authorName: string; authorEmail?: string; content: string }) => {
    if (!selectedMaterialId) return;
    requestRevision({
      deliverableId: isDeliverable ? selectedMaterialId : undefined,
      fileId: !isDeliverable ? selectedMaterialId : undefined,
      authorName,
      authorEmail,
      content,
    });
  };

  const handleCreateChangeRequest = ({ title, description, authorName, authorEmail, priority }: {
    title: string;
    description?: string;
    authorName: string;
    authorEmail?: string;
    priority?: string;
  }) => {
    createChangeRequest({
      deliverableId: selectedMaterialId && isDeliverable ? selectedMaterialId : undefined,
      title,
      description,
      authorName,
      authorEmail,
      priority: priority as any,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {project?.logo_url ? (
                <img 
                  src={project.logo_url} 
                  alt="Logo" 
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <img 
                  src={squadHubLogo} 
                  alt="SQUAD Hub" 
                  className="h-8 w-auto object-contain"
                />
              )}
              <div className="hidden sm:block h-6 w-px bg-border" />
              <div className="hidden sm:block">
                <h1 className="font-semibold text-foreground">{project?.name || portal.project_name || 'Projeto'}</h1>
                <p className="text-xs text-muted-foreground">{project?.client_name || portal.client_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {stageName && (
                <Badge className="text-xs bg-primary/20 text-primary border-0">
                  {stageName}
                </Badge>
              )}
              {hasPaymentBlock && (
                <Badge variant="destructive" className="text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  Bloqueado
                </Badge>
              )}
            </div>
          </div>
          {/* Mobile Project Name */}
          <div className="sm:hidden mt-3">
            <h1 className="font-semibold text-foreground">{project?.name || portal.project_name || 'Projeto'}</h1>
            <p className="text-xs text-muted-foreground">{project?.client_name || portal.client_name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Project Info Cards - Main Metrics */}
        {project && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-violet-500" />
                </div>
                <span className="text-[9px] font-bold text-violet-500 uppercase">Valor</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {project.contract_value ? formatCurrency(project.contract_value) : '--'}
              </p>
              <p className="text-[10px] text-muted-foreground">Valor do Contrato</p>
            </div>

            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-[9px] font-bold text-emerald-500 uppercase">Saúde</span>
              </div>
              <p className={cn(
                "text-lg font-bold",
                (project.health_score || 0) >= 90 ? 'text-emerald-500' :
                (project.health_score || 0) >= 70 ? 'text-amber-500' : 'text-red-500'
              )}>
                {project.health_score ?? 100}%
              </p>
              <p className="text-[10px] text-muted-foreground">Health Score</p>
            </div>

            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[9px] font-bold text-primary uppercase">Entrega</span>
              </div>
              <p className="text-sm font-bold text-foreground">
                {project.due_date ? format(new Date(project.due_date), "dd/MM/yyyy") : '--'}
              </p>
              <p className="text-[10px] text-muted-foreground">Data de Entrega</p>
            </div>

            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-[9px] font-bold text-amber-500 uppercase">Responsável</span>
              </div>
              <p className="text-sm font-bold text-foreground truncate">
                {project.owner_name || '--'}
              </p>
              <p className="text-[10px] text-muted-foreground">Gerente do Projeto</p>
            </div>
          </div>
        )}

        {/* Payment Block Alert */}
        {hasPaymentBlock && (
          <div className="glass-card rounded-2xl p-6 border-amber-500/30 bg-amber-500/5 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Projeto Bloqueado por Inadimplência</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Existe uma fatura em atraso vinculada a este projeto. A entrega final está bloqueada até regularização.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Overview Section - Extended Metrics, Briefing */}
        {project && (
          <div className="mb-6">
            <PortalOverviewSection
              project={project}
              stages={stages}
              hasPaymentBlock={hasPaymentBlock}
            />
          </div>
        )}

        {/* Project Stages Pipeline */}
        {(stages.length > 0 || project?.stage_current) && (
          <div className="mb-6">
            <PortalProjectStages
              stages={stages}
              currentStageKey={project?.stage_current}
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Materials */}
          <div className="lg:col-span-2 space-y-6">
            <PortalMaterialsSection
              materials={materials}
              onSelectMaterial={(m) => setSelectedMaterialId(m.id)}
              selectedMaterialId={selectedMaterialId}
              approvedIds={approvedIds}
              commentCounts={commentCounts}
            />

            {/* Change Requests Section */}
            <PortalChangeRequests
              requests={changeRequests as ChangeRequest[]}
              onCreateRequest={handleCreateChangeRequest}
              isCreating={isCreatingChangeRequest}
              isClientView={true}
            />
          </div>

          {/* Right Column - Feedback & Versions */}
          <div className="space-y-6">
            {selectedMaterial ? (
              <>
                <PortalFeedbackPanel
                  materialId={selectedMaterialId!}
                  materialTitle={selectedMaterial.title}
                  comments={selectedComments}
                  approval={selectedApproval}
                  onAddComment={handleAddComment}
                  onApprove={handleApprove}
                  onRequestRevision={handleRequestRevision}
                  isAddingComment={isAddingComment}
                  isApproving={isApproving}
                  isRequestingRevision={isRequestingRevision}
                  hasPaymentBlock={hasPaymentBlock}
                />

                {selectedVersions.length > 0 && (
                  <PortalVersionsTimeline
                    versions={selectedVersions as DeliverableVersion[]}
                    currentVersion={selectedMaterial.current_version || 1}
                  />
                )}
              </>
            ) : (
              <div className="glass-card rounded-2xl p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Selecione um Material</h3>
                <p className="text-sm text-muted-foreground">
                  Clique em um material à esquerda para visualizar e enviar feedback.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by <span className="font-semibold text-foreground">SQUAD Hub</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
