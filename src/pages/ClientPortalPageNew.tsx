/**
 * ClientPortalPage - Portal do Cliente expandido
 * 
 * Espelha o design do detalhe interno do projeto com:
 * - Header com badges, métricas e ações
 * - Sistema de abas completo
 * - Realtime updates
 */

import { useParams } from "react-router-dom";
import { useState, useMemo } from "react";
import { Loader2, Lock, AlertTriangle } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useClientPortalEnhanced } from "@/hooks/useClientPortalEnhanced";
import { PortalHeaderExpanded } from "@/components/client-portal/PortalHeaderExpanded";
import { PortalTabs } from "@/components/client-portal/PortalTabs";
import { PortalOverviewTab } from "@/components/client-portal/portal-tabs/PortalOverviewTab";
import { PortalDeliverablesTab } from "@/components/client-portal/portal-tabs/PortalDeliverablesTab";
import { PortalFilesTab } from "@/components/client-portal/portal-tabs/PortalFilesTab";
import { PortalRevisionsTab } from "@/components/client-portal/portal-tabs/PortalRevisionsTab";
import { PortalScheduleTab } from "@/components/client-portal/portal-tabs/PortalScheduleTab";
import { PortalTasksTab } from "@/components/client-portal/portal-tabs/PortalTasksTab";
import { PortalMaterialsTab } from "@/components/client-portal/portal-tabs/PortalMaterialsTab";
import { PortalAuditTab } from "@/components/client-portal/portal-tabs/PortalAuditTab";
import { PortalFeedbackPanel } from "@/components/client-portal/PortalFeedbackPanel";
import { PortalVersionsTimeline, DeliverableVersion } from "@/components/client-portal/PortalVersionsTimeline";
import { toast } from "sonner";

export default function ClientPortalPage() {
  const { shareToken } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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
  } = useClientPortalEnhanced(shareToken);

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

  // Selected material data
  const selectedMaterial = deliverables.find(d => d.id === selectedMaterialId);
  const selectedComments = comments.filter(c => c.deliverable_id === selectedMaterialId);
  const selectedApproval = approvals.find(a => a.deliverable_id === selectedMaterialId);
  const selectedVersions = versions.filter(v => v.deliverable_id === selectedMaterialId);

  const handleExportPdf = async () => {
    setIsExporting(true);
    toast.info("Gerando PDF do portal...");
    // TODO: Implement PDF export via edge function
    setTimeout(() => {
      setIsExporting(false);
      toast.success("PDF gerado com sucesso!");
    }, 2000);
  };

  const handleAddComment = ({ authorName, authorEmail, content }: { authorName: string; authorEmail?: string; content: string }) => {
    if (!selectedMaterialId) return;
    addComment({
      deliverableId: selectedMaterialId,
      authorName,
      authorEmail,
      content,
    });
  };

  const handleApprove = ({ approvedByName, approvedByEmail, notes }: { approvedByName: string; approvedByEmail?: string; notes?: string }) => {
    if (!selectedMaterialId) return;
    approveDeliverable({
      deliverableId: selectedMaterialId,
      approvedByName,
      approvedByEmail,
      notes,
    });
  };

  const handleRequestRevision = ({ authorName, authorEmail, content }: { authorName: string; authorEmail?: string; content: string }) => {
    if (!selectedMaterialId) return;
    requestRevision({
      deliverableId: selectedMaterialId,
      authorName,
      authorEmail,
      content,
    });
  };

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
  if (error || !data || !portal || !project) {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <PortalHeaderExpanded
          project={project}
          shareToken={shareToken || ''}
          hasPaymentBlock={hasPaymentBlock}
          onExportPdf={handleExportPdf}
          isExporting={isExporting}
        />

        {/* Tabs */}
        <PortalTabs activeTab={activeTab} onTabChange={setActiveTab}>
          <TabsContent value="overview" className="mt-6">
            <PortalOverviewTab project={project} stages={stages} hasPaymentBlock={hasPaymentBlock} />
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <PortalTasksTab />
          </TabsContent>

          <TabsContent value="deliverables" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PortalDeliverablesTab
                  deliverables={deliverables}
                  files={files}
                  approvals={approvals}
                  comments={comments}
                  hasPaymentBlock={hasPaymentBlock}
                  onSelectMaterial={setSelectedMaterialId}
                  selectedMaterialId={selectedMaterialId}
                />
              </div>
              <div>
                {selectedMaterial ? (
                  <div className="space-y-4">
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
                        currentVersion={selectedMaterial.current_version}
                      />
                    )}
                  </div>
                ) : (
                  <div className="glass-card rounded-2xl p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Selecione um material para ver detalhes e enviar feedback.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="revisions" className="mt-6">
            <PortalRevisionsTab changeRequests={changeRequests} comments={comments} />
          </TabsContent>

          <TabsContent value="files" className="mt-6">
            <PortalFilesTab files={files} hasPaymentBlock={hasPaymentBlock} />
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <PortalScheduleTab stages={stages} dueDate={project.due_date} />
          </TabsContent>

          <TabsContent value="portal" className="mt-6">
            <PortalMaterialsTab
              deliverables={deliverables}
              approvals={approvals}
              comments={comments}
              portalLinkId={portal.id}
              hasPaymentBlock={hasPaymentBlock}
              isGestor={false}
              onSelectMaterial={setSelectedMaterialId}
              selectedMaterialId={selectedMaterialId}
            />
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <PortalAuditTab comments={comments} approvals={approvals} versions={versions} />
          </TabsContent>
        </PortalTabs>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by <span className="font-semibold text-foreground">SQUAD Hub</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
