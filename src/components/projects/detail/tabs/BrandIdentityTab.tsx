import { useState, useCallback, useRef, useEffect } from "react";
import { useSignedUrlBatch } from "@/hooks/useSignedUrlBatch";
import * as htmlToImage from "html-to-image";
import { ProjectWithStages } from "@/hooks/useProjects";
import { useProjectAssets, ProjectAsset } from "@/hooks/useProjectAssets";
import { useCreativeWorks } from "@/hooks/useCreativeWorks";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Palette,
  Layers,
  Image as ImageIcon,
  Sparkles,
  Copy,
  Download,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Upload,
  Brush,
  FileImage,
  Wand2,
  ChevronRight,
  Info,
  X,
  FileText,
  Package,
  PenLine,
  Stamp,
  Camera,
  Trash2,
  CheckSquare,
  FolderInput,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";


interface BrandIdentityTabProps {
  project: ProjectWithStages;
}

// ─── Brand Asset Thumbnail ─────────────────────────────────────────────────

function BrandAssetThumbnail({ asset, className, preloadedUrl }: { asset: ProjectAsset; className?: string; preloadedUrl?: string | null }) {
  const [imgError, setImgError] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(
    preloadedUrl || asset.thumb_url || asset.og_image_url || asset.preview_url || null
  );
  const entities = asset.ai_entities as any;
  const elementType = entities?.element?.type as string | undefined;

  useEffect(() => {
    if (preloadedUrl && preloadedUrl !== resolvedUrl) {
      setResolvedUrl(preloadedUrl);
      setImgError(false);
    }
  }, [preloadedUrl]);


  const handleError = async () => {
    if (!preloadedUrl && asset.storage_path) {
      try {
        const { data } = await supabase.storage
          .from(asset.storage_bucket || 'project-files')
          .createSignedUrl(asset.storage_path, 3600);
        if (data?.signedUrl) {
          setResolvedUrl(data.signedUrl);
          return;
        }
      } catch (e) { /* noop */ }
    }
    setImgError(true);
  };

  if (resolvedUrl && !imgError) {
    return (
      <img
        src={resolvedUrl}
        alt={asset.ai_title || asset.title}
        className={cn("max-w-[80%] max-h-[80%] object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300", className)}
        onError={handleError}
      />
    );
  }

  // Fallback: rich placeholder
  const isPdf = asset.asset_type === 'pdf';
  const iconSize = "w-10 h-10 text-muted-foreground/50";
  const label = asset.file_ext?.toUpperCase() || (isPdf ? 'PDF' : asset.asset_type?.toUpperCase() || 'FILE');

  const Icon = () => {
    if (elementType === 'logo') return <Layers className={iconSize} />;
    if (elementType === 'assinatura') return <PenLine className={iconSize} />;
    if (elementType === 'carimbo') return <Stamp className={iconSize} />;
    if (elementType === 'foto') return <Camera className={iconSize} />;
    if (elementType === 'paleta') return <Palette className={iconSize} />;
    if (isPdf) return <FileText className={iconSize} />;
    if (asset.asset_type === 'image') return <ImageIcon className={iconSize} />;
    return <FileImage className={iconSize} />;
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <Icon />
      <span className="text-[10px] font-semibold tracking-widest text-muted-foreground/40">{label}</span>
      {asset.file_name && (
        <span className="text-[9px] text-muted-foreground/30 text-center px-2 truncate max-w-[120px]">
          {asset.file_name.length > 20 ? asset.file_name.substring(0, 20) + '…' : asset.file_name}
        </span>
      )}
    </div>
  );
}

// ─── Color Swatch ──────────────────────────────────────────────────────────

