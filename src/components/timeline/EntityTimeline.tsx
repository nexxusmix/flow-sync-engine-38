/**
 * EntityTimeline – Reusable chronological event feed for any entity.
 * Used in projects, tasks, deliverables, contracts, etc.
 */

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity, CheckCircle2, AlertTriangle, ArrowRight, FileUp, MessageSquare,
  Clock, Star, PlayCircle, RefreshCw, Lock, Edit3, Trash2, UserPlus,
  Eye, Send, ChevronDown, Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEntityTimeline, type TimelineEvent } from "@/hooks/useEntityTimeline";

interface EntityTimelineProps {
  entityType: string;
  entityId?: string;
  parentEntityType?: string;
  parentEntityId?: string;
  projectId?: string;
  visibility?: "internal" | "client" | "all";
  /** Max items to show initially */
  initialCount?: number;
  title?: string;
  compact?: boolean;
  className?: string;
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  created: <PlayCircle className="w-4 h-4" />,
  status_change: <ArrowRight className="w-4 h-4" />,
  completed: <CheckCircle2 className="w-4 h-4" />,
  approved: <Star className="w-4 h-4" />,
  rejected: <AlertTriangle className="w-4 h-4" />,
  comment: <MessageSquare className="w-4 h-4" />,
  file_uploaded: <FileUp className="w-4 h-4" />,
  assigned: <UserPlus className="w-4 h-4" />,
  updated: <Edit3 className="w-4 h-4" />,
  deleted: <Trash2 className="w-4 h-4" />,
  sent: <Send className="w-4 h-4" />,
  viewed: <Eye className="w-4 h-4" />,
  blocked: <Lock className="w-4 h-4" />,
  revision: <RefreshCw className="w-4 h-4" />,
  deadline_changed: <Clock className="w-4 h-4" />,
  note: <MessageSquare className="w-4 h-4" />,
};

function getEventColor(eventType: string): string {
  switch (eventType) {
    case "completed":
    case "approved":
      return "text-primary border-primary/30 bg-primary/10";
    case "rejected":
    case "blocked":
    case "deleted":
      return "text-destructive border-destructive/30 bg-destructive/10";
    case "status_change":
    case "sent":
      return "text-primary border-primary/20 bg-primary/5";
    default:
      return "text-muted-foreground border-border bg-muted/30";
  }
}

export const EntityTimeline = memo(function EntityTimeline({
  entityType,
  entityId,
  parentEntityType,
  parentEntityId,
  projectId,
  visibility = "all",
  initialCount = 10,
  title = "Timeline",
  compact = false,
  className,
}: EntityTimelineProps) {
  const { data: events = [], isLoading } = useEntityTimeline({
    entityType,
    entityId,
    parentEntityType,
    parentEntityId,
    projectId,
    visibility,
    limit: 200,
  });

  const [showAll, setShowAll] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");

  const filtered = filterType === "all"
    ? events
    : events.filter((e) => e.event_type === filterType);

  const displayed = showAll ? filtered : filtered.slice(0, initialCount);
  const hasMore = filtered.length > initialCount;

  // Unique event types for filter
  const eventTypes = Array.from(new Set(events.map((e) => e.event_type)));

  if (isLoading) {
    return (
      <div className={cn("p-6 text-center", className)}>
        <Clock className="w-5 h-5 text-muted-foreground animate-pulse mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Carregando timeline...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={cn("rounded-2xl border border-border/20 bg-card p-6 text-center", className)}>
        <Activity className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Nenhum evento registrado ainda.</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-border/20 bg-card overflow-hidden", className)}>
      {/* Header */}
      <div className={cn("flex items-center justify-between border-b border-border/10", compact ? "px-4 py-3" : "px-5 py-4")}>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className={cn("font-medium text-foreground", compact ? "text-xs" : "text-sm")}>{title}</h3>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{events.length}</Badge>
        </div>

        {eventTypes.length > 2 && (
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-[10px] bg-muted/50 border border-border/30 rounded-md px-2 py-1 text-muted-foreground focus:outline-none"
          >
            <option value="all">Todos</option>
            {eventTypes.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
            ))}
          </select>
        )}
      </div>

      {/* Events */}
      <div className={cn("relative", compact ? "px-4 py-3" : "px-5 py-4")}>
        {/* Vertical line */}
        <div className="absolute left-[27px] top-4 bottom-4 w-px bg-border/30" />

        <div className="space-y-0">
          <AnimatePresence initial={false}>
            {displayed.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.02 }}
                className="relative flex gap-3 py-2.5 group"
              >
                {/* Dot */}
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border z-10 transition-colors",
                  getEventColor(event.event_type),
                )}>
                  {EVENT_ICONS[event.event_type] || <Activity className="w-3.5 h-3.5" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className={cn("text-foreground leading-snug", compact ? "text-[11px]" : "text-xs")}>
                    {event.title}
                  </p>

                  {event.description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      {event.description}
                    </p>
                  )}

                  {/* Status change badge */}
                  {event.status_from && event.status_to && (
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="outline" className="text-[9px] px-1 py-0">{event.status_from}</Badge>
                      <ArrowRight className="w-2.5 h-2.5 text-muted-foreground" />
                      <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/30 text-primary">{event.status_to}</Badge>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground/60">
                    <span>
                      {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                    {event.actor_name && (
                      <>
                        <span>·</span>
                        <span>{event.actor_name}</span>
                      </>
                    )}
                    {event.visibility === "client" && (
                      <>
                        <span>·</span>
                        <Badge variant="secondary" className="text-[8px] px-1 py-0">Visível ao cliente</Badge>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Show more */}
        {hasMore && !showAll && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs text-muted-foreground gap-1"
            onClick={() => setShowAll(true)}
          >
            <ChevronDown className="w-3 h-3" />
            Ver mais {filtered.length - initialCount} eventos
          </Button>
        )}
      </div>
    </div>
  );
});
