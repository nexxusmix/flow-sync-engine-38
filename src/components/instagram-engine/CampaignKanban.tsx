import { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InstagramPost, POST_STATUSES, FORMATS, PILLARS, useUpdatePost } from '@/hooks/useInstagramEngine';
import { DndContext, closestCenter, DragEndEvent, DragOverlay, DragStartEvent, useDroppable, useDraggable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';

interface Props {
  posts: InstagramPost[];
}

const KANBAN_COLUMNS = POST_STATUSES.map(s => ({ key: s.key, label: s.label, color: s.color }));

function DroppableColumn({ id, label, color, count, children }: { id: string; label: string; color: string; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[200px] max-w-[280px] flex flex-col rounded-xl border transition-colors ${
        isOver ? 'border-primary/40 bg-primary/5' : 'border-border/30 bg-muted/10'
      }`}
    >
      <div className="px-3 py-2 border-b border-border/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={`${color} text-[9px]`}>{label}</Badge>
        </div>
        <span className="text-[10px] text-muted-foreground">{count}</span>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[60vh]">
        {children}
      </div>
    </div>
  );
}

function DraggableCard({ post }: { post: InstagramPost }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: post.id });
  const fmt = FORMATS.find(f => f.key === post.format);
  const pillar = PILLARS.find(p => p.key === post.pillar);

  const style = transform ? {
    transform: `translate(${transform.x}px, ${transform.y}px)`,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="glass-card p-2.5 cursor-grab active:cursor-grabbing hover:border-primary/20 transition-colors"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-1.5">
        <GripVertical className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-foreground truncate">{post.title}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {fmt && (
              <Badge variant="outline" className="text-[8px] h-4 px-1.5">
                {fmt.label}
              </Badge>
            )}
            {pillar && (
              <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: pillar.color }} />
                {pillar.label}
              </span>
            )}
            {post.ai_generated && <span className="text-[9px] text-primary">⚡IA</span>}
          </div>
          {post.hook && (
            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">🪝 {post.hook}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

export function CampaignKanban({ posts }: Props) {
  const updatePost = useUpdatePost();
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const postsByStatus = useMemo(() => {
    const map: Record<string, InstagramPost[]> = {};
    KANBAN_COLUMNS.forEach(col => { map[col.key] = []; });
    posts.forEach(p => {
      if (map[p.status]) map[p.status].push(p);
      else if (map.idea) map.idea.push(p);
    });
    return map;
  }, [posts]);

  const activePost = activeId ? posts.find(p => p.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const postId = String(active.id);
    const newStatus = String(over.id);

    // Only update if dropped on a valid column and status changed
    const post = posts.find(p => p.id === postId);
    if (!post || post.status === newStatus) return;
    if (!KANBAN_COLUMNS.some(c => c.key === newStatus)) return;

    updatePost.mutate({ id: postId, status: newStatus } as any);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {KANBAN_COLUMNS.map(col => (
          <DroppableColumn key={col.key} id={col.key} label={col.label} color={col.color} count={postsByStatus[col.key]?.length || 0}>
            {(postsByStatus[col.key] || []).map(post => (
              <DraggableCard key={post.id} post={post} />
            ))}
            {(postsByStatus[col.key] || []).length === 0 && (
              <div className="text-center py-4 text-[10px] text-muted-foreground">
                Arraste posts aqui
              </div>
            )}
          </DroppableColumn>
        ))}
      </div>

      <DragOverlay>
        {activePost && (
          <Card className="glass-card p-2.5 w-[240px] shadow-lg border-primary/30">
            <p className="text-[11px] font-medium text-foreground truncate">{activePost.title}</p>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}
