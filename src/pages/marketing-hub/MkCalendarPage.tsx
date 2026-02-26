import { useEffect, useState, useMemo, useCallback } from "react";
import { MkAppShell } from "@/components/marketing-hub/MkAppShell";
import { MkCard, MkStatusBadge, MkEmptyState } from "@/components/marketing-hub/mk-ui";
import { useMarketingStore } from "@/stores/marketingStore";
import { ContentItem, CONTENT_CHANNELS, CONTENT_ITEM_STAGES, CONTENT_FORMATS } from "@/types/marketing";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, LayoutGrid, List,
  Clock, Sparkles, GripVertical, X, Eye, ExternalLink, Zap
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay,
  addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks,
  isToday as isDateToday, parseISO, addDays, isSameMonth, setHours, setMinutes
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ViewMode = "month" | "week";

// Best posting times by channel (based on general social media research)
const BEST_TIMES: Record<string, { hours: number[]; label: string }> = {
  instagram: { hours: [9, 12, 18, 21], label: "9h, 12h, 18h, 21h" },
  tiktok: { hours: [7, 12, 19, 22], label: "7h, 12h, 19h, 22h" },
  youtube: { hours: [9, 14, 17], label: "9h, 14h, 17h" },
  linkedin: { hours: [8, 10, 12], label: "8h, 10h, 12h" },
  email: { hours: [8, 10, 14], label: "8h, 10h, 14h" },
  site: { hours: [9, 15], label: "9h, 15h" },
};

// Drag state (simple pointer-based DnD)
interface DragState {
  itemId: string;
  item: ContentItem;
}

