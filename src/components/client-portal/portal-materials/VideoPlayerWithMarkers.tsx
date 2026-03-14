/**
 * VideoPlayerWithMarkers - Player de vídeo com marcação de timecode
 * 
 * Features:
 * - Captura de timecode atual
 * - Marcadores visuais na timeline
 * - Botão para marcar frame atual
 * - Suporte a vídeo nativo e YouTube
 */

import { memo, useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Target,
  Camera,
  Edit3,
  Clock,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { PortalComment } from "@/hooks/useClientPortalEnhanced";

interface VideoPlayerWithMarkersProps {
  videoUrl?: string;
  youtubeUrl?: string;
  thumbnailUrl?: string;
  title: string;
  comments?: PortalComment[];
  onMarkFrame?: (timestampMs: number, screenshotDataUrl?: string) => void;
  onOpenAnnotation?: (timestampMs: number, screenshotDataUrl: string) => void;
  onRequestComment?: () => void;
  onRequestRevision?: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function extractYoutubeId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function VideoPlayerWithMarkersComponent({
  videoUrl,
  youtubeUrl,
  thumbnailUrl,
  title,
  comments = [],
  onMarkFrame,
  onOpenAnnotation,
  onRequestComment,
  onRequestRevision,
}: VideoPlayerWithMarkersProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [markedTimestamp, setMarkedTimestamp] = useState<number | null>(null);

  const isYoutube = !!youtubeUrl;
  const youtubeId = youtubeUrl ? extractYoutubeId(youtubeUrl) : null;

  // Get comment markers (timecodes converted to seconds)
  const commentMarkers = comments
    .filter(c => c.timecode)
    .map(c => {
      const parts = c.timecode!.split(':');
      if (parts.length === 2) {
        return { seconds: parseInt(parts[0]) * 60 + parseInt(parts[1]), comment: c };
      }
      return null;
    })
    .filter(Boolean) as { seconds: number; comment: PortalComment }[];

  // Video event handlers
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleSeek = useCallback((value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  }, []);

  const handleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  }, []);

  // Capture current frame as screenshot
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, []);

  // Mark current frame
  const handleMarkFrame = useCallback(() => {
    if (videoRef.current) {
      const timestampMs = Math.round(videoRef.current.currentTime * 1000);
      setMarkedTimestamp(timestampMs);
      const screenshot = captureFrame();
      onMarkFrame?.(timestampMs, screenshot || undefined);
    }
  }, [captureFrame, onMarkFrame]);

  // Open annotation mode
  const handleOpenAnnotation = useCallback(() => {
    if (videoRef.current) {
      const timestampMs = Math.round(videoRef.current.currentTime * 1000);
      const screenshot = captureFrame();
      if (screenshot) {
        // Pause video when opening annotation
        videoRef.current.pause();
        setIsPlaying(false);
        onOpenAnnotation?.(timestampMs, screenshot);
      }
    }
  }, [captureFrame, onOpenAnnotation]);

  // Navigate to marker
  const handleMarkerClick = useCallback((seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  }, []);

  // Auto-hide controls
  useEffect(() => {
    if (isPlaying && !isHovering) {
      const timer = setTimeout(() => setShowControls(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowControls(true);
    }
  }, [isPlaying, isHovering, currentTime]);

  // YouTube Embed with action buttons
  if (isYoutube && youtubeId) {
    return (
      <div className="space-y-3">
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {/* Action buttons for YouTube - since we can't capture frames */}
        <div className="flex items-center gap-2 p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
          <p className="text-xs text-gray-500 flex-1">
            Assista o vídeo e deixe seu feedback abaixo:
          </p>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-[#2a2a2a] text-gray-400 hover:text-white hover:border-cyan-500/50"
            onClick={onRequestComment}
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
            Comentar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-[#2a2a2a] text-muted-foreground hover:text-foreground hover:border-border"
            onClick={onRequestRevision}
          >
            <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
            Solicitar Ajuste
          </Button>
        </div>
      </div>
    );
  }

  // Native Video Player
  return (
    <div 
      ref={containerRef}
      className="relative rounded-xl overflow-hidden bg-black aspect-video group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Video Element */}
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbnailUrl}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={togglePlay}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a]">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="text-gray-500 text-sm">Sem vídeo disponível</div>
          )}
        </div>
      )}

      {/* Play/Pause Overlay */}
      <AnimatePresence>
        {!isPlaying && videoUrl && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center bg-black/30"
            onClick={togglePlay}
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Controls */}
      <AnimatePresence>
        {showControls && videoUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4"
          >
            {/* Timeline with Markers */}
            <div className="relative mb-3">
              {/* Comment Markers */}
              {commentMarkers.map((marker, idx) => (
                <button
                  key={idx}
                  className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary hover:scale-150 transition-transform z-10"
                  style={{ left: `${(marker.seconds / duration) * 100}%` }}
                  onClick={() => handleMarkerClick(marker.seconds)}
                  title={`${formatTime(marker.seconds)} - ${marker.comment.author_name}`}
                />
              ))}
              
              {/* Marked Frame Indicator */}
              {markedTimestamp !== null && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-500 ring-2 ring-cyan-500/50 z-10"
                  style={{ left: `${((markedTimestamp / 1000) / duration) * 100}%` }}
                />
              )}

              {/* Slider */}
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="cursor-pointer"
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>

              {/* Mute */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>

              {/* Time Display */}
              <span className="text-xs text-white/80 font-mono min-w-[80px]">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                {/* Mark Frame */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 text-xs text-white/80 hover:bg-white/20 hover:text-white",
                    markedTimestamp !== null && "text-cyan-400"
                  )}
                  onClick={handleMarkFrame}
                >
                  <Target className="w-3.5 h-3.5 mr-1" />
                  Marcar
                </Button>

                {/* Screenshot + Annotate */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-white/80 hover:bg-white/20 hover:text-white"
                  onClick={handleOpenAnnotation}
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1" />
                  Anotar
                </Button>

                {/* Screenshot Only */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/80 hover:bg-white/20 hover:text-white"
                  onClick={() => {
                    const screenshot = captureFrame();
                    if (screenshot) {
                      // Download screenshot
                      const link = document.createElement('a');
                      link.href = screenshot;
                      link.download = `frame-${formatTime(currentTime).replace(':', '-')}.jpg`;
                      link.click();
                    }
                  }}
                >
                  <Camera className="w-3.5 h-3.5" />
                </Button>

                {/* Fullscreen */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/80 hover:bg-white/20 hover:text-white"
                  onClick={handleFullscreen}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Comment Markers Legend */}
            {commentMarkers.length > 0 && (
              <div className="flex items-center gap-4 mt-2 pt-2 border-t border-white/10">
                <span className="text-[10px] text-white/50 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Comentários no tempo:
                </span>
                <div className="flex gap-2 flex-wrap">
                  {commentMarkers.slice(0, 5).map((marker, idx) => (
                    <button
                      key={idx}
                      className="text-[10px] text-primary hover:underline"
                      onClick={() => handleMarkerClick(marker.seconds)}
                    >
                      {formatTime(marker.seconds)}
                    </button>
                  ))}
                  {commentMarkers.length > 5 && (
                    <span className="text-[10px] text-white/50">
                      +{commentMarkers.length - 5} mais
                    </span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const VideoPlayerWithMarkers = memo(VideoPlayerWithMarkersComponent);
