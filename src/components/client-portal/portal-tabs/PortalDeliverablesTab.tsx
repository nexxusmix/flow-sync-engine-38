/**
 * PortalDeliverablesTab - Aba Entregas do portal do cliente
 * 
 * Exibe materiais/entregas do projeto com:
 * - Grid de cards de materiais
 * - Preview de vídeos/imagens
 * - Comentários e aprovações
 * - Bloqueio por inadimplência
 */

import { memo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Play, 
  FileText, 
  Image, 
  Download,
  ExternalLink,
  Youtube,
  Link as LinkIcon,
  CheckCircle2,
  Clock,
  MessageSquare,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PortalDeliverable, PortalFile, PortalApproval, PortalComment } from "@/hooks/useClientPortalEnhanced";

interface PortalDeliverablesTabProps {
  deliverables: PortalDeliverable[];
  files: PortalFile[];
  approvals: PortalApproval[];
  comments: PortalComment[];
  hasPaymentBlock?: boolean;
  onSelectMaterial: (id: string) => void;
  selectedMaterialId?: string | null;
}

interface MaterialItem {
  id: string;
  type: 'video' | 'youtube' | 'file' | 'link' | 'image';
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
  isDeliverable: boolean;
}

function PortalDeliverablesTabComponent({
  deliverables,
  files,
  approvals,
  comments,
  hasPaymentBlock,
  onSelectMaterial,
  selectedMaterialId,
}: PortalDeliverablesTabProps) {
  // Combine deliverables and files into materials
  const materials: MaterialItem[] = [
    ...deliverables.map(d => ({
      id: d.id,
      type: (d.youtube_url ? 'youtube' : d.external_url ? 'link' : d.type?.includes('video') ? 'video' : 'file') as MaterialItem['type'],
      title: d.title,
      description: d.description,
      file_url: d.file_url,
      youtube_url: d.youtube_url,
      external_url: d.external_url,
      thumbnail_url: d.thumbnail_url,
      status: d.status,
      awaiting_approval: d.awaiting_approval,
      current_version: d.current_version,
      created_at: d.created_at,
      isDeliverable: true,
    })),
    ...files.map(f => ({
      id: f.id,
      type: (f.file_type?.includes('image') ? 'image' : 'file') as MaterialItem['type'],
      title: f.name,
      file_url: f.file_url,
      status: 'pending',
      created_at: f.created_at,
      isDeliverable: false,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getApprovalStatus = (id: string) => {
    return approvals.some(a => a.deliverable_id === id || a.project_file_id === id);
  };

  const getCommentCount = (id: string) => {
    return comments.filter(c => c.deliverable_id === id || c.project_file_id === id).length;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="w-5 h-5" />;
      case 'youtube':
        return <Youtube className="w-5 h-5" />;
      case 'image':
        return <Image className="w-5 h-5" />;
      case 'link':
        return <LinkIcon className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getYouTubeThumbnail = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
    }
    return null;
  };

  if (materials.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">Nenhuma entrega ainda</h3>
        <p className="text-sm text-muted-foreground">
          Os materiais do projeto aparecerão aqui quando forem publicados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map((material) => {
          const isApproved = getApprovalStatus(material.id);
          const commentCount = getCommentCount(material.id);
          const isSelected = selectedMaterialId === material.id;
          const thumbnail = material.thumbnail_url || 
            (material.youtube_url ? getYouTubeThumbnail(material.youtube_url) : null);

          return (
            <div
              key={material.id}
              onClick={() => onSelectMaterial(material.id)}
              className={cn(
                "glass-card rounded-xl overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary/50",
                isSelected && "ring-2 ring-primary"
              )}
            >
              {/* Thumbnail or Icon */}
              <div className="relative aspect-video bg-muted/50 flex items-center justify-center">
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={material.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                    {getTypeIcon(material.type)}
                  </div>
                )}

                {/* Overlay badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                  {isApproved && (
                    <Badge className="bg-emerald-500/90 text-white text-[10px]">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Aprovado
                    </Badge>
                  )}
                  {material.awaiting_approval && !isApproved && (
                    <Badge variant="secondary" className="text-[10px]">
                      <Clock className="w-3 h-3 mr-1" />
                      Aguardando
                    </Badge>
                  )}
                </div>

                {/* Version badge */}
                {material.current_version && material.current_version > 1 && (
                  <Badge className="absolute top-2 right-2 text-[10px]">
                    V{material.current_version}
                  </Badge>
                )}

                {/* Play overlay for videos */}
                {(material.type === 'video' || material.type === 'youtube') && thumbnail && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-6 h-6 text-foreground ml-1" />
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-medium text-foreground truncate mb-1">
                  {material.title}
                </h3>
                {material.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {material.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(material.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {commentCount > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MessageSquare className="w-3 h-3" />
                        {commentCount}
                      </span>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Block Notice */}
      {hasPaymentBlock && (
        <div className="glass-card rounded-xl p-4 border-amber-500/30 bg-amber-500/5">
          <p className="text-sm text-amber-500">
            <strong>Nota:</strong> Alguns materiais podem ter download bloqueado devido a pendência financeira.
          </p>
        </div>
      )}
    </div>
  );
}

export const PortalDeliverablesTab = memo(PortalDeliverablesTabComponent);
