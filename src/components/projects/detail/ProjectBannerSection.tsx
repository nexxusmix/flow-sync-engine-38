/**
 * ProjectBannerSection - Banner with AI generation and style selection
 */

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Wand2, 
  Loader2, 
  Pencil, 
  ImagePlus,
  Sparkles,
  Image,
  Upload,
  Palette,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BANNER_STYLES, BannerStyleId } from "@/data/bannerStyles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

interface ProjectBannerSectionProps {
  projectId: string;
  bannerUrl?: string | null;
  logoUrl?: string | null;
  onEditProject: () => void;
}

export function ProjectBannerSection({
  projectId,
  bannerUrl,
  logoUrl,
  onEditProject,
}: ProjectBannerSectionProps) {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<BannerStyleId>('texture_pattern');

  const handleGenerateBanner = async (style: BannerStyleId, withLogo: boolean = false) => {
    setIsGenerating(true);
    setSelectedStyle(style);
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-project-art", {
        body: { 
          project_id: projectId, 
          art_type: "banner",
          style: style,
          include_logo: withLogo,
        },
      });

      if (error) throw error;
      if (data?.success && data?.public_url) {
        queryClient.invalidateQueries({ queryKey: ["project", projectId] });
        toast.success("Banner gerado com sucesso!");
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

  const selectedStyleLabel = BANNER_STYLES.find(s => s.id === selectedStyle)?.label || 'Textura Pattern';

  return (
    <div className="relative group">
      <button 
        onClick={onEditProject}
        disabled={isGenerating}
        className="w-full aspect-[21/1] border-b border-border/50 overflow-hidden transition-all bg-muted/30 relative"
      >
        {isGenerating ? (
          <div className="w-full h-full flex items-center justify-center gap-2 text-primary">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Gerando com IA...</span>
          </div>
        ) : bannerUrl ? (
          <div className="relative w-full h-full">
            <img 
              src={bannerUrl} 
              alt="Banner do projeto" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
              <Pencil className="w-5 h-5 text-white" />
              <span className="text-white text-sm font-medium">Editar Projeto</span>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ImagePlus className="w-5 h-5" />
            <span className="text-sm">Adicionar Banner</span>
          </div>
        )}
      </button>

      {/* Floating AI Generation Button */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-8 gap-1.5 bg-background/90 backdrop-blur-sm shadow-lg"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              <span className="text-xs">Gerar IA</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-2">
              <Palette className="w-3.5 h-3.5" />
              Escolha o estilo
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {BANNER_STYLES.map((style) => (
              <DropdownMenuSub key={style.id}>
                <DropdownMenuSubTrigger className="text-xs">
                  <span className="flex-1">{style.label}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48">
                  <DropdownMenuItem 
                    onClick={() => handleGenerateBanner(style.id, false)}
                    className="text-xs"
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Apenas fundo
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleGenerateBanner(style.id, true)}
                    disabled={!logoUrl}
                    className="text-xs"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Fundo para Logo
                    {!logoUrl && <span className="ml-auto text-muted-foreground text-[10px]">(sem logo)</span>}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ))}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onEditProject} className="text-xs">
              <Upload className="w-4 h-4 mr-2" />
              Upload manual
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
