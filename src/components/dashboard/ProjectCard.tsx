import { Play, Clapperboard, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useProjectMedia } from "@/hooks/useProjectMedia";

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
  const { data: mediaUrls } = useProjectMedia(projectId);
  const [modalUrl, setModalUrl] = useState<string | null>(null);

  // Build the final slides list: fetched media → fallback image prop
  const slides: string[] = mediaUrls && mediaUrls.length > 0
    ? mediaUrls
    : image
      ? [image]
      : [];

  const [current, setCurrent] = useState(0);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());

  // Filter out errored slides
  const validSlides = slides.filter((_, i) => !imgErrors.has(i));

  const handleImgError = useCallback((slideIndex: number) => {
    setImgErrors(prev => new Set(prev).add(slideIndex));
  }, []);

  // Reset state when slides change
  useEffect(() => {
    setCurrent(0);
    setImgErrors(new Set());
  }, [slides.length]);

  // Autoplay
  useEffect(() => {
    if (validSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % validSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [validSlides.length]);

  const hasSlides = validSlides.length > 0;

  const handleSlideClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasSlides && validSlides[current]) {
      setModalUrl(validSlides[current]);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: index * 0.1,
          type: "spring",
          stiffness: 100,
          damping: 15,
        }}
        whileHover={{
          y: -12,
          scale: 1.02,
          transition: { duration: 0.3 },
        }}
        whileTap={{ scale: 0.98 }}
        className="glass-card rounded-[2rem] overflow-hidden group cursor-pointer hover:border-primary/30 transition-all duration-500"
      >
        <div className="relative aspect-video overflow-hidden">
          {hasSlides ? (
            <>
              <AnimatePresence mode="wait">
                <motion.img
                  key={current}
                  src={validSlides[current]}
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
              </AnimatePresence>

              {/* Dots indicator */}
              {validSlides.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {validSlides.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        i === current
                          ? "bg-primary w-4"
                          : "bg-white/50 hover:bg-white/80"
                      }`}
                    />
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
            <motion.span
              className="badge-info"
              whileHover={{ scale: 1.05 }}
            >
              {status}
            </motion.span>
            <span className="text-[9px] text-muted-foreground font-normal uppercase tracking-wider">{date}</span>
          </div>
          <h3 className="text-lg font-normal text-foreground tracking-tight group-hover:text-primary transition-colors duration-300">{title}</h3>
          <p className="text-xs text-muted-foreground font-light">{client}</p>
        </div>
      </motion.div>

      {/* Media Modal */}
      {modalUrl && <MediaModal url={modalUrl} onClose={() => setModalUrl(null)} />}
    </>
  );
}
