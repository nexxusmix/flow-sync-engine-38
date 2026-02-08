/**
 * PortalMaterialCard - Card de material com versão, tags e changelog inline
 */

import { memo, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Play,
  FileVideo,
  FileText,
  Image as ImageIcon,
  Youtube,
  Link as LinkIcon,
  CheckCircle2,
  Clock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PortalDeliverable, PortalComment, PortalApproval, PortalVersion } from "@/hooks/useClientPortalEnhanced";
import { getTagConfig, type ChangelogItem } from "./types";

interface PortalMaterialCardProps {
  material: PortalDeliverable;
  versions: PortalVersion[];
  comments: PortalComment[];
  approval?: PortalApproval;
  isSelected: boolean;
  onSelect: () => void;
  onViewVersion?: (version: PortalVersion) => void;
}

function PortalMaterialCardComponent({
  material,
  versions,
  comments,
  approval,
  isSelected,
  onSelect,
  onViewVersion,
}: PortalMaterialCardProps) {
  const [showVersions, setShowVersions] = useState(false);

  // Get the latest version data (if available)
  const latestVersion = versions
    .filter(v => v.deliverable_id === material.id)
    .sort((a, b) => b.version_number - a.version_number)[0];

  // Parse changelog items from version (with safe fallback)
  const changeTags: string[] = (latestVersion as any)?.change_tags || [];
  const changelogItems: ChangelogItem[] = (latestVersion as any)?.changelog_items || [];

  const isApproved = !!approval;
  const commentCount = comments.filter(c => c.deliverable_id === material.id).length;
  const previousVersions = versions
    .filter(v => v.deliverable_id === material.id && v.version_number < material.current_version)
    .sort((a, b) => b.version_number - a.version_number);

  // Determine material type for icon
  const getTypeIcon = () => {
    if (material.youtube_url) return <Youtube className="w-5 h-5" />;
    if (material.external_url) return <LinkIcon className="w-5 h-5" />;
    if (material.type?.includes('video')) return <FileVideo className="w-5 h-5" />;
    if (material.type?.includes('image')) return <ImageIcon className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  // Get YouTube thumbnail
  const getYouTubeThumbnail = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
    return null;
  };

  const thumbnail = material.thumbnail_url ||
    (material.youtube_url ? getYouTubeThumbnail(material.youtube_url) : null);

  const isVideo = material.youtube_url || material.type?.includes('video');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-[#0a0a0a] border rounded-lg overflow-hidden transition-all cursor-pointer",
        isSelected
          ? "border-cyan-500/50 ring-1 ring-cyan-500/30"
          : "border-[#1a1a1a] hover:border-[#2a2a2a]"
      )}
      onClick={onSelect}
    >
      {/* Thumbnail/Preview */}
      <div className="relative aspect-video bg-[#111] flex items-center justify-center">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={material.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-gray-600">
            {getTypeIcon()}
          </div>
        )}

        {/* Play overlay for videos */}
        {isVideo && thumbnail && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-5 h-5 text-gray-900 ml-1" />
            </div>
          </div>
        )}

        {/* Version Badge */}
        <Badge className="absolute top-2 right-2 bg-[#0a0a0a]/90 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          V{String(material.current_version).padStart(2, '0')}
        </Badge>

        {/* Status Badge */}
        <div className="absolute top-2 left-2 flex gap-1">
          {isApproved && (
            <Badge className="bg-emerald-500/90 text-white text-[10px]">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Aprovado
            </Badge>
          )}
          {material.awaiting_approval && !isApproved && (
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 text-[10px]">
              <Clock className="w-3 h-3 mr-1" />
              Aguardando
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title and Date */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-white text-sm leading-tight flex-1">
            {material.title}
          </h3>
          <span className="text-[10px] text-gray-600 whitespace-nowrap">
            {format(new Date(material.updated_at || material.created_at), "dd/MM/yy", { locale: ptBR })}
          </span>
        </div>

        {/* Change Tags */}
        {changeTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {changeTags.map((tagId) => {
              const tag = getTagConfig(tagId);
              return (
                <span
                  key={tagId}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-medium text-white",
                    tag.color
                  )}
                >
                  {tag.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Changelog Items */}
        {changelogItems.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-[#1a1a1a]">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">O que mudou:</p>
            <ul className="space-y-0.5">
              {changelogItems.slice(0, 3).map((item, idx) => (
                <li key={idx} className="text-xs text-gray-400 flex items-start gap-1.5">
                  <span className="text-cyan-500 mt-0.5">•</span>
                  <span>{item.description}</span>
                </li>
              ))}
              {changelogItems.length > 3 && (
                <li className="text-[10px] text-gray-600">
                  +{changelogItems.length - 3} alterações
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Footer: Comments & Version Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1a1a1a]">
          <div className="flex items-center gap-3">
            {commentCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MessageSquare className="w-3.5 h-3.5" />
                {commentCount}
              </span>
            )}
            {material.external_url && (
              <a
                href={material.external_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-gray-500 hover:text-cyan-400 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {previousVersions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] text-gray-500 hover:text-gray-300"
              onClick={(e) => {
                e.stopPropagation();
                setShowVersions(!showVersions);
              }}
            >
              {showVersions ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
              V{previousVersions.map(v => String(v.version_number).padStart(2, '0')).join(' • V')}
            </Button>
          )}
        </div>

        {/* Expandable Previous Versions */}
        {showVersions && previousVersions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 pt-2 border-t border-[#1a1a1a]"
          >
            {previousVersions.map((version) => (
              <button
                key={version.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewVersion?.(version);
                }}
                className="w-full flex items-center justify-between p-2 rounded bg-[#111] hover:bg-[#1a1a1a] transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    V{String(version.version_number).padStart(2, '0')}
                  </Badge>
                  <span className="text-xs text-gray-400">{version.title || 'Versão anterior'}</span>
                </div>
                <span className="text-[10px] text-gray-600">
                  {format(new Date(version.created_at), "dd/MM", { locale: ptBR })}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export const PortalMaterialCard = memo(PortalMaterialCardComponent);
