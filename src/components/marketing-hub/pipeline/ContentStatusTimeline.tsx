/**
 * ContentStatusTimeline — Visual SLA timeline for content workflow
 * Shows status transitions with duration between each step
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CONTENT_ITEM_STAGES } from "@/types/marketing";
import { Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { formatDistanceToNow, differenceInMinutes, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  contentItemId: string;
}

interface StatusEntry {
  id: string;
  from_status: string | null;
  to_status: string;
  created_at: string;
  duration_minutes: number | null;
}

// SLA targets in hours per stage
const SLA_HOURS: Record<string, number> = {
  briefing: 24,
  writing: 48,
  recording: 72,
  editing: 48,
  review: 24,
  approved: 8,
  scheduled: 24,
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export function ContentStatusTimeline({ contentItemId }: Props) {
  const { data: history } = useQuery({
    queryKey: ["content-status-history", contentItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_status_history")
        .select("*")
        .eq("content_item_id", contentItemId)
        .order("created_at", { ascending: true });
      if (error) throw error;

      // Calculate durations between transitions
      const entries = (data || []) as StatusEntry[];
      for (let i = 0; i < entries.length; i++) {
        if (i > 0) {
          entries[i].duration_minutes = differenceInMinutes(
            new Date(entries[i].created_at),
            new Date(entries[i - 1].created_at)
          );
        }
      }
      return entries;
    },
  });

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-4">
        <Clock className="w-5 h-5 text-muted-foreground/30 mx-auto mb-1" />
        <p className="text-[10px] text-muted-foreground/40">Sem histórico de transições</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {history.map((entry, i) => {
        const stage = CONTENT_ITEM_STAGES.find(s => s.type === entry.to_status);
        const slaHours = SLA_HOURS[entry.from_status || ""] || 24;
        const durationHours = entry.duration_minutes ? entry.duration_minutes / 60 : 0;
        const isOverSLA = durationHours > slaHours;
        const isLast = i === history.length - 1;

        return (
          <div key={entry.id} className="flex gap-3">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-2.5 h-2.5 rounded-full border-2 mt-1",
                isLast ? "border-primary bg-primary" : "border-muted-foreground/30 bg-background"
              )} />
              {!isLast && <div className="w-px flex-1 bg-border/30 min-h-[24px]" />}
            </div>

            {/* Content */}
            <div className="pb-3 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground/80">
                  {stage?.name || entry.to_status}
                </span>
                {entry.duration_minutes != null && (
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1",
                    isOverSLA
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted/30 text-muted-foreground"
                  )}>
                    {isOverSLA && <AlertTriangle className="w-2.5 h-2.5" />}
                    <Clock className="w-2.5 h-2.5" />
                    {formatDuration(entry.duration_minutes)}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
