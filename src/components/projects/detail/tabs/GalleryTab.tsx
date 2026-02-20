import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ProjectWithStages } from "@/hooks/useProjects";
import { useProjectAssets, ProjectAsset } from "@/hooks/useProjectAssets";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Upload, 
  Loader2, 
  Sparkles, 
  Image as ImageIcon, 
  FileText, 
  Link2, 
  Package, 
  Trash2,
  ExternalLink,
  MoreVertical,
  X,
  Cpu,
  Eye,
  Download,
  Palette,
  PenLine,
  Stamp,
  Camera,
  Layers,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GalleryTabProps {
  project: ProjectWithStages;
}

type FilterType = 'all' | 'image' | 'video' | 'pdf' | 'link' | 'other';

const FILTER_LABELS: Record<FilterType, string> = {
  all: 'Todos',
  image: 'Imagens',
  video: 'Vídeos',
  pdf: 'PDFs',
  link: 'Links',
  other: 'Outros',
};

const CATEGORY_LABELS: Record<string, string> = {
  deliverable: 'Entrega',
  reference: 'Referência',
  raw: 'Bruto',
  contract: 'Contrato',
  finance: 'Financeiro',
  other: 'Outro',
};

const CATEGORY_COLORS: Record<string, string> = {
  deliverable: 'bg-primary/10 text-primary',
  reference: 'bg-blue-500/10 text-blue-600',
  raw: 'bg-orange-500/10 text-orange-600',
  contract: 'bg-purple-500/10 text-purple-600',
  finance: 'bg-green-500/10 text-green-600',
  other: 'bg-muted text-muted-foreground',
};

function getAssetTypeIcon(asset: ProjectAsset) {
  const entities = asset.ai_entities as any;
  if (entities?.element?.type === 'logo') return <Layers className="w-4 h-4" />;
  if (entities?.element?.type === 'assinatura') return <PenLine className="w-4 h-4" />;
  if (entities?.element?.type === 'carimbo') return <Stamp className="w-4 h-4" />;
  if (entities?.element?.type === 'foto') return <Camera className="w-4 h-4" />;
  if (entities?.element?.type === 'paleta') return <Palette className="w-4 h-4" />;
  if (asset.asset_type === 'image') return <ImageIcon className="w-4 h-4" />;
  if (asset.asset_type === 'video') return <Layers className="w-4 h-4" />;
  if (asset.asset_type === 'pdf') return <FileText className="w-4 h-4" />;
  if (asset.asset_type === 'link') return <Link2 className="w-4 h-4" />;
  return <Package className="w-4 h-4" />;
}

function ColorPalette({ colors }: { colors: string[] }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {colors.slice(0, 6).map((color, i) => (
        <div
          key={i}
          className="w-5 h-5 rounded-full border border-border/50 cursor-pointer"
          style={{ backgroundColor: color }}
          title={color}
          onClick={() => { navigator.clipboard?.writeText(color); toast.success(`Cor ${color} copiada!`); }}
        />
      ))}
    </div>
  );
}

const CATEGORY_BG: Record<string, string> = {
  deliverable: 'from-primary/20 to-primary/5',
  reference: 'from-blue-500/20 to-blue-500/5',
  raw: 'from-orange-500/20 to-orange-500/5',
  contract: 'from-purple-500/20 to-purple-500/5',
  finance: 'from-green-500/20 to-green-500/5',
  other: 'from-muted to-muted/30',
};

