import { useState } from "react";
import { useProjectAssets, type ProjectAsset } from "@/hooks/useProjectAssets";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Play, Download, ExternalLink, Film, Image, FileText, Link2, Package } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface AssetCarouselProps {
  projectId: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  deliverable: "ENTREGA",
  reference: "REFERÊNCIA",
  raw: "BRUTO",
  contract: "CONTRATO",
  finance: "FINANCEIRO",
  other: "OUTRO",
};

const CATEGORY_COLORS: Record<string, string> = {
  deliverable: "bg-primary/20 text-primary",
  reference: "bg-primary/10 text-primary/70",
  raw: "bg-muted text-muted-foreground",
  other: "bg-muted text-muted-foreground",
};

function getAssetThumb(asset: ProjectAsset): string | null {
  if (asset.thumb_url) return asset.thumb_url;
  if (asset.og_image_url) return asset.og_image_url;
  if (asset.asset_type === "image" && asset.storage_path) return null; // Will use storage URL
  return null;
}

function getAssetUrl(asset: ProjectAsset): string | null {
  if (asset.source_type === "link") return asset.url;
  if (asset.storage_path) {
    // Build public URL
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/project-files/${asset.storage_path}`;
  }
  return null;
}

export function AssetCarousel({ projectId }: AssetCarouselProps) {
  const { assets } = useProjectAssets(projectId);
  const readyAssets = assets.filter(a => a.status === "ready");
  const [currentIndex, setCurrentIndex] = useState(0);

  if (readyAssets.length === 0) return null;

  const current = readyAssets[currentIndex % readyAssets.length];
  const thumb = getAssetThumb(current);
  const url = getAssetUrl(current);

  const next = () => setCurrentIndex(i => (i + 1) % readyAssets.length);
  const prev = () => setCurrentIndex(i => (i - 1 + readyAssets.length) % readyAssets.length);

  const isVideo = current.asset_type === "video";
  const isLink = current.source_type === "link";

  return (
    <Card className="glass-card p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-foreground">Materiais Recentes</h3>
          <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{readyAssets.length}</span>
        </div>
        {readyAssets.length > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={prev} className="w-7 h-7 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] text-muted-foreground px-2">{(currentIndex % readyAssets.length) + 1}/{readyAssets.length}</span>
            <button onClick={next} className="w-7 h-7 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <AspectRatio ratio={16 / 9} className="rounded-xl overflow-hidden border border-border bg-muted/20">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full h-full"
          >
            {/* Content */}
            {isVideo && url ? (
              <video
                src={url}
                muted
                playsInline
                autoPlay
                loop
                preload="metadata"
                className="w-full h-full object-cover"
              />
            ) : thumb ? (
              <img src={thumb} alt={current.title} className="w-full h-full object-cover" />
            ) : isLink && current.embed_url ? (
              <iframe
                src={current.embed_url}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30">
                {current.asset_type === "video" ? <Film className="w-8 h-8 text-muted-foreground/40" /> :
                 current.asset_type === "image" ? <Image className="w-8 h-8 text-muted-foreground/40" /> :
                 current.asset_type === "pdf" ? <FileText className="w-8 h-8 text-muted-foreground/40" /> :
                 <Link2 className="w-8 h-8 text-muted-foreground/40" />}
                <span className="text-[10px] text-muted-foreground mt-2">{current.file_name || current.url}</span>
              </div>
            )}

            {/* Overlay badges */}
            <div className="absolute top-2 left-2 flex gap-1.5">
              <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider", CATEGORY_COLORS[current.category] || CATEGORY_COLORS.other)}>
                {CATEGORY_LABELS[current.category] || "OUTRO"}
              </span>
            </div>

            {/* Bottom overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <p className="text-xs text-white font-medium truncate">{current.ai_title || current.title}</p>
              {current.ai_summary && (
                <p className="text-[10px] text-white/70 truncate mt-0.5">{current.ai_summary}</p>
              )}
            </div>

            {/* Play button for video */}
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="absolute top-2 right-2 flex gap-1">
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-lg bg-black/40 backdrop-blur-sm hover:bg-black/60 flex items-center justify-center transition-colors"
                >
                  {isLink ? <ExternalLink className="w-3.5 h-3.5 text-white" /> : <Download className="w-3.5 h-3.5 text-white" />}
                </a>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </AspectRatio>

      {/* Tags */}
      {(current.ai_tags || current.tags)?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {(current.ai_tags || current.tags)?.slice(0, 5).map((tag, i) => (
            <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
