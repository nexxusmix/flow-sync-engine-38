import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Instagram,
  Link2,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface ScrapeUrlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

type UrlType = "instagram" | "behance" | "pinterest" | "youtube" | "linkedin" | "generic";

const URL_TYPE_CONFIG: Record<UrlType, { label: string; icon: React.ReactNode; color: string }> = {
  instagram: {
    label: "Instagram",
    icon: <Instagram className="w-3.5 h-3.5" />,
    color: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  },
  behance: {
    label: "Behance",
    icon: <Globe className="w-3.5 h-3.5" />,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  pinterest: {
    label: "Pinterest",
    icon: <Globe className="w-3.5 h-3.5" />,
    color: "bg-red-500/10 text-red-600 border-red-500/20",
  },
  youtube: {
    label: "YouTube",
    icon: <Globe className="w-3.5 h-3.5" />,
    color: "bg-red-500/10 text-red-600 border-red-500/20",
  },
  linkedin: {
    label: "LinkedIn",
    icon: <Globe className="w-3.5 h-3.5" />,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  generic: {
    label: "Site",
    icon: <Globe className="w-3.5 h-3.5" />,
    color: "bg-muted text-muted-foreground border-border",
  },
};

function detectUrlType(url: string): UrlType {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = u.hostname.toLowerCase();
    if (host.includes("instagram.com")) return "instagram";
    if (host.includes("behance.net")) return "behance";
    if (host.includes("pinterest.com")) return "pinterest";
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
    if (host.includes("linkedin.com")) return "linkedin";
    return "generic";
  } catch {
    return "generic";
  }
}

export function ScrapeUrlDialog({ open, onOpenChange, projectId }: ScrapeUrlDialogProps) {
  const { user } = useAuth();
  const [urlInput, setUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; title?: string; colors?: number; brand?: string } | null>(null);

  const urlType = urlInput.trim() ? detectUrlType(urlInput) : "generic";
  const typeConfig = URL_TYPE_CONFIG[urlType];

  const handleScrape = async () => {
    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) return;

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("scrape-client-url", {
        body: {
          url: trimmedUrl,
          project_id: projectId,
          user_id: user?.id,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setResult({
          success: true,
          title: data.title,
          colors: data.colors_found,
          brand: data.brand_name,
        });
        toast.success(`Identidade extraída de "${data.title}"!`, {
          description: data.colors_found > 0
            ? `${data.colors_found} cores detectadas pela IA`
            : "Asset salvo na galeria",
        });
      } else {
        throw new Error(data?.error || "Falha ao extrair identidade");
      }
    } catch (e: any) {
      console.error("scrape error:", e);
      setResult({ success: false });
      toast.error("Erro ao extrair identidade visual", {
        description: e.message || "Verifique a URL e tente novamente",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setUrlInput("");
      setResult(null);
    }, 300);
  };

  const handleAddAnother = () => {
    setUrlInput("");
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Extrair Identidade de URL
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cole o link do site, Instagram, Behance ou qualquer perfil digital do cliente. A IA irá extrair cores, logo e identidade visual automaticamente.
          </p>

          {!result ? (
            <>
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    placeholder="https://exemplo.com ou instagram.com/perfil..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !isLoading && urlInput.trim() && handleScrape()}
                    className="pr-20"
                    disabled={isLoading}
                  />
                  {urlInput.trim() && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] h-5 px-1.5 gap-1 border", typeConfig.color)}
                      >
                        {typeConfig.icon}
                        {typeConfig.label}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Examples */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "instagram.com/user",
                    "behance.net/user",
                    "seusite.com.br",
                  ].map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setUrlInput(ex)}
                      className="text-[10px] text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted px-2 py-0.5 rounded-full transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* What will be extracted */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { icon: "🎨", label: "Paleta de cores" },
                  { icon: "🏷️", label: "Nome da marca" },
                  { icon: "🖼️", label: "Imagem OG" },
                ].map(({ icon, label }) => (
                  <div key={label} className="p-2 bg-muted/30 rounded-xl border border-border/20">
                    <div className="text-xl mb-0.5">{icon}</div>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleScrape}
                  disabled={!urlInput.trim() || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Extraindo...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Extrair Identidade
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : result.success ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">{result.title || "Identidade extraída!"}</p>
                  {result.brand && result.brand !== result.title && (
                    <p className="text-sm text-muted-foreground mt-0.5">Marca: {result.brand}</p>
                  )}
                  {result.colors !== undefined && result.colors > 0 && (
                    <Badge variant="outline" className="mt-2 gap-1 text-xs">
                      <Sparkles className="w-3 h-3 text-primary" />
                      {result.colors} cores extraídas pela IA
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Asset salvo na Galeria IA e Identidade Visual automaticamente.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleAddAnother}>
                  Adicionar outra URL
                </Button>
                <Button className="flex-1" onClick={handleClose}>
                  Fechar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-4">
                <AlertCircle className="w-10 h-10 text-destructive/60" />
                <p className="text-sm text-muted-foreground text-center">
                  Não foi possível extrair identidade da URL. Verifique se o endereço está correto e tente novamente.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setResult(null)}>
                  Tentar novamente
                </Button>
                <Button variant="ghost" className="flex-1" onClick={handleClose}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
