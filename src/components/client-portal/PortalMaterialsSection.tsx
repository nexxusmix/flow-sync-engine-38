/**
 * PortalMaterialsSection - Seção de Materiais & Vídeos do Portal
 * 
 * Exibe entregas do projeto com suporte a:
 * - Vídeos com player (Storage ou YouTube/Vimeo embed)
 * - Links externos (Drive, URL qualquer)
 * - Arquivos para download
 * - Preview de imagens
 */

import { useState } from "react";
import { 
  Play, 
  Download, 
  ExternalLink, 
  FileText, 
  Image as ImageIcon,
  Film,
  Link as LinkIcon,
  Youtube,
  CheckCircle2,
  Clock,
  Eye,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface PortalMaterial {
  id: string;
  type: 'file' | 'video' | 'link' | 'youtube' | 'vimeo';
  title: string;
  description?: string | null;
  file_url?: string | null;
  youtube_url?: string | null;
  external_url?: string | null;
  thumbnail_url?: string | null;
  status: string;
  awaiting_approval?: boolean;
  current_version?: number;
  created_at: string;
  folder?: string;
  file_type?: string | null;
}

interface PortalMaterialsSectionProps {
  materials: PortalMaterial[];
  onSelectMaterial: (material: PortalMaterial) => void;
  selectedMaterialId?: string | null;
  approvedIds: string[];
  commentCounts: Record<string, number>;
}

// Extract YouTube video ID from various URL formats
function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/v\/([^&\s?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Extract Vimeo video ID
function getVimeoVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

// Determine material type from data
function getMaterialType(material: PortalMaterial): PortalMaterial['type'] {
  if (material.youtube_url && getYouTubeVideoId(material.youtube_url)) return 'youtube';
  if (material.external_url) {
    if (material.external_url.includes('vimeo.com')) return 'vimeo';
    return 'link';
  }
  if (material.file_type?.startsWith('video/')) return 'video';
  return 'file';
}

// Get icon for material type
function getMaterialIcon(type: PortalMaterial['type']) {
  switch (type) {
    case 'youtube':
    case 'vimeo':
    case 'video':
      return <Film className="w-5 h-5" />;
    case 'link':
      return <LinkIcon className="w-5 h-5" />;
    default:
      return <FileText className="w-5 h-5" />;
  }
}

function MaterialCard({ 
  material, 
  isSelected,
  isApproved,
  commentCount,
  onClick 
}: { 
  material: PortalMaterial;
  isSelected: boolean;
  isApproved: boolean;
  commentCount: number;
  onClick: () => void;
}) {
  const type = getMaterialType(material);
  const youtubeId = type === 'youtube' && material.youtube_url ? getYouTubeVideoId(material.youtube_url) : null;
  const vimeoId = type === 'vimeo' && material.external_url ? getVimeoVideoId(material.external_url) : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "glass-card rounded-xl p-3 text-left transition-all hover:border-primary/30 w-full",
        isSelected && "border-primary ring-1 ring-primary"
      )}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden flex items-center justify-center relative">
        {youtubeId ? (
          <img 
            src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
            alt={material.title}
            className="w-full h-full object-cover"
          />
        ) : vimeoId ? (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Play className="w-10 h-10 text-white" />
          </div>
        ) : material.thumbnail_url ? (
          <img 
            src={material.thumbnail_url}
            alt={material.title}
            className="w-full h-full object-cover"
          />
        ) : material.file_type?.startsWith('image/') && material.file_url ? (
          <img 
            src={material.file_url}
            alt={material.title}
            className="w-full h-full object-cover"
          />
        ) : material.file_type?.startsWith('video/') && material.file_url ? (
          <>
            <video src={material.file_url} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Play className="w-10 h-10 text-white" />
            </div>
          </>
        ) : (
          <div className="text-muted-foreground">
            {getMaterialIcon(type)}
          </div>
        )}
        
        {/* Version badge */}
        {material.current_version && material.current_version > 1 && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 left-2 text-[10px] bg-background/80 backdrop-blur-sm"
          >
            v{material.current_version}
          </Badge>
        )}
        
        {/* Play overlay for videos */}
        {(youtubeId || vimeoId || type === 'video') && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
              <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-medium text-sm text-foreground truncate flex-1">{material.title}</h4>
        <Badge 
          variant={isApproved ? "default" : material.awaiting_approval ? "outline" : "secondary"} 
          className={cn(
            "text-[10px] shrink-0",
            material.awaiting_approval && !isApproved && "border-muted-foreground text-muted-foreground"
          )}
        >
          {isApproved ? (
            <>
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Aprovado
            </>
          ) : material.awaiting_approval ? (
            <>
              <Clock className="w-3 h-3 mr-1" />
              Aguardando
            </>
          ) : (
            'Pendente'
          )}
        </Badge>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-muted-foreground capitalize">
          {type === 'youtube' && (
            <span className="flex items-center gap-1">
              <Youtube className="w-3 h-3 text-red-500" />
              YouTube
            </span>
          )}
          {type === 'vimeo' && 'Vimeo'}
          {type === 'link' && 'Link Externo'}
          {type === 'video' && 'Vídeo'}
          {type === 'file' && (material.folder || 'Arquivo')}
        </span>
        {commentCount > 0 && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            💬 {commentCount}
          </span>
        )}
      </div>
    </button>
  );
}

