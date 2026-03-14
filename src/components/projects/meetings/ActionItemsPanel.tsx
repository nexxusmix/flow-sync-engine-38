/**
 * ActionItemsPanel - Collapsible panel showing open action items/deadlines
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useUpdateActionItem } from "@/hooks/useProjectInteractions";
import type { ProjectActionItem } from "@/types/meetings";
import {
  ChevronDown,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  User,
} from "lucide-react";

interface ActionItemsPanelProps {
  actionItems: ProjectActionItem[];
  projectId: string;
}

const statusConfig = {
  aberto: { icon: Circle, label: 'Aberto', color: 'text-muted-foreground' },
  em_andamento: { icon: Clock, label: 'Em Andamento', color: 'text-muted-foreground' },
  concluido: { icon: CheckCircle2, label: 'Concluído', color: 'text-primary' },
};

export function ActionItemsPanel({ actionItems, projectId }: ActionItemsPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const updateActionItem = useUpdateActionItem();

  const overdueItems = actionItems.filter(
    item => item.due_date && isPast(new Date(item.due_date)) && !isToday(new Date(item.due_date))
  );

  const handleStatusChange = (item: ProjectActionItem) => {
    const nextStatus = item.status === 'aberto' ? 'em_andamento' : 
                       item.status === 'em_andamento' ? 'concluido' : 'aberto';
    updateActionItem.mutate({ id: item.id, status: nextStatus });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-card border border-border">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Prazos & Ações Pendentes
              </span>
              <Badge variant="secondary" className="text-[10px]">
                {actionItems.length}
              </Badge>
              {overdueItems.length > 0 && (
                <Badge variant="destructive" className="text-[10px] gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {overdueItems.length} atrasado(s)
                </Badge>
              )}
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )} />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <AnimatePresence>
                {actionItems.map((item) => {
                  const statusInfo = statusConfig[item.status];
                  const StatusIcon = statusInfo.icon;
                  const isOverdue = item.due_date && isPast(new Date(item.due_date)) && !isToday(new Date(item.due_date));
                  const isDueToday = item.due_date && isToday(new Date(item.due_date));

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "bg-muted/30 border p-3 transition-all",
                        isOverdue ? "border-destructive/50 bg-destructive/5" :
                        isDueToday ? "border-muted-foreground/50 bg-muted/50" :
                        "border-border"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => handleStatusChange(item)}
                          className={cn("mt-0.5", statusInfo.color)}
                        >
                          <StatusIcon className="w-4 h-4" />
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            item.status === 'concluido' && "line-through text-muted-foreground"
                          )}>
                            {item.title}
                          </p>

                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            {item.due_date && (
                              <span className={cn(
                                "flex items-center gap-1",
                                isOverdue && "text-destructive",
                                isDueToday && "text-amber-500"
                              )}>
                                <Clock className="w-3 h-3" />
                                {format(new Date(item.due_date), "dd MMM", { locale: ptBR })}
                              </span>
                            )}
                            {item.assignee && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {item.assignee}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
