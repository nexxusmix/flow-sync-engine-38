/**
 * DeliverablesListSection - Report-style deliverables list (03 — ENTREGAS & MATERIAIS)
 * Indexed list with status badges
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReportSectionHeader } from "./ReportSectionHeader";
import { Plus, Lock, Clock, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Deliverable {
  id: string;
  title: string;
  description?: string;
  status: 'not_started' | 'in_progress' | 'waiting_review' | 'completed' | 'blocked';
}

interface DeliverablesListSectionProps {
  deliverables: Deliverable[];
  onAddMaterial?: () => void;
  isManager?: boolean;
}

const STATUS_CONFIG = {
  not_started: { 
    label: 'Não Iniciado', 
    className: 'bg-muted text-muted-foreground border-muted',
    icon: Circle 
  },
  in_progress: { 
    label: 'Em Andamento', 
    className: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
    icon: Clock 
  },
  waiting_review: { 
    label: 'Aguardando Revisão', 
    className: 'bg-primary/20 text-primary border-primary/30',
    icon: Clock 
  },
  completed: { 
    label: 'Concluído', 
    className: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
    icon: CheckCircle2 
  },
  blocked: { 
    label: 'Bloqueado', 
    className: 'bg-destructive/20 text-destructive border-destructive/30',
    icon: Lock 
  },
};

export function DeliverablesListSection({
  deliverables,
  onAddMaterial,
  isManager = true,
}: DeliverablesListSectionProps) {
  const [showAll, setShowAll] = useState(false);
  
  const displayedDeliverables = showAll ? deliverables : deliverables.slice(0, 5);
  const hasMore = deliverables.length > 5;

  return (
    <div className="bg-card border border-border p-8 md:p-12">
      <ReportSectionHeader index="03" title="ENTREGAS & MATERIAIS">
        {isManager && onAddMaterial && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onAddMaterial}
            className="text-muted-foreground hover:text-foreground"
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar Material Pronto
          </Button>
        )}
      </ReportSectionHeader>

      {deliverables.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Nenhuma entrega cadastrada ainda.
        </p>
      ) : (
        <div className="space-y-0">
          {displayedDeliverables.map((deliverable, idx) => {
            const status = STATUS_CONFIG[deliverable.status];
            const StatusIcon = status.icon;

            return (
              <div 
                key={deliverable.id}
                className="flex items-start gap-6 py-6 border-b border-border last:border-0"
              >
                {/* Index number */}
                <span className="text-2xl font-light text-muted-foreground w-12 shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-medium text-foreground mb-1">
                    {deliverable.title}
                  </h4>
                  {deliverable.description && (
                    <p className="text-sm text-muted-foreground">
                      {deliverable.description}
                    </p>
                  )}
                </div>

                {/* Status */}
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-micro uppercase tracking-widest font-bold shrink-0",
                    status.className
                  )}
                >
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
            );
          })}
        </div>
      )}

      {hasMore && (
        <Button 
          variant="ghost" 
          className="w-full mt-4 text-muted-foreground hover:text-foreground"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Mostrar menos' : `Ver lista completa de ${deliverables.length} entregas →`}
        </Button>
      )}
    </div>
  );
}
