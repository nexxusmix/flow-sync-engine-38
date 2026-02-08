import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Wand2, Image, Download, Loader2, Sparkles, ImagePlus } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";

interface ProjectArtSectionProps {
  projectId: string;
  bannerUrl?: string | null;
  coverUrl?: string | null;
  logoUrl?: string | null;
  onArtGenerated?: () => void;
}

type ArtType = "banner" | "cover" | "favicon";

export function ProjectArtSection({
  projectId,
  bannerUrl,
  coverUrl,
  logoUrl,
  onArtGenerated,
}: ProjectArtSectionProps) {
  const [generatingType, setGeneratingType] = useState<ArtType | null>(null);
  const [localBannerUrl, setLocalBannerUrl] = useState(bannerUrl);
  const [localCoverUrl, setLocalCoverUrl] = useState(coverUrl);

  const handleGenerate = async (artType: ArtType) => {
    setGeneratingType(artType);

    try {
      const { data, error } = await supabase.functions.invoke("generate-project-art", {
        body: {
          project_id: projectId,
          art_type: artType,
        },
      });

      if (error) throw error;

      if (data?.success && data?.public_url) {
        if (artType === "banner") {
          setLocalBannerUrl(data.public_url);
        } else if (artType === "cover") {
          setLocalCoverUrl(data.public_url);
        }

        toast.success(`${artType === "banner" ? "Banner" : artType === "cover" ? "Capa" : "Favicon"} gerado com sucesso!`);
        onArtGenerated?.();
      } else {
        throw new Error(data?.error || "Falha na geração");
      }
    } catch (error) {
      console.error("Art generation error:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao gerar arte");
    } finally {
      setGeneratingType(null);
    }
  };

  const handleDownload = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="glass-card p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Arte do Projeto</h3>
            <p className="text-[10px] text-muted-foreground">Logo e artes geradas com IA</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Logo Section - Primary Display */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Logo do Projeto</span>
          </div>
          
          <AspectRatio ratio={16/9} className="rounded-xl overflow-hidden border border-border">
            {logoUrl ? (
              <div className="relative w-full h-full group">
                {/* Solid gradient background for transparent logos */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--background)) 50%, hsl(var(--muted)) 100%)',
                  }}
                />
                {/* Subtle pattern overlay */}
                <div 
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--primary) / 0.1) 0%, transparent 50%),
                                      radial-gradient(circle at 75% 75%, hsl(var(--primary) / 0.05) 0%, transparent 50%)`,
                  }}
                />
                {/* Logo centered */}
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  <img
                    src={logoUrl}
                    alt="Logo do projeto"
                    className="max-w-[70%] max-h-[70%] object-contain drop-shadow-lg"
                  />
                </div>
                <button
                  onClick={() => handleDownload(logoUrl, `logo_${projectId}.png`)}
                  className="absolute bottom-2 right-2 p-2 bg-background/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30">
                <ImagePlus className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <span className="text-xs text-muted-foreground">Nenhum logo</span>
                <span className="text-[10px] text-muted-foreground/60 mt-1">Adicione via "Editar Projeto"</span>
              </div>
            )}
          </AspectRatio>
        </div>

        {/* Regenerate with AI Button */}
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => handleGenerate("banner")}
          disabled={generatingType !== null}
        >
          {generatingType === "banner" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          Regenerar com IA
        </Button>

        {/* Generated Arts Grid - Collapsed */}
        {(localBannerUrl || localCoverUrl) && (
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
            {/* Banner Thumbnail */}
            {localBannerUrl && (
              <div className="space-y-2">
                <span className="text-[10px] font-medium text-muted-foreground uppercase">Banner</span>
                <AspectRatio ratio={16/9} className="bg-muted/30 rounded-lg overflow-hidden border border-border">
                  <div className="relative w-full h-full group">
                    <img
                      src={localBannerUrl}
                      alt="Banner"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleDownload(localBannerUrl, `banner_${projectId}.png`)}
                      className="absolute bottom-1 right-1 p-1.5 bg-background/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                </AspectRatio>
              </div>
            )}

            {/* Cover Thumbnail */}
            {localCoverUrl && (
              <div className="space-y-2">
                <span className="text-[10px] font-medium text-muted-foreground uppercase">Capa</span>
                <AspectRatio ratio={1200/630} className="bg-muted/30 rounded-lg overflow-hidden border border-border">
                  <div className="relative w-full h-full group">
                    <img
                      src={localCoverUrl}
                      alt="Capa"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleDownload(localCoverUrl, `cover_${projectId}.png`)}
                      className="absolute bottom-1 right-1 p-1.5 bg-background/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                </AspectRatio>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
