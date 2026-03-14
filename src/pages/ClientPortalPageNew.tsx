/**
 * ClientPortalPage - Portal do Cliente Premium com animações impactantes
 * Scroll reveal, parallax, 3D effects, magnetic interactions
 */

import { useParams } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { Loader2, Lock, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClientPortalEnhanced } from "@/hooks/useClientPortalEnhanced";
import { PortalHeaderPremium } from "@/components/client-portal/PortalHeaderPremium";
import { PortalMetricsGrid } from "@/components/client-portal/PortalMetricsGrid";
import { PortalTabsPremium, TabsContent } from "@/components/client-portal/PortalTabsPremium";
import { PortalOverviewPremium } from "@/components/client-portal/PortalOverviewPremium";
import { PortalFooterPremium } from "@/components/client-portal/PortalFooterPremium";
import { PortalMaterialsAside } from "@/components/client-portal/PortalMaterialsAside";
import { PortalAuditBadge } from "@/components/client-portal/PortalAuditBadge";
import { PortalNextSteps } from "@/components/client-portal/PortalNextSteps";
import { PortalClientUploads } from "@/components/client-portal/PortalClientUploads";
import { PortalRevisionsTab } from "@/components/client-portal/portal-tabs/PortalRevisionsTab";
import { PortalScheduleTab } from "@/components/client-portal/portal-tabs/PortalScheduleTab";
import { PortalFilesTab } from "@/components/client-portal/portal-tabs/PortalFilesTab";
import { PortalTasksTab } from "@/components/client-portal/portal-tabs/PortalTasksTab";
import { PortalActivityTab } from "@/components/client-portal/portal-tabs/PortalActivityTab";
import { PortalDocumentsTab } from "@/components/client-portal/portal-tabs/PortalDocumentsTab";
import { PortalFinancialTab } from "@/components/client-portal/portal-tabs/PortalFinancialTab";
import { PortalMessagesTab } from "@/components/client-portal/portal-tabs/PortalMessagesTab";
import { PortalMaterialsTab } from "@/components/client-portal/portal-materials";
import { PortalFeedbackWidget } from "@/components/client-portal/PortalFeedbackWidget";
import { PortalProjectRoadmap } from "@/components/timeline/PortalProjectRoadmap";
import { ScrollReveal, StaggerContainer, StaggerItem, Floating, GlowCard } from "@/components/client-portal/animations";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Lightweight background particles (reduced from 20 to 6)
const PARTICLE_POSITIONS = [
  { left: '15%', top: '20%' }, { left: '75%', top: '10%' }, { left: '45%', top: '60%' },
  { left: '85%', top: '45%' }, { left: '25%', top: '80%' }, { left: '60%', top: '35%' },
];