export default function MkCalendarPage() {
  const { contentItems, fetchContentItems, updateContentItem } = useMarketingStore();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropTargetDate, setDropTargetDate] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<ContentItem | null>(null);
  const [showBestTimes, setShowBestTimes] = useState(false);

  useEffect(() => { fetchContentItems(); }, []);

  // Navigation
  const goNext = () => setCurrentDate(d => viewMode === "month" ? addMonths(d, 1) : addWeeks(d, 1));
  const goPrev = () => setCurrentDate(d => viewMode === "month" ? subMonths(d, 1) : subWeeks(d, 1));
  const goToday = () => setCurrentDate(new Date());

  const headerLabel = viewMode === "month"
    ? format(currentDate, "MMMM yyyy", { locale: ptBR })
    : `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "dd MMM", { locale: ptBR })} — ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), "dd MMM yyyy", { locale: ptBR })}`;

  // Get items for a specific day
  const getItemsForDay = useCallback((day: Date) =>
    contentItems.filter(i => {
      const d = i.scheduled_at ? new Date(i.scheduled_at) : i.due_at ? new Date(i.due_at) : null;
      return d && isSameDay(d, day);
    }).sort((a, b) => {
      const da = a.scheduled_at || a.due_at || "";
      const db = b.scheduled_at || b.due_at || "";
      return da.localeCompare(db);
    }),
  [contentItems]);

  // DnD handlers
  const handleDragStart = (item: ContentItem) => {
    setDragState({ itemId: item.id, item });
  };

  const handleDrop = async (targetDate: Date) => {
    if (!dragState) return;
    const newDate = targetDate.toISOString();
    try {
      await updateContentItem(dragState.itemId, {
        scheduled_at: newDate,
      });
      toast.success(`"${dragState.item.title}" movido para ${format(targetDate, "dd/MM/yyyy")}`);
    } catch {
      toast.error("Erro ao mover conteúdo");
    }
    setDragState(null);
    setDropTargetDate(null);
  };

  // Scheduled / unscheduled counts
  const scheduledCount = contentItems.filter(i => i.scheduled_at).length;
  const unscheduledCount = contentItems.filter(i => !i.scheduled_at && !i.published_at).length;

  return (
    <MkAppShell title="Calendário Editorial" sectionCode="04" sectionLabel="Editorial_Calendar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-white/30">
            {scheduledCount} agendados · {unscheduledCount} sem data
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-xl border border-border/50 overflow-hidden">
            <button
              onClick={() => setViewMode("month")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors",
                viewMode === "month"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Mês
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors",
                viewMode === "week"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="w-3.5 h-3.5" />
              Semana
            </button>
          </div>

          {/* Best times toggle */}
          <motion.button
            onClick={() => setShowBestTimes(!showBestTimes)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all duration-300",
              showBestTimes
                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
            )}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Horários
          </motion.button>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button onClick={goPrev} className="p-2 rounded-xl hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={goToday} className="px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors font-medium">
              Hoje
            </button>
            <button onClick={goNext} className="p-2 rounded-xl hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Period label */}
      <motion.h2
        key={headerLabel}
        className="text-lg font-semibold text-foreground/80 capitalize mb-4"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {headerLabel}
      </motion.h2>

      {/* Best times panel */}
      <AnimatePresence>
        {showBestTimes && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden mb-6"
          >
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-400">Melhores Horários por Canal</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {CONTENT_CHANNELS.map(ch => {
                  const best = BEST_TIMES[ch.type];
                  return (
                    <div key={ch.type} className="rounded-xl bg-background/50 border border-border/30 p-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-primary/70">{ch.icon}</span>
                        <span className="text-xs font-medium text-foreground/80">{ch.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {best?.hours.map(h => (
                          <span key={h} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">
                            {h}h
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar view */}
      {viewMode === "month" ? (
        <MonthView
          currentDate={currentDate}
          getItemsForDay={getItemsForDay}
          dragState={dragState}
          dropTargetDate={dropTargetDate}
          setDropTargetDate={setDropTargetDate}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          onItemClick={setDetailItem}
        />
      ) : (
        <WeekView
          currentDate={currentDate}
          getItemsForDay={getItemsForDay}
          dragState={dragState}
          dropTargetDate={dropTargetDate}
          setDropTargetDate={setDropTargetDate}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          onItemClick={setDetailItem}
        />
      )}

      {/* Unscheduled items sidebar */}
      {unscheduledCount > 0 && (
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Sem data agendada ({unscheduledCount})
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {contentItems
              .filter(i => !i.scheduled_at && !i.published_at)
              .slice(0, 10)
              .map(item => (
                <ContentChip
                  key={item.id}
                  item={item}
                  draggable
                  onDragStart={() => handleDragStart(item)}
                  onClick={() => setDetailItem(item)}
                />
              ))}
          </div>
        </motion.div>
      )}

      {/* Detail dialog */}
      <ContentDetailDialog item={detailItem} onClose={() => setDetailItem(null)} />
    </MkAppShell>
  );
}

// ── Month View ──────────────────────────────────────
interface CalendarViewProps {
  currentDate: Date;
  getItemsForDay: (day: Date) => ContentItem[];
  dragState: DragState | null;
  dropTargetDate: string | null;
  setDropTargetDate: (d: string | null) => void;
  onDragStart: (item: ContentItem) => void;
  onDrop: (date: Date) => void;
  onItemClick: (item: ContentItem) => void;
}

function MonthView({ currentDate, getItemsForDay, dragState, dropTargetDate, setDropTargetDate, onDragStart, onDrop, onItemClick }: CalendarViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
          <div key={d} className="text-center text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 py-2 font-medium">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} className="min-h-[100px]" />)}
        {days.map(day => (
          <DayCell
            key={day.toISOString()}
            day={day}
            items={getItemsForDay(day)}
            isCurrentMonth
            dragState={dragState}
            isDropTarget={dropTargetDate === day.toISOString()}
            onDragEnter={() => dragState && setDropTargetDate(day.toISOString())}
            onDragLeave={() => setDropTargetDate(null)}
            onDrop={() => onDrop(day)}
            onDragStart={onDragStart}
            onItemClick={onItemClick}
            compact
          />
        ))}
      </div>
    </div>
  );
}

// ── Week View ──────────────────────────────────────
function WeekView({ currentDate, getItemsForDay, dragState, dropTargetDate, setDropTargetDate, onDragStart, onDrop, onItemClick }: CalendarViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map(day => (
        <div key={day.toISOString()} className="space-y-1">
          {/* Day header */}
          <div className={cn(
            "text-center py-2 rounded-xl transition-colors",
            isDateToday(day) ? "bg-primary/10" : ""
          )}>
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-medium">
              {format(day, "EEE", { locale: ptBR })}
            </div>
            <div className={cn(
              "text-lg font-bold mt-0.5",
              isDateToday(day) ? "text-primary" : "text-foreground/70"
            )}>
              {format(day, "d")}
            </div>
          </div>

          <DayCell
            day={day}
            items={getItemsForDay(day)}
            isCurrentMonth
            dragState={dragState}
            isDropTarget={dropTargetDate === day.toISOString()}
            onDragEnter={() => dragState && setDropTargetDate(day.toISOString())}
            onDragLeave={() => setDropTargetDate(null)}
            onDrop={() => onDrop(day)}
            onDragStart={onDragStart}
            onItemClick={onItemClick}
            compact={false}
          />
        </div>
      ))}
    </div>
  );
}

