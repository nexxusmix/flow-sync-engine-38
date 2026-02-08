/**
 * PortalHeaderPremium - Header do portal idêntico ao HTML de referência
 * Com badges, título, ações e integração com Material Icons
 */

import { memo, useState } from "react";
import { toast } from "sonner";
import { 
  Link as LinkIcon,
  FileText,
  Lock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectInfo } from "@/hooks/useClientPortalEnhanced";

interface PortalHeaderPremiumProps {
  project: ProjectInfo;
  shareToken: string;
  hasPaymentBlock?: boolean;
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

function PortalHeaderPremiumComponent({
  project,
  shareToken,
  hasPaymentBlock,
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
    <div className="space-y-0">
      {/* Badges Row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Status Badge */}
        <span className="text-[10px] px-3 py-1 uppercase tracking-widest font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
          {project.status}
        </span>
        
        {/* Template Badge */}
        <span className="text-[10px] px-3 py-1 uppercase tracking-widest text-gray-500 border border-[#1a1a1a]">
          {templateLabel}
        </span>
        
        {/* Stage Badge */}
        <span className="text-[10px] px-3 py-1 uppercase tracking-widest text-gray-500 border border-[#1a1a1a]">
          {stageName}
        </span>
        
        {/* Blocked Badge */}
        {hasPaymentBlock && (
          <span className="text-[10px] px-3 py-1 uppercase tracking-widest font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Bloqueado
          </span>
        )}
      </div>

      {/* Title Section */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            {project.name}
          </h1>
          <p className="text-gray-500 text-sm">
            Cliente: <span className="text-gray-300 uppercase">{project.client_name || 'Cliente'}</span>
            <span className="text-gray-600 mx-2">•</span>
            <span className="text-gray-600">ID: #{project.template?.toUpperCase() || 'PROJETO'}</span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-400 hover:text-white h-9 gap-2 border border-[#1a1a1a] hover:border-gray-700 rounded-none"
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
            className="text-gray-400 hover:text-white h-9 gap-2 border border-[#1a1a1a] hover:border-gray-700 rounded-none"
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onExportPdf}
            disabled={isExporting}
            className="text-gray-400 hover:text-white h-9 gap-2 border border-[#1a1a1a] hover:border-gray-700 rounded-none"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                picture_as_pdf
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export const PortalHeaderPremium = memo(PortalHeaderPremiumComponent);
