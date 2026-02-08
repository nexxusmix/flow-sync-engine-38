/**
 * ClientPortalPage - Portal do Cliente Premium
 * Layout idêntico ao HTML de referência com sidebar
 */

import { useParams } from "react-router-dom";
import { useState } from "react";
import { Loader2, Lock, AlertTriangle } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useClientPortalEnhanced } from "@/hooks/useClientPortalEnhanced";
import { PortalBlockBanner } from "@/components/client-portal/PortalBlockBanner";
import { PortalHeaderPremium } from "@/components/client-portal/PortalHeaderPremium";
import { PortalMetricsGrid } from "@/components/client-portal/PortalMetricsGrid";
import { PortalTabsPremium } from "@/components/client-portal/PortalTabsPremium";
import { PortalOverviewPremium } from "@/components/client-portal/PortalOverviewPremium";
import { PortalDeliverablesPremium } from "@/components/client-portal/PortalDeliverablesPremium";
import { PortalFooterPremium } from "@/components/client-portal/PortalFooterPremium";
import { PortalMaterialsAside } from "@/components/client-portal/PortalMaterialsAside";
import { PortalPaymentsAside } from "@/components/client-portal/PortalPaymentsAside";
import { PortalAuditBadge } from "@/components/client-portal/PortalAuditBadge";
import { PortalTasksTab } from "@/components/client-portal/portal-tabs/PortalTasksTab";
import { PortalRevisionsTab } from "@/components/client-portal/portal-tabs/PortalRevisionsTab";
import { PortalScheduleTab } from "@/components/client-portal/portal-tabs/PortalScheduleTab";
import { PortalAuditTab } from "@/components/client-portal/portal-tabs/PortalAuditTab";
import { PortalFilesTab } from "@/components/client-portal/portal-tabs/PortalFilesTab";
import { PortalFeedbackPanel } from "@/components/client-portal/PortalFeedbackPanel";
import { PortalVersionsTimeline, DeliverableVersion } from "@/components/client-portal/PortalVersionsTimeline";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
    if (!project) return;
    
    setIsExporting(true);
    toast.info("Gerando PDF do portal...");
    
    try {
      const { data: result, error } = await supabase.functions.invoke('export-universal-pdf', {
        body: { type: 'project', id: project.id }
      });
      
      if (error) throw error;
      
      if (result?.public_url) {
        window.open(result.public_url, '_blank');
        toast.success("PDF gerado com sucesso!");
      }
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error("Erro ao gerar PDF");
    } finally {
      setIsExporting(false);
    }
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
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto" />
          <p className="text-sm text-gray-500">Carregando portal...</p>
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
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-10 max-w-md text-center space-y-4">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mx-auto",
            isInactive ? "bg-gray-800" : isExpired ? "bg-amber-500/20" : "bg-red-500/20"
          )}>
            {isInactive ? (
              <Lock className="w-8 h-8 text-gray-500" />
            ) : (
              <AlertTriangle className={cn("w-8 h-8", isExpired ? "text-amber-500" : "text-red-500")} />
            )}
          </div>
          <h1 className="text-xl font-light text-white">
            {isInactive ? 'Portal Desativado' : isExpired ? 'Link Expirado' : 'Link Inválido'}
          </h1>
          <p className="text-gray-500 text-sm">
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
    <div className="min-h-screen bg-[#050505]">
      {/* Block Banner */}
      <PortalBlockBanner isVisible={!!hasPaymentBlock} />
      
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Header with badges and title */}
        <PortalHeaderPremium
          project={project}
          shareToken={shareToken || ''}
          hasPaymentBlock={hasPaymentBlock}
          onExportPdf={handleExportPdf}
          isExporting={isExporting}
        />

        {/* Metrics Grid */}
        <div className="mt-6">
          <PortalMetricsGrid project={project} />
        </div>

        {/* Tabs */}
        <div className="mt-10">
          <PortalTabsPremium activeTab={activeTab} onTabChange={setActiveTab}>
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-8">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2">
                  <PortalOverviewPremium 
                    project={project} 
                    stages={stages}
                    deliverables={deliverables}
                    hasPaymentBlock={hasPaymentBlock}
                    isManager={false}
                  />
                </div>
                
                {/* Sidebar */}
                <div className="space-y-6">
                  <PortalMaterialsAside deliverables={deliverables} files={files} />
                  <PortalPaymentsAside hasPaymentBlock={hasPaymentBlock} />
                  <PortalAuditBadge />
                </div>
              </div>
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="mt-8">
              <PortalTasksTab />
            </TabsContent>

            {/* Deliverables Tab */}
            <TabsContent value="deliverables" className="mt-8">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <PortalDeliverablesPremium
                    deliverables={deliverables}
                    approvals={approvals}
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
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-8 text-center">
                      <p className="text-sm text-gray-500">
                        Selecione uma entrega para ver detalhes e enviar feedback.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Revisions Tab */}
            <TabsContent value="revisions" className="mt-8">
              <PortalRevisionsTab changeRequests={changeRequests} comments={comments} />
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="mt-8">
              <PortalFilesTab files={files} hasPaymentBlock={hasPaymentBlock} />
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="mt-8">
              <PortalScheduleTab stages={stages} dueDate={project.due_date} />
            </TabsContent>

            {/* Audit Tab */}
            <TabsContent value="audit" className="mt-8">
              <PortalAuditTab comments={comments} approvals={approvals} versions={versions} />
            </TabsContent>
          </PortalTabsPremium>
        </div>
      </div>

      {/* Footer */}
      <PortalFooterPremium />
    </div>
  );
}
