/**
 * PortalHeaderPremium - Header do portal premium com animações
 * Typography: Host Grotesk only (removed Playfair Display)
 */

import { memo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { 
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.25 },
  },
};

const titleVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 },
  },
};

function PortalHeaderPremiumComponent({
  project,
  shareToken,
  onExportPdf,
  isExporting,
}: PortalHeaderPremiumProps) {
  const [copied, setCopied] = useState(false);

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
      className="space-y-0"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Badges Row */}
      <motion.div 
        className="flex flex-wrap items-center gap-2 mb-4"
        variants={containerVariants}
      >
        {/* Status Badge */}
        <motion.span 
          variants={badgeVariants}
          className="text-[10px] px-3 py-1 uppercase tracking-widest font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
        >
          {project.status}
        </motion.span>
        
        {/* Template Badge */}
        <motion.span 
          variants={badgeVariants}
          className="text-[10px] px-3 py-1 uppercase tracking-widest text-gray-500 border border-[#1a1a1a]"
        >
          {templateLabel}
        </motion.span>
        
        {/* Stage Badge */}
        <motion.span 
          variants={badgeVariants}
          className="text-[10px] px-3 py-1 uppercase tracking-widest text-gray-500 border border-[#1a1a1a]"
        >
          {stageName}
        </motion.span>
      </motion.div>

      {/* Title Section */}
      <motion.div 
        className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6"
        variants={titleVariants}
      >
        <div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white mb-2 uppercase">
            {project.name}
          </h1>
          <p className="text-gray-500 text-sm">
            Cliente: <span className="text-gray-300 uppercase">{project.client_name || 'Cliente'}</span>
            <span className="text-gray-600 mx-2">•</span>
            <span className="text-gray-600">ID: #{project.template?.toUpperCase() || 'PROJETO'}</span>
          </p>
        </div>

        {/* Actions */}
        <motion.div 
          className="flex items-center gap-2 flex-shrink-0"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-400 hover:text-white h-9 gap-2 border border-[#1a1a1a] hover:border-gray-700 rounded-none transition-all duration-200 hover:-translate-y-0.5"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              contact_support
            </span>
            <span className="hidden sm:inline">Suporte / Contato</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCopyLink}
            className="text-gray-400 hover:text-white h-9 gap-2 border border-[#1a1a1a] hover:border-gray-700 rounded-none transition-all duration-200 hover:-translate-y-0.5"
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onExportPdf}
            disabled={isExporting}
            className="text-gray-400 hover:text-white h-9 gap-2 border border-[#1a1a1a] hover:border-gray-700 rounded-none transition-all duration-200 hover:-translate-y-0.5"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                picture_as_pdf
              </span>
            )}
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export const PortalHeaderPremium = memo(PortalHeaderPremiumComponent);
