import { Plus } from "lucide-react";
import { KanbanCard, Deal } from "./KanbanCard";

interface KanbanColumnProps {
  title: string;
  count: number;
  deals: Deal[];
  color: string;
}

export function KanbanColumn({ title, count, deals, color }: KanbanColumnProps) {
  return (
    <div className="flex flex-col min-w-[300px] max-w-[300px]">
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
          <KanbanCard key={deal.id} deal={deal} />
        ))}
        <button className="w-full p-4 border border-dashed border-border rounded-2xl text-[10px] font-black text-muted-foreground uppercase tracking-wider hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>
    </div>
  );
}
