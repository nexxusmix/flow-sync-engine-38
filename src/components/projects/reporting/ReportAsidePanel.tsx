/**
 * ReportAsidePanel - Right sidebar for report layout
 * Arte do Projeto (Carousel), Condições Financeiras, Configurações
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Check, Settings, CreditCard } from "lucide-react";
import { ProjectArtCarousel } from "@/components/projects/ProjectArtCarousel";

interface ReportAsidePanelProps {
  projectId: string;
  bannerUrl?: string | null;
  logoUrl?: string | null;
  pixKey?: string;
  pixHolder?: string;
  pixBank?: string;
  revisionLimit?: number;
  isManager?: boolean;
  onBannerGenerated?: () => void;
  onEditProject?: () => void;
}

export function ReportAsidePanel({
  projectId,
  bannerUrl,
  logoUrl,
  pixKey = "squadfilmeo@gmail.com",
  pixHolder = "Matheus Filipe Alves",
  pixBank = "Nubank",
  revisionLimit = 2,
  isManager = true,
  onBannerGenerated,
  onEditProject,
}: ReportAsidePanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    toast.success("Chave PIX copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Arte do Projeto - Carousel */}
      <ProjectArtCarousel
        projectId={projectId}
        bannerUrl={bannerUrl}
        logoUrl={logoUrl}
        isManager={isManager}
        onGenerateArt={onEditProject}
      />

      {/* Condições Financeiras */}
      <div className="bg-card border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            Condições Financeiras
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground block mb-1">
              Chave PIX (E-mail)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-primary font-mono flex-1 truncate">{pixKey}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0 shrink-0"
                onClick={handleCopyPix}
              >
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>

          <div>
            <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground block mb-1">
              Titular / Banco
            </span>
            <p className="text-sm text-foreground">
              {pixHolder}
              <span className="text-primary ml-2"> {pixBank}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Configurações */}
      <div className="bg-card border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            Configurações
          </span>
        </div>

        <div>
          <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground block mb-1">
            Limite de Revisões
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-lg font-bold px-3 py-1">
              {revisionLimit}
            </Badge>
            <span className="text-sm text-muted-foreground">por material</span>
          </div>
        </div>
      </div>
    </div>
  );
}
