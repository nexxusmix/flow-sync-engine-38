/**
 * PortalMaterialsTab - Aba Portal/Materiais do portal do cliente
 * 
 * Exibe materiais do projeto e permite ao cliente interagir
 * (gestor tem botões de adicionar material)
 */

import { memo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Package, 
  Plus, 
  Upload, 
  Link as LinkIcon, 
  Youtube,
  Play,
  FileText,
  Image,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  Clock,
  Eye,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PortalDeliverable, PortalApproval, PortalComment } from "@/hooks/useClientPortalEnhanced";
import { AddMaterialDialog } from "@/components/client-portal/AddMaterialDialog";

interface PortalMaterialsTabProps {
  deliverables: PortalDeliverable[];
  approvals: PortalApproval[];
  comments: PortalComment[];
  portalLinkId: string;
  hasPaymentBlock?: boolean;
  isGestor?: boolean; // Se o usuário é gestor (tem permissão de adicionar)
  onSelectMaterial: (id: string) => void;
  selectedMaterialId?: string | null;
}

function PortalMaterialsTabComponent({
  deliverables,
  approvals,
  comments,
  portalLinkId,
  hasPaymentBlock,
  isGestor = false,
  onSelectMaterial,
  selectedMaterialId,
}: PortalMaterialsTabProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const getApprovalStatus = (id: string) => {
    return approvals.some(a => a.deliverable_id === id);
  };

  const getCommentCount = (id: string) => {
    return comments.filter(c => c.deliverable_id === id).length;
  };

  const getTypeIcon = (deliverable: PortalDeliverable) => {
    if (deliverable.youtube_url) return <Youtube className="w-5 h-5" />;
    if (deliverable.external_url) return <LinkIcon className="w-5 h-5" />;
    if (deliverable.type?.includes('video')) return <Play className="w-5 h-5" />;
    if (deliverable.type?.includes('image')) return <Image className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const getYouTubeThumbnail = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions (only for gestor) */}
      {isGestor && (
        <div className="glass-card rounded-2xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Materiais para o Cliente</h3>
                <p className="text-[10px] text-muted-foreground">
                  Adicione vídeos, arquivos e links para o cliente visualizar
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Material
            </Button>
            <Button variant="outline" onClick={() => setAddDialogOpen(true)}>
              <Youtube className="w-4 h-4 mr-2" />
              Adicionar Link
            </Button>
            <Button variant="outline" onClick={() => setAddDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Arquivo
            </Button>
          </div>
        </div>
      )}

      {/* Materials Grid */}
      {deliverables.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Nenhum material ainda</h3>
          <p className="text-sm text-muted-foreground">
            {isGestor 
              ? "Adicione materiais para o cliente visualizar usando os botões acima."
              : "Os materiais do projeto aparecerão aqui quando forem publicados."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deliverables.map((deliverable) => {
            const isApproved = getApprovalStatus(deliverable.id);
            const commentCount = getCommentCount(deliverable.id);
            const isSelected = selectedMaterialId === deliverable.id;
            const thumbnail = deliverable.thumbnail_url || 
              (deliverable.youtube_url ? getYouTubeThumbnail(deliverable.youtube_url) : null);

            return (
              <div
                key={deliverable.id}
                onClick={() => onSelectMaterial(deliverable.id)}
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
                      alt={deliverable.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                      {getTypeIcon(deliverable)}
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
                    {deliverable.awaiting_approval && !isApproved && (
                      <Badge variant="secondary" className="text-[10px]">
                        <Clock className="w-3 h-3 mr-1" />
                        Aguardando
                      </Badge>
                    )}
                  </div>

                  {/* Version badge */}
                  {deliverable.current_version > 1 && (
                    <Badge className="absolute top-2 right-2 text-[10px]">
                      V{deliverable.current_version}
                    </Badge>
                  )}

                  {/* Play overlay for videos */}
                  {(deliverable.youtube_url || deliverable.type?.includes('video')) && thumbnail && (
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
                    {deliverable.title}
                  </h3>
                  {deliverable.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {deliverable.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(deliverable.created_at), "dd/MM/yyyy", { locale: ptBR })}
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
      )}

      {/* Payment Block Notice */}
      {hasPaymentBlock && (
        <div className="glass-card rounded-xl p-4 border-amber-500/30 bg-amber-500/5">
          <p className="text-sm text-amber-500">
            <strong>Nota:</strong> Alguns materiais podem ter download bloqueado devido a pendência financeira.
          </p>
        </div>
      )}

      {/* Add Material Dialog */}
      <AddMaterialDialog
        portalLinkId={portalLinkId}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
    </div>
  );
}

export const PortalMaterialsTab = memo(PortalMaterialsTabComponent);
