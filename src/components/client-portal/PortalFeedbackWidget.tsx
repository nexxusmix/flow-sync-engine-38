/**
 * PortalFeedbackWidget - Quick satisfaction feedback with star rating
 * Lightweight, elegant micro-interaction for the client portal
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, CheckCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PortalFeedbackWidgetProps {
  portalLinkId: string;
  projectId?: string;
  entityType?: string;
  entityId?: string;
  /** Custom title for the widget */
  title?: string;
  /** Custom subtitle / prompt */
  subtitle?: string;
  /** Compact mode for inline use */
  compact?: boolean;
  /** Client name (pre-filled if known) */
  clientName?: string;
  /** Client email (pre-filled if known) */
  clientEmail?: string;
  /** Called after successful submission */
  onSubmitted?: (rating: number) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: "Muito insatisfeito",
  2: "Insatisfeito",
  3: "Neutro",
  4: "Satisfeito",
  5: "Muito satisfeito",
};

const RATING_EMOJIS: Record<number, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "😊",
  5: "🤩",
};

export function PortalFeedbackWidget({
  portalLinkId,
  projectId,
  entityType = "general",
  entityId,
  title = "Como está sua experiência?",
  subtitle = "Sua opinião nos ajuda a melhorar.",
  compact = false,
  clientName,
  clientEmail,
  onSubmitted,
}: PortalFeedbackWidgetProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [showComment, setShowComment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const activeStar = hoveredStar ?? rating;

  const handleSubmit = async () => {
    if (!rating) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("client_feedback" as any).insert({
        portal_link_id: portalLinkId,
        project_id: projectId,
        entity_type: entityType,
        entity_id: entityId,
        rating,
        comment: comment.trim() || null,
        client_name: clientName || null,
        client_email: clientEmail || null,
      });

      if (error) throw error;

      setSubmitted(true);
      onSubmitted?.(rating);
      toast.success("Obrigado pelo seu feedback!");
    } catch (err) {
      console.error("Feedback submission error:", err);
      toast.error("Erro ao enviar feedback. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (submitted) {
    return (
      <motion.div
        className={cn(
          "rounded-2xl border border-border/20 bg-card p-6 text-center",
          compact && "p-4"
        )}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, type: "spring" }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
        >
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-primary" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-sm font-medium text-foreground">Obrigado pelo seu feedback!</p>
          <p className="text-xs text-muted-foreground mt-1">Sua avaliação nos ajuda a melhorar sua experiência.</p>
          <div className="flex items-center justify-center gap-1 mt-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "w-4 h-4",
                  star <= (rating || 0) ? "text-primary fill-primary" : "text-muted-foreground/20"
                )}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(
        "rounded-2xl border border-border/20 bg-card overflow-hidden",
        compact ? "p-4" : "p-6"
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className={cn("text-center", compact ? "mb-3" : "mb-5")}>
        <p className={cn(
          "font-medium text-foreground",
          compact ? "text-xs" : "text-sm"
        )}>
          {title}
        </p>
        <p className={cn(
          "text-muted-foreground mt-0.5",
          compact ? "text-[10px]" : "text-xs"
        )}>
          {subtitle}
        </p>
      </div>

      {/* Star Rating */}
      <div className="flex items-center justify-center gap-1.5 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            className="relative p-1 rounded-lg hover:bg-primary/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(null)}
            onClick={() => {
              setRating(star);
              if (!showComment) setShowComment(true);
            }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            <Star
              className={cn(
                "transition-all duration-200",
                compact ? "w-6 h-6" : "w-8 h-8",
                activeStar && star <= activeStar
                  ? "text-primary fill-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]"
                  : "text-muted-foreground/25"
              )}
            />
          </motion.button>
        ))}
      </div>

      {/* Rating Label */}
      <AnimatePresence mode="wait">
        {activeStar && (
          <motion.div
            key={activeStar}
            className="text-center mb-4"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
          >
            <span className="text-xs text-primary font-medium">
              {RATING_EMOJIS[activeStar]} {RATING_LABELS[activeStar]}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment Area + Submit */}
      <AnimatePresence>
        {rating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {showComment && (
              <div className="space-y-3 pt-2">
                <div className="relative">
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Quer deixar uma observação? (opcional)"
                    className="min-h-[60px] max-h-[120px] resize-none text-sm bg-background/50 border-border/30 focus:border-primary/30"
                    maxLength={500}
                  />
                  {comment.length > 0 && (
                    <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground/40">
                      {comment.length}/500
                    </span>
                  )}
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full gap-2 bg-primary hover:bg-primary/90 h-9 text-xs"
                  size="sm"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                    />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Enviar Feedback
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
