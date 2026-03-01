import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Instagram,
  Link2,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
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
type UrlStatus = "pending" | "loading" | "success" | "error";

interface UrlItem {
  id: string;
  url: string;
  type: UrlType;
  status: UrlStatus;
  title?: string;
  colors?: number;
  brand?: string;
  error?: string;
}

const URL_TYPE_CONFIG: Record<UrlType, { label: string; icon: React.ReactNode; color: string }> = {
  instagram: {
    label: "Instagram",
    icon: <Instagram className="w-3.5 h-3.5" />,
    color: "bg-primary/10 text-primary border-primary/20",
  },
  behance: {
    label: "Behance",
    icon: <Globe className="w-3.5 h-3.5" />,
    color: "bg-primary/10 text-primary border-primary/20",
  },
  pinterest: {
    label: "Pinterest",
    icon: <Globe className="w-3.5 h-3.5" />,
    color: "bg-primary/10 text-primary border-primary/20",
  },
  youtube: {
    label: "YouTube",
    icon: <Globe className="w-3.5 h-3.5" />,
    color: "bg-primary/10 text-primary border-primary/20",
  },
  linkedin: {
    label: "LinkedIn",
    icon: <Globe className="w-3.5 h-3.5" />,
    color: "bg-primary/10 text-primary border-primary/20",
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

function parseUrls(raw: string): string[] {
  return raw
    .split(/[\n,\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3 && (s.includes(".") || s.startsWith("http")));
}

function getDomain(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {
    return url;
  }
}

export function ScrapeUrlDialog({ open, onOpenChange, projectId }: ScrapeUrlDialogProps) {
  const { user } = useAuth();
  const [rawInput, setRawInput] = useState("");
  const [items, setItems] = useState<UrlItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<"input" | "processing" | "done">("input");
  const abortRef = useRef(false);

  const previewUrls = parseUrls(rawInput);
  const hasInput = previewUrls.length > 0;
  const totalDone = items.filter((i) => i.status === "success" || i.status === "error").length;
  const allDone = items.length > 0 && totalDone === items.length;

  const updateItem = (id: string, patch: Partial<UrlItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const scrapeOne = async (item: UrlItem): Promise<void> => {
    if (abortRef.current) return;
    updateItem(item.id, { status: "loading" });
    try {
      const { data, error } = await supabase.functions.invoke("scrape-client-url", {
        body: {
          url: item.url,
          project_id: projectId,
          user_id: user?.id,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao extrair");

      updateItem(item.id, {
        status: "success",
        title: data.title,
        colors: data.colors_found,
        brand: data.brand_name,
      });
    } catch (e: any) {
      updateItem(item.id, { status: "error", error: e.message });
    }
  };

  const handleStart = async () => {
    const urls = parseUrls(rawInput);
    if (!urls.length) return;

    abortRef.current = false;
    const newItems: UrlItem[] = urls.map((url, i) => ({
      id: `${i}-${url}`,
      url,
      type: detectUrlType(url),
      status: "pending",
    }));

    setItems(newItems);
    setPhase("processing");
    setIsRunning(true);

    // Process sequentially to avoid hammering the edge function
    for (const item of newItems) {
      if (abortRef.current) break;
      await scrapeOne(item);
    }

    setIsRunning(false);
    setPhase("done");

    const succeeded = newItems.filter((i) => {
      // Re-read from state is tricky — count locally
      return true; // we'll check via items state
    });
    toast.success("Extração concluída!", {
      description: `${urls.length} URL${urls.length > 1 ? "s" : ""} processada${urls.length > 1 ? "s" : ""}.`,
    });
  };

  const handleClose = () => {
    abortRef.current = true;
    onOpenChange(false);
    setTimeout(() => {
      setRawInput("");
      setItems([]);
      setPhase("input");
      setIsRunning(false);
    }, 300);
  };

  const handleReset = () => {
    setRawInput("");
    setItems([]);
    setPhase("input");
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Extrair Identidade de URLs
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {phase === "input" && (
            <>
              <p className="text-sm text-muted-foreground">
                Cole um ou mais links (um por linha ou separados por vírgula). A IA extrai cores, logo e identidade visual de cada URL.
              </p>

              <div className="space-y-2">
                <Textarea
                  placeholder={"instagram.com/perfil\nbehance.net/usuario\nhttps://seusite.com.br"}
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  className="min-h-[100px] resize-none font-mono text-xs"
                  disabled={isRunning}
                />

                {/* Preview pills */}
                {previewUrls.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {previewUrls.map((url, i) => {
                      const type = detectUrlType(url);
                      const cfg = URL_TYPE_CONFIG[type];
                      return (
                        <Badge
                          key={i}
                          variant="outline"
                          className={cn("text-[10px] h-5 px-1.5 gap-1 border", cfg.color)}
                        >
                          {cfg.icon}
                          {getDomain(url).replace("www.", "").split(".")[0]}
                        </Badge>
                      );
                    })}
                    {previewUrls.length > 0 && (
                      <span className="text-[10px] text-muted-foreground self-center">
                        {previewUrls.length} URL{previewUrls.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                )}

                {/* Quick examples */}
                <div className="flex flex-wrap gap-1.5">
                  {["instagram.com/user", "behance.net/user", "seusite.com.br"].map((ex) => (
                    <button
                      key={ex}
                      onClick={() =>
                        setRawInput((prev) => (prev ? `${prev}\n${ex}` : ex))
                      }
                      className="text-[10px] text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted px-2 py-0.5 rounded-full transition-colors"
                    >
                      + {ex}
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
                  onClick={handleStart}
                  disabled={!hasInput || isRunning}
                >
                  <Sparkles className="w-4 h-4" />
                  Extrair {previewUrls.length > 1 ? `${previewUrls.length} URLs` : "Identidade"}
                </Button>
              </div>
            </>
          )}

          {(phase === "processing" || phase === "done") && (
            <>
              {/* Progress header */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {isRunning ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Processando...
                    </span>
                  ) : (
                    "Concluído"
                  )}
                </span>
                <span className="font-medium text-foreground tabular-nums">
                  {totalDone}/{items.length}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: items.length ? `${(totalDone / items.length) * 100}%` : "0%" }}
                />
              </div>

              {/* Per-item cards */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {items.map((item) => {
                  const cfg = URL_TYPE_CONFIG[item.type];
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border transition-all",
                        item.status === "success" && "bg-primary/5 border-primary/20",
                        item.status === "error" && "bg-destructive/5 border-destructive/20",
                        item.status === "loading" && "bg-muted/40 border-border",
                        item.status === "pending" && "bg-muted/20 border-border/40 opacity-60"
                      )}
                    >
                      {/* Status icon */}
                      <div className="mt-0.5 shrink-0">
                        {item.status === "loading" && (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        )}
                        {item.status === "success" && (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        )}
                        {item.status === "error" && (
                          <AlertCircle className="w-4 h-4 text-destructive" />
                        )}
                        {item.status === "pending" && (
                          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] h-4 px-1 gap-0.5 border", cfg.color)}
                          >
                            {cfg.icon}
                            {cfg.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {item.url.replace(/^https?:\/\/(www\.)?/, "")}
                          </span>
                        </div>

                        {item.status === "success" && (
                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                            {item.title && (
                              <span className="text-xs font-medium text-foreground truncate max-w-[200px]">
                                {item.title}
                              </span>
                            )}
                            {item.colors !== undefined && item.colors > 0 && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1 gap-0.5">
                                <Sparkles className="w-2.5 h-2.5 text-primary" />
                                {item.colors} cores
                              </Badge>
                            )}
                          </div>
                        )}

                        {item.status === "error" && (
                          <p className="mt-0.5 text-[11px] text-destructive/80 truncate">
                            {item.error || "Falha ao extrair"}
                          </p>
                        )}

                        {item.status === "loading" && (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Extraindo identidade visual...
                          </p>
                        )}

                        {item.status === "pending" && (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Aguardando...
                          </p>
                        )}
                      </div>

                      {/* Remove (only when done) */}
                      {allDone && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                {allDone && (
                  <Button variant="outline" className="flex-1 gap-1.5" onClick={handleReset}>
                    <Plus className="w-4 h-4" />
                    Adicionar mais
                  </Button>
                )}
                <Button
                  className="flex-1"
                  onClick={handleClose}
                  disabled={isRunning}
                >
                  {allDone ? "Fechar" : "Cancelar"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
