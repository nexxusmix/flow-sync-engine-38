/**
 * ReportAsidePanel - Right sidebar for report layout
 * Arte do Projeto, Condições Financeiras, Configurações
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Image, 
  Wand2, 
  Loader2, 
  Copy, 
  Check,
  Settings,
  CreditCard
} from "lucide-react";

interface ReportAsidePanelProps {
  projectId: string;
  bannerUrl?: string | null;
  pixKey?: string;
  pixHolder?: string;
  pixBank?: string;
  revisionLimit?: number;
  isManager?: boolean;
  onBannerGenerated?: () => void;
}

export function ReportAsidePanel({
  projectId,
  bannerUrl,
  pixKey = "squadfilmeo@gmail.com",
  pixHolder = "Matheus Filipe Alves",
  pixBank = "Nubank",
  revisionLimit = 2,
  isManager = true,
  onBannerGenerated,
}: ReportAsidePanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [localBannerUrl, setLocalBannerUrl] = useState(bannerUrl);
  const [copied, setCopied] = useState(false);

  const handleGenerateBanner = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-project-art", {
        body: { project_id: projectId, art_type: "banner" },
      });

      if (error) throw error;
      if (data?.success && data?.public_url) {
        setLocalBannerUrl(data.public_url);
        toast.success("Banner gerado com sucesso!");
        onBannerGenerated?.();
      } else {
        throw new Error(data?.error || "Falha na geração");
      }
    } catch (error) {
      console.error("Banner generation error:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao gerar banner");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    toast.success("Chave PIX copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Arte do Projeto */}
      <div className="bg-card border border-border p-6">
        <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-4 block">
          Arte do Projeto
        </span>
        
        <AspectRatio ratio={16/9} className="bg-muted/30 rounded-none overflow-hidden border border-border mb-4">
          {localBannerUrl ? (
            <img
              src={localBannerUrl}
              alt="Banner do projeto"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Image className="w-8 h-8 text-muted-foreground/50 mb-2" />
              <span className="text-[10px] text-muted-foreground">Banner 16:9</span>
            </div>
          )}
        </AspectRatio>

        {isManager && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={handleGenerateBanner}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4 mr-2" />
            )}
            {localBannerUrl ? 'Regenerar com IA' : 'Gerar com IA'}
          </Button>
        )}
      </div>

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
