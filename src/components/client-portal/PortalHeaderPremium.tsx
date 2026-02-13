/**
 * PortalHeaderPremium - Header do portal premium com animações impactantes
 * Text reveal, magnetic buttons, parallax effects
 */

import { memo, useState, useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { toast } from "sonner";
import { 
  Link as LinkIcon,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TextReveal, Magnetic, Shimmer, PulseRing } from "./animations";
import type { ProjectInfo } from "@/hooks/useClientPortalEnhanced";

interface PortalHeaderPremiumProps {
  project: ProjectInfo;
  shareToken: string;
  onExportPdf?: () => void;
  isExporting?: boolean;
}

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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8, y: -10 },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { 
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
    },
  },
};

const lineVariants = {
  hidden: { scaleX: 0 },
  visible: { 
    scaleX: 1,
    transition: { duration: 0.8, ease: "easeOut" as const },
  },
};

function PortalHeaderPremiumComponent({
  project,
  shareToken,
  onExportPdf,
  isExporting,
}: PortalHeaderPremiumProps) {
  const [copied, setCopied] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  
  // Parallax scroll effect
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, -50]);
  const opacity = useTransform(scrollY, [0, 200], [1, 0.8]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.98]);
  const springY = useSpring(y, { stiffness: 100, damping: 30 });

  const handleCopyLink = () => {
    const url = `${window.location.origin}/client/${shareToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const templateLabel = project.template?.replace(/_/g, ' ') || 'custom';
  const stageName = project.stage_current 
    ? STAGE_NAMES[project.stage_current] || project.stage_current 
    : 'Pré-produção';

  return (
    <motion.div 
      ref={headerRef}
      className="space-y-0 relative py-8 md:py-12"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={containerVariants}
      style={{ y: springY, opacity, scale }}
    >
      {/* Decorative Line */}
      <motion.div 
        className="absolute top-0 left-0 h-px bg-gradient-to-r from-primary via-primary/50 to-transparent"
        style={{ width: '40%' }}
        variants={lineVariants}
      />

      {/* Badges Row */}
      <motion.div 
        className="flex flex-wrap items-center gap-2 mb-6"
        variants={containerVariants}
      >
        {/* Status Badge with Pulse */}
        <motion.div variants={badgeVariants}>
          <PulseRing color="rgba(6, 182, 212, 0.5)">
            <Shimmer>
              <span className="text-[10px] px-4 py-1.5 uppercase tracking-[0.2em] font-medium bg-primary/20 text-primary border border-primary/30 inline-flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                {project.status}
              </span>
            </Shimmer>
          </PulseRing>
        </motion.div>
        
        {/* Template Badge */}
        <motion.span 
          variants={badgeVariants}
          whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.3)' }}
          className="text-[10px] px-3 py-1 uppercase tracking-[0.15em] text-muted-foreground border border-border transition-colors cursor-default"
        >
          {templateLabel}
        </motion.span>
        
        {/* Stage Badge */}
        <motion.span 
          variants={badgeVariants}
          whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.3)' }}
          className="text-[10px] px-3 py-1 uppercase tracking-[0.15em] text-muted-foreground border border-border transition-colors cursor-default"
        >
          {stageName}
        </motion.span>
      </motion.div>

      {/* Title Section */}
      <motion.div 
        className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="space-y-3">
          {/* Project Name with Text Reveal */}
          <div className="overflow-hidden pb-2">
            <TextReveal 
              text={project.name}
              className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight text-foreground uppercase leading-tight"
              delay={0.4}
            />
          </div>
          
          {/* Client Info with Fade */}
          <motion.p 
            className="text-muted-foreground text-sm flex items-center gap-2 flex-wrap"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            Cliente: 
            <motion.span 
              className="text-foreground uppercase font-medium"
              whileHover={{ color: 'hsl(var(--primary))' }}
            >
              {project.client_name || 'Cliente'}
            </motion.span>
            <span className="text-muted-foreground/50">•</span>
            <span className="text-muted-foreground/70">ID: #{project.template?.toUpperCase() || 'PROJETO'}</span>
          </motion.p>
        </div>

        {/* Actions with Magnetic Effect */}
        <motion.div 
          className="flex items-center gap-3 flex-shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Magnetic strength={0.2}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground h-10 gap-2 border border-border hover:border-primary/50 rounded-none transition-all duration-300 hover:bg-primary/5 group"
            >
              <motion.span 
                className="material-symbols-outlined" 
                style={{ fontSize: 16 }}
                whileHover={{ rotate: 15 }}
              >
                contact_support
              </motion.span>
              <span className="hidden sm:inline group-hover:text-primary transition-colors">Suporte</span>
            </Button>
          </Magnetic>
          
          <Magnetic strength={0.2}>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCopyLink}
              className={cn(
                "text-muted-foreground hover:text-foreground h-10 w-10 border border-border hover:border-primary/50 rounded-none transition-all duration-300",
                copied && "border-primary text-primary bg-primary/10"
              )}
            >
              <motion.div
                animate={copied ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <LinkIcon className="w-4 h-4" />
              </motion.div>
            </Button>
          </Magnetic>
          
          <Magnetic strength={0.2}>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onExportPdf}
              disabled={isExporting}
              className="text-muted-foreground hover:text-foreground h-10 w-10 border border-border hover:border-primary/50 rounded-none transition-all duration-300 hover:bg-primary/5"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <motion.span 
                  className="material-symbols-outlined" 
                  style={{ fontSize: 16 }}
                  whileHover={{ y: -2 }}
                >
                  picture_as_pdf
                </motion.span>
              )}
            </Button>
          </Magnetic>
        </motion.div>
      </motion.div>
      
      {/* Decorative Bottom Line */}
      <motion.div 
        className="h-px bg-gradient-to-r from-transparent via-border to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
      />
    </motion.div>
  );
}

export const PortalHeaderPremium = memo(PortalHeaderPremiumComponent);
