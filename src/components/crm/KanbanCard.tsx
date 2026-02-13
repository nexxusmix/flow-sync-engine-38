import { MoreVertical, Clock, Sparkles, Trash2, Pencil, GripVertical } from "lucide-react";
import { useState, DragEvent } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: string;
  score: number;
  tags: string[];
  ownerInitials: string;
  lastActivity: string;
}

interface KanbanCardProps {
  deal: Deal;
  onDelete?: (id: string) => void;
}

export function KanbanCard({ deal, onDelete }: KanbanCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const getScoreColor = (score: number) => {
    if (score > 80) return { text: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' };
    if (score > 50) return { text: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' };
    return { text: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' };
  };

  const scoreStyle = getScoreColor(deal.score);

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ dealId: deal.id, fromStage: deal.stage }));
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={`glass-card rounded-2xl p-4 space-y-3 group cursor-grab active:cursor-grabbing hover:border-primary/30 transition-all duration-300 relative overflow-hidden ${
          isDragging ? 'opacity-40 scale-95 ring-2 ring-primary/30' : ''
        }`}
      >
        {/* Drag Handle */}
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-50 transition-opacity">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
        </div>

        {/* Hover Glow Effect */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between relative">
          <span className="text-[11px] font-medium text-primary uppercase tracking-wider">{deal.company}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded-lg">
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Pencil className="w-3.5 h-3.5 mr-2" />
                Editar
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <div className="space-y-1 relative">
          <h4 className="text-sm font-bold text-foreground">{deal.title}</h4>
          <p className="text-xs text-muted-foreground font-semibold">
            R$ {deal.value.toLocaleString('pt-BR')}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 relative">
          {deal.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Footer */}
        <div className="flex items-center justify-between relative">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            {deal.lastActivity}
          </div>
          
          {/* Owner Avatar */}
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-medium text-primary">
            {deal.ownerInitials}
          </div>
          
          {/* AI Score Badge */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full border ${scoreStyle.bg}`}>
            <Sparkles className={`w-3 h-3 ${scoreStyle.text}`} />
            <span className={`text-[11px] font-medium ${scoreStyle.text}`}>{deal.score}</span>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Deal</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deal.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete?.(deal.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
