/**
 * PortalFeedbackWidget - Recurrent satisfaction feedback with star rating
 * Supports cooldown periods, trend tracking, and cycle-based recurrence
 */

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, CheckCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
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
  title?: string;
  subtitle?: string;
  compact?: boolean;
  clientName?: string;
  clientEmail?: string;
  /** Feedback context: checkpoint, delivery, milestone, onboarding, approval */
  feedbackContext?: string;
  /** Minimum days between feedback requests for same context */
  cooldownDays?: number;
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

const CONTEXT_TITLES: Record<string, { title: string; subtitle: string }> = {
  checkpoint: {
    title: "Como está sua experiência até agora?",
    subtitle: "Sua opinião nos ajuda a acompanhar sua jornada.",
  },
  delivery: {
    title: "Como você avalia esta entrega?",
    subtitle: "Conte como foi sua experiência com esta etapa.",
  },
  milestone: {
    title: "Como foi essa fase do projeto?",
    subtitle: "Seu feedback nos ajuda a melhorar continuamente.",
  },
  onboarding: {
    title: "Como foi o início do projeto?",
    subtitle: "Queremos saber se começamos bem juntos.",
  },
  approval: {
    title: "Como foi o processo de aprovação?",
    subtitle: "Sua opinião é importante para otimizarmos o fluxo.",
  },
  general: {
    title: "Como está sua experiência?",
    subtitle: "Sua opinião nos ajuda a melhorar.",
  },
};

