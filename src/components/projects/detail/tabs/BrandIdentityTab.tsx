import { useState, useCallback } from "react";
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

function BrandAssetThumbnail({ asset, className }: { asset: ProjectAsset; className?: string }) {
  const [imgError, setImgError] = useState(false);
  const displayUrl = asset.thumb_url || asset.og_image_url || asset.preview_url;
  const entities = asset.ai_entities as any;
  const elementType = entities?.element?.type;

  if (displayUrl && !imgError) {
    return (
      <img
        src={displayUrl}
        alt={asset.ai_title || asset.title}
        className={cn("max-w-[80%] max-h-[80%] object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300", className)}
        onError={() => setImgError(true)}
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
}: {
  asset: ProjectAsset;
  onSendToStudio: (asset: ProjectAsset) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggle?: (id: string) => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const entities = asset.ai_entities as any;
  const downloadUrl = asset.thumb_url || asset.og_image_url || asset.preview_url;

  const handleDownload = async () => {
    // Prefer original file via signed URL
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
    // Fallback to thumb/preview URL
    if (downloadUrl) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = asset.file_name || asset.title;
      a.target = '_blank';
      a.click();
    }
  };

  const handleCardClick = () => {
    if (selectionMode) onToggle?.(asset.id);
    else setPreviewOpen(true);
  };

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
          <BrandAssetThumbnail asset={asset} />

          {/* Processing overlay */}
          {asset.status === 'processing' && (
            <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-2 z-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-[10px] text-muted-foreground font-medium">Gerando variações IA...</span>
            </div>
          )}

          {/* Selection checkbox overlay */}
          {selectionMode && (
            <div className="absolute top-2 left-2 z-20">
              <div className="w-5 h-5 rounded border-2 border-primary bg-background flex items-center justify-center shadow-sm">
                {isSelected && <div className="w-3 h-3 rounded-sm bg-primary" />}
              </div>
            </div>
          )}

          {/* Hover overlay (only when not in selection mode) */}
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

          {/* AI Variations */}
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

          {/* AI Tags */}
          {asset.ai_tags && asset.ai_tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {asset.ai_tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="text-[10px] bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              {asset.ai_title || asset.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div
              className="rounded-xl p-8 flex items-center justify-center min-h-48"
              style={{ background: "repeating-conic-gradient(hsl(var(--muted)/0.4) 0% 25%, transparent 0% 50%) 0 0 / 16px 16px" }}
            >
              <BrandAssetThumbnail asset={asset} className="max-h-64 object-contain" />
            </div>
            {asset.ai_summary && (
              <p className="text-sm text-muted-foreground">{asset.ai_summary}</p>
            )}
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
              <Button className="flex-1 gap-1.5" onClick={() => { setPreviewOpen(false); onSendToStudio(asset); }}>
                <Wand2 className="w-4 h-4" />
                Enviar ao Studio
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
          {copiedAll ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
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
  onExportColors,
}: {
  brandNames: string[];
  allColors: string[];
  logoAssets: ProjectAsset[];
  fonts: string[];
  onExportColors: () => void;
}) {
  const primaryLogo = logoAssets.find(a => a.preview_url || a.thumb_url) || logoAssets[0];
  const displayUrl = primaryLogo?.preview_url || primaryLogo?.thumb_url || primaryLogo?.og_image_url;
  const [copiedPalette, setCopiedPalette] = useState(false);

  const handleCopyAll = () => {
    navigator.clipboard?.writeText(allColors.join(', '));
    setCopiedPalette(true);
    toast.success("Paleta copiada!");
    setTimeout(() => setCopiedPalette(false), 1500);
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-border/30">
      {/* Top bar — brand name + actions */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Kit de Marca</p>
            {brandNames.length > 0 ? (
              <h3 className="text-base font-semibold text-foreground leading-tight">{brandNames[0]}</h3>
            ) : (
              <h3 className="text-base font-semibold text-foreground leading-tight">Identidade Visual</h3>
            )}
          </div>
          {brandNames.length > 0 && (
            <Badge className="h-5 px-1.5 text-[9px] bg-primary/10 text-primary border-0 gap-0.5">
              <Sparkles className="w-2 h-2" /> IA
            </Badge>
          )}
        </div>
        {allColors.length > 0 && (
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={onExportColors}>
            <Palette className="w-3 h-3" />
            Exportar Paleta
          </Button>
        )}
      </div>

      {/* Kit body */}
      <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/20">

        {/* ── Col 1: Primary Logo ── */}
        <div className="p-5 flex flex-col gap-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Logo Principal</p>
          <div
            className="flex-1 rounded-xl flex items-center justify-center min-h-28"
            style={{ background: "repeating-conic-gradient(hsl(var(--muted)/0.25) 0% 25%, transparent 0% 50%) 0 0 / 10px 10px" }}
          >
            {displayUrl ? (
              <img
                src={displayUrl}
                alt="Logo principal"
                className="max-h-24 max-w-[80%] object-contain drop-shadow-sm"
              />
            ) : logoAssets.length > 0 ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
                <Layers className="w-10 h-10" />
                <span className="text-[10px]">{logoAssets[0].ai_title || logoAssets[0].title}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground/30">
                <Layers className="w-8 h-8" />
                <span className="text-[10px]">Nenhum logo detectado</span>
              </div>
            )}
          </div>
          {logoAssets.length > 1 && (
            <div className="flex gap-1.5 flex-wrap">
              {logoAssets.slice(1, 4).map(a => {
                const url = a.preview_url || a.thumb_url || a.og_image_url;
                return url ? (
                  <div
                    key={a.id}
                    className="w-12 h-12 rounded-lg border border-border/40 overflow-hidden"
                    style={{ background: "repeating-conic-gradient(hsl(var(--muted)/0.2) 0% 25%, transparent 0% 50%) 0 0 / 8px 8px" }}
                  >
                    <img src={url} alt="" className="w-full h-full object-contain" />
                  </div>
                ) : null;
              })}
              {logoAssets.length > 4 && (
                <div className="w-12 h-12 rounded-lg border border-border/40 bg-muted/20 flex items-center justify-center text-[10px] text-muted-foreground font-medium">
                  +{logoAssets.length - 4}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Col 2: Color Palette ── */}
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Paleta de Cores</p>
            {allColors.length > 0 && (
              <button onClick={handleCopyAll} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                {copiedPalette ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                Copiar
              </button>
            )}
          </div>
          {allColors.length > 0 ? (
            <>
              {/* Stripe preview */}
              <div className="rounded-xl overflow-hidden h-10 flex">
                {allColors.slice(0, 8).map((c, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                ))}
              </div>
              {/* Swatch grid */}
              <div className="flex flex-wrap gap-2">
                {allColors.slice(0, 10).map((c, i) => (
                  <TooltipProvider key={i}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => { navigator.clipboard?.writeText(c); toast.success(`${c} copiada!`); }}
                          className="w-9 h-9 rounded-lg border-2 border-border/30 hover:scale-110 hover:-translate-y-0.5 transition-all shadow-sm"
                          style={{ backgroundColor: c }}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="text-xs font-mono">{c}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {allColors.length > 10 && (
                  <div className="w-9 h-9 rounded-lg border border-border/40 bg-muted/20 flex items-center justify-center text-[9px] text-muted-foreground font-medium">
                    +{allColors.length - 10}
                  </div>
                )}
              </div>
              {/* Hex chips */}
              <div className="flex flex-wrap gap-1">
                {allColors.slice(0, 6).map((c, i) => (
                  <button
                    key={i}
                    onClick={() => { navigator.clipboard?.writeText(c); toast.success(`${c} copiada!`); }}
                    className="text-[9px] font-mono bg-muted/40 hover:bg-muted text-muted-foreground px-1.5 py-0.5 rounded transition-colors"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground/30 min-h-28">
              <Palette className="w-8 h-8" />
              <span className="text-[10px]">Nenhuma cor detectada</span>
            </div>
          )}
        </div>

        {/* ── Col 3: Typography + Metadata ── */}
        <div className="p-5 flex flex-col gap-4">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Tipografia Detectada</p>
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

          {/* Brand metadata */}
          <div className="space-y-2 mt-auto">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Metadados da Marca</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Logos detectados</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">{logoAssets.length}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Cores extraídas</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">{allColors.length}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Fontes identificadas</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">{fonts.length}</Badge>
              </div>
              {brandNames.length > 1 && (
                <div className="flex items-start justify-between text-xs gap-2">
                  <span className="text-muted-foreground flex-shrink-0">Outras marcas</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {brandNames.slice(1).map((n, i) => (
                      <span key={i} className="text-[9px] bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded-full">{n}</span>
                    ))}
                  </div>
                </div>
              )}
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
  const [studioAsset, setStudioAsset] = useState<ProjectAsset | null>(null);
  const [exportColorsOpen, setExportColorsOpen] = useState(false);

  // Selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  // Detect logo/visual identity assets: images that were AI processed and tagged
  const logoAssets = assets.filter(a => {
    const entities = a.ai_entities as any;
    if (a.asset_type === 'image' && a.ai_processed) return true;
    if (entities?.element?.type && ['logo', 'foto', 'ilustracao'].includes(entities.element.type)) return true;
    const tags = (a.ai_tags || []).join(' ').toLowerCase();
    if (tags.includes('logo') || tags.includes('identidade') || tags.includes('marca')) return true;
    return false;
  });

  // Detect palette assets: assets with color_palette in entities
  const paletteAssets = assets.filter(a => {
    const entities = a.ai_entities as any;
    return entities?.color_palette && Array.isArray(entities.color_palette) && entities.color_palette.length > 0;
  });

  // All unique colors across all palette assets
  const allColors: string[] = [...new Set(
    paletteAssets.flatMap(a => {
      const entities = a.ai_entities as any;
      return (entities?.color_palette as string[] | undefined) || [];
    })
  )];

  // Signature / seal assets
  const signatureAssets = assets.filter(a => {
    const entities = a.ai_entities as any;
    return ['assinatura', 'carimbo'].includes(entities?.element?.type || '');
  });

  // Brand name detected
  const brandNames = [...new Set(
    assets
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
          onExportColors={() => setExportColorsOpen(true)}
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
                    onSendToStudio={(a) => setStudioAsset(a)}
                    selectionMode={selectionMode}
                    isSelected={selectedIds.has(asset.id)}
                    onToggle={toggleSelection}
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
                    onSendToStudio={(a) => setStudioAsset(a)}
                    selectionMode={selectionMode}
                    isSelected={selectedIds.has(asset.id)}
                    onToggle={toggleSelection}
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