function AssetThumbnail({ asset }: { asset: ProjectAsset }) {
  const [imgError, setImgError] = useState(false);
  const displayUrl = asset.thumb_url || asset.og_image_url || asset.preview_url;
  const entities = asset.ai_entities as any;

  // Show image if we have a URL and it hasn't errored
  if (displayUrl && !imgError) {
    return (
      <img
        src={displayUrl}
        alt={asset.ai_title || asset.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback placeholder — rich visual based on category/type
  const bg = CATEGORY_BG[asset.category] || CATEGORY_BG.other;
  const isPdf = asset.asset_type === 'pdf';
  const isImage = asset.asset_type === 'image';

  // Detect element type for sub-assets
  const elementType = entities?.element?.type;
  const iconSize = "w-8 h-8";

  const Icon = () => {
    if (elementType === 'logo') return <Layers className={iconSize} />;
    if (elementType === 'assinatura') return <PenLine className={iconSize} />;
    if (elementType === 'carimbo') return <Stamp className={iconSize} />;
    if (elementType === 'foto') return <Camera className={iconSize} />;
    if (elementType === 'paleta') return <Palette className={iconSize} />;
    if (isImage) return <ImageIcon className={iconSize} />;
    if (isPdf) return <FileText className={iconSize} />;
    return <Package className={iconSize} />;
  };

  const label = asset.file_ext?.toUpperCase()
    || (isPdf ? 'PDF' : isImage ? 'IMG' : asset.asset_type?.toUpperCase() || 'FILE');

  return (
    <div className={cn(
      "w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br text-muted-foreground",
      bg
    )}>
      <Icon />
      <span className="text-[10px] font-semibold tracking-widest opacity-60">{label}</span>
      {asset.file_name && (
        <span className="text-[9px] text-center px-2 opacity-40 truncate w-full text-center leading-tight">
          {asset.file_name.length > 22 ? asset.file_name.substring(0, 22) + '…' : asset.file_name}
        </span>
      )}
    </div>
  );
}

function AssetCard({
  asset,
  onDelete,
  selectionMode,
  isSelected,
  onToggle,
}: {
  asset: ProjectAsset;
  onDelete: (id: string) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggle?: (id: string) => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const entities = asset.ai_entities as any;
  const colorPalette = entities?.color_palette as string[] | undefined;
  const displayUrl = asset.thumb_url || asset.og_image_url || asset.preview_url;
  const isPdf = asset.asset_type === 'pdf';

  const handleDownload = async () => {
    if (!asset.storage_path) return;
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
    }
  };

  const openPreview = useCallback(async () => {
    setPreviewOpen(true);
    if (isPdf && asset.storage_path && !pdfUrl) {
      setPdfLoading(true);
      try {
        const { data, error } = await supabase.storage
          .from('project-files')
          .createSignedUrl(asset.storage_path, 3600);
        if (data?.signedUrl) setPdfUrl(data.signedUrl);
        else console.error('Signed URL error:', error);
      } catch (e) {
        console.error('Error generating PDF signed URL:', e);
      } finally {
        setPdfLoading(false);
      }
    }
  }, [isPdf, asset.storage_path, pdfUrl]);

  const handleCardClick = () => {
    if (selectionMode) {
      onToggle?.(asset.id);
    } else {
      openPreview();
    }
  };

  return (
    <>
      <div className={cn(
        "glass-card rounded-xl overflow-hidden group transition-all",
        selectionMode && isSelected
          ? "ring-2 ring-primary bg-primary/5"
          : "hover:ring-2 hover:ring-primary/30"
      )}>
        {/* Thumbnail */}
        <div 
          className="relative aspect-video bg-muted/40 overflow-hidden cursor-pointer"
          onClick={handleCardClick}
        >
          <AssetThumbnail asset={asset} />

          {/* Selection checkbox overlay */}
          {selectionMode && (
            <div className="absolute top-2 left-2 z-20">
              <div className="w-5 h-5 rounded border-2 border-primary bg-background flex items-center justify-center shadow-sm">
                {isSelected && <div className="w-3 h-3 rounded-sm bg-primary" />}
              </div>
            </div>
          )}

          {/* Overlay on hover (only when not in selection mode) */}
          {!selectionMode && (
            <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button size="sm" variant="secondary" className="h-8 gap-1 text-xs">
                <Eye className="w-3 h-3" />
                Ver
              </Button>
            </div>
          )}

          {/* AI badge */}
          {asset.ai_processed && !selectionMode && (
            <div className="absolute top-2 left-2">
              <Badge className="h-5 px-1.5 text-[9px] bg-primary/90 text-primary-foreground gap-1">
                <Cpu className="w-2.5 h-2.5" />
                IA
              </Badge>
            </div>
          )}

          {/* Category badge */}
          <div className="absolute top-2 right-2">
            <span className={cn(
              "text-[9px] font-medium px-1.5 py-0.5 rounded-full",
              CATEGORY_COLORS[asset.category] || CATEGORY_COLORS.other
            )}>
              {CATEGORY_LABELS[asset.category] || asset.category}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate leading-tight">
                {asset.ai_title || asset.title}
              </p>
              {asset.ai_summary && (
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                  {asset.ai_summary}
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100">
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {asset.source_type === 'file' && asset.storage_path && (
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                )}
                {asset.url && (
                  <DropdownMenuItem asChild>
                    <a href={asset.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir link
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => onDelete(asset.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Color palette if available */}
          {colorPalette && colorPalette.length > 0 && (
            <ColorPalette colors={colorPalette} />
          )}

          {/* Tags */}
          {asset.ai_tags && asset.ai_tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {asset.ai_tags.slice(0, 4).map((tag, i) => (
                <span key={i} className="text-[10px] bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className={cn(
          "max-h-[92vh] overflow-hidden flex flex-col",
          isPdf ? "sm:max-w-4xl" : "sm:max-w-2xl"
        )}>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-sm">
              {getAssetTypeIcon(asset)}
              {asset.ai_title || asset.title}
              {isPdf && asset.storage_path && (
                <a
                  href={pdfUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto"
                  onClick={(e) => { if (!pdfUrl) e.preventDefault(); }}
                >
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" disabled={!pdfUrl}>
                    <ExternalLink className="w-3 h-3" />
                    Abrir em nova aba
                  </Button>
                </a>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
            {/* PDF Viewer */}
            {isPdf && (
              <div className="rounded-xl overflow-hidden border border-border/40 bg-muted/20" style={{ height: '65vh' }}>
                {pdfLoading ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm">Carregando PDF...</span>
                  </div>
                ) : pdfUrl ? (
                  <iframe
                    src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                    className="w-full h-full border-0"
                    title={asset.title}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <AlertCircle className="w-8 h-8 text-destructive/60" />
                    <span className="text-sm">Não foi possível carregar o PDF</span>
                    {asset.storage_path && (
                      <Button size="sm" variant="outline" onClick={openPreview} className="gap-1.5">
                        <RotateCw className="w-3 h-3" />
                        Tentar novamente
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Image viewer */}
            {!isPdf && displayUrl && (
              <img
                src={displayUrl}
                alt={asset.ai_title || asset.title}
                className="w-full rounded-xl object-contain max-h-96"
              />
            )}

            {asset.ai_summary && (
              <p className="text-sm text-muted-foreground">{asset.ai_summary}</p>
            )}
            {colorPalette && colorPalette.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Paleta de Cores</p>
                <ColorPalette colors={colorPalette} />
              </div>
            )}
            {entities?.assets_found && entities.assets_found.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Elementos Detectados pela IA</p>
                <div className="space-y-2">
                  {entities.assets_found.map((el: any, i: number) => (
                    <div key={i} className="p-2 bg-muted/30 rounded-lg text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] h-4">{el.type}</Badge>
                        <span className="text-muted-foreground">{el.location}</span>
                        <span className="ml-auto text-muted-foreground">{Math.round((el.confidence || 0) * 100)}%</span>
                      </div>
                      <p>{el.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function GalleryTab({ project }: GalleryTabProps) {
  const { assets, isLoading, deleteAsset } = useProjectAssets(project.id);
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const filteredAssets = assets.filter(a => {
    if (filter === 'all') return true;
    return a.asset_type === filter;
  });

  const filterCounts: Record<FilterType, number> = {
    all: assets.length,
    image: assets.filter(a => a.asset_type === 'image').length,
    video: assets.filter(a => a.asset_type === 'video').length,
    pdf: assets.filter(a => a.asset_type === 'pdf').length,
    link: assets.filter(a => a.asset_type === 'link').length,
    other: assets.filter(a => !['image', 'video', 'pdf', 'link'].includes(a.asset_type)).length,
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    if (files.length > 0) setUploadDialogOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
    });
  };

  const handleExtract = async () => {
    if (selectedFiles.length === 0) return;
    setIsExtracting(true);
    setUploadDialogOpen(false);

    // Filter: skip files over 5MB to prevent OOM in edge function
    const MAX_FILE_BYTES = 5 * 1024 * 1024;
    const eligibleFiles = selectedFiles.filter(f => f.size <= MAX_FILE_BYTES);
    const skippedCount = selectedFiles.length - eligibleFiles.length;

    if (skippedCount > 0) {
      toast.warning(`${skippedCount} arquivo(s) ignorado(s) por exceder 5MB. Envie arquivos menores para análise de IA.`);
    }

    if (eligibleFiles.length === 0) {
      setIsExtracting(false);
      return;
    }

    let totalSaved = 0;

    try {
      // Process one file at a time to avoid OOM in the edge function
      for (let i = 0; i < eligibleFiles.length; i++) {
        const file = eligibleFiles[i];
        setExtractProgress(`Processando ${i + 1}/${eligibleFiles.length}: ${file.name}...`);

        const base64 = await fileToBase64(file);

        const { data, error } = await supabase.functions.invoke('extract-visual-assets', {
          body: {
            project_id: project.id,
            files: [{
              name: file.name,
              base64,
              mime_type: file.type,
              size_bytes: file.size,
            }],
            uploaded_by_user_id: user?.id,
          }
        });

        if (error) {
          console.error(`Error processing ${file.name}:`, error);
          toast.error(`Erro ao processar ${file.name}`);
        } else {
          totalSaved += data?.total || 0;
        }
      }

      toast.success(`${totalSaved} asset${totalSaved !== 1 ? 's' : ''} extraído${totalSaved !== 1 ? 's' : ''} com sucesso!`);
      setSelectedFiles([]);
    } catch (err) {
      console.error('Extraction error:', err);
      toast.error('Erro ao extrair assets com IA');
    } finally {
      setIsExtracting(false);
      setExtractProgress("");
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm('Excluir este asset?')) return;
    await deleteAsset.mutateAsync(assetId);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(filteredAssets.map(a => a.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = async () => {
    if (!confirm(`Excluir ${selectedIds.size} item(s)? Esta ação não pode ser desfeita.`)) return;
    setIsDeleting(true);
    try {
      await Promise.all([...selectedIds].map(id => deleteAsset.mutateAsync(id)));
      setSelectedIds(new Set());
      setSelectionMode(false);
      toast.success(`Itens excluídos com sucesso`);
    } catch {
      toast.error('Erro ao excluir itens');
    } finally {
      setIsDeleting(false);
    }
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkDownload = async () => {
    const toDownload = [...selectedIds]
      .map(id => assets.find(a => a.id === id))
      .filter((a): a is ProjectAsset => !!(a && a.source_type === 'file' && a.storage_path));

    if (toDownload.length === 0) {
      toast.info('Nenhum arquivo para baixar (links são ignorados)');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {assets.length} asset{assets.length !== 1 ? 's' : ''} no projeto
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx"
          />
          {assets.length > 0 && !selectionMode && (
            <Button
              variant="outline"
              onClick={() => setSelectionMode(true)}
              className="gap-2"
            >
              <CheckSquare className="w-4 h-4" />
              Selecionar
            </Button>
          )}
          <Button 
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isExtracting || selectionMode}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload de Arquivo
          </Button>
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isExtracting || selectionMode}
            className="gap-2"
          >
            {isExtracting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isExtracting ? extractProgress : 'Extrair Assets com IA'}
          </Button>
        </div>
      </div>

      {/* Selection action bar */}
      {selectionMode && (
        <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/20 flex-wrap">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size} selecionado{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <Button size="sm" variant="outline" onClick={selectAll} className="h-8 text-xs">
            Selecionar tudo ({filteredAssets.length})
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

      {/* Filters */}
      {assets.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(FILTER_LABELS) as FilterType[]).map(f => (
            filterCounts[f] > 0 || f === 'all' ? (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
                className="h-8 text-xs gap-1.5"
              >
                {FILTER_LABELS[f]}
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                  filter === f ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  {filterCounts[f]}
                </span>
              </Button>
            ) : null
          ))}
        </div>
      )}

      {/* Extracting state */}
      {isExtracting && (
        <div className="glass-card rounded-xl p-6 flex items-center gap-4">
          <div className="relative">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <Sparkles className="w-4 h-4 text-primary absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <p className="font-medium text-foreground">Extração em andamento...</p>
            <p className="text-sm text-muted-foreground">{extractProgress}</p>
            <p className="text-xs text-muted-foreground mt-1">A galeria atualiza automaticamente quando terminar</p>
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      {filteredAssets.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map(asset => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onDelete={handleDelete}
              selectionMode={selectionMode}
              isSelected={selectedIds.has(asset.id)}
              onToggle={toggleSelection}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Galeria de Assets IA</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
            Faça upload de contratos, briefings, identidades visuais e deixe a IA extrair automaticamente logos, paletas de cores, assinaturas e mais.
          </p>
          <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Extrair Assets com IA
          </Button>
        </div>
      )}

      {/* Upload confirmation dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Extrair Assets com IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              A IA vai analisar os arquivos e extrair automaticamente logos, identidade visual, assinaturas, paletas de cores e outros elementos.
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                  <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate flex-1">{f.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setUploadDialogOpen(false); setSelectedFiles([]); }}>
                Cancelar
              </Button>
              <Button className="flex-1 gap-2" onClick={handleExtract} disabled={selectedFiles.length === 0}>
                <Sparkles className="w-4 h-4" />
                Processar {selectedFiles.length} arquivo{selectedFiles.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

