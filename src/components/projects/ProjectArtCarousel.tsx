import { useState, useEffect, useRef, useCallback } from "react";
import { useProjectMedia, type MediaItem } from "@/hooks/useProjectMedia";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, ChevronRight, Play, Download, ExternalLink, 
  Film, ImageIcon, Sparkles, X, Maximize2 
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

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.play().catch(() => {});
  }, [src]);

  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
      onCanPlay={() => setReady(true)}
      className={cn(className, ready ? "opacity-100" : "opacity-0", "transition-opacity duration-500")}
    />
  );
}

function FullscreenModal({ item, onClose }: { item: MediaItem; onClose: () => void }) {
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
        {item.type === "video" ? (
          <video src={item.url} controls autoPlay className="max-w-[90vw] max-h-[85vh] rounded-2xl shadow-2xl" />
        ) : (
          <img src={item.url} alt={item.title || "Preview"} className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
        )}
      </motion.div>
    </motion.div>,
    document.body,
  );
}

export function ProjectArtCarousel({
  projectId,
  bannerUrl,
  logoUrl,
  coverUrl,
  isManager,
  onGenerateArt,
}: ProjectArtCarouselProps) {
  const { data: mediaItems } = useProjectMedia(projectId);
  const [current, setCurrent] = useState(0);
  const [fullscreenItem, setFullscreenItem] = useState<MediaItem | null>(null);

  // Build slides: banner/cover first, then media items
  const slides: MediaItem[] = [];
  if (bannerUrl) slides.push({ url: bannerUrl, type: "image", title: "Banner do Projeto", sourceType: "banner" });
  if (coverUrl) slides.push({ url: coverUrl, type: "image", title: "Capa do Projeto", sourceType: "cover" });
  if (logoUrl && !bannerUrl && !coverUrl) slides.push({ url: logoUrl, type: "image", title: "Logo do Projeto", sourceType: "logo" });
  if (mediaItems) {
    for (const item of mediaItems) {
      if (!slides.find(s => s.url === item.url)) {
        slides.push(item);
      }
    }
  }

  const total = slides.length;
  const currentSlide = total > 0 ? slides[current % total] : null;

  // Reset index if slides change
  useEffect(() => {
    if (current >= total && total > 0) setCurrent(0);
  }, [total, current]);

  const goNext = useCallback(() => {
    if (total <= 1) return;
    setCurrent(prev => (prev + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    if (total <= 1) return;
    setCurrent(prev => (prev - 1 + total) % total);
  }, [total]);

  const handleDownload = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Touch/swipe support
  const touchStart = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goNext() : goPrev();
    }
    touchStart.current = null;
  };

  if (total === 0) {
    return (
      <div className="bg-card border border-border p-6">
        <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-4 block">
          Arte do Projeto
        </span>
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
    <div className="bg-card border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          Arte do Projeto
        </span>
        {total > 1 && (
          <span className="text-[9px] text-muted-foreground">{(current % total) + 1} / {total}</span>
        )}
      </div>

      {/* Main carousel */}
      <AspectRatio ratio={16/9} className="bg-muted/30 rounded-none overflow-hidden border border-border mb-3 relative group">
        <div
          className="w-full h-full relative"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <AnimatePresence mode="wait">
            {currentSlide?.type === "video" ? (
              <motion.div
                key={`v-${current}`}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <InlineVideo src={currentSlide.url} className="w-full h-full object-cover absolute inset-0" />
              </motion.div>
            ) : (
              <motion.div
                key={`i-${current}`}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {currentSlide?.sourceType === "logo" ? (
                  <div className="w-full h-full relative" style={{
                    background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--background)) 50%, hsl(var(--muted)) 100%)',
                  }}>
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                      <img src={currentSlide.url} alt={currentSlide.title || ""} className="max-w-[60%] max-h-[60%] object-contain drop-shadow-lg" />
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
              <button
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </>
          )}

          {/* Type badge */}
          <div className="absolute top-2 left-2">
            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
              {currentSlide?.type === "video" ? (
                <Film className="w-3 h-3 text-white/80" />
              ) : (
                <ImageIcon className="w-3 h-3 text-white/80" />
              )}
            </div>
          </div>

          {/* Expand button */}
          <button
            onClick={() => currentSlide && setFullscreenItem(currentSlide)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
          >
            <Maximize2 className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </AspectRatio>

      {/* Current slide info + actions */}
      {currentSlide && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-muted-foreground truncate flex-1">
            {currentSlide.title || (currentSlide.sourceType === "banner" ? "Banner" : currentSlide.sourceType === "cover" ? "Capa" : "Mídia")}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            {currentSlide.type === "video" && (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setFullscreenItem(currentSlide)}>
                <Play className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDownload(currentSlide.url, currentSlide.title || `media_${current}`)}>
              <Download className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                i === current % total ? "bg-primary w-4" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
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