export function PortalMaterialsSection({
  materials,
  onSelectMaterial,
  selectedMaterialId,
  approvedIds,
  commentCounts,
}: PortalMaterialsSectionProps) {
  const [previewMaterial, setPreviewMaterial] = useState<PortalMaterial | null>(null);

  if (materials.length === 0) {
    return (
      <section className="glass-card rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Film className="w-7 h-7 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">Nenhum material disponível</h3>
        <p className="text-sm text-muted-foreground">
          Os materiais do projeto aparecerão aqui assim que forem publicados pela equipe.
        </p>
      </section>
    );
  }

  const youtubeId = previewMaterial?.youtube_url ? getYouTubeVideoId(previewMaterial.youtube_url) : null;
  const vimeoId = previewMaterial?.external_url ? getVimeoVideoId(previewMaterial.external_url) : null;

  return (
    <>
      <section className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Film className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Materiais & Vídeos</h3>
          <Badge variant="secondary" className="ml-auto">{materials.length}</Badge>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              isSelected={material.id === selectedMaterialId}
              isApproved={approvedIds.includes(material.id)}
              commentCount={commentCounts[material.id] || 0}
              onClick={() => {
                onSelectMaterial(material);
                // Also open preview for videos
                const type = getMaterialType(material);
                if (type === 'youtube' || type === 'vimeo' || type === 'video') {
                  setPreviewMaterial(material);
                }
              }}
            />
          ))}
        </div>
      </section>

      {/* Video Preview Modal */}
      <Dialog open={!!previewMaterial} onOpenChange={() => setPreviewMaterial(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">{previewMaterial?.title || 'Visualização'}</DialogTitle>
          <div className="aspect-video bg-black">
            {youtubeId && (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                title={previewMaterial?.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
            {vimeoId && (
              <iframe
                src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`}
                title={previewMaterial?.title}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            )}
            {!youtubeId && !vimeoId && previewMaterial?.file_url && (
              <video 
                src={previewMaterial.file_url} 
                controls 
                autoPlay
                className="w-full h-full"
              />
            )}
          </div>
          <div className="p-4 bg-background">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold text-foreground">{previewMaterial?.title}</h4>
                {previewMaterial?.description && (
                  <p className="text-sm text-muted-foreground mt-1">{previewMaterial.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {previewMaterial?.file_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={previewMaterial.file_url} download>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  </Button>
                )}
                <Button 
                  size="sm" 
                  onClick={() => {
                    onSelectMaterial(previewMaterial!);
                    setPreviewMaterial(null);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Detalhes
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
