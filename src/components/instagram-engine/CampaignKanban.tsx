import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InstagramPost, POST_STATUSES, FORMATS, PILLARS, useUpdatePost } from '@/hooks/useInstagramEngine';
import { DndContext, closestCenter, DragEndEvent, DragOverlay, DragStartEvent, useDroppable, useDraggable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { GripVertical, Zap, Clock, CheckCircle2, FileText, Hash, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  posts: InstagramPost[];
}

const KANBAN_COLUMNS = POST_STATUSES.map(s => ({ key: s.key, label: s.label, color: s.color }));

// Completion percentage for a post
function getPostCompletion(post: InstagramPost): number {
  let done = 0, total = 5;
  if (post.hook) done++;
  if (post.script) done++;
  if (post.caption_short || post.caption_medium || post.caption_long) done++;
  if (post.cta) done++;
  if (post.hashtags?.length) done++;
  return Math.round((done / total) * 100);
}

// Mini progress ring
function MiniRing({ value, size = 20 }: { value: number; size?: number }) {
  const r = (size - 3) / 2;
  const c = r * 2 * Math.PI;
  const offset = c - (Math.min(value, 100) / 100) * c;
  const color = value >= 80 ? 'hsl(142,60%,45%)' : value >= 50 ? 'hsl(45,90%,50%)' : 'hsl(var(--muted-foreground))';
  return (
    <svg width={size} height={size} className="transform -rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={2.5} opacity={0.2} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  );
}

function DroppableColumn({ id, label, color, count, children }: { id: string; label: string; color: string; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <motion.div
      ref={setNodeRef}
      layout
      className={`flex-1 min-w-[220px] max-w-[300px] flex flex-col rounded-xl border transition-all duration-300 ${
        isOver ? 'border-primary/50 bg-primary/5 shadow-lg shadow-primary/10' : 'border-border/30 bg-muted/10'
      }`}
    >
      <div className="px-3 py-2.5 border-b border-border/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={`${color} text-[9px]`}>{label}</Badge>
        </div>
        <motion.span
          key={count}
          initial={{ scale: 1.3, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-5 h-5 rounded-full bg-muted/40 flex items-center justify-center text-[10px] font-semibold text-foreground"
        >
          {count}
        </motion.span>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[60vh]">
        <AnimatePresence mode="popLayout">
          {children}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function DraggableCard({ post }: { post: InstagramPost }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: post.id });
  const fmt = FORMATS.find(f => f.key === post.format);
  const pillar = PILLARS.find(p => p.key === post.pillar);
  const completion = getPostCompletion(post);

  const style = transform ? {
    transform: `translate(${transform.x}px, ${transform.y}px)`,
    zIndex: isDragging ? 50 : undefined,
  } : undefined;

  const hasCaption = !!(post.caption_short || post.caption_medium || post.caption_long);
  const hasHashtags = !!(post.hashtags?.length);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: isDragging ? 0.4 : 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <TooltipProvider delayDuration={400}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card
              ref={setNodeRef}
              style={style}
              className={`p-3 cursor-grab active:cursor-grabbing transition-all duration-200 group
                ${isDragging ? 'shadow-2xl border-primary/40 rotate-2' : 'hover:border-primary/25 hover:shadow-md glass-card'}
              `}
              {...attributes}
              {...listeners}
            >
              {/* Thumbnail / Visual */}
              {post.thumbnail_url && (
                <div className="w-full h-20 rounded-md overflow-hidden mb-2 bg-muted/20">
                  <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex items-start gap-2">
                <GripVertical className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-foreground truncate">{post.title}</p>

                  {/* Tags row */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {fmt && (
                      <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-border/50">
                        {fmt.label}
                      </Badge>
                    )}
                    {pillar && (
                      <span className="flex items-center gap-0.5 text-[8px] text-muted-foreground">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: pillar.color }} />
                        {pillar.label}
                      </span>
                    )}
                    {post.ai_generated && (
                      <span className="flex items-center gap-0.5 text-[8px] text-primary font-medium">
                        <Zap className="w-2.5 h-2.5" /> IA
                      </span>
                    )}
                  </div>

                  {/* Hook preview */}
                  {post.hook && (
                    <p className="text-[9px] text-muted-foreground mt-1.5 line-clamp-2 italic">🪝 {post.hook}</p>
                  )}

                  {/* Bottom row: completion + schedule + content indicators */}
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/10">
                    <div className="flex items-center gap-1.5">
                      <MiniRing value={completion} />
                      <span className="text-[8px] text-muted-foreground">{completion}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {post.hook && <FileText className="w-2.5 h-2.5 text-emerald-400" />}
                      {hasCaption && <MessageSquare className="w-2.5 h-2.5 text-primary" />}
                      {hasHashtags && <Hash className="w-2.5 h-2.5 text-amber-400" />}
                      {post.scheduled_at && (
                        <span className="flex items-center gap-0.5 text-[8px] text-cyan-400">
                          <Clock className="w-2.5 h-2.5" />
                          {format(new Date(post.scheduled_at), 'dd/MM', { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs p-3">
            <p className="text-xs font-semibold mb-1">{post.title}</p>
            {post.hook && <p className="text-[10px] text-muted-foreground mb-1">🪝 {post.hook}</p>}
            <div className="flex gap-2 text-[9px] text-muted-foreground">
              <span>Hook: {post.hook ? '✅' : '❌'}</span>
              <span>Roteiro: {post.script ? '✅' : '❌'}</span>
              <span>Legenda: {hasCaption ? '✅' : '❌'}</span>
              <span>CTA: {post.cta ? '✅' : '❌'}</span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
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

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const postId = String(active.id);
    const newStatus = String(over.id);
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6 text-[10px] text-muted-foreground border border-dashed border-border/20 rounded-lg"
              >
                Arraste posts aqui
              </motion.div>
            )}
          </DroppableColumn>
        ))}
      </div>

      <DragOverlay>
        {activePost && (
          <Card className="glass-card p-3 w-[250px] shadow-2xl border-primary/40 rotate-3">
            <p className="text-[11px] font-semibold text-foreground truncate">{activePost.title}</p>
            <div className="flex items-center gap-1.5 mt-1">
              {activePost.ai_generated && <Zap className="w-3 h-3 text-primary" />}
              <span className="text-[9px] text-muted-foreground">{FORMATS.find(f => f.key === activePost.format)?.label}</span>
            </div>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}
