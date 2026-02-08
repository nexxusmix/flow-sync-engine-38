/**
 * ReportAsidePanel - Right sidebar for report layout
 * Arte do Projeto (Logo + Background Style), Condições Financeiras, Configurações
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
  CreditCard,
  Upload,
  ImagePlus,
  Sparkles,
  Palette
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BANNER_STYLES, BannerStyleId } from "@/data/bannerStyles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [localBannerUrl, setLocalBannerUrl] = useState(bannerUrl);
  const [copied, setCopied] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<BannerStyleId>('texture_pattern');

  const handleGenerateBanner = async (withLogo: boolean = true) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-project-art", {
        body: { 
          project_id: projectId, 
          art_type: "banner",
          style: selectedStyle,
          include_logo: withLogo,
        },
      });

      if (error) throw error;
      if (data?.success && data?.public_url) {
        setLocalBannerUrl(data.public_url);
        toast.success("Arte gerada com sucesso!");
        onBannerGenerated?.();
      } else {
        throw new Error(data?.error || "Falha na geração");
      }
    } catch (error) {
      console.error("Banner generation error:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao gerar arte");
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

  const selectedStyleLabel = BANNER_STYLES.find(s => s.id === selectedStyle)?.label || 'Textura Pattern';

  return (
    <div className="space-y-6">
      {/* Arte do Projeto - Redesigned */}
      <div className="bg-card border border-border p-6">
        <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-4 block">
          Arte do Projeto
        </span>
        
        {/* Logo Preview Area */}
        <AspectRatio ratio={16/9} className="bg-muted/30 rounded-none overflow-hidden border border-border mb-4">
          {localBannerUrl ? (
            <div className="relative w-full h-full group">
              <img
                src={localBannerUrl}
                alt="Arte do projeto"
                className="w-full h-full object-cover"
              />
              {/* Logo overlay if exists */}
              {logoUrl && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="max-w-[50%] max-h-[50%] object-contain drop-shadow-lg"
                  />
                </div>
              )}
            </div>
          ) : logoUrl ? (
            <div 
              className="relative w-full h-full"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--background)) 50%, hsl(var(--muted)) 100%)',
              }}
            >
              {/* Subtle pattern overlay */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--primary) / 0.1) 0%, transparent 50%),
                                    radial-gradient(circle at 75% 75%, hsl(var(--primary) / 0.05) 0%, transparent 50%)`,
                }}
              />
              {/* Logo centered */}
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <img
                  src={logoUrl}
                  alt="Logo do projeto"
                  className="max-w-[60%] max-h-[60%] object-contain drop-shadow-lg"
                />
              </div>
            </div>
          ) : (
            <div 
              className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={onEditProject}
            >
              <ImagePlus className="w-8 h-8 text-muted-foreground/50 mb-2" />
              <span className="text-[10px] text-muted-foreground">Adicionar Logo</span>
              <span className="text-[9px] text-muted-foreground/60 mt-1">Clique para editar</span>
            </div>
          )}
        </AspectRatio>

        {/* Style Selector */}
        {isManager && (
          <div className="space-y-3">
            {/* Style Dropdown */}
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-muted-foreground shrink-0" />
              <Select
                value={selectedStyle}
                onValueChange={(v) => setSelectedStyle(v as BannerStyleId)}
              >
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Estilo do fundo" />
                </SelectTrigger>
                <SelectContent>
                  {BANNER_STYLES.map((style) => (
                    <SelectItem key={style.id} value={style.id} className="text-xs">
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button with Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-2"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  {isGenerating ? 'Gerando...' : 'Gerar com IA'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Opções de Geração
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleGenerateBanner(true)}
                  disabled={!logoUrl}
                  className="text-xs"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar fundo com Logo
                  {!logoUrl && <span className="ml-auto text-muted-foreground">(sem logo)</span>}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleGenerateBanner(false)}
                  className="text-xs"
                >
                  <Image className="w-4 h-4 mr-2" />
                  Gerar apenas fundo
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onEditProject}
                  className="text-xs"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload manual (Editar Projeto)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
