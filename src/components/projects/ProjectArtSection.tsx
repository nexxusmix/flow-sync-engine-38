import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Wand2, Image, Download, Loader2, Sparkles } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

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
            <h3 className="text-sm font-semibold text-foreground">Arte do Projeto</h3>
            <p className="text-[10px] text-muted-foreground">Gere imagens com IA para o projeto</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Banner */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Banner (16:9)</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerate("banner")}
              disabled={generatingType !== null}
            >
              {generatingType === "banner" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              Gerar
            </Button>
          </div>
          
          <AspectRatio ratio={16/9} className="bg-muted/30 rounded-xl overflow-hidden border border-border">
            {localBannerUrl ? (
              <div className="relative w-full h-full group">
                <img
                  src={localBannerUrl}
                  alt="Banner do projeto"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleDownload(localBannerUrl, `banner_${projectId}.png`)}
                  className="absolute bottom-2 right-2 p-2 bg-background/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Image className="w-8 h-8 text-muted-foreground/50 mb-2" />
                <span className="text-[10px] text-muted-foreground">Nenhum banner</span>
              </div>
            )}
          </AspectRatio>
        </div>

        {/* Cover (OG Image) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Capa (OG Image)</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerate("cover")}
              disabled={generatingType !== null}
            >
              {generatingType === "cover" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              Gerar
            </Button>
          </div>
          
          <AspectRatio ratio={1200/630} className="bg-muted/30 rounded-xl overflow-hidden border border-border">
            {localCoverUrl ? (
              <div className="relative w-full h-full group">
                <img
                  src={localCoverUrl}
                  alt="Capa do projeto"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleDownload(localCoverUrl, `cover_${projectId}.png`)}
                  className="absolute bottom-2 right-2 p-2 bg-background/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Image className="w-8 h-8 text-muted-foreground/50 mb-2" />
                <span className="text-[10px] text-muted-foreground">Nenhuma capa</span>
              </div>
            )}
          </AspectRatio>
        </div>
      </div>

      {logoUrl && (
        <p className="text-[10px] text-muted-foreground mt-4 text-center">
          💡 A IA usará o logo do projeto como referência visual
        </p>
      )}
    </Card>
  );
}
