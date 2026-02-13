import { Play, Clapperboard, X, Film, ImageIcon, Link2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useProjectMedia, type MediaItem } from "@/hooks/useProjectMedia";
import { useProjectMediaFeed, type ProjectMediaItem } from "@/hooks/useProjectMediaFeed";

const VIDEO_RE = /\.(mp4|webm|mov|avi|mkv)(\?|$)/i;
function isVideo(url: string) { return VIDEO_RE.test(url); }

// ── Lightbox / Video Modal ──
function MediaModal({ url, onClose }: { url: string; onClose: () => void }) {
  const video = isVideo(url);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="media-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative max-w-[90vw] max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-background/90 border border-border flex items-center justify-center hover:bg-background transition-colors"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>

          {video ? (
            <video
              src={url}
              controls
              autoPlay
              className="max-w-[90vw] max-h-[85vh] rounded-2xl shadow-2xl"
            />
          ) : (
            <img
              src={url}
              alt="Preview"
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

// ── Inline Video Slide (muted autoplay loop) ──
function InlineVideo({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [canPlay, setCanPlay] = useState(false);
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
        onCanPlay={() => setCanPlay(true)}
        onError={() => setShowFallback(true)}
        className={`${className} ${canPlay && !showFallback ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
      />
      {showFallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <Film className="w-8 h-8 text-primary/40" />
        </div>
      )}
    </>
  );
}

// ── Unified slide type ──
interface CardSlide {
  url: string;
  type: "image" | "video" | "external_video";
  title?: string;
}

// ── ProjectCard ──
interface ProjectCardProps {
  title: string;
  client: string;
  status: string;
  image?: string;
  date: string;
  index?: number;
  projectId?: string;
}

export function ProjectCard({ title, client, status, image, date, index = 0, projectId }: ProjectCardProps) {
  const { data: mediaItems } = useProjectMedia(projectId);
  const { data: feedItems } = useProjectMediaFeed(projectId);
  const [modalUrl, setModalUrl] = useState<string | null>(null);

  // Build slides: feed items first, then legacy, then fallback
  const slides: CardSlide[] = [];
  
  // From feed
  if (feedItems && feedItems.length > 0) {
    for (const f of feedItems) {
      const url = f.media_url || f.thumb_url || "";
      if (!url) continue;
      const type = f.media_type === "video" ? "video" as const
        : f.media_type === "external_video" ? "external_video" as const
        : "image" as const;
      if (!slides.find(s => s.url === url)) {
        slides.push({ url, type, title: f.title });
      }
    }
  }
  
  // From legacy
  if (slides.length === 0 && mediaItems && mediaItems.length > 0) {
    for (const m of mediaItems) {
      slides.push({ url: m.url, type: m.type === "video" ? "video" : "image", title: m.title });
    }
  }
  
  // Fallback
  if (slides.length === 0 && image) {
    slides.push({ url: image, type: "image" });
  }

  const [current, setCurrent] = useState(0);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());
  const [isPaused, setIsPaused] = useState(false);

  const validSlides = slides.filter((_, i) => !imgErrors.has(i));

  const handleImgError = useCallback((slideIndex: number) => {
    setImgErrors(prev => new Set(prev).add(slideIndex));
  }, []);

  useEffect(() => {
    setCurrent(0);
    setImgErrors(new Set());
  }, [slides.length]);

  // Autoplay
  useEffect(() => {
    if (validSlides.length <= 1 || isPaused) return;
    const currentSlide = validSlides[current];
    const delay = currentSlide?.type === "video" || currentSlide?.type === "external_video" ? 8000 : 4000;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % validSlides.length);
    }, delay);
    return () => clearInterval(timer);
  }, [validSlides.length, current, isPaused]);

  const hasSlides = validSlides.length > 0;
  const currentSlide = hasSlides ? validSlides[current] : null;

  const handleSlideClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentSlide) setModalUrl(currentSlide.url);
  };

  const typeIcon = (type: string) => {
    if (type === "video") return <Film className="w-3 h-3 text-white/80" />;
    if (type === "external_video") return <Link2 className="w-3 h-3 text-white/80" />;
    return <ImageIcon className="w-3 h-3 text-white/80" />;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, type: "spring", stiffness: 100, damping: 15 }}
        whileHover={{ y: -12, scale: 1.02, transition: { duration: 0.3 } }}
        whileTap={{ scale: 0.98 }}
        className="glass-card rounded-[2rem] overflow-hidden group cursor-pointer hover:border-primary/30 transition-all duration-500"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="relative aspect-video overflow-hidden">
          {hasSlides ? (
            <>
              <AnimatePresence mode="wait">
                {currentSlide?.type === "video" ? (
                  <motion.div
                    key={`video-${current}`}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <InlineVideo src={currentSlide.url} className="w-full h-full object-cover absolute inset-0" />
                  </motion.div>
                ) : (
                  <motion.img
                    key={`img-${current}`}
                    src={currentSlide?.url}
                    alt={title}
                    className="w-full h-full object-cover absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    onError={() => {
                      const originalIndex = slides.indexOf(validSlides[current]);
                      if (originalIndex !== -1) handleImgError(originalIndex);
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Media type badge */}
              {currentSlide && (
                <div className="absolute top-3 left-3 z-10">
                  <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                    {typeIcon(currentSlide.type)}
                    {validSlides.length > 1 && (
                      <span className="text-[9px] text-white/70 font-light">{current + 1}/{validSlides.length}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Story-mode progress bars */}
              {validSlides.length > 1 && (
                <div className="absolute bottom-3 left-3 right-3 flex gap-1 z-10">
                  {validSlides.map((s, i) => (
                    <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/20">
                      <motion.div
                        className="h-full bg-white/80"
                        initial={{ width: "0%" }}
                        animate={{ width: i === current ? "100%" : i < current ? "100%" : "0%" }}
                        transition={i === current ? { duration: s.type === "video" ? 8 : 4, ease: "linear" } : { duration: 0 }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-muted/80 flex items-center justify-center">
              <Clapperboard className="w-12 h-12 text-primary/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <motion.button
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            onClick={handleSlideClick}
          >
            <motion.div
              className="w-16 h-16 rounded-full bg-primary/90 backdrop-blur flex items-center justify-center shadow-[0_0_40px_rgba(0,163,211,0.5)]"
              initial={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Play className="w-6 h-6 text-white fill-white ml-1" />
            </motion.div>
          </motion.button>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <motion.span className="badge-info" whileHover={{ scale: 1.05 }}>{status}</motion.span>
            <span className="text-[9px] text-muted-foreground font-normal uppercase tracking-wider">{date}</span>
          </div>
          <h3 className="text-lg font-normal text-foreground tracking-tight group-hover:text-primary transition-colors duration-300">{title}</h3>
          <p className="text-xs text-muted-foreground font-light">{client}</p>
        </div>
      </motion.div>

      {modalUrl && <MediaModal url={modalUrl} onClose={() => setModalUrl(null)} />}
    </>
  );
}
