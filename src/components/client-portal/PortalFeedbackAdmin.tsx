/**
 * PortalFeedbackAdmin - Internal view for team to see client feedback
 * Shows ratings, trends, satisfaction evolution, and comments
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Star, AlertTriangle, TrendingUp, TrendingDown, MessageSquare, Filter, Minus,
  ArrowDown, ArrowUp,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/squad-ui/GlassCard";
import { SectionHeader } from "@/components/squad-ui/SectionHeader";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  feedback_context: string | null;
  cycle_number: number | null;
  previous_rating: number | null;
  trend_direction: string | null;
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
};

export function PortalFeedbackAdmin() {
  const [filterRating, setFilterRating] = useState<string>("all");
  const [filterContext, setFilterContext] = useState<string>("all");

  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ["client-feedback-admin", filterRating, filterContext],
    queryFn: async () => {
      let query = supabase
        .from("client_feedback" as any)
        .select("*")
        .order("submitted_at", { ascending: false })
        .limit(200);

      if (filterRating !== "all") {
        query = query.eq("rating", parseInt(filterRating));
      }
      if (filterContext !== "all") {
        query = query.eq("feedback_context", filterContext);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as FeedbackItem[];
    },
  });

  // Stats
  const totalFeedback = feedback.length;
  const avgRating =
    totalFeedback > 0
      ? feedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback
      : 0;
  const lowRatings = feedback.filter((f) => f.rating <= 2).length;
  const droppingTrend = feedback.filter(
    (f) => f.trend_direction === "down"
  ).length;

  // Trend chart data (last 30 feedbacks chronological)
  const trendChartData = useMemo(() => {
    const sorted = [...feedback]
      .sort(
        (a, b) =>
          new Date(a.submitted_at).getTime() -
          new Date(b.submitted_at).getTime()
      )
      .slice(-30);

    return sorted.map((f) => ({
      date: format(new Date(f.submitted_at), "dd/MM", { locale: ptBR }),
      rating: f.rating,
      client: f.client_name || "Anônimo",
    }));
  }, [feedback]);

  // Client satisfaction summary
  const clientSummary = useMemo(() => {
    const map = new Map<
      string,
      { ratings: number[]; lastRating: number; lastDate: string; trend: string }
    >();

    const sorted = [...feedback].sort(
      (a, b) =>
        new Date(a.submitted_at).getTime() -
        new Date(b.submitted_at).getTime()
    );

    sorted.forEach((f) => {
      const name = f.client_name || "Anônimo";
      const existing = map.get(name);
      if (existing) {
        existing.ratings.push(f.rating);
        existing.lastRating = f.rating;
        existing.lastDate = f.submitted_at;
        existing.trend = f.trend_direction || "stable";
      } else {
        map.set(name, {
          ratings: [f.rating],
          lastRating: f.rating,
          lastDate: f.submitted_at,
          trend: f.trend_direction || "stable",
        });
      }
    });

    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        avgRating:
          data.ratings.reduce((s, r) => s + r, 0) / data.ratings.length,
        lastRating: data.lastRating,
        totalFeedbacks: data.ratings.length,
        lastDate: data.lastDate,
        trend: data.trend,
        ratings: data.ratings,
      }))
      .sort((a, b) => a.avgRating - b.avgRating);
  }, [feedback]);

  const ENTITY_LABELS: Record<string, string> = {
    general: "Portal Geral",
    delivery: "Entrega",
    milestone: "Etapa",
    project: "Projeto",
    onboarding: "Onboarding",
    approval: "Aprovação",
  };

  const CONTEXT_LABELS: Record<string, string> = {
    checkpoint: "Checkpoint",
    delivery: "Entrega",
    milestone: "Milestone",
    onboarding: "Onboarding",
    approval: "Aprovação",
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        label="Satisfação do Cliente"
        title="Feedbacks"
        highlight="recorrentes"
        action={
          <div className="flex gap-2">
            <Select value={filterContext} onValueChange={setFilterContext}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder="Contexto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos contextos</SelectItem>
                <SelectItem value="checkpoint">Checkpoint</SelectItem>
                <SelectItem value="delivery">Entrega</SelectItem>
                <SelectItem value="milestone">Milestone</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="approval">Aprovação</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-32 h-8 text-xs">
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
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <GlassCard className="text-center p-4">
          <p className="text-2xl font-light text-foreground">{totalFeedback}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
            Total
          </p>
        </GlassCard>
        <GlassCard className="text-center p-4">
          <p className="text-2xl font-light text-foreground">
            {avgRating.toFixed(1)}
          </p>
          <div className="flex items-center justify-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={cn(
                  "w-2.5 h-2.5",
                  s <= Math.round(avgRating)
                    ? "text-primary fill-primary"
                    : "text-muted-foreground/20"
                )}
              />
            ))}
          </div>
        </GlassCard>
        <GlassCard className="text-center p-4">
          <p
            className={cn(
              "text-2xl font-light",
              lowRatings > 0 ? "text-destructive" : "text-foreground"
            )}
          >
            {lowRatings}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
            Atenção (≤2★)
          </p>
        </GlassCard>
        <GlassCard className="text-center p-4">
          <p
            className={cn(
              "text-2xl font-light",
              droppingTrend > 0
                ? "text-destructive"
                : "text-foreground"
            )}
          >
            {droppingTrend}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
            Em Queda
          </p>
        </GlassCard>
        <GlassCard className="text-center p-4">
          <p className="text-2xl font-light text-foreground">
            {clientSummary.length}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
            Clientes
          </p>
        </GlassCard>
      </div>

      {/* Trend Chart */}
      {trendChartData.length >= 3 && (
        <GlassCard className="p-5">
          <h3 className="text-xs font-medium text-foreground mb-4 uppercase tracking-wider">
            Evolução da Satisfação
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendChartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="date"
                tick={{
                  fontSize: 10,
                  fill: "hsl(var(--muted-foreground))",
                }}
              />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tick={{
                  fontSize: 10,
                  fill: "hsl(var(--muted-foreground))",
                }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [`${value} ★`, "Nota"]}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <ReferenceLine
                y={3}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      )}

      {/* Client Satisfaction Summary */}
      {clientSummary.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-foreground mb-3 uppercase tracking-wider">
            Satisfação por Cliente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {clientSummary.map((client) => (
              <GlassCard
                key={client.name}
                className={cn(
                  "p-4",
                  client.avgRating <= 2 && "border-destructive/20"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-foreground truncate">
                    {client.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {client.trend === "up" && (
                      <ArrowUp className="w-3 h-3 text-primary" />
                    )}
                    {client.trend === "down" && (
                      <ArrowDown className="w-3 h-3 text-destructive" />
                    )}
                    {client.trend === "stable" && (
                      <Minus className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Mini sparkline */}
                <div className="flex items-end gap-0.5 h-6 mb-2">
                  {client.ratings.slice(-8).map((r, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex-1 rounded-sm transition-all min-w-[3px]",
                        r >= 4
                          ? "bg-primary"
                          : r === 3
                          ? "bg-yellow-500"
                          : "bg-destructive"
                      )}
                      style={{
                        height: `${(r / 5) * 100}%`,
                      }}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>
                    Média: {client.avgRating.toFixed(1)}★ ·{" "}
                    {client.totalFeedbacks} avaliação
                    {client.totalFeedbacks > 1 ? "ões" : ""}
                  </span>
                  <span>
                    Última: {client.lastRating}★
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Feedback List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            Carregando feedbacks...
          </p>
        </div>
      ) : feedback.length === 0 ? (
        <GlassCard className="text-center py-12">
          <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhum feedback recebido ainda.
          </p>
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
              <GlassCard
                className={cn(
                  "p-4 flex items-start gap-4",
                  item.rating <= 2 && "border-destructive/20 bg-destructive/3"
                )}
              >
                {/* Rating */}
                <div className="shrink-0 text-center min-w-[48px]">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "w-3 h-3",
                          s <= item.rating
                            ? "text-primary fill-primary"
                            : "text-muted-foreground/15"
                        )}
                      />
                    ))}
                  </div>
                  {/* Trend indicator */}
                  {item.trend_direction && item.trend_direction !== "stable" && (
                    <div className="flex items-center justify-center gap-0.5 mt-1">
                      {item.trend_direction === "up" ? (
                        <TrendingUp className="w-2.5 h-2.5 text-primary" />
                      ) : (
                        <TrendingDown className="w-2.5 h-2.5 text-destructive" />
                      )}
                      {item.previous_rating && (
                        <span className="text-[9px] text-muted-foreground">
                          de {item.previous_rating}★
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-medium text-foreground">
                      {item.client_name || "Cliente anônimo"}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {ENTITY_LABELS[item.entity_type] || item.entity_type}
                    </Badge>
                    {item.feedback_context && item.feedback_context !== "checkpoint" && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {CONTEXT_LABELS[item.feedback_context] ||
                          item.feedback_context}
                      </Badge>
                    )}
                    {item.cycle_number && item.cycle_number > 1 && (
                      <span className="text-[10px] text-muted-foreground">
                        #{item.cycle_number}
                      </span>
                    )}
                    {item.rating <= 2 && (
                      <AlertTriangle className="w-3 h-3 text-destructive" />
                    )}
                  </div>
                  {item.comment && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.comment}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground/50 mt-1">
                    {format(
                      new Date(item.submitted_at),
                      "dd MMM yyyy 'às' HH:mm",
                      { locale: ptBR }
                    )}
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
