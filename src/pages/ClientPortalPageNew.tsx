/**
 * ClientPortalPage - Portal do Cliente Premium com animações impactantes
 * Scroll reveal, parallax, 3D effects, magnetic interactions
 */

import { useParams } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
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
import { PortalMaterialsTab } from "@/components/client-portal/portal-materials";
import { ScrollReveal, StaggerContainer, StaggerItem, Floating, GlowCard } from "@/components/client-portal/animations";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Cursor follower component
function CursorGlow() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', updateMousePosition);
    document.body.addEventListener('mouseleave', handleMouseLeave);
    document.body.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      document.body.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  return (
    <motion.div
      className="fixed pointer-events-none z-0 w-96 h-96 rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%)',
        left: mousePosition.x - 192,
        top: mousePosition.y - 192,
      }}
      animate={{
        opacity: isVisible ? 1 : 0,
        scale: isVisible ? 1 : 0.8,
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    />
  );
}

// Animated background particles
function BackgroundParticles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default function ClientPortalPage() {
  const { shareToken } = useParams();
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
    authorName: string; 
    authorEmail?: string; 
    content: string;
    timecode?: string;
    priority?: string;
    frameTimestampMs?: number;
    screenshotUrl?: string;
  }) => {
    if (!selectedMaterialId) return;
    requestRevision({
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
        clientName: 'Cliente',
      });

      toast.success("Material enviado com sucesso!");
    } catch (err) {
      console.error('Upload error:', err);
      toast.error("Erro ao enviar material");
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
              isInactive ? "bg-muted" : isExpired ? "bg-amber-500/20" : "bg-destructive/20"
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            {isInactive ? (
              <Lock className="w-8 h-8 text-muted-foreground" />
            ) : (
              <AlertTriangle className={cn("w-8 h-8", isExpired ? "text-amber-500" : "text-destructive")} />
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
      className="min-h-screen h-screen overflow-y-auto bg-background scroll-smooth relative"
    >
      {/* Animated Background */}
      <CursorGlow />
      <BackgroundParticles />
      
      {/* Background Gradient that moves with scroll */}
      <motion.div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{ 
          y: springBackgroundY,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(6, 182, 212, 0.05) 0%, transparent 50%)',
        }}
      />

      <div className="max-w-[1400px] xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header with animations */}
        <ScrollReveal direction="down" delay={0.1}>
          <PortalHeaderPremium
            project={project}
            shareToken={shareToken || ''}
            onExportPdf={handleExportPdf}
            isExporting={isExporting}
          />
        </ScrollReveal>

        {/* Metrics Grid */}
        <ScrollReveal delay={0.2} className="mt-8">
          <PortalMetricsGrid project={project} />
        </ScrollReveal>

        {/* Tabs with Tab Content Animation */}
        <ScrollReveal delay={0.3} className="mt-12">
          <PortalTabsPremium activeTab={activeTab} onTabChange={setActiveTab}>
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
                  <StaggerContainer className="grid lg:grid-cols-12 gap-6" staggerDelay={0.08}>
                    {/* Main Content */}
                    <StaggerItem className="lg:col-span-8 xl:col-span-9 space-y-6">
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
                      
                      <ScrollReveal delay={0.4}>
                        <PortalClientUploads
                          clientUploads={clientUploads}
                          onUpload={handleClientUpload}
                          isUploading={isUploadingMaterial}
                        />
                      </ScrollReveal>
                    </StaggerItem>
                    
                    {/* Sidebar */}
                    <StaggerItem className="lg:col-span-4 xl:col-span-3 space-y-6">
                      <GlowCard glowColor="rgba(6, 182, 212, 0.2)">
                        <PortalMaterialsAside deliverables={deliverables} files={files} />
                      </GlowCard>
                      <ScrollReveal delay={0.4}>
                        <PortalNextSteps stages={stages} currentStageKey={project.stage_current} />
                      </ScrollReveal>
                      <ScrollReveal delay={0.5}>
                        <PortalAuditBadge />
                      </ScrollReveal>
                    </StaggerItem>
                  </StaggerContainer>
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
                    onCreateRequest={(data) => {
                      if (data.deliverableId) {
                        createChangeRequest({
                          deliverableId: data.deliverableId,
                          title: data.title,
                          description: data.description,
                          authorName: data.authorName,
                          authorEmail: data.authorEmail,
                          priority: data.priority,
                        });
                      }
                    }}
                    isCreatingRequest={isCreatingChangeRequest}
                  />
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
