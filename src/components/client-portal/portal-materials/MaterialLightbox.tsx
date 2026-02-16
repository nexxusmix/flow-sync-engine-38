/**
 * MaterialLightbox - Fullscreen modal for previewing materials
 * Shows image/video large with title, comment/revision controls at bottom
 */

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  X,
  MessageSquare,
  AlertCircle,
  Send,
  CheckCircle2,
  Loader2,
  Play,
  Clock,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getYouTubeThumbnailHQ, getYouTubeEmbedUrl } from "@/lib/youtube-utils";
import type {
  PortalDeliverable,
  PortalComment,
  PortalApproval,
} from "@/hooks/useClientPortalEnhanced";

interface MaterialLightboxProps {
  material: PortalDeliverable;
  materials: PortalDeliverable[];
  comments: PortalComment[];
  approval?: PortalApproval;
  onClose: () => void;
  onNavigate: (id: string) => void;
  onAddComment: (data: {
    authorName: string;
    authorEmail?: string;
    content: string;
    timecode?: string;
    priority?: string;
  }) => void;
  onRequestRevision: (data: {
    deliverableId?: string;
    authorName: string;
    authorEmail?: string;
    content: string;
    priority?: string;
  }) => void;
  isAddingComment: boolean;
  isRequestingRevision: boolean;
}

function MaterialLightboxComponent({
  material,
  materials,
  comments,
  approval,
  onClose,
  onNavigate,
  onAddComment,
  onRequestRevision,
  isAddingComment,
  isRequestingRevision,
}: MaterialLightboxProps) {
  const [mode, setMode] = useState<"comment" | "revision">("comment");
  const [comment, setComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [showCommentExpanded, setShowCommentExpanded] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(false);

  const currentIndex = materials.findIndex((m) => m.id === material.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < materials.length - 1;

  const isVideo = material.youtube_url || material.type?.includes("video") || material.file_url?.match(/\.(mp4|webm|mov)$/i);
  const isImage = material.type?.includes("image") || material.file_url?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || material.thumbnail_url;
  const isApproved = !!approval;

  const materialComments = comments.filter((c) => c.deliverable_id === material.id);

  // Determine what to show as main preview
  const thumbnailUrl =
    material.thumbnail_url ||
    (material.youtube_url ? getYouTubeThumbnailHQ(material.youtube_url) : null) ||
    (material.file_url && material.file_url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? material.file_url : null);

  const handleSubmit = () => {
    if (!comment.trim() || !authorName.trim()) return;

    if (mode === "revision") {
      onRequestRevision({
        deliverableId: material.id,
        authorName,
        content: comment,
        priority: "normal",
      });
    } else {
      onAddComment({
        authorName,
        content: comment,
      });
    }
    setComment("");
    setShowCommentExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && comment.trim() && authorName.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Navigation arrows */}
        {hasPrev && (
          <button
            onClick={() => onNavigate(materials[currentIndex - 1].id)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {hasNext && (
          <button
            onClick={() => onNavigate(materials[currentIndex + 1].id)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Main preview area */}
        <div className="flex-1 flex items-center justify-center p-4 pb-0 min-h-0">
          <div className="w-full max-w-6xl h-full flex items-center justify-center">
            {/* YouTube embed */}
            {material.youtube_url && playingVideo ? (
              <iframe
                src={getYouTubeEmbedUrl(material.youtube_url) || ""}
                title={material.title}
                className="w-full aspect-video max-h-[70vh] rounded-xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : /* Video file */
            isVideo && material.file_url && !material.youtube_url ? (
              <video
                src={material.file_url}
                controls
                autoPlay
                className="w-full max-h-[70vh] rounded-xl object-contain"
              />
            ) : /* Image or thumbnail with play overlay */
            thumbnailUrl ? (
              <div className="relative w-full flex items-center justify-center">
                <img
                  src={thumbnailUrl}
                  alt={material.title}
                  className="max-w-full max-h-[70vh] rounded-xl object-contain"
                />
                {/* Play overlay for YouTube videos */}
                {material.youtube_url && !playingVideo && (
                  <button
                    onClick={() => setPlayingVideo(true)}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-colors shadow-2xl">
                      <Play className="w-7 h-7 text-gray-900 ml-1" />
                    </div>
                  </button>
                )}
              </div>
            ) : (
              /* Fallback - no preview */
              <div className="w-full aspect-video max-h-[70vh] rounded-xl bg-[#111] flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] flex items-center justify-center mx-auto">
                    {material.external_url ? (
                      <ExternalLink className="w-8 h-8 text-gray-600" />
                    ) : (
                      <Download className="w-8 h-8 text-gray-600" />
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">{material.title}</p>
                  {material.external_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={material.external_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Abrir Link
                      </a>
                    </Button>
                  )}
                  {material.file_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={material.file_url} download>
                        <Download className="w-4 h-4 mr-2" />
                        Baixar Arquivo
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar - Title + Comment */}
        <div className="w-full max-w-6xl mx-auto px-4 pb-4 pt-3 space-y-3">
          {/* Title row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium text-base truncate">{material.title}</h3>
              <p className="text-gray-500 text-xs">
                {material.type || "deliverable"}
                {material.current_version > 1 && (
                  <span className="ml-2 text-cyan-400 font-mono">V{String(material.current_version).padStart(2, "0")}</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isApproved && (
                <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Aprovado
                </Badge>
              )}
              {material.awaiting_approval && !isApproved && (
                <Badge className="bg-amber-500/20 text-amber-400 text-[10px]">
                  <Clock className="w-3 h-3 mr-1" />
                  Aguardando
                </Badge>
              )}
              {materialComments.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  {materialComments.length}
                </Badge>
              )}
            </div>
          </div>

          {/* Mode toggle + Comment input */}
          <div className="space-y-2">
            {/* Mode tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode("comment")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  mode === "comment"
                    ? "bg-primary/20 text-primary"
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Comentário
              </button>
              {!isApproved && (
                <button
                  onClick={() => setMode("revision")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    mode === "revision"
                      ? "bg-amber-500/20 text-amber-400"
                      : "text-gray-500 hover:text-gray-300"
                  )}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  Revisão
                </button>
              )}

              {/* Timecode toggle placeholder */}
              <span className="ml-auto flex items-center gap-1 text-[10px] text-gray-600">
                <Clock className="w-3 h-3" />
                Timecode
              </span>
            </div>

            {/* Author name (collapsible) */}
            {showCommentExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="overflow-hidden"
              >
                <Input
                  placeholder="Seu nome *"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="bg-[#111] border-[#2a2a2a] text-sm h-9"
                />
              </motion.div>
            )}

            {/* Comment input row */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Adicionar comentário..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onFocus={() => setShowCommentExpanded(true)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-[#111] border-[#2a2a2a] text-sm h-10"
              />
              <Button
                size="icon"
                className={cn(
                  "h-10 w-10 shrink-0",
                  mode === "revision"
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-primary hover:bg-primary/90"
                )}
                onClick={handleSubmit}
                disabled={
                  (isAddingComment || isRequestingRevision) ||
                  !comment.trim() ||
                  !authorName.trim()
                }
              >
                {isAddingComment || isRequestingRevision ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export const MaterialLightbox = memo(MaterialLightboxComponent);
