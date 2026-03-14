import { Plus } from "lucide-react";
import { KanbanCard, Deal } from "./KanbanCard";
import { useState, DragEvent } from "react";

interface KanbanColumnProps {
  title: string;
  count: number;
  deals: Deal[];
  color: string;
  stageKey: string;
  onDeleteDeal?: (id: string) => void;
  onMoveDeal?: (dealId: string, toStage: string) => void;
  onOpenDeal?: (id: string) => void;
}

export function KanbanColumn({ title, count, deals, color, stageKey, onDeleteDeal, onMoveDeal, onOpenDeal }: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    // Only set false if we're actually leaving the column, not entering a child
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.dealId && data.fromStage !== stageKey) {
        onMoveDeal?.(data.dealId, stageKey);
      }
    } catch {
      // ignore invalid data
    }
  };

  return (
    <div
      className={`flex flex-col min-w-[260px] sm:min-w-[300px] max-w-[300px] rounded-2xl p-2 transition-all duration-200 ${
        isDragOver ? 'bg-primary/5 ring-2 ring-primary/20 ring-inset' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
          <h3 className="text-[11px] font-black text-foreground uppercase tracking-wider">{title}</h3>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        <button className="p-1.5 hover:bg-muted rounded-lg transition-colors">
          <Plus className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Cards Container */}
      <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pb-4">
        {deals.map(deal => (
          <KanbanCard key={deal.id} deal={deal} onDelete={onDeleteDeal} onOpen={onOpenDeal} />
        ))}
        <button className="w-full p-4 border border-dashed border-border rounded-2xl text-[10px] font-black text-muted-foreground uppercase tracking-wider hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>
    </div>
  );
}
