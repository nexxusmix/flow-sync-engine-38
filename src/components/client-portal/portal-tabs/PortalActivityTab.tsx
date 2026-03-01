/**
 * PortalActivityTab - Timeline de atividades do portal
 * Feed cronológico de eventos do projeto em tempo real
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity,
  CheckCircle2,
  PlayCircle,
  AlertTriangle,
  MessageSquare,
  FileUp,
  Star,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PortalTimelineEvent } from "@/hooks/useClientPortalEnhanced";

interface PortalActivityTabProps {
  events: PortalTimelineEvent[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
};

function getEventIcon(eventType: string) {
  switch (eventType) {
    case 'stage_update':
      return <ArrowRight className="w-4 h-4 text-primary" />;
    case 'task_completed':
      return <CheckCircle2 className="w-4 h-4 text-primary" />;
    case 'chat_message':
      return <MessageSquare className="w-4 h-4 text-primary/60" />;
    case 'file_uploaded':
      return <FileUp className="w-4 h-4 text-muted-foreground" />;
    case 'approval':
      return <Star className="w-4 h-4 text-yellow-500" />;
    case 'revision_requested':
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    case 'deliverable_added':
      return <PlayCircle className="w-4 h-4 text-purple-500" />;
    default:
      return <Activity className="w-4 h-4 text-muted-foreground" />;
  }
}

function getEventColor(eventType: string) {
  switch (eventType) {
    case 'stage_update': return 'border-l-primary';
    case 'task_completed': return 'border-l-emerald-500';
    case 'chat_message': return 'border-l-blue-500';
    case 'approval': return 'border-l-yellow-500';
    default: return 'border-l-border';
  }
}

function PortalActivityTabComponent({ events }: PortalActivityTabProps) {
  if (events.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <Activity className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">Nenhuma atividade ainda</h3>
        <p className="text-sm text-muted-foreground">
          As atualizações do projeto aparecerão aqui em tempo real.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {events.map((event) => (
        <motion.div
          key={event.id}
          variants={itemVariants}
          className={cn(
            "glass-card rounded-xl p-4 border-l-4 transition-all hover:bg-muted/30",
            getEventColor(event.event_type)
          )}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0">
              {getEventIcon(event.event_type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-medium text-sm text-foreground">
                  {event.title}
                </span>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              {event.description && (
                <p className="text-xs text-muted-foreground">{event.description}</p>
              )}
              {event.actor_name && event.actor_type !== 'system' && (
                <Badge variant="secondary" className="mt-2 text-[10px]">
                  {event.actor_name}
                </Badge>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

export const PortalActivityTab = memo(PortalActivityTabComponent);