// ── Day Cell ──────────────────────────────────────
interface DayCellProps {
  day: Date;
  items: ContentItem[];
  isCurrentMonth: boolean;
  dragState: DragState | null;
  isDropTarget: boolean;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onDragStart: (item: ContentItem) => void;
  onItemClick: (item: ContentItem) => void;
  compact: boolean;
}

function DayCell({ day, items, isCurrentMonth, dragState, isDropTarget, onDragEnter, onDragLeave, onDrop, onDragStart, onItemClick, compact }: DayCellProps) {
  const today = isDateToday(day);
  const maxVisible = compact ? 3 : 8;

  return (
    <motion.div
      className={cn(
        "rounded-xl p-2 border transition-all duration-300 relative group",
        compact ? "min-h-[100px]" : "min-h-[140px]",
        today
          ? "border-primary/30 bg-primary/[0.04] shadow-[0_0_20px_-8px_hsl(var(--primary)/0.15)]"
          : "border-border/30 bg-card/30 hover:bg-card/60 hover:border-border/50",
        isDropTarget && "border-primary/50 bg-primary/10 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.25)] scale-[1.02]",
        dragState && !isDropTarget && "hover:border-primary/30"
      )}
      onDragOver={e => { e.preventDefault(); onDragEnter(); }}
      onDragLeave={onDragLeave}
      onDrop={e => { e.preventDefault(); onDrop(); }}
      layout
    >
      {/* Day number */}
      {compact && (
        <div className="flex items-center justify-between mb-1">
          <span className={cn(
            "text-xs font-semibold",
            today ? "text-primary" : "text-muted-foreground/50"
          )}>
            {format(day, "d")}
          </span>
          {items.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
              {items.length}
            </span>
          )}
        </div>
      )}

      {/* Today indicator */}
      {today && (
        <motion.div
          className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Items */}
      <div className="space-y-0.5">
        {items.slice(0, maxVisible).map((item, i) => (
          <ContentChip
            key={item.id}
            item={item}
            compact={compact}
            draggable
            onDragStart={() => onDragStart(item)}
            onClick={() => onItemClick(item)}
          />
        ))}
        {items.length > maxVisible && (
          <span className="text-[9px] text-muted-foreground/40 pl-1">+{items.length - maxVisible} mais</span>
        )}
      </div>

      {/* Drop target glow */}
      <AnimatePresence>
        {isDropTarget && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-dashed border-primary/40 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] text-primary/60 font-medium">Soltar aqui</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Content Chip ──────────────────────────────────────
function ContentChip({ item, compact = false, draggable = false, onDragStart, onClick }: {
  item: ContentItem;
  compact?: boolean;
  draggable?: boolean;
  onDragStart?: () => void;
  onClick?: () => void;
}) {
  const channel = CONTENT_CHANNELS.find(c => c.type === item.channel);
  const stage = CONTENT_ITEM_STAGES.find(s => s.type === item.status);

  const statusColor = item.status === "published" ? "bg-primary/20 text-primary"
    : item.status === "approved" || item.status === "scheduled" ? "bg-emerald-500/20 text-emerald-400"
    : item.status === "review" ? "bg-amber-500/20 text-amber-400"
    : "bg-muted/30 text-muted-foreground";

  return (
    <motion.div
      className={cn(
        "group/chip flex items-center gap-1.5 rounded-lg cursor-pointer transition-all duration-200",
        compact ? "px-1.5 py-0.5" : "px-2.5 py-1.5 border border-border/30",
        statusColor,
        "hover:shadow-sm hover:scale-[1.02]",
        draggable && "active:scale-95 active:opacity-70"
      )}
      draggable={draggable}
      onDragStart={(e: any) => {
        if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onClick={onClick}
      whileHover={{ x: compact ? 0 : 2 }}
      layout
    >
      {draggable && !compact && (
        <GripVertical className="w-3 h-3 text-muted-foreground/30 opacity-0 group-hover/chip:opacity-100 transition-opacity shrink-0" />
      )}
      {channel && !compact && (
        <span className="material-symbols-outlined text-[12px] opacity-60">{channel.icon}</span>
      )}
      <span className={cn(
        "truncate font-medium",
        compact ? "text-[10px]" : "text-xs"
      )}>
        {item.title}
      </span>
      {item.scheduled_at && !compact && (
        <span className="text-[9px] opacity-50 font-mono shrink-0 ml-auto">
          {format(parseISO(item.scheduled_at), "HH:mm")}
        </span>
      )}
    </motion.div>
  );
}

// ── Content Detail Dialog ──────────────────────────────────────
function ContentDetailDialog({ item, onClose }: { item: ContentItem | null; onClose: () => void }) {
  if (!item) return null;
  const channel = CONTENT_CHANNELS.find(c => c.type === item.channel);
  const stage = CONTENT_ITEM_STAGES.find(s => s.type === item.status);
  const fmt = CONTENT_FORMATS.find(f => f.type === item.format);
  const bestTimes = item.channel ? BEST_TIMES[item.channel] : null;

  return (
    <Dialog open={!!item} onOpenChange={() => onClose()}>
      <DialogContent className="border-border/50 bg-card/95 backdrop-blur-xl max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground/90 flex items-center gap-2">
            {channel && <span className="material-symbols-outlined text-primary/70">{channel.icon}</span>}
            {item.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {/* Status & meta */}
          <div className="flex flex-wrap gap-2">
            <MkStatusBadge label={stage?.name || item.status} variant={
              item.status === "approved" || item.status === "published" ? "emerald"
              : item.status === "review" ? "amber"
              : item.status === "scheduled" ? "blue"
              : "slate"
            } />
            {channel && <span className="text-[10px] px-2 py-0.5 rounded bg-muted/30 text-muted-foreground">{channel.name}</span>}
            {fmt && <span className="text-[10px] px-2 py-0.5 rounded bg-muted/30 text-muted-foreground">{fmt.name}</span>}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            {item.scheduled_at && (
              <div className="rounded-xl bg-accent/30 p-3 border border-border/30">
                <span className="text-[9px] text-muted-foreground uppercase tracking-[0.12em] block mb-1">Agendado</span>
                <span className="text-sm font-medium text-foreground/80">
                  {format(parseISO(item.scheduled_at), "dd MMM yyyy · HH:mm", { locale: ptBR })}
                </span>
              </div>
            )}
            {item.due_at && (
              <div className="rounded-xl bg-accent/30 p-3 border border-border/30">
                <span className="text-[9px] text-muted-foreground uppercase tracking-[0.12em] block mb-1">Prazo</span>
                <span className="text-sm font-medium text-foreground/80">
                  {format(parseISO(item.due_at), "dd MMM yyyy", { locale: ptBR })}
                </span>
              </div>
            )}
          </div>

          {/* Best time suggestion */}
          {bestTimes && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-medium text-amber-400">Melhor horário para {channel?.name}</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Horários com maior engajamento: <strong className="text-foreground/70">{bestTimes.label}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Content preview */}
          {item.hook && (
            <div className="rounded-xl bg-accent/20 border border-border/30 p-3">
              <span className="text-[9px] text-muted-foreground uppercase tracking-[0.12em] block mb-1">Hook</span>
              <p className="text-sm text-foreground/70">{item.hook}</p>
            </div>
          )}
          {item.caption_short && (
            <div className="rounded-xl bg-accent/20 border border-border/30 p-3">
              <span className="text-[9px] text-muted-foreground uppercase tracking-[0.12em] block mb-1">Legenda</span>
              <p className="text-xs text-foreground/60">{item.caption_short}</p>
            </div>
          )}
          {item.cta && (
            <div className="rounded-xl bg-accent/20 border border-border/30 p-3">
              <span className="text-[9px] text-muted-foreground uppercase tracking-[0.12em] block mb-1">CTA</span>
              <p className="text-xs text-foreground/60">{item.cta}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
