/**
 * PortalHeaderPremium - Header do portal no estilo premium SQUAD
 */

import { memo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { 
  ArrowLeft,
  Link as LinkIcon,
  FileText,
  Lock,
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

// Template name mapping
const TEMPLATE_NAMES: Record<string, string> = {
  filme_institucional: 'filme_institucional',
  video_clipe: 'video_clipe',
  documentario: 'documentario',
  comercial: 'comercial',
  evento: 'evento',
  social_media: 'social_media',
  custom: 'custom',
};

function PortalHeaderPremiumComponent({
  project,
  shareToken,
  hasPaymentBlock,
  onExportPdf,
  isExporting,
}: PortalHeaderPremiumProps) {
  const [copied, setCopied] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd MMM yyyy", { locale: ptBR });
    } catch {
      return "—";
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/client/${shareToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const templateName = project.template 
    ? TEMPLATE_NAMES[project.template] || project.template 
    : 'custom';

  return (
    <div className="space-y-0">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between py-4 border-b border-[#1a1a1a]">
        <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Voltar para Projetos
        </button>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCopyLink}
            className="text-gray-400 hover:text-white h-8 gap-2"
          >
            <LinkIcon className="w-4 h-4" />
            Copiar Link
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onExportPdf}
            disabled={isExporting}
            className="text-gray-400 hover:text-white h-8 gap-2"
          >
            <FileText className="w-4 h-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Badges Row */}
      <div className="flex items-center gap-2 py-4">
        <span className="text-[10px] px-3 py-1 uppercase tracking-widest font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
          {project.status}
        </span>
        <span className="text-[10px] px-3 py-1 uppercase tracking-widest text-gray-500 border border-[#1a1a1a]">
          {templateName}
        </span>
        {hasPaymentBlock && (
          <span className="text-[10px] px-3 py-1 uppercase tracking-widest font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Bloqueado
          </span>
        )}
      </div>

      {/* Title Section */}
      <div className="pb-6">
        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white mb-2">
          {project.name}
        </h1>
        <p className="text-gray-500 text-sm">
          Cliente: <span className="text-gray-300 uppercase">{project.client_name || 'Cliente'}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#1a1a1a] border border-[#1a1a1a]">
        <div className="bg-[#0a0a0a] p-5">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">
            Valor do Contrato
          </p>
          <p className="text-xl font-semibold text-white">
            {formatCurrency(project.contract_value || 0)}
          </p>
        </div>
        <div className="bg-[#0a0a0a] p-5">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">
            Saúde
          </p>
          <p className={cn(
            "text-xl font-semibold",
            (project.health_score || 0) >= 80 ? "text-emerald-400" : 
            (project.health_score || 0) >= 50 ? "text-amber-400" : "text-red-400"
          )}>
            {project.health_score || 0}%
          </p>
        </div>
        <div className="bg-[#0a0a0a] p-5">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">
            Entrega
          </p>
          <p className="text-xl font-semibold text-white">
            {formatDate(project.due_date)}
          </p>
        </div>
        <div className="bg-[#0a0a0a] p-5">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">
            Responsável
          </p>
          <p className="text-lg font-medium text-gray-300">
            {project.owner_name || 'Não definido'}
          </p>
        </div>
      </div>

      {/* Payment Block Alert */}
      {hasPaymentBlock && (
        <div className="mt-6 bg-red-500/5 border border-red-500/20 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm mb-1">
              Projeto Bloqueado por Inadimplência
            </h3>
            <p className="text-gray-400 text-sm">
              Existe uma fatura em atraso vinculada a este projeto. A entrega final está bloqueada até regularização.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export const PortalHeaderPremium = memo(PortalHeaderPremiumComponent);
