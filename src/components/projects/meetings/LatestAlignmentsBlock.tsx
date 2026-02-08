/**
 * LatestAlignmentsBlock - Summary block for project overview
 * Shows latest alignments, deadlines, and pending items
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  useProjectInteractions,
  useProjectActionItems,
} from "@/hooks/useProjectInteractions";
import {
  MessageSquare,
  Clock,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  Circle,
} from "lucide-react";

interface LatestAlignmentsBlockProps {
  projectId: string;
}

export function LatestAlignmentsBlock({ projectId }: LatestAlignmentsBlockProps) {
  const navigate = useNavigate();
  const { data: interactions } = useProjectInteractions(projectId);
  const { data: actionItems } = useProjectActionItems(projectId);

  // Get latest 3 interactions with summaries
  const latestWithSummaries = useMemo(() => {
    return (interactions || [])
      .filter(i => i.summary)
      .slice(0, 3);
  }, [interactions]);

  // Get open action items (deadline-focused)
  const openItems = useMemo(() => {
    return (actionItems || [])
      .filter(a => a.status !== 'concluido')
      .slice(0, 5);
  }, [actionItems]);

  // Extract all summary bullets
  const allBullets = useMemo(() => {
    const bullets: string[] = [];
    latestWithSummaries.forEach(interaction => {
      if (interaction.summary?.summary_bullets) {
        bullets.push(...interaction.summary.summary_bullets.slice(0, 2));
      }
    });
    return bullets.slice(0, 5);
  }, [latestWithSummaries]);

  // If no data, don't show the block
  if (latestWithSummaries.length === 0 && openItems.length === 0) {
    return null;
  }

  const goToMeetings = () => {
    navigate(`?tab=meetings`);
  };

  return (
    <div className="bg-card border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-primary text-[10px] uppercase tracking-[0.3em] font-bold">
            Últimos Alinhamentos
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={goToMeetings} className="gap-1 text-xs">
          Ver tudo
          <ChevronRight className="w-3 h-3" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Summary Bullets */}
        {allBullets.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Pontos Principais</h4>
            <ul className="space-y-1.5">
              {allBullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="text-primary mt-1">•</span>
                  <span className="line-clamp-2">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Open Action Items */}
        {openItems.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Prazos & Próximos Passos
            </h4>
            <ul className="space-y-2">
              {openItems.map((item) => {
                const isOverdue = item.due_date && isPast(new Date(item.due_date)) && !isToday(new Date(item.due_date));
                const isDueToday = item.due_date && isToday(new Date(item.due_date));

                return (
                  <li key={item.id} className="flex items-start gap-2">
                    <Circle className={cn(
                      "w-3 h-3 mt-1",
                      isOverdue ? "text-destructive" :
                      isDueToday ? "text-amber-500" :
                      "text-muted-foreground"
                    )} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-foreground line-clamp-1">
                        {item.title}
                      </span>
                      {item.due_date && (
                        <span className={cn(
                          "text-xs",
                          isOverdue ? "text-destructive" :
                          isDueToday ? "text-amber-500" :
                          "text-muted-foreground"
                        )}>
                          {isOverdue ? 'Atrasado: ' : isDueToday ? 'Hoje: ' : ''}
                          {format(new Date(item.due_date), "dd MMM", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