export function PortalFeedbackWidget({
  portalLinkId,
  projectId,
  entityType = "general",
  entityId,
  title,
  subtitle,
  compact = false,
  clientName,
  clientEmail,
  feedbackContext = "checkpoint",
  cooldownDays = 7,
  onSubmitted,
}: PortalFeedbackWidgetProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [showComment, setShowComment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const activeStar = hoveredStar ?? rating;

  // Resolve title/subtitle from context or props
  const contextConfig = CONTEXT_TITLES[feedbackContext] || CONTEXT_TITLES.general;
  const resolvedTitle = title || contextConfig.title;
  const resolvedSubtitle = subtitle || contextConfig.subtitle;

  // Fetch previous feedback for this portal/project to check cooldown and show trend
  const { data: feedbackHistory = [] } = useQuery({
    queryKey: ["portal-feedback-history", portalLinkId, projectId, entityType, feedbackContext],
    queryFn: async () => {
      let query = supabase
        .from("client_feedback" as any)
        .select("id, rating, submitted_at, feedback_context, cycle_number, entity_type")
        .eq("portal_link_id", portalLinkId)
        .order("submitted_at", { ascending: false })
        .limit(20);

      if (projectId) query = query.eq("project_id", projectId);

      const { data } = await query;
      return (data || []) as Array<{
        id: string;
        rating: number;
        submitted_at: string;
        feedback_context: string;
        cycle_number: number;
        entity_type: string;
      }>;
    },
    staleTime: 60_000,
  });

  // Check cooldown
  const isInCooldown = useMemo(() => {
    const contextHistory = feedbackHistory.filter(
      (f) => f.feedback_context === feedbackContext && f.entity_type === entityType
    );
    if (contextHistory.length === 0) return false;
    const lastSubmission = new Date(contextHistory[0].submitted_at);
    const daysSince = (Date.now() - lastSubmission.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince < cooldownDays;
  }, [feedbackHistory, feedbackContext, entityType, cooldownDays]);

  // Calculate trend from history
  const trend = useMemo(() => {
    const sorted = [...feedbackHistory]
      .filter((f) => f.entity_type === entityType || entityType === "general")
      .sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());
    if (sorted.length < 2) return null;
    const recent = sorted.slice(-3);
    const avgRecent = recent.reduce((s, f) => s + f.rating, 0) / recent.length;
    const older = sorted.slice(0, Math.max(1, sorted.length - 3));
    const avgOlder = older.reduce((s, f) => s + f.rating, 0) / older.length;
    const diff = avgRecent - avgOlder;
    if (diff > 0.3) return "up";
    if (diff < -0.3) return "down";
    return "stable";
  }, [feedbackHistory, entityType]);

  // Get cycle number
  const nextCycle = useMemo(() => {
    const contextHistory = feedbackHistory.filter(
      (f) => f.feedback_context === feedbackContext && f.entity_type === entityType
    );
    if (contextHistory.length === 0) return 1;
    const maxCycle = Math.max(...contextHistory.map((f) => f.cycle_number || 0));
    return maxCycle + 1;
  }, [feedbackHistory, feedbackContext, entityType]);

  const lastRating = useMemo(() => {
    const last = feedbackHistory.find(
      (f) => f.feedback_context === feedbackContext && f.entity_type === entityType
    );
    return last?.rating || null;
  }, [feedbackHistory, feedbackContext, entityType]);

  const handleSubmit = async () => {
    if (!rating) return;
    setIsSubmitting(true);

    try {
      const trendDir =
        lastRating === null
          ? "stable"
          : rating > lastRating
          ? "up"
          : rating < lastRating
          ? "down"
          : "stable";

      const { error } = await supabase.from("client_feedback" as any).insert({
        portal_link_id: portalLinkId,
        project_id: projectId,
        entity_type: entityType,
        entity_id: entityId,
        rating,
        comment: comment.trim() || null,
        client_name: clientName || null,
        client_email: clientEmail || null,
        feedback_context: feedbackContext,
        cycle_number: nextCycle,
        previous_rating: lastRating,
        trend_direction: trendDir,
      });

      if (error) throw error;

      // Generate alert for low ratings (1-2 stars)
      if (rating <= 2) {
        await supabase.from("alerts").insert({
          title: `Feedback negativo: ${rating} estrela${rating > 1 ? "s" : ""}`,
          message: `Cliente ${clientName || "anônimo"} avaliou com ${rating} estrela${rating > 1 ? "s" : ""}${comment.trim() ? `: "${comment.trim().slice(0, 120)}"` : "."}`,
          type: "feedback" as any,
          severity: rating === 1 ? "critical" : "high",
          scope: "project",
          status: "open",
          entity_type: "client_feedback",
          entity_id: projectId || portalLinkId,
          project_id: projectId,
        }).then(() => {});
      }

      // Generate alert on satisfaction drop
      if (lastRating && rating < lastRating && lastRating - rating >= 2) {
        await supabase.from("alerts").insert({
          title: `Queda de satisfação: ${lastRating}★ → ${rating}★`,
          message: `Satisfação do cliente ${clientName || "anônimo"} caiu de ${lastRating} para ${rating} estrelas no projeto.`,
          type: "feedback" as any,
          severity: "high",
          scope: "project",
          status: "open",
          entity_type: "client_feedback",
          entity_id: projectId || portalLinkId,
          project_id: projectId,
        }).then(() => {});
      }

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

  // Don't render if in cooldown
  if (isInCooldown && !submitted) {
    return null;
  }

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
          <p className="text-xs text-muted-foreground mt-1">
            {nextCycle > 1
              ? "Obrigado por acompanhar conosco. Sua avaliação contínua nos ajuda muito."
              : "Sua avaliação nos ajuda a melhorar sua experiência."}
          </p>
          <div className="flex items-center justify-center gap-1 mt-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "w-4 h-4",
                  star <= (rating || 0)
                    ? "text-primary fill-primary"
                    : "text-muted-foreground/20"
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
        <p
          className={cn(
            "font-medium text-foreground",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {resolvedTitle}
        </p>
        <p
          className={cn(
            "text-muted-foreground mt-0.5",
            compact ? "text-[10px]" : "text-xs"
          )}
        >
          {resolvedSubtitle}
        </p>
      </div>

      {/* Trend indicator (if has history) */}
      {trend && feedbackHistory.length >= 2 && (
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            {feedbackHistory
              .filter((f) => f.entity_type === entityType || entityType === "general")
              .slice(0, 5)
              .reverse()
              .map((f, i) => (
                <div
                  key={f.id}
                  className={cn(
                    "w-1.5 rounded-full transition-all",
                    f.rating >= 4
                      ? "bg-primary"
                      : f.rating === 3
                      ? "bg-yellow-500"
                      : "bg-destructive"
                  )}
                  style={{ height: `${8 + f.rating * 3}px` }}
                />
              ))}
          </div>
          <div className="flex items-center gap-1">
            {trend === "up" && (
              <TrendingUp className="w-3 h-3 text-primary" />
            )}
            {trend === "down" && (
              <TrendingDown className="w-3 h-3 text-destructive" />
            )}
            {trend === "stable" && (
              <Minus className="w-3 h-3 text-muted-foreground" />
            )}
            <span className="text-[10px] text-muted-foreground">
              {trend === "up"
                ? "Melhorando"
                : trend === "down"
                ? "Em queda"
                : "Estável"}
            </span>
          </div>
        </div>
      )}

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
                    placeholder={
                      rating <= 2
                        ? "O que poderíamos melhorar?"
                        : "Quer deixar uma observação? (opcional)"
                    }
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
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
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
