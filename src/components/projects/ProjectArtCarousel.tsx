import { useState, useEffect, useRef, useCallback } from "react";
import { useProjectMediaFeed, useUiState, type ProjectMediaItem } from "@/hooks/useProjectMediaFeed";
import { useProjectMedia, type MediaItem } from "@/hooks/useProjectMedia";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, ChevronRight, Play, Download, ExternalLink, 
  Film, ImageIcon, Sparkles, X, Maximize2, Link2, FileIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ProjectArtCarouselProps {
  projectId: string;
  bannerUrl?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  isManager?: boolean;
  onGenerateArt?: () => void;
}

function InlineVideo({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.play().catch(() => setShowFallback(true));
  }, [src]);

  return (
    <>
      <video
        ref={ref}
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        onCanPlay={() => setReady(true)}
        onError={() => setShowFallback(true)}
        className={cn(className, ready && !showFallback ? "opacity-100" : "opacity-0", "transition-opacity duration-500")}
      />
      {showFallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <Play className="w-8 h-8 text-primary/40" />
        </div>
      )}
    </>
  );
}

function ExternalVideoEmbed({ url, className }: { url: string; className?: string }) {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  
  if (ytMatch) {
    return <iframe src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}`} className={className} allow="autoplay; encrypted-media" allowFullScreen />;
  }
  if (vimeoMatch) {
    return <iframe src={`https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1`} className={className} allow="autoplay" allowFullScreen />;
  }
  return null;
}

function FullscreenModal({ item, onClose }: { item: SlideItem; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-background/90 border border-border flex items-center justify-center hover:bg-background transition-colors"
        >
          <X className="w-4 h-4 text-foreground" />
        </button>
        {item.mediaType === "video" ? (
          <video src={item.url} controls autoPlay className="max-w-[90vw] max-h-[85vh] rounded-2xl shadow-2xl" />
        ) : item.mediaType === "external_video" && item.externalUrl ? (
          <div className="w-[80vw] max-w-[900px] aspect-video rounded-2xl overflow-hidden shadow-2xl">
            <ExternalVideoEmbed url={item.externalUrl} className="w-full h-full" />
          </div>
        ) : (
          <img src={item.url} alt={item.title || "Preview"} className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
        )}
      </motion.div>
    </motion.div>,
    document.body,
  );
}

interface SlideItem {
  url: string;
  title: string;
  mediaType: "image" | "video" | "external_video" | "file" | "link";
  sourceType: string;
  externalUrl?: string | null;
}

export function ProjectArtCarousel({
  projectId,
  bannerUrl,
  logoUrl,
  coverUrl,
  isManager,
  onGenerateArt,
}: ProjectArtCarouselProps) {
  const { data: feedItems } = useProjectMediaFeed(projectId);
  const { data: legacyMediaItems } = useProjectMedia(projectId);
  const { state: savedState, saveState } = useUiState("project_art_carousel", `project:${projectId}`);
  
  const [current, setCurrent] = useState(0);
  const [fullscreenItem, setFullscreenItem] = useState<SlideItem | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Build slides: banner/cover → feed items → legacy media
  const slides: SlideItem[] = [];
  if (bannerUrl) slides.push({ url: bannerUrl, title: "Banner do Projeto", mediaType: "image", sourceType: "banner" });
  if (coverUrl) slides.push({ url: coverUrl, title: "Capa do Projeto", mediaType: "image", sourceType: "cover" });
  
  if (feedItems && feedItems.length > 0) {
    for (const item of feedItems) {
      const url = item.thumb_url || item.media_url || item.external_url || "";
      if (!url || slides.find(s => s.url === url)) continue;
      slides.push({
        url: item.media_url || item.thumb_url || "",
        title: item.title,
        mediaType: item.media_type as any,
        sourceType: item.source_type,
        externalUrl: item.external_url,
      });
    }
  }
  
  // Fallback to legacy media
  if (slides.length <= 2 && legacyMediaItems) {
    for (const item of legacyMediaItems) {
      if (!slides.find(s => s.url === item.url)) {
        slides.push({
          url: item.url,
          title: item.title || "Mídia",
          mediaType: item.type === "video" ? "video" : "image",
          sourceType: item.sourceType || "file",
        });
      }
    }
  }
  
  if (logoUrl && slides.length === 0) {
    slides.push({ url: logoUrl, title: "Logo do Projeto", mediaType: "image", sourceType: "logo" });
  }

  const total = slides.length;
  const safeIndex = total > 0 ? current % total : 0;
  const currentSlide = total > 0 ? slides[safeIndex] : null;

  // Restore saved index
  useEffect(() => {
    if (savedState?.activeIndex !== undefined && total > 0) {
      setCurrent(Math.min(savedState.activeIndex, total - 1));
    }
  }, [savedState?.activeIndex, total]);

  // Save index on change
  useEffect(() => {
    if (total > 0) {
      saveState({ activeIndex: safeIndex });
    }
  }, [safeIndex, total, saveState]);

  // Reset if total changes
  useEffect(() => {
    if (current >= total && total > 0) setCurrent(0);
  }, [total, current]);

  // Autoplay
  useEffect(() => {
    if (total <= 1 || isPaused || fullscreenItem) return;
    const delay = currentSlide?.mediaType === "video" || currentSlide?.mediaType === "external_video" ? 8000 : 4000;
    const timer = setInterval(() => setCurrent(prev => (prev + 1) % total), delay);
    return () => clearInterval(timer);
  }, [total, isPaused, fullscreenItem, currentSlide?.mediaType]);

  const goNext = useCallback(() => { if (total > 1) setCurrent(prev => (prev + 1) % total); }, [total]);
  const goPrev = useCallback(() => { if (total > 1) setCurrent(prev => (prev - 1 + total) % total); }, [total]);

  const handleDownload = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Touch/swipe
  const touchStart = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { diff > 0 ? goNext() : goPrev(); }
    touchStart.current = null;
  };

  const mediaTypeIcon = (type: string) => {
    switch (type) {
      case "video": return <Film className="w-3 h-3 text-white/80" />;
      case "external_video": return <Link2 className="w-3 h-3 text-white/80" />;
      case "file": return <FileIcon className="w-3 h-3 text-white/80" />;
      default: return <ImageIcon className="w-3 h-3 text-white/80" />;
    }
  };

  if (total === 0) {
    return (
      <div className="bg-card border border-border p-6">
        <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-4 block">Arte do Projeto</span>
        <AspectRatio ratio={16/9} className="bg-muted/30 rounded-none overflow-hidden border border-border mb-4">
          <div className="w-full h-full flex flex-col items-center justify-center">
            <Sparkles className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <span className="text-[10px] text-muted-foreground">Nenhuma mídia disponível</span>
          </div>
        </AspectRatio>
        {isManager && onGenerateArt && (
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={onGenerateArt}>
            <Sparkles className="w-4 h-4" /> Gerar com IA
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className="bg-card border border-border p-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Arte do Projeto</span>
        {total > 1 && <span className="text-[9px] text-muted-foreground">{safeIndex + 1} / {total}</span>}
      </div>

      <AspectRatio ratio={16/9} className="bg-muted/30 rounded-none overflow-hidden border border-border mb-3 relative group">
        <div className="w-full h-full relative" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <AnimatePresence mode="wait">
            {currentSlide?.mediaType === "video" ? (
              <motion.div key={`v-${safeIndex}`} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <InlineVideo src={currentSlide.url} className="w-full h-full object-cover absolute inset-0" />
              </motion.div>
            ) : currentSlide?.mediaType === "external_video" && currentSlide.externalUrl ? (
              <motion.div key={`ev-${safeIndex}`} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <ExternalVideoEmbed url={currentSlide.externalUrl} className="w-full h-full absolute inset-0" />
              </motion.div>
            ) : (
              <motion.div key={`i-${safeIndex}`} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                {currentSlide?.sourceType === "logo" ? (
                  <div className="w-full h-full relative" style={{ background: "linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--background)) 50%, hsl(var(--muted)) 100%)" }}>
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                      <img src={currentSlide.url} alt={currentSlide.title} className="max-w-[60%] max-h-[60%] object-contain drop-shadow-lg" />
                    </div>
                  </div>
                ) : (
                  <img src={currentSlide?.url} alt={currentSlide?.title || ""} className="w-full h-full object-cover" />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation arrows */}
          {total > 1 && (
            <>
              <button onClick={goPrev} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60">
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button onClick={goNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60">
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </>
          )}

          {/* Type badge */}
          <div className="absolute top-2 left-2">
            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
              {currentSlide && mediaTypeIcon(currentSlide.mediaType)}
            </div>
          </div>

          {/* Expand button */}
          <button
            onClick={() => currentSlide && setFullscreenItem(currentSlide)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
          >
            <Maximize2 className="w-3.5 h-3.5 text-white" />
          </button>

          {/* Story-mode progress bar */}
          {total > 1 && (
            <div className="absolute bottom-0 left-0 right-0 flex gap-0.5 px-2 pb-2">
              {slides.map((_, i) => (
                <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/20">
                  <motion.div
                    className="h-full bg-white/80"
                    initial={{ width: "0%" }}
                    animate={{ width: i === safeIndex ? "100%" : i < safeIndex ? "100%" : "0%" }}
                    transition={i === safeIndex ? { duration: currentSlide?.mediaType === "video" ? 8 : 4, ease: "linear" } : { duration: 0 }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </AspectRatio>

      {/* Current slide info + actions */}
      {currentSlide && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-muted-foreground truncate flex-1">{currentSlide.title}</p>
          <div className="flex items-center gap-1 shrink-0">
            {(currentSlide.mediaType === "video" || currentSlide.mediaType === "external_video") && (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setFullscreenItem(currentSlide)}>
                <Play className="w-3.5 h-3.5" />
              </Button>
            )}
            {currentSlide.externalUrl && (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => window.open(currentSlide.externalUrl!, "_blank")}>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDownload(currentSlide.url, currentSlide.title || `media_${safeIndex}`)}>
              <Download className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Generate button */}
      {isManager && onGenerateArt && (
        <Button variant="outline" size="sm" className="w-full gap-2 mt-4" onClick={onGenerateArt}>
          <Sparkles className="w-4 h-4" /> Gerar com IA
        </Button>
      )}

      {/* Fullscreen modal */}
      <AnimatePresence>
        {fullscreenItem && <FullscreenModal item={fullscreenItem} onClose={() => setFullscreenItem(null)} />}
      </AnimatePresence>
    </div>
  );
}
