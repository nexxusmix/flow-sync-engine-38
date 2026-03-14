/**
 * PortalFeedbackAdmin - Internal view for team to see client feedback
 * Shows ratings, trends, and comments from clients
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star, AlertTriangle, TrendingUp, MessageSquare, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/squad-ui/GlassCard";
import { SectionHeader } from "@/components/squad-ui/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FeedbackItem {
  id: string;
  rating: number;
  comment: string | null;
  client_name: string | null;
  entity_type: string;
  entity_id: string | null;
  submitted_at: string;
  project_id: string | null;
  status: string;
}

export function PortalFeedbackAdmin() {
  const [filterRating, setFilterRating] = useState<string>("all");

  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ["client-feedback-admin", filterRating],
    queryFn: async () => {
      let query = supabase
        .from("client_feedback" as any)
        .select("*")
        .order("submitted_at", { ascending: false })
        .limit(100);

      if (filterRating !== "all") {
        query = query.eq("rating", parseInt(filterRating));
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as FeedbackItem[];
    },
  });

  // Calculate stats
  const totalFeedback = feedback.length;
  const avgRating = totalFeedback > 0
    ? feedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback
    : 0;
  const lowRatings = feedback.filter(f => f.rating <= 2).length;
  const withComments = feedback.filter(f => f.comment).length;

  const ENTITY_LABELS: Record<string, string> = {
    general: "Portal Geral",
    delivery: "Entrega",
    milestone: "Etapa",
    project: "Projeto",
    onboarding: "Onboarding",
    approval: "Aprovação",
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        label="Satisfação do Cliente"
        title="Feedbacks"
        highlight="recebidos"
        action={
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <Filter className="w-3 h-3 mr-1.5" />
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as notas</SelectItem>
              <SelectItem value="5">⭐ 5 estrelas</SelectItem>
              <SelectItem value="4">⭐ 4 estrelas</SelectItem>
              <SelectItem value="3">⭐ 3 estrelas</SelectItem>
              <SelectItem value="2">⭐ 2 estrelas</SelectItem>
              <SelectItem value="1">⭐ 1 estrela</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <GlassCard className="text-center p-4">
          <p className="text-2xl font-light text-foreground">{totalFeedback}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Total</p>
        </GlassCard>
        <GlassCard className="text-center p-4">
          <p className="text-2xl font-light text-foreground">{avgRating.toFixed(1)}</p>
          <div className="flex items-center justify-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={cn("w-2.5 h-2.5", s <= Math.round(avgRating) ? "text-primary fill-primary" : "text-muted-foreground/20")} />
            ))}
          </div>
        </GlassCard>
        <GlassCard className="text-center p-4">
          <p className={cn("text-2xl font-light", lowRatings > 0 ? "text-destructive" : "text-foreground")}>{lowRatings}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Atenção</p>
        </GlassCard>
        <GlassCard className="text-center p-4">
          <p className="text-2xl font-light text-foreground">{withComments}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Com obs.</p>
        </GlassCard>
      </div>

      {/* Feedback List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">Carregando feedbacks...</p>
        </div>
      ) : feedback.length === 0 ? (
        <GlassCard className="text-center py-12">
          <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum feedback recebido ainda.</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {feedback.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <GlassCard className={cn(
                "p-4 flex items-start gap-4",
                item.rating <= 2 && "border-destructive/20 bg-destructive/3"
              )}>
                {/* Rating */}
                <div className="shrink-0 text-center min-w-[48px]">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={cn("w-3 h-3", s <= item.rating ? "text-primary fill-primary" : "text-muted-foreground/15")} />
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-foreground">
                      {item.client_name || "Cliente anônimo"}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {ENTITY_LABELS[item.entity_type] || item.entity_type}
                    </Badge>
                    {item.rating <= 2 && (
                      <AlertTriangle className="w-3 h-3 text-destructive" />
                    )}
                  </div>
                  {item.comment && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.comment}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground/50 mt-1">
                    {format(new Date(item.submitted_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
