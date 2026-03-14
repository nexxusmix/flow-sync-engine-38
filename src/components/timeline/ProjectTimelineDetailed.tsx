import { useRef, useState, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import { TimelineStageSegment, TimelineMilestone } from "@/types/timeline";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  LayoutList, 
  GitBranch,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  User,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ProjectTimelineDetailedProps {
  segments: TimelineStageSegment[];
  milestones?: TimelineMilestone[];
  hasPaymentBlock?: boolean;
  currentStage?: string;
  lastUpdated?: string;
  projectName?: string;
  className?: string;
}

type ViewMode = "horizontal" | "vertical";
type ZoomLevel = 1 | 2 | 4;

export function ProjectTimelineDetailed({
  segments,
  milestones = [],
  hasPaymentBlock = false,
  currentStage,
  lastUpdated,
  projectName,
  className,
}: ProjectTimelineDetailedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  const [viewMode, setViewMode] = useState<ViewMode>("horizontal");
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(1);
  const [selectedSegment, setSelectedSegment] = useState<TimelineStageSegment | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const today = new Date();

  // Calculate timeline bounds
  const timelineBounds = useMemo(() => {
    const allDates = [
      ...segments.map((s) => new Date(s.plannedStart)),
      ...segments.map((s) => new Date(s.plannedEnd)),
      ...segments.filter((s) => s.actualStart).map((s) => new Date(s.actualStart!)),
      ...segments.filter((s) => s.actualEnd).map((s) => new Date(s.actualEnd!)),
    ];

    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
    const totalDays = differenceInDays(maxDate, minDate) + 14; // Add padding

    return { minDate, maxDate, totalDays };
  }, [segments]);

  const getPositionPercent = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayOffset = differenceInDays(date, timelineBounds.minDate);
    return (dayOffset / timelineBounds.totalDays) * 100;
  };

  const getWidthPercent = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const days = differenceInDays(end, start);
    return (days / timelineBounds.totalDays) * 100;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-primary/20 border-primary/40";
      case "in_progress":
        return "bg-primary/10 border-primary/30";
      case "blocked":
        return "bg-destructive/20 border-destructive/40";
      default:
        return "bg-muted/20 border-muted/40";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
      case "in_progress":
        return <Clock className="w-3 h-3 text-primary" />;
      case "blocked":
        return <Lock className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getDelayDays = (segment: TimelineStageSegment) => {
    if (!segment.actualEnd && segment.plannedEnd) {
      const planned = new Date(segment.plannedEnd);
      if (today > planned && segment.status !== "done") {
        return differenceInDays(today, planned);
      }
    }
    if (segment.actualEnd && segment.plannedEnd) {
      const planned = new Date(segment.plannedEnd);
      const actual = new Date(segment.actualEnd);
      const delay = differenceInDays(actual, planned);
      return delay > 0 ? delay : 0;
    }
    return 0;
  };

  // Drag scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = direction === "left" ? -300 : 300;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <div ref={containerRef} className={cn("space-y-4", className)}>
      {/* Header */}
      <motion.div
        className="glass-card rounded-2xl p-4 md:p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Timeline do Projeto</h3>
              {projectName && (
                <p className="text-xs text-muted-foreground mt-1">{projectName}</p>
              )}
            </div>

            {currentStage && (
              <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary">
                <Clock className="w-3 h-3 mr-1" />
                {currentStage}
              </Badge>
            )}

          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center border border-border/50 rounded-lg p-1 bg-muted/20">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-2",
                  viewMode === "horizontal" && "bg-background"
                )}
                onClick={() => setViewMode("horizontal")}
              >
                <GitBranch className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-2",
                  viewMode === "vertical" && "bg-background"
                )}
                onClick={() => setViewMode("vertical")}
              >
                <LayoutList className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Zoom Controls (only for horizontal) */}
            {viewMode === "horizontal" && (
              <div className="flex items-center border border-border/50 rounded-lg p-1 bg-muted/20">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setZoomLevel((z) => Math.max(1, z / 2) as ZoomLevel)}
                  disabled={zoomLevel === 1}
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </Button>
                <span className="text-[10px] font-medium text-muted-foreground px-2">{zoomLevel}x</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setZoomLevel((z) => Math.min(4, z * 2) as ZoomLevel)}
                  disabled={zoomLevel === 4}
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            {lastUpdated && (
              <span className="text-[10px] text-muted-foreground">
                Atualizado {format(new Date(lastUpdated), "dd/MM HH:mm", { locale: ptBR })}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Timeline Content */}
      {viewMode === "horizontal" ? (
        <motion.div
          className="glass-card rounded-2xl p-4 md:p-6 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Navigation Arrows */}
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => scroll("left")}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 text-center">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Arraste para navegar
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => scroll("right")}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Scrollable Timeline */}
          <div
            ref={scrollRef}
            className="overflow-x-auto cursor-grab active:cursor-grabbing scrollbar-hide"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ scrollBehavior: isDragging ? "auto" : "smooth" }}
          >
            <div
              className="relative h-40 md:h-48"
              style={{ width: `${100 * zoomLevel}%`, minWidth: "800px" }}
            >
              {/* Grid lines */}
              <div className="absolute inset-0 flex">
                {Array.from({ length: Math.ceil(timelineBounds.totalDays / 7) }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 border-l border-white/5 first:border-l-0"
                  />
                ))}
              </div>

              {/* Main line */}
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/10 -translate-y-1/2" />

              {/* Today marker */}
              {differenceInDays(today, timelineBounds.minDate) >= 0 &&
                differenceInDays(today, timelineBounds.maxDate) <= 14 && (
                  <div
                    className="absolute top-0 bottom-0 w-[2px] bg-primary/50 z-10"
                    style={{ left: `${getPositionPercent(today.toISOString())}%` }}
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary/20 rounded text-[8px] text-primary font-medium">
                      HOJE
                    </div>
                  </div>
                )}

              {/* Stage Segments */}
              {segments.map((segment, index) => {
                const left = getPositionPercent(segment.plannedStart);
                const width = getWidthPercent(segment.plannedStart, segment.plannedEnd);
                const delay = getDelayDays(segment);

                return (
                  <motion.div
                    key={segment.id}
                    className="absolute top-1/2 -translate-y-1/2 cursor-pointer group"
                    style={{ left: `${left}%`, width: `${width}%` }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    onClick={() => setSelectedSegment(segment)}
                    whileHover={{ y: -4 }}
                  >
                    <div
                      className={cn(
                        "h-10 rounded-lg border transition-all duration-300",
                        getStatusColor(segment.status),
                        "group-hover:shadow-[0_4px_20px_rgba(0,163,211,0.15)]",
                        segment.status === "in_progress" && "animate-pulse"
                      )}
                    >
                      {/* Progress fill */}
                      <div
                        className={cn(
                          "h-full rounded-lg transition-all duration-300",
                          segment.status === "done"
                            ? "bg-primary/30"
                            : segment.status === "in_progress"
                            ? "bg-primary/20"
                            : segment.status === "blocked"
                            ? "bg-destructive/30"
                            : "bg-muted/30"
                        )}
                        style={{ width: `${segment.progress}%` }}
                      />
                    </div>

                    {/* Label */}
                    <div className="absolute -bottom-6 left-0 right-0 text-center">
                      <span className="text-[9px] text-muted-foreground font-medium truncate block">
                        {segment.name}
                      </span>
                      {delay > 0 && (
                        <span className="text-[8px] text-red-400">+{delay}d</span>
                      )}
                    </div>

                    {/* Status indicator */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      {getStatusIcon(segment.status)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-8 pt-4 border-t border-border/30">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50" />
              <span className="text-[10px] text-muted-foreground">Concluído</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary/30 border border-primary/50" />
              <span className="text-[10px] text-muted-foreground">Em andamento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-muted/30 border border-muted/50" />
              <span className="text-[10px] text-muted-foreground">Pendente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50" />
              <span className="text-[10px] text-muted-foreground">Bloqueado</span>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Vertical List View */
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {segments.map((segment, index) => {
            const delay = getDelayDays(segment);

            return (
              <motion.div
                key={segment.id}
                className={cn(
                  "glass-card rounded-xl p-4 border-l-2 cursor-pointer transition-all duration-300 hover:bg-muted/10",
                  segment.status === "done" && "border-l-emerald-500",
                  segment.status === "in_progress" && "border-l-primary",
                  segment.status === "blocked" && "border-l-red-500",
                  segment.status === "not_started" && "border-l-muted"
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                onClick={() => setSelectedSegment(segment)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getStatusIcon(segment.status)}</div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">{segment.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {format(new Date(segment.plannedStart), "dd/MM", { locale: ptBR })} -{" "}
                          {format(new Date(segment.plannedEnd), "dd/MM", { locale: ptBR })}
                        </span>
                        {segment.ownerName && (
                          <span className="text-[10px] text-muted-foreground">
                            <User className="w-3 h-3 inline mr-1" />
                            {segment.ownerName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {delay > 0 && (
                      <Badge variant="destructive" className="bg-red-500/20 text-red-400 text-[10px]">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        +{delay} dias
                      </Badge>
                    )}
                    <div className="mt-2">
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            segment.status === "done" && "bg-emerald-500",
                            segment.status === "in_progress" && "bg-primary",
                            segment.status === "blocked" && "bg-red-500",
                            segment.status === "not_started" && "bg-muted-foreground/30"
                          )}
                          style={{ width: `${segment.progress}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-muted-foreground">{segment.progress}%</span>
                    </div>
                  </div>
                </div>

                {/* Blockers */}
                {segment.blockers && segment.blockers.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <div className="flex flex-wrap gap-2">
                      {segment.blockers.map((blocker, i) => (
                        <span
                          key={i}
                          className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20"
                        >
                          {blocker.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selectedSegment} onOpenChange={() => setSelectedSegment(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selectedSegment && getStatusIcon(selectedSegment.status)}
              {selectedSegment?.name}
            </SheetTitle>
            <SheetDescription>Detalhes da etapa do projeto</SheetDescription>
          </SheetHeader>

          {selectedSegment && (
            <div className="mt-6 space-y-6">
              {/* Status */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Status
                </label>
                <Badge
                  className={cn(
                    "mt-1",
                    selectedSegment.status === "done" && "bg-emerald-500/20 text-emerald-400",
                    selectedSegment.status === "in_progress" && "bg-primary/20 text-primary",
                    selectedSegment.status === "blocked" && "bg-red-500/20 text-red-400",
                    selectedSegment.status === "not_started" && "bg-muted/20 text-muted-foreground"
                  )}
                >
                  {selectedSegment.status === "done" && "Concluído"}
                  {selectedSegment.status === "in_progress" && "Em andamento"}
                  {selectedSegment.status === "blocked" && "Bloqueado"}
                  {selectedSegment.status === "not_started" && "Não iniciado"}
                </Badge>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Início Planejado
                  </label>
                  <p className="text-sm text-foreground mt-1">
                    {format(new Date(selectedSegment.plannedStart), "dd MMM yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Fim Planejado
                  </label>
                  <p className="text-sm text-foreground mt-1">
                    {format(new Date(selectedSegment.plannedEnd), "dd MMM yyyy", { locale: ptBR })}
                  </p>
                </div>
                {selectedSegment.actualStart && (
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Início Real
                    </label>
                    <p className="text-sm text-foreground mt-1">
                      {format(new Date(selectedSegment.actualStart), "dd MMM yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
                {selectedSegment.actualEnd && (
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Fim Real
                    </label>
                    <p className="text-sm text-foreground mt-1">
                      {format(new Date(selectedSegment.actualEnd), "dd MMM yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>

              {/* Owner */}
              {selectedSegment.ownerName && (
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Responsável
                  </label>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                      {selectedSegment.ownerInitials}
                    </div>
                    <span className="text-sm text-foreground">{selectedSegment.ownerName}</span>
                  </div>
                </div>
              )}

              {/* Progress */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Progresso
                </label>
                <div className="mt-2">
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        selectedSegment.status === "done" && "bg-emerald-500",
                        selectedSegment.status === "in_progress" && "bg-primary",
                        selectedSegment.status === "blocked" && "bg-red-500",
                        selectedSegment.status === "not_started" && "bg-muted-foreground/30"
                      )}
                      style={{ width: `${selectedSegment.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">{selectedSegment.progress}%</span>
                </div>
              </div>

              {/* Blockers */}
              {selectedSegment.blockers && selectedSegment.blockers.length > 0 && (
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Bloqueios
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedSegment.blockers.map((blocker, i) => (
                      <Badge
                        key={i}
                        variant="destructive"
                        className="bg-red-500/20 text-red-400"
                      >
                        {blocker.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-border/30 space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Definir prazo
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Definir responsável
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
