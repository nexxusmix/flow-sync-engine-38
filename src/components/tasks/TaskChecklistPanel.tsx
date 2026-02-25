import { useState, useRef } from "react";
import { useTaskChecklist } from "@/hooks/useTaskChecklist";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Plus, Trash2, ArrowUp, ArrowDown, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskChecklistPanelProps {
  taskId: string;
}

export function TaskChecklistPanel({ taskId }: TaskChecklistPanelProps) {
  const { items, completed, total, addItem, toggleItem, updateTitle, deleteItem, moveItem } = useTaskChecklist(taskId);
  const [isOpen, setIsOpen] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addItem(newTitle.trim());
    setNewTitle('');
    inputRef.current?.focus();
  };

  const startEdit = (id: string, title: string) => {
    setEditingId(id);
    setEditingValue(title);
  };

  const commitEdit = () => {
    if (editingId && editingValue.trim()) {
      updateTitle(editingId, editingValue.trim());
    }
    setEditingId(null);
    setEditingValue('');
  };

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-1.5 group">
        <ListChecks className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground">
          Subtarefas
          {total > 0 && (
            <span className="text-muted-foreground font-normal ml-1">({completed}/{total})</span>
          )}
        </span>
        <div className="flex-1" />
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-2 mt-2">
        {/* Progress bar */}
        {total > 0 && (
          <div className="flex items-center gap-2">
            <Progress value={percent} className="h-1.5 flex-1" />
            <span className="text-[10px] text-muted-foreground font-light">{percent}%</span>
          </div>
        )}

        {/* Items */}
        <div className="space-y-1">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-2 group/item rounded-lg px-2 py-1.5 hover:bg-muted/30 transition-colors",
                item.is_completed && "opacity-60"
              )}
            >
              <Checkbox
                checked={item.is_completed}
                onCheckedChange={() => toggleItem(item.id)}
                className="flex-shrink-0"
              />

              {editingId === item.id ? (
                <Input
                  value={editingValue}
                  onChange={e => setEditingValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null); }}
                  className="h-6 text-xs border-none px-0 focus-visible:ring-0 shadow-none flex-1"
                  autoFocus
                />
              ) : (
                <span
                  onClick={() => startEdit(item.id, item.title)}
                  className={cn(
                    "text-xs flex-1 cursor-text text-foreground",
                    item.is_completed && "line-through text-muted-foreground"
                  )}
                >
                  {item.title}
                </span>
              )}

              {/* Reorder + Delete */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                {idx > 0 && (
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => moveItem(item.id, 'up')}>
                    <ArrowUp className="w-3 h-3" />
                  </Button>
                )}
                {idx < items.length - 1 && (
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => moveItem(item.id, 'down')}>
                    <ArrowDown className="w-3 h-3" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-destructive" onClick={() => deleteItem(item.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add new item */}
        <div className="flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <Input
            ref={inputRef}
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            placeholder="Adicionar subtarefa..."
            className="h-7 text-xs border-none px-0 focus-visible:ring-0 shadow-none flex-1"
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