function BackgroundParticles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {PARTICLE_POSITIONS.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/20"
          style={pos}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export default function ClientPortalPage() {
  const { shareToken } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax scroll effects
  const { scrollYProgress } = useScroll({ container: containerRef });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const springBackgroundY = useSpring(backgroundY, { stiffness: 100, damping: 30 });

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
  const tasks = data?.tasks || [];
  const timelineEvents = data?.timelineEvents || [];

  // Filter client uploads
  const clientUploads = deliverables.filter(d => d.uploaded_by_client);

  // Calculate pending revisions for badge
  const pendingRevisionsCount = changeRequests.filter(cr => cr.status === 'open').length +
    comments.filter(c => c.status === 'revision_requested' || c.status === 'open').length;

  const pendingTasksCount = tasks.filter(t => t.status === 'in_progress').length;

  // Tab badges configuration
  const tabBadges = {
    revisions: pendingRevisionsCount > 0 ? { count: pendingRevisionsCount, variant: 'warning' as const } : undefined,
    tasks: pendingTasksCount > 0 ? { count: pendingTasksCount, variant: 'default' as const } : undefined,
    activity: timelineEvents.length > 0 ? { count: timelineEvents.length, variant: 'success' as const } : undefined,
  };

  const handleExportPdf = async () => {
    if (!project) return;
    
    setIsExporting(true);
    const toastId = toast.loading("Gerando PDF do portal...");
    
    try {
      const { data: result, error } = await supabase.functions.invoke('export-pdf', {
        body: { type: 'portal', id: project.id, token: shareToken }
      });
      
      if (error) throw error;
      if (!result?.success) throw new Error(result?.error || "Falha ao gerar PDF");
      
      const url = result.signed_url || result.public_url;
      if (url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Falha ao baixar PDF");
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `portal_${project.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'export'}.pdf`;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(blobUrl); }, 250);
      }
      toast.success("PDF gerado com sucesso!", { id: toastId });
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error("Erro ao gerar PDF", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddComment = (data: { 
    authorName: string; 
    authorEmail?: string; 
    content: string;
    timecode?: string;
    priority?: string;
    frameTimestampMs?: number;
    screenshotUrl?: string;
  }) => {
    if (!selectedMaterialId) return;
    addComment({
      deliverableId: selectedMaterialId,
      authorName: data.authorName,
      authorEmail: data.authorEmail,
      content: data.content,
      timecode: data.timecode,
      priority: data.priority,
      frameTimestampMs: data.frameTimestampMs,
      screenshotUrl: data.screenshotUrl,
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

  const handleRequestRevision = (data: { 
    deliverableId?: string;
    authorName: string; 
    authorEmail?: string; 
    content: string;
    timecode?: string;
    priority?: string;
    frameTimestampMs?: number;
    screenshotUrl?: string;
  }) => {
    const targetId = data.deliverableId || selectedMaterialId;
    if (!targetId) return;
    requestRevision({
      deliverableId: targetId,
      authorName: data.authorName,
      authorEmail: data.authorEmail,
      content: data.content,
      timecode: data.timecode,
      priority: data.priority,
      frameTimestampMs: data.frameTimestampMs,
      screenshotUrl: data.screenshotUrl,
    });
  };

  const handleClientUpload = async (uploadData: {
    type: 'youtube' | 'link' | 'file';
    title: string;
    description?: string;
    url?: string;
    file?: File;
  }) => {
    if (!portal?.id || !shareToken) {
      toast.error("Portal não carregado");
      return;
    }

    try {
      console.log('[Portal Upload] Starting upload:', { type: uploadData.type, title: uploadData.title, hasFile: !!uploadData.file });

      const formData = new FormData();
      formData.append('shareToken', shareToken);
      formData.append('title', uploadData.title);
      formData.append('type', uploadData.type);
      formData.append('clientName', 'Cliente');
      formData.append('requestId', `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
      
      if (uploadData.description) formData.append('description', uploadData.description);
      if (uploadData.url) formData.append('url', uploadData.url);
      if (uploadData.file) formData.append('file', uploadData.file, uploadData.file.name);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/portal-upload-material`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        console.error('[Portal Upload] Server error:', errData);
        throw new Error(errData.error || `Upload failed (${response.status})`);
      }

      const result = await response.json();
      console.log('[Portal Upload] Success:', result);

      if (!result.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Refresh portal data
      queryClient.invalidateQueries({ queryKey: ['client-portal', shareToken] });
      toast.success("Material enviado com sucesso!");
    } catch (err) {
      console.error('[Portal Upload] Error:', err);
      toast.error(err instanceof Error ? err.message : "Erro ao enviar material");
      throw err;
    }
  };

  // Loading state with animated loader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center overflow-hidden">
        <BackgroundParticles />
        <motion.div 
          className="text-center space-y-6 relative z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Floating duration={2} distance={8}>
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-8 h-8 text-primary" />
              </motion.div>
            </div>
          </Floating>
          <motion.p 
            className="text-sm text-muted-foreground"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Carregando seu portal...
          </motion.p>
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <BackgroundParticles />
        <motion.div 
          className="bg-card border border-border p-10 max-w-md text-center space-y-4 relative z-10"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <motion.div 
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto",
              isInactive ? "bg-muted" : isExpired ? "bg-muted" : "bg-destructive/20"
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            {isInactive ? (
              <Lock className="w-8 h-8 text-muted-foreground" />
            ) : (
              <AlertTriangle className={cn("w-8 h-8", isExpired ? "text-muted-foreground" : "text-destructive")} />
            )}
          </motion.div>
          <motion.h1 
            className="text-xl font-light text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {isInactive ? 'Portal Desativado' : isExpired ? 'Link Expirado' : 'Link Inválido'}
          </motion.h1>
          <motion.p 
            className="text-muted-foreground text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {isInactive 
              ? 'O acesso ao portal está temporariamente desativado.'
              : isExpired 
                ? 'O link de acesso expirou. Solicite um novo link à equipe.'
                : 'Este link não é válido. Entre em contato com a equipe.'}
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="holo min-h-[100dvh] h-[100dvh] overflow-y-auto bg-background scroll-smooth relative"
      data-platform="portal"
    >
      {/* Holographic Ambient Glow */}
      <div className="holo-ambient" />
      
      {/* Animated Background - desktop only */}
      <div className="hidden md:block">
        <BackgroundParticles />
      </div>
      
      {/* Background Gradient that moves with scroll */}
      <motion.div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{ 
          y: springBackgroundY,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(6, 182, 212, 0.05) 0%, transparent 50%)',
        }}
      />

      <div className="world-stage max-w-[1400px] xl:max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8 relative z-10 pb-8">
        {/* Header */}
        <PortalHeaderPremium
          project={project}
          shareToken={shareToken || ''}
          onExportPdf={handleExportPdf}
          isExporting={isExporting}
        />

        {/* Metrics Grid */}
        <div className="mt-4 md:mt-8">
          <PortalMetricsGrid project={project} />
        </div>

        {/* Tabs */}
        <div className="mt-6 md:mt-12">
          <PortalTabsPremium activeTab={activeTab} onTabChange={setActiveTab} badges={tabBadges}>
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-8 xl:col-span-9 space-y-4 md:space-y-6">
                      <PortalOverviewPremium 
                        project={project} 
                        stages={stages}
                        deliverables={deliverables}
                        isManager={false}
                        onReviewNow={(deliverableId) => {
                          setSelectedMaterialId(deliverableId);
                          setActiveTab("materials");
                        }}
                      />
                      <PortalClientUploads
                        clientUploads={clientUploads}
                        onUpload={handleClientUpload}
                        isUploading={isUploadingMaterial}
                      />
                    </div>
                    
                    {/* Sidebar */}
                    <div className="lg:col-span-4 xl:col-span-3 space-y-4 md:space-y-6">
                      <PortalMaterialsAside deliverables={deliverables} files={files} />
                      <PortalProjectRoadmap
                        stages={stages.map(s => ({
                          id: s.id,
                          name: s.title || s.stage_key,
                          status: s.status as any,
                          plannedEnd: s.planned_end || undefined,
                          progress: s.status === 'done' ? 100 : s.status === 'in_progress' ? 50 : 0,
                        }))}
                        projectName={project.name}
                        dueDate={project.due_date}
                      />
                      <PortalNextSteps stages={stages} currentStageKey={project.stage_current} />
                      <PortalAuditBadge />
                      <PortalFeedbackWidget
                        portalLinkId={portal.id}
                        projectId={project.id}
                        entityType="general"
                        title="Como está sua experiência?"
                        subtitle="Sua opinião nos ajuda a melhorar."
                      />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials" className="mt-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key="materials"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
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
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="mt-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key="messages"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <PortalMessagesTab
                    comments={comments}
                    timelineEvents={timelineEvents}
                    onSendMessage={(data) => {
                      // Use addComment as message channel
                      if (!deliverables[0]?.id) return;
                      addComment({
                        deliverableId: deliverables[0].id,
                        authorName: data.authorName,
                        content: data.content,
                      });
                    }}
                    isSending={isAddingComment}
                  />
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="mt-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key="tasks"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <PortalTasksTab tasks={tasks} />
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key="activity"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <PortalActivityTab events={timelineEvents} />
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            {/* Revisions Tab */}
            <TabsContent value="revisions" className="mt-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key="revisions"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <PortalRevisionsTab 
                    changeRequests={changeRequests} 
                    comments={comments}
                    deliverables={deliverables}
                    onNavigateToMaterial={(materialId) => {
                      setActiveTab('materials');
                    }}
                  />
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="mt-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key="documents"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <PortalDocumentsTab files={files} deliverables={deliverables} />
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="mt-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key="financial"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <PortalFinancialTab project={project} />
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="mt-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key="files"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <PortalFilesTab files={files} />
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="mt-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key="schedule"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <PortalScheduleTab stages={stages} dueDate={project.due_date} />
                </motion.div>
              </AnimatePresence>
            </TabsContent>
          </PortalTabsPremium>
        </ScrollReveal>
      </div>

      {/* Footer */}
      <ScrollReveal delay={0.5}>
        <PortalFooterPremium />
      </ScrollReveal>
    </div>
  );
}