function ColorSwatch({ color, size = "md" }: { color: string; size?: "sm" | "md" | "lg" }) {
  const [copied, setCopied] = useState(false);
  const sizes = { sm: "w-8 h-8", md: "w-12 h-12", lg: "w-16 h-16" };

  const handleCopy = () => {
    navigator.clipboard?.writeText(color);
    setCopied(true);
    toast.success(`${color} copiada!`);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleCopy}
            className={cn(
              sizes[size],
              "rounded-xl border-2 border-border/40 relative group transition-all hover:scale-110 hover:-translate-y-0.5 shadow-sm"
            )}
            style={{ backgroundColor: color }}
          >
            {copied && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-foreground/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs font-mono">
          {color}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Logo Card ─────────────────────────────────────────────────────────────

function LogoCard({
  asset,
  onSendToStudio,
  selectionMode,
  isSelected,
  onToggle,
  primaryColor,
  preloadedUrl,
}: {
  asset: ProjectAsset;
  onSendToStudio: (asset: ProjectAsset) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggle?: (id: string) => void;
  primaryColor?: string;
  preloadedUrl?: string | null;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [localVariations, setLocalVariations] = useState<Record<string, string> | null>(null);

  const entities = asset.ai_entities as any;
  const colorVariations: Record<string, string> = localVariations || entities?.color_variations || {};
  const hasVariations = Object.keys(colorVariations).filter(k => k !== 'primary_color_hex').length > 0;
  const downloadUrl = asset.thumb_url || asset.og_image_url || asset.preview_url;

  const handleDownload = async () => {
    if (asset.storage_path) {
      const { data } = await supabase.storage
        .from(asset.storage_bucket || 'project-files')
        .createSignedUrl(asset.storage_path, 300);
      if (data?.signedUrl) {
        const a = document.createElement('a');
        a.href = data.signedUrl;
        a.download = asset.file_name || asset.title;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
    }
    if (downloadUrl) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = asset.file_name || asset.title;
      a.target = '_blank';
      a.click();
    }
  };

  const handleReprocess = async () => {
    setIsReprocessing(true);
    try {
      await supabase.functions.invoke('process-asset', { body: { asset_id: asset.id } });
      toast.success('Variações IA iniciadas! Aguarde alguns instantes.');
    } catch (e) {
      toast.error('Erro ao iniciar reprocessamento');
    } finally {
      setIsReprocessing(false);
    }
  };

  const handleGenerateColorVariations = async () => {
    setIsGeneratingVariations(true);
    toast.info('Gerando variações de cor com IA... Pode levar até 1 minuto.');
    try {
      const { data, error } = await supabase.functions.invoke('generate-logo-variations', {
        body: { asset_id: asset.id, primary_color: primaryColor },
      });
      if (error) throw error;
      if (data?.color_variations) {
        setLocalVariations(data.color_variations);
        toast.success('Variações de cor geradas com sucesso!');
      } else {
        toast.error('Não foi possível gerar todas as variações.');
      }
    } catch (e: any) {
      console.error('Color variation error:', e);
      toast.error('Erro ao gerar variações de cor');
    } finally {
      setIsGeneratingVariations(false);
    }
  };

  const handleCardClick = () => {
    if (selectionMode) onToggle?.(asset.id);
    else setPreviewOpen(true);
  };

  // Variation labels and backgrounds
  const VARIATION_SLOTS = [
    { key: 'white', label: 'Branco', cardBg: 'bg-muted/50', imgBg: 'bg-muted/80' },
    { key: 'black', label: 'Preto',  cardBg: 'bg-muted/20', imgBg: 'bg-background' },
    { key: 'primary', label: 'Cor Principal', cardBg: 'bg-primary/5', imgBg: 'bg-transparent' },
  ] as const;

  return (
    <>
      <div className={cn(
        "glass-card rounded-2xl overflow-hidden group transition-all",
        selectionMode && isSelected
          ? "ring-2 ring-primary bg-primary/5"
          : "hover:ring-2 hover:ring-primary/30"
      )}>
        {/* Preview area */}
        <div
          className="relative aspect-video bg-muted/20 flex items-center justify-center cursor-pointer overflow-hidden"
          style={{ background: "repeating-conic-gradient(hsl(var(--muted)/0.3) 0% 25%, transparent 0% 50%) 0 0 / 12px 12px" }}
          onClick={handleCardClick}
        >
          <BrandAssetThumbnail asset={asset} preloadedUrl={preloadedUrl} />

          {asset.status === 'processing' && (
            <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-2 z-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-[10px] text-muted-foreground font-medium">Gerando variações IA...</span>
            </div>
          )}

          {selectionMode && (
            <div className="absolute top-2 left-2 z-20">
              <div className="w-5 h-5 rounded border-2 border-primary bg-background flex items-center justify-center shadow-sm">
                {isSelected && <div className="w-3 h-3 rounded-sm bg-primary" />}
              </div>
            </div>
          )}

          {!selectionMode && asset.status !== 'processing' && (
            <div className="absolute inset-0 bg-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button size="sm" variant="secondary" className="h-7 px-2 text-xs gap-1">
                <ImageIcon className="w-3 h-3" />
                Ver
              </Button>
            </div>
          )}

          {asset.ai_processed && !selectionMode && (
            <Badge className="absolute top-2 left-2 h-5 px-1.5 text-[9px] bg-primary/90 text-primary-foreground gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              IA
            </Badge>
          )}
        </div>

        {/* Original AI Variations (cutout + pattern) */}
        {(asset.preview_url || asset.og_image_url) && (
          <div className="mt-2 grid grid-cols-2 gap-1.5 px-3 pb-0">
            {asset.preview_url && (
              <div className="rounded-lg bg-muted/30 border border-border/20 p-1.5 flex flex-col items-center gap-1">
                <img
                  src={asset.preview_url}
                  className="h-12 object-contain"
                  style={{ background: "repeating-conic-gradient(hsl(var(--muted)/0.2) 0% 25%, transparent 0% 50%) 0 0 / 8px 8px" }}
                  alt="Recorte PNG"
                />
                <span className="text-[9px] text-muted-foreground">Recorte PNG</span>
              </div>
            )}
            {asset.og_image_url && (
              <div className="rounded-lg bg-muted/30 border border-border/20 p-1.5 flex flex-col items-center gap-1 overflow-hidden">
                <img src={asset.og_image_url} className="h-12 object-cover rounded w-full" alt="Padrão" />
                <span className="text-[9px] text-muted-foreground">Padrão</span>
              </div>
            )}
          </div>
        )}

        {/* Color Variations strip */}
        {hasVariations && (
          <div className="px-3 pt-2 pb-0">
            <div className="flex items-center gap-1 mb-1.5">
              <Palette className="w-2.5 h-2.5 text-primary" />
              <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Variações de Cor</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {VARIATION_SLOTS.map(({ key, label, cardBg, imgBg }) => {
                const url = colorVariations[key];
                const hex = key === 'primary' ? (colorVariations.primary_color_hex || primaryColor) : undefined;
                return url ? (
                  <div key={key} className={cn("rounded-lg border border-border/20 p-1 flex flex-col items-center gap-0.5", cardBg)}>
                    <div className={cn("w-full h-8 rounded flex items-center justify-center overflow-hidden", imgBg)}>
                      <img src={url} className="max-h-8 max-w-full object-contain" alt={label} />
                    </div>
                    <div className="flex items-center gap-0.5 w-full justify-center">
                      {hex && (
                        <div className="w-2 h-2 rounded-full border border-border/40 flex-shrink-0" style={{ backgroundColor: hex }} />
                      )}
                      <span className="text-[8px] text-muted-foreground truncate">{label}</span>
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="p-3 space-y-2.5">
          <div>
            <p className="text-sm font-medium text-foreground truncate">
              {asset.ai_title || asset.title}
            </p>
            {asset.ai_summary && (
              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                {asset.ai_summary}
              </p>
            )}
          </div>

          {asset.ai_tags && asset.ai_tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {asset.ai_tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="text-[10px] bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-1.5 pt-0.5">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-xs gap-1"
              onClick={handleDownload}
              disabled={!asset.storage_path && !downloadUrl}
            >
              <Download className="w-3 h-3" />
              Download
            </Button>
            <Button
              size="sm"
              className="flex-1 h-7 text-xs gap-1"
              onClick={() => onSendToStudio(asset)}
            >
              <Wand2 className="w-3 h-3" />
              Studio
            </Button>
          </div>
        </div>
      </div>

      {/* Full preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              {asset.ai_title || asset.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            {/* Original preview */}
            <div
              className="rounded-xl p-8 flex items-center justify-center min-h-48"
              style={{ background: "repeating-conic-gradient(hsl(var(--muted)/0.4) 0% 25%, transparent 0% 50%) 0 0 / 16px 16px" }}
            >
              <BrandAssetThumbnail asset={asset} className="max-h-64 object-contain" />
            </div>

            {asset.ai_summary && (
              <p className="text-sm text-muted-foreground">{asset.ai_summary}</p>
            )}

            {/* Color Variations Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">Variações Monocromáticas</p>
                  {hasVariations && (
                    <Badge className="h-4 px-1 text-[9px] bg-primary/10 text-primary border-0">IA</Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={hasVariations ? 'outline' : 'default'}
                  className="h-7 text-xs gap-1.5"
                  onClick={handleGenerateColorVariations}
                  disabled={isGeneratingVariations}
                >
                  {isGeneratingVariations
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Sparkles className="w-3 h-3" />}
                  {isGeneratingVariations
                    ? 'Gerando...'
                    : hasVariations ? 'Regenerar' : 'Gerar Variações IA'}
                </Button>
              </div>

              {isGeneratingVariations ? (
                <div className="grid grid-cols-3 gap-2">
                  {VARIATION_SLOTS.map(({ key, label }) => (
                    <div key={key} className="rounded-xl border border-border/20 bg-muted/10 p-3 flex flex-col items-center gap-2 min-h-20">
                      <Loader2 className="w-5 h-5 animate-spin text-primary/50 mt-2" />
                      <span className="text-[10px] text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              ) : hasVariations ? (
                <div className="grid grid-cols-3 gap-2">
                  {VARIATION_SLOTS.map(({ key, label }) => {
                    const url = colorVariations[key];
                    const hex = key === 'primary' ? (colorVariations.primary_color_hex || primaryColor) : undefined;
                    const bgs = {
                      white: 'bg-muted/60',
                      black: 'bg-background',
                      primary: 'bg-primary/5',
                    } as const;
                    return (
                      <div key={key} className={cn("rounded-xl border border-border/20 p-3 flex flex-col items-center gap-2", bgs[key as keyof typeof bgs] || 'bg-muted/20')}>
                        {url ? (
                          <>
                            <div className="w-full h-14 flex items-center justify-center">
                              <img src={url} className="max-h-14 max-w-full object-contain" alt={label} />
                            </div>
                            <div className="flex items-center gap-1">
                              {hex && (
                                <div className="w-2.5 h-2.5 rounded-full border border-border/40" style={{ backgroundColor: hex }} />
                              )}
                              <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 px-1.5 text-[9px] gap-0.5 mt-auto"
                              onClick={async () => {
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `logo-${key}.png`;
                                a.target = '_blank';
                                a.click();
                              }}
                            >
                              <Download className="w-2.5 h-2.5" />
                              Baixar
                            </Button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-muted-foreground/30 min-h-14 justify-center">
                            <ImageIcon className="w-6 h-6" />
                            <span className="text-[9px]">{label}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/40 bg-muted/10 p-5 flex flex-col items-center gap-2 text-center">
                  <Palette className="w-8 h-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">
                    Gere versões monocromáticas do logo em branco, preto e na cor principal da marca usando IA.
                  </p>
                  {primaryColor && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-3 h-3 rounded-full border border-border/40" style={{ backgroundColor: primaryColor }} />
                      <span className="font-mono">{primaryColor}</span>
                      <span>— cor detectada</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {entities?.assets_found && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Elementos detectados</p>
                {entities.assets_found.map((el: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs p-2 bg-muted/30 rounded-lg">
                    <Badge variant="outline" className="text-[10px] h-4">{el.type}</Badge>
                    <span className="text-muted-foreground flex-1 truncate">{el.description}</span>
                    <span className="text-muted-foreground">{Math.round((el.confidence || 0) * 100)}%</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-1.5" onClick={handleDownload} disabled={!asset.storage_path && !downloadUrl}>
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button
                variant="secondary"
                className="flex-1 gap-1.5"
                onClick={handleReprocess}
                disabled={isReprocessing}
              >
                {isReprocessing
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Sparkles className="w-4 h-4" />}
                {isReprocessing ? 'Gerando...' : 'Reprocessar IA'}
              </Button>
              <Button className="flex-1 gap-1.5" onClick={() => { setPreviewOpen(false); onSendToStudio(asset); }}>
                <Wand2 className="w-4 h-4" />
                Studio
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Palette Row ───────────────────────────────────────────────────────────

function PaletteRow({ asset }: { asset: ProjectAsset }) {
  const entities = asset.ai_entities as any;
  const colors: string[] = entities?.color_palette || [];
  const [copiedAll, setCopiedAll] = useState(false);

  if (colors.length === 0) return null;

  const copyAll = () => {
    navigator.clipboard?.writeText(colors.join(', '));
    setCopiedAll(true);
    toast.success("Todas as cores copiadas!");
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          <p className="text-sm font-medium text-foreground">
            {asset.ai_title || asset.title}
          </p>
          {asset.ai_processed && (
            <Badge className="h-4 px-1 text-[9px] bg-primary/10 text-primary border-0">IA</Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs gap-1.5 text-muted-foreground"
          onClick={copyAll}
        >
          {copiedAll ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
          {copiedAll ? 'Copiado!' : 'Copiar todas'}
        </Button>
      </div>

      {/* Swatches */}
      <div className="flex items-center gap-2 flex-wrap">
        {colors.map((c, i) => <ColorSwatch key={i} color={c} size="md" />)}
      </div>

      {/* Hex values */}
      <div className="flex flex-wrap gap-1.5">
        {colors.map((c, i) => (
          <button
            key={i}
            onClick={() => { navigator.clipboard?.writeText(c); toast.success(`${c} copiada!`); }}
            className="text-[10px] font-mono bg-muted/50 hover:bg-muted text-muted-foreground px-2 py-0.5 rounded transition-colors"
          >
            {c}
          </button>
        ))}
      </div>

      {asset.ai_summary && (
        <p className="text-[11px] text-muted-foreground">{asset.ai_summary}</p>
      )}
    </div>
  );
}

// ─── Send to Studio Dialog ─────────────────────────────────────────────────

function SendToStudioDialog({
  open,
  onOpenChange,
  asset,
  project,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  asset: ProjectAsset | null;
  project: ProjectWithStages;
}) {
  const { createWork } = useCreativeWorks();
  const navigate = useNavigate();
  const [isSending, setIsSending] = useState(false);

  if (!asset) return null;

  const handleSend = async () => {
    setIsSending(true);
    try {
      const work = await createWork.mutateAsync({
        title: `Identidade Visual — ${asset.ai_title || asset.title}`,
        project_id: project.id,
      });

      toast.success("Enviado ao Studio Criativo!");
      onOpenChange(false);
      navigate(`/marketing/studio/${work.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar ao Studio");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            Enviar ao Studio Criativo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
            {asset.thumb_url ? (
              <img src={asset.thumb_url} alt="" className="w-16 h-16 object-contain rounded-lg border border-border/40 bg-muted/20" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-muted/40 flex items-center justify-center">
                <FileImage className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{asset.ai_title || asset.title}</p>
              {asset.ai_summary && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{asset.ai_summary}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs text-muted-foreground">
            <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p>
              Será criado um novo trabalho criativo vinculado a <strong>{project.name}</strong> com este asset como referência de identidade visual.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button className="flex-1 gap-2" onClick={handleSend} disabled={isSending}>
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {isSending ? "Enviando..." : "Criar no Studio"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Export All Colors Dialog ──────────────────────────────────────────────

function ExportColorsDialog({
  open,
  onOpenChange,
  allColors,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  allColors: string[];
}) {
  const uniqueColors = [...new Set(allColors)];
  const cssVars = uniqueColors.map((c, i) => `  --brand-color-${i + 1}: ${c};`).join('\n');
  const cssText = `:root {\n${cssVars}\n}`;
  const hexList = uniqueColors.join('\n');

  const [format, setFormat] = useState<'hex' | 'css'>('hex');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Exportar Paleta de Cores
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {uniqueColors.map((c, i) => <ColorSwatch key={i} color={c} size="md" />)}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant={format === 'hex' ? 'default' : 'outline'}
              onClick={() => setFormat('hex')}
              className="text-xs"
            >
              Lista HEX
            </Button>
            <Button
              size="sm"
              variant={format === 'css' ? 'default' : 'outline'}
              onClick={() => setFormat('css')}
              className="text-xs"
            >
              Variáveis CSS
            </Button>
          </div>

          <div className="relative">
            <pre className="text-xs bg-muted/40 rounded-xl p-4 font-mono overflow-x-auto whitespace-pre-wrap text-foreground border border-border/40">
              {format === 'hex' ? hexList : cssText}
            </pre>
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2 h-7 w-7 p-0"
              onClick={() => {
                navigator.clipboard?.writeText(format === 'hex' ? hexList : cssText);
                toast.success("Copiado!");
              }}
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>

          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Brand Kit Panel ───────────────────────────────────────────────────────

function BrandKitPanel({
  brandNames,
  allColors,
  logoAssets,
  fonts,
  squadColorsFound,
  onExportColors,
  onMarkAsSquad,
  manuallyExcluded,
}: {
  brandNames: string[];
  allColors: string[];
  logoAssets: ProjectAsset[];
  fonts: string[];
  squadColorsFound: boolean;
  onExportColors: () => void;
  onMarkAsSquad: (color: string) => void;
  manuallyExcluded: Set<string>;
}) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedPalette, setCopiedPalette] = useState(false);

  // Primary logo — prefer the one with the most variants available
  const primaryLogo = logoAssets.find(a => a.preview_url && a.og_image_url)
    || logoAssets.find(a => a.preview_url || a.og_image_url)
    || logoAssets[0];

  const originalUrl  = primaryLogo?.thumb_url || null;
  const cutoutUrl    = primaryLogo?.preview_url || null;
  const patternUrl   = primaryLogo?.og_image_url || null;

  const handleCopyAll = () => {
    navigator.clipboard?.writeText(allColors.join(', '));
    setCopiedPalette(true);
    toast.success("Paleta copiada!");
    setTimeout(() => setCopiedPalette(false), 1500);
  };

  const handleExportKit = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await htmlToImage.toPng(exportRef.current, {
        pixelRatio: 2,
        backgroundColor: '#0f0f11',
        cacheBust: true,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `kit-de-marca-${(brandNames[0] || 'identidade').toLowerCase().replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Kit de Marca exportado!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao exportar o kit');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-border/30">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Kit de Marca</p>
            <h3 className="text-base font-semibold text-foreground leading-tight">
              {brandNames[0] || 'Identidade Visual'}
            </h3>
          </div>
          {brandNames.length > 0 && (
            <Badge className="h-5 px-1.5 text-[9px] bg-primary/10 text-primary border-0 gap-0.5">
              <Sparkles className="w-2 h-2" /> IA
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {allColors.length > 0 && (
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={onExportColors}>
              <Palette className="w-3 h-3" />
              Paleta CSS
            </Button>
          )}
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={handleExportKit}
            disabled={isExporting}
          >
            {isExporting
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Download className="w-3 h-3" />}
            {isExporting ? 'Exportando...' : 'Exportar Kit PNG'}
          </Button>
        </div>
      </div>

      {/* ── Exportable visual region ── */}
      <div ref={exportRef} className="p-6 space-y-6 bg-background">

        {/* Brand header inside export */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Identidade Visual</p>
            <h2 className="text-xl font-bold text-foreground leading-tight">{brandNames[0] || 'Kit de Marca'}</h2>
          </div>
          {brandNames.length > 1 && (
            <div className="flex flex-wrap gap-1 justify-end">
              {brandNames.slice(1).map((n, i) => (
                <span key={i} className="text-[9px] bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded-full">{n}</span>
              ))}
            </div>
          )}
        </div>

        {/* ── Logo variants row ── */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Variações de Logo</p>
          <div className="grid grid-cols-3 gap-3">
            {/* Original */}
            <div className="space-y-1.5">
              <div
                className="rounded-xl border border-border/30 flex items-center justify-center min-h-28 overflow-hidden"
                style={{ background: "repeating-conic-gradient(hsl(var(--muted)/0.3) 0% 25%, transparent 0% 50%) 0 0 / 10px 10px" }}
              >
                {originalUrl ? (
                  <img src={originalUrl} alt="Logo original" className="max-h-24 max-w-[85%] object-contain" />
                ) : cutoutUrl ? (
                  <img src={cutoutUrl} alt="Logo" className="max-h-24 max-w-[85%] object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground/30 py-6">
                    <Layers className="w-8 h-8" />
                    <span className="text-[9px]">Sem logo</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                <p className="text-[10px] text-muted-foreground">Original</p>
              </div>
            </div>

            {/* Cutout PNG */}
            <div className="space-y-1.5">
              <div
                className="rounded-xl border border-border/30 flex items-center justify-center min-h-28 overflow-hidden"
                style={{ background: "repeating-conic-gradient(hsl(var(--muted)/0.15) 0% 25%, transparent 0% 50%) 0 0 / 10px 10px" }}
              >
                {cutoutUrl ? (
                  <img src={cutoutUrl} alt="Cutout PNG" className="max-h-24 max-w-[85%] object-contain drop-shadow-lg" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground/30 py-6">
                    <FileImage className="w-7 h-7" />
                    <span className="text-[9px]">Gerar via IA</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                <p className="text-[10px] text-muted-foreground">Recorte PNG</p>
                {cutoutUrl && <Badge className="h-3.5 px-1 text-[8px] bg-primary/10 text-primary border-0 ml-auto">IA</Badge>}
              </div>
            </div>

            {/* Generated Pattern */}
            <div className="space-y-1.5">
              <div className="rounded-xl border border-border/30 overflow-hidden min-h-28 flex items-center justify-center">
                {patternUrl ? (
                  <img src={patternUrl} alt="Padrão gerado" className="w-full h-28 object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground/30 py-6">
                    <Brush className="w-7 h-7" />
                    <span className="text-[9px]">Gerar via IA</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                <p className="text-[10px] text-muted-foreground">Padrão Gerado</p>
                {patternUrl && <Badge className="h-3.5 px-1 text-[8px] bg-primary/10 text-primary border-0 ml-auto">IA</Badge>}
              </div>
            </div>
          </div>

          {/* Additional logos (thumbnails) */}
          {logoAssets.length > 1 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {logoAssets.filter(a => a.id !== primaryLogo?.id).slice(0, 6).map(a => {
                const url = a.preview_url || a.thumb_url || a.og_image_url;
                return url ? (
                  <div
                    key={a.id}
                    className="w-12 h-12 rounded-lg border border-border/30 overflow-hidden"
                    style={{ background: "repeating-conic-gradient(hsl(var(--muted)/0.2) 0% 25%, transparent 0% 50%) 0 0 / 6px 6px" }}
                  >
                    <img src={url} alt="" className="w-full h-full object-contain" />
                  </div>
                ) : null;
              })}
              {logoAssets.length > 7 && (
                <div className="w-12 h-12 rounded-lg border border-border/40 bg-muted/20 flex items-center justify-center text-[9px] text-muted-foreground font-medium">
                  +{logoAssets.length - 7}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Color palette ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Paleta de Cores</p>
            {allColors.length > 0 && (
              <button onClick={handleCopyAll} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                {copiedPalette ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                Copiar tudo
              </button>
            )}
          </div>

          {allColors.length > 0 ? (
            <div className="space-y-3">
              {/* Full-width color bar */}
              <div className="rounded-xl overflow-hidden h-12 flex shadow-sm">
                {allColors.slice(0, 12).map((c, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                ))}
              </div>
              {/* Swatch + hex grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {allColors.map((c, i) => (
                  <TooltipProvider key={i}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col items-center gap-1 group relative">
                          <button
                            onClick={() => { navigator.clipboard?.writeText(c); toast.success(`${c} copiada!`); }}
                            className="w-full h-10 rounded-lg border-2 border-border/30 group-hover:scale-105 group-hover:-translate-y-0.5 transition-all shadow-sm"
                            style={{ backgroundColor: c }}
                          />
                          <span className="text-[9px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                            {c}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); onMarkAsSquad(c); }}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive/80 hover:bg-destructive border border-background opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            title="Marcar como cor SQUAD (excluir da paleta)"
                          >
                            <X className="w-2.5 h-2.5 text-destructive-foreground" />
                          </button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs font-mono">Clique para copiar · ✕ para excluir da paleta</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground/30 min-h-20 border border-border/20 rounded-xl">
              <Palette className="w-7 h-7" />
              <span className="text-[10px]">Nenhuma cor detectada</span>
            </div>
          )}

          {/* SQUAD exclusion warning */}
          {squadColorsFound && (
            <div className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-muted/40 border border-border/30 mt-2">
              <span className="text-[11px] flex-shrink-0">⚠️</span>
              <p className="text-[10px] text-muted-foreground leading-snug">
                Cores da plataforma SQUAD foram excluídas desta paleta.
              </p>
            </div>
          )}
        </div>

        {/* ── Typography + Metadata ── */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Typography */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Tipografia</p>
            {fonts.length > 0 ? (
              <div className="space-y-1.5">
                {fonts.slice(0, 4).map((font, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/20">
                    <span className="text-[10px] text-muted-foreground w-4 flex-shrink-0 font-mono">{i + 1}</span>
                    <span className="text-sm font-medium text-foreground truncate flex-1" style={{ fontFamily: font }}>
                      {font}
                    </span>
                    <button
                      onClick={() => { navigator.clipboard?.writeText(font); toast.success(`"${font}" copiada!`); }}
                      className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground/30 min-h-16 border border-border/20 rounded-xl">
                <span className="text-[10px]">Nenhuma tipografia detectada</span>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Metadados</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/20 border border-border/20">
                <span className="text-muted-foreground">Logos detectados</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">{logoAssets.length}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/20 border border-border/20">
                <span className="text-muted-foreground">Cores extraídas</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">{allColors.length}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/20 border border-border/20">
                <span className="text-muted-foreground">Fontes identificadas</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">{fonts.length}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/20 border border-border/20">
                <span className="text-muted-foreground">Com recorte PNG</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                  {logoAssets.filter(a => a.preview_url).length}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/20 border border-border/20">
                <span className="text-muted-foreground">Com padrão gerado</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                  {logoAssets.filter(a => a.og_image_url).length}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function BrandIdentityTab({ project }: BrandIdentityTabProps) {
  const { assets, isLoading, deleteAsset } = useProjectAssets(project.id);
  // Batch pre-fetch all signed URLs at once — eliminates per-card delay
  const signedUrlMap = useSignedUrlBatch(assets);
  const [studioAsset, setStudioAsset] = useState<ProjectAsset | null>(null);
  const [exportColorsOpen, setExportColorsOpen] = useState(false);

  // Manually excluded colors (persisted in localStorage per project)
  const storageKey = `squad-excluded-colors-${project.id}`;
  const [manuallyExcluded, setManuallyExcluded] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const handleMarkAsSquad = (color: string) => {
    setManuallyExcluded(prev => {
      const next = new Set(prev);
      next.add(color.toLowerCase());
      localStorage.setItem(storageKey, JSON.stringify([...next]));
      return next;
    });
    toast.success(`${color} excluída da paleta do cliente.`, {
      description: 'Marcada como cor da plataforma SQUAD.',
    });
  };


  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  // ── SQUAD brand filter ─────────────────────────────────────────────────────
  // Colors belonging to the SQUAD Film platform — must be excluded from the client palette
  const SQUAD_COLORS_FILTER = new Set([
    '#009cca', '#009CCA',
    '#000000', '#0f0f11', '#0a0a0a', '#1a1a1a', '#111111',
    '#ffffff', '#fefefe',
  ].map(c => c.toLowerCase()));

  const SQUAD_BRAND_NAMES = ['squad', 'squad film', 'squadfilm'];

  const isSquadAsset = (a: ProjectAsset): boolean => {
    const brandName = ((a.ai_entities as any)?.brand_name || '').toLowerCase();
    return SQUAD_BRAND_NAMES.some(n => brandName.includes(n));
  };

  const filterClientColors = (colors: string[]): string[] =>
    colors.filter(c => !SQUAD_COLORS_FILTER.has(c.toLowerCase()));

  // How many SQUAD-originated colors were stripped (for the warning UI)
  const squadColorsFound = assets.some(isSquadAsset);

  // Detect logo/visual identity assets: images that were AI processed and tagged
  const logoAssets = assets.filter(a => {
    if (isSquadAsset(a)) return false;
    const entities = a.ai_entities as any;
    if (a.asset_type === 'image' && a.ai_processed) return true;
    if (entities?.element?.type && ['logo', 'foto', 'ilustracao'].includes(entities.element.type)) return true;
    const tags = (a.ai_tags || []).join(' ').toLowerCase();
    if (tags.includes('logo') || tags.includes('identidade') || tags.includes('marca')) return true;
    return false;
  });

  // Detect palette assets: only from non-SQUAD assets
  const paletteAssets = assets.filter(a => {
    if (isSquadAsset(a)) return false;
    const entities = a.ai_entities as any;
    return entities?.color_palette && Array.isArray(entities.color_palette) && entities.color_palette.length > 0;
  });

  // All unique client colors, filtered to remove SQUAD platform colors
  const allColors: string[] = [...new Set(
    filterClientColors(
      paletteAssets.flatMap(a => {
        const entities = a.ai_entities as any;
        return (entities?.color_palette as string[] | undefined) || [];
      })
    ).filter(c => !manuallyExcluded.has(c.toLowerCase()))
  )];

  // Signature / seal assets
  const signatureAssets = assets.filter(a => {
    if (isSquadAsset(a)) return false;
    const entities = a.ai_entities as any;
    return ['assinatura', 'carimbo'].includes(entities?.element?.type || '');
  });

  // Brand name detected — exclude SQUAD names
  const brandNames = [...new Set(
    assets
      .filter(a => !isSquadAsset(a))
      .map(a => (a.ai_entities as any)?.brand_name)
      .filter(Boolean)
  )] as string[];

  // Typography: collect all fonts detected across assets
  const allFonts: string[] = [...new Set(
    assets.flatMap(a => {
      const entities = a.ai_entities as any;
      const fonts = entities?.fonts;
      if (Array.isArray(fonts)) return fonts as string[];
      if (typeof fonts === 'string') return [fonts];
      return [];
    }).filter(Boolean)
  )];

  const allVisibleAssets = [...logoAssets, ...signatureAssets];

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(allVisibleAssets.map(a => a.id)));
  const clearSelection = () => setSelectedIds(new Set());
  const exitSelection = () => { setSelectionMode(false); setSelectedIds(new Set()); };

  const handleBulkDownload = async () => {
    const toDownload = [...selectedIds]
      .map(id => allVisibleAssets.find(a => a.id === id))
      .filter((a): a is ProjectAsset => !!(a && a.storage_path));

    if (toDownload.length === 0) {
      toast.info('Nenhum arquivo para baixar');
      return;
    }

    setIsDownloading(true);
    toast.info(`Baixando ${toDownload.length} arquivo(s)...`);

    for (let i = 0; i < toDownload.length; i++) {
      const asset = toDownload[i];
      const { data } = await supabase.storage
        .from(asset.storage_bucket || 'project-files')
        .createSignedUrl(asset.storage_path!, 300);
      if (data?.signedUrl) {
        const a = document.createElement('a');
        a.href = data.signedUrl;
        a.download = asset.file_name || asset.title;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (i < toDownload.length - 1) await new Promise(r => setTimeout(r, 400));
      }
    }

    setIsDownloading(false);
    toast.success(`${toDownload.length} arquivo(s) baixado(s)`);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Excluir ${selectedIds.size} item(s)? Esta ação não pode ser desfeita.`)) return;
    setIsDeleting(true);
    try {
      await Promise.all([...selectedIds].map(id => deleteAsset.mutateAsync(id)));
      setSelectedIds(new Set());
      setSelectionMode(false);
      toast.success('Itens excluídos com sucesso');
    } catch {
      toast.error('Erro ao excluir itens');
    } finally {
      setIsDeleting(false);
    }
  };

  const BRAND_CATEGORY_LABELS: Record<string, string> = {
    deliverable: 'Entrega',
    reference: 'Referência',
    raw: 'Bruto',
    contract: 'Contrato',
    finance: 'Financeiro',
    other: 'Outro',
  };

  const handleBulkMove = async (targetCategory: string) => {
    if (selectedIds.size === 0) return;
    setIsMoving(true);
    try {
      await Promise.all(
        [...selectedIds].map(id =>
          supabase.from('project_assets').update({ category: targetCategory }).eq('id', id)
        )
      );
      setSelectedIds(new Set());
      setSelectionMode(false);
      toast.success(`${selectedIds.size} asset(s) movido(s) para "${BRAND_CATEGORY_LABELS[targetCategory] || targetCategory}"`);
    } catch {
      toast.error('Erro ao mover assets');
    } finally {
      setIsMoving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasAnyData = logoAssets.length > 0 || paletteAssets.length > 0 || signatureAssets.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Brush className="w-5 h-5 text-primary" />
            Identidade Visual
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kit de marca consolidado automaticamente pela IA a partir dos assets do projeto
          </p>
        </div>
        <div className="flex gap-2">
          {allVisibleAssets.length > 0 && !selectionMode && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setSelectionMode(true)}
            >
              <CheckSquare className="w-4 h-4" />
              Selecionar
            </Button>
          )}
        </div>
      </div>

      {/* ── Kit de Marca consolidado ─────────────────────────────── */}
      {hasAnyData && (
        <BrandKitPanel
          brandNames={brandNames}
          allColors={allColors}
          logoAssets={logoAssets}
          fonts={allFonts}
          squadColorsFound={squadColorsFound}
          onExportColors={() => setExportColorsOpen(true)}
          onMarkAsSquad={handleMarkAsSquad}
          manuallyExcluded={manuallyExcluded}
        />
      )}

      {/* Selection action bar */}
      {selectionMode && (
        <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/20 flex-wrap">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size} selecionado{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <Button size="sm" variant="outline" onClick={selectAll} className="h-8 text-xs">
            Selecionar tudo ({allVisibleAssets.length})
          </Button>
          <Button size="sm" variant="outline" onClick={clearSelection} className="h-8 text-xs" disabled={selectedIds.size === 0}>
            Desmarcar tudo
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkDownload}
            disabled={selectedIds.size === 0 || isDownloading}
            className="h-8 text-xs gap-1.5"
          >
            {isDownloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            Baixar {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                disabled={selectedIds.size === 0 || isMoving}
                className="h-8 text-xs gap-1.5"
              >
                {isMoving ? <Loader2 className="w-3 h-3 animate-spin" /> : <FolderInput className="w-3 h-3" />}
                Mover para...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="z-50 bg-popover border border-border shadow-lg">
              {Object.entries(BRAND_CATEGORY_LABELS).map(([key, label]) => (
                <DropdownMenuItem key={key} onClick={() => handleBulkMove(key)}>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleBulkDelete}
            disabled={selectedIds.size === 0 || isDeleting}
            className="h-8 text-xs gap-1.5 ml-auto"
          >
            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            Excluir {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </Button>
          <Button size="sm" variant="ghost" onClick={exitSelection} className="h-8 text-xs">
            Cancelar
          </Button>
        </div>
      )}

      {!hasAnyData ? (
        /* Empty state */
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Brush className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhuma identidade visual detectada ainda
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
            Faça upload de arquivos com logos, contratos ou briefings na Galeria IA e a IA extrairá automaticamente a identidade visual do cliente.
          </p>
          <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
            <ChevronRight className="w-4 h-4" />
            Acesse a aba <strong className="text-foreground ml-1">Galeria IA</strong> para fazer upload e extrair assets
          </div>
        </div>
      ) : (
        <div className="space-y-10">

          {/* ── Logos ─────────────────────────────────────────────── */}
          {logoAssets.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Logos & Imagens de Marca
                </h3>
                <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                  {logoAssets.length}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {logoAssets.map(asset => (
                  <LogoCard
                    key={asset.id}
                    asset={asset}
                    primaryColor={allColors[0]}
                    onSendToStudio={(a) => setStudioAsset(a)}
                    selectionMode={selectionMode}
                    isSelected={selectedIds.has(asset.id)}
                    onToggle={toggleSelection}
                    preloadedUrl={signedUrlMap.get(asset.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Color Palettes ────────────────────────────────────── */}
          {paletteAssets.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Paletas de Cores
                  </h3>
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                    {allColors.length} cores únicas
                  </Badge>
                </div>
              </div>

              {/* Master palette */}
              {allColors.length > 0 && (
                <div className="glass-card rounded-xl p-4 space-y-3 border-l-4 border-primary/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <p className="text-sm font-medium">Paleta Consolidada</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs gap-1"
                      onClick={() => {
                        navigator.clipboard?.writeText(allColors.join(', '));
                        toast.success("Paleta copiada!");
                      }}
                    >
                      <Copy className="w-3 h-3" />
                      Copiar tudo
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allColors.map((c, i) => <ColorSwatch key={i} color={c} size="lg" />)}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {allColors.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => { navigator.clipboard?.writeText(c); toast.success(`${c} copiada!`); }}
                        className="text-[10px] font-mono bg-muted/50 hover:bg-muted text-muted-foreground px-2 py-0.5 rounded transition-colors"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Per-document palettes */}
              <div className="space-y-3">
                {paletteAssets.map(asset => (
                  <PaletteRow key={asset.id} asset={asset} />
                ))}
              </div>
            </section>
          )}

          {/* ── Signatures & Seals ────────────────────────────────── */}
          {signatureAssets.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Assinaturas & Carimbos
                </h3>
                <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                  {signatureAssets.length}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {signatureAssets.map(asset => (
                  <LogoCard
                    key={asset.id}
                    asset={asset}
                    primaryColor={allColors[0]}
                    onSendToStudio={(a) => setStudioAsset(a)}
                    selectionMode={selectionMode}
                    isSelected={selectedIds.has(asset.id)}
                    onToggle={toggleSelection}
                    preloadedUrl={signedUrlMap.get(asset.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Send to Studio CTA ────────────────────────────────── */}
          <div className="glass-card rounded-xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Wand2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Usar identidade no Studio Criativo</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Envie logos e paletas extraídas para o Studio Criativo para gerar roteiros, storyboards e criativos com a marca do cliente.
              </p>
            </div>
            <Button
              className="gap-2 flex-shrink-0"
              onClick={() => logoAssets[0] && setStudioAsset(logoAssets[0])}
              disabled={logoAssets.length === 0}
            >
              <ChevronRight className="w-4 h-4" />
              Abrir Studio
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <SendToStudioDialog
        open={!!studioAsset}
        onOpenChange={(v) => !v && setStudioAsset(null)}
        asset={studioAsset}
        project={project}
      />
      <ExportColorsDialog
        open={exportColorsOpen}
        onOpenChange={setExportColorsOpen}
        allColors={allColors}
      />
    </div>
  );
}
