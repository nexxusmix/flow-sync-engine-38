/**
 * ClientPortalPage - Portal do Cliente Premium com animações
 * Layout navegável com smooth scroll e transições
 */

import { useParams } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Lock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClientPortalEnhanced } from "@/hooks/useClientPortalEnhanced";
import { PortalHeaderPremium } from "@/components/client-portal/PortalHeaderPremium";
import { PortalMetricsGrid } from "@/components/client-portal/PortalMetricsGrid";
import { PortalTabsPremium, TabsContent } from "@/components/client-portal/PortalTabsPremium";
import { PortalOverviewPremium } from "@/components/client-portal/PortalOverviewPremium";
import { PortalFooterPremium } from "@/components/client-portal/PortalFooterPremium";
import { PortalMaterialsAside } from "@/components/client-portal/PortalMaterialsAside";
import { PortalAuditBadge } from "@/components/client-portal/PortalAuditBadge";
import { PortalClientUploads } from "@/components/client-portal/PortalClientUploads";
import { PortalRevisionsTab } from "@/components/client-portal/portal-tabs/PortalRevisionsTab";
import { PortalScheduleTab } from "@/components/client-portal/portal-tabs/PortalScheduleTab";
import { PortalFilesTab } from "@/components/client-portal/portal-tabs/PortalFilesTab";
import { PortalMaterialsTab } from "@/components/client-portal/portal-materials";
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
    uploadClientMaterial,
    isUploadingMaterial,
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

  // Filter client uploads
  const clientUploads = deliverables.filter(d => d.uploaded_by_client);

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

  const handleClientUpload = async (uploadData: {
    type: 'youtube' | 'link' | 'file';
    title: string;
    description?: string;
    url?: string;
    file?: File;
  }) => {
    if (!portal?.id) {
      toast.error("Portal não carregado");
      return;
    }

    try {
      let fileUrl = uploadData.url;

      // If it's a file, upload to storage first
      if (uploadData.type === 'file' && uploadData.file) {
        const fileName = `${Date.now()}-${uploadData.file.name}`;
        const { data: uploadResult, error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(`portal-uploads/${portal.id}/${fileName}`, uploadData.file);

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from('project-files')
          .getPublicUrl(uploadResult.path);

        fileUrl = publicUrl.publicUrl;
      }

      await uploadClientMaterial({
        portalLinkId: portal.id,
        title: uploadData.title,
        description: uploadData.description,
        type: uploadData.type,
        url: fileUrl,
        clientName: 'Cliente', // Could be enhanced with actual client name
      });

      toast.success("Material enviado com sucesso!");
    } catch (err) {
      console.error('Upload error:', err);
      toast.error("Erro ao enviar material");
      throw err;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto" />
          <p className="text-sm text-gray-500">Carregando portal...</p>
        </motion.div>
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
        <motion.div 
          className="bg-[#0a0a0a] border border-[#1a1a1a] p-10 max-w-md text-center space-y-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
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
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-[#050505] scroll-smooth">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Header with badges and title */}
        <PortalHeaderPremium
          project={project}
          shareToken={shareToken || ''}
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
                <div className="lg:col-span-2 space-y-6">
                  <PortalOverviewPremium 
                    project={project} 
                    stages={stages}
                    deliverables={deliverables}
                    isManager={false}
                  />
                  
                  {/* Client Uploads Section */}
                  <PortalClientUploads
                    clientUploads={clientUploads}
                    onUpload={handleClientUpload}
                    isUploading={isUploadingMaterial}
                  />
                </div>
                
                {/* Sidebar */}
                <div className="space-y-6">
                  <PortalMaterialsAside deliverables={deliverables} files={files} />
                  <PortalAuditBadge />
                </div>
              </div>
            </TabsContent>

            {/* Materials Tab (new) */}
            <TabsContent value="materials" className="mt-8">
              <PortalMaterialsTab
                deliverables={deliverables}
                comments={comments}
                approvals={approvals}
                versions={versions}
                selectedMaterialId={selectedMaterialId}
                onSelectMaterial={setSelectedMaterialId}
                onAddComment={handleAddComment}
                onApprove={handleApprove}
                onRequestRevision={handleRequestRevision}
                isAddingComment={isAddingComment}
                isApproving={isApproving}
                isRequestingRevision={isRequestingRevision}
                portalLinkId={portal.id}
                isManager={false}
              />
            </TabsContent>

            {/* Revisions Tab */}
            <TabsContent value="revisions" className="mt-8">
              <PortalRevisionsTab changeRequests={changeRequests} comments={comments} />
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="mt-8">
              <PortalFilesTab files={files} />
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="mt-8">
              <PortalScheduleTab stages={stages} dueDate={project.due_date} />
            </TabsContent>
          </PortalTabsPremium>
        </div>
      </div>

      {/* Footer */}
      <PortalFooterPremium />
    </div>
  );
}
