import { useRef, useEffect, useState } from "react";
import { ContentItem, CONTENT_ITEM_STAGES } from "@/types/marketing";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

interface Timeline3DProps {
  items: ContentItem[];
  onItemClick?: (item: ContentItem) => void;
  days?: number;
}

export function Timeline3D({ items, onItemClick, days = 30 }: Timeline3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const { scrollXProgress } = useScroll({
    container: containerRef,
    axis: "x",
  });

  // Parallax effect based on scroll
  const parallaxX = useTransform(scrollXProgress, [0, 1], [0, -50]);
  const parallaxScale = useTransform(scrollXProgress, [0, 0.5, 1], [1, 1.02, 1]);
  
  // Smooth spring for mouse tracking
  const springConfig = { damping: 25, stiffness: 200 };
  const rotateX = useSpring(useTransform(mouseY, [0, 400], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [0, 1200], [-5, 5]), springConfig);

  // Generate days for the timeline
  const today = new Date();
  const timelineDays = Array.from({ length: days }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - Math.floor(days / 2) + i);
    return date;
  });

  // Group items by date
  const itemsByDate = items.reduce((acc, item) => {
    const date = item.scheduled_at || item.due_at;
    if (date) {
      const dateKey = new Date(date).toDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(item);
    }
    return acc;
  }, {} as Record<string, ContentItem[]>);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    }
  };

  const getStatusColor = (status: string) => {
    const stage = CONTENT_ITEM_STAGES.find(s => s.type === status);
    return stage?.color || 'bg-slate-500';
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    return date < today && !isToday(date);
  };

  return (
    <div className="relative">
      {/* Background Parallax Layer */}
      <motion.div 
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ x: parallaxX }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </motion.div>

      {/* 3D Container */}
      <motion.div
        ref={containerRef}
        className="relative overflow-x-auto overflow-y-hidden custom-scrollbar perspective-1000"
        style={{
          perspective: "1200px",
          perspectiveOrigin: "center center",
        }}
        onMouseMove={handleMouseMove}
      >
        <motion.div
          className="flex items-center gap-1 py-16 px-8 min-w-max"
          style={{
            rotateX,
            rotateY,
            scale: parallaxScale,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Timeline Track */}
          <div className="absolute top-1/2 left-8 right-8 h-[2px] bg-gradient-to-r from-border/0 via-border to-border/0 transform -translate-y-1/2" />
          
          {/* Glow Effect */}
          <div className="absolute top-1/2 left-1/2 w-96 h-32 bg-primary/10 blur-3xl rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

          {timelineDays.map((date, idx) => {
            const dateKey = date.toDateString();
            const dayItems = itemsByDate[dateKey] || [];
            const hasItems = dayItems.length > 0;
            const isTodayDate = isToday(date);
            const isPastDate = isPast(date);

            return (
              <motion.div
                key={dateKey}
                className="relative flex flex-col items-center"
                style={{
                  transformStyle: "preserve-3d",
                  translateZ: isTodayDate ? 30 : 0,
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02, duration: 0.4 }}
              >
                {/* Date Label */}
                <motion.div 
                  className={cn(
                    "absolute -top-12 text-center transform -translate-x-1/2 left-1/2",
                    isTodayDate && "scale-110"
                  )}
                  style={{ translateZ: 10 }}
                >
                  <p className={cn(
                    "text-[9px] uppercase tracking-widest font-medium mb-1",
                    isTodayDate ? "text-primary" : "text-muted-foreground/60"
                  )}>
                    {date.toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </p>
                  <p className={cn(
                    "text-xs font-medium",
                    isTodayDate ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {date.getDate()}
                  </p>
                </motion.div>

                {/* Timeline Node */}
                <motion.div
                  className={cn(
                    "relative w-24 h-24 flex items-center justify-center",
                    "cursor-pointer group"
                  )}
                  whileHover={{ scale: 1.1, translateZ: 20 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Node Circle */}
                  <motion.div
                    className={cn(
                      "absolute w-3 h-3 rounded-full transition-all duration-300",
                      "shadow-lg",
                      isTodayDate 
                        ? "bg-primary ring-4 ring-primary/30 w-4 h-4" 
                        : hasItems 
                          ? isPastDate 
                            ? "bg-red-500 ring-2 ring-red-500/30" 
                            : "bg-muted-foreground ring-2 ring-muted-foreground/20"
                          : "bg-muted-foreground/30"
                    )}
                    style={{ translateZ: 5 }}
                    whileHover={{ 
                      scale: 1.5,
                      boxShadow: "0 0 20px rgba(0, 163, 211, 0.5)"
                    }}
                  />

                  {/* Today Indicator */}
                  {isTodayDate && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/20" />
                    </motion.div>
                  )}

                  {/* Content Items Indicators */}
                  {hasItems && (
                    <motion.div
                      className="absolute top-full mt-4 flex flex-col gap-1"
                      style={{ translateZ: 15 }}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {dayItems.slice(0, 3).map((item, i) => (
                        <motion.button
                          key={item.id}
                          className={cn(
                            "group/item relative px-3 py-1.5 rounded-lg text-left",
                            "bg-card/80 backdrop-blur-sm border border-border/50",
                            "hover:bg-card hover:border-primary/30 transition-all",
                            "min-w-[120px] max-w-[160px]"
                          )}
                          onClick={() => onItemClick?.(item)}
                          onMouseEnter={() => setHoveredItem(item.id)}
                          onMouseLeave={() => setHoveredItem(null)}
                          whileHover={{ 
                            scale: 1.05, 
                            translateZ: 10,
                            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
                          }}
                          style={{ translateZ: i * 5 }}
                        >
                          {/* Status Indicator */}
                          <div className={cn(
                            "absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full",
                            getStatusColor(item.status)
                          )} />
                          
                          <p className="text-[10px] text-foreground font-medium truncate pl-3">
                            {item.title}
                          </p>
                          <p className="text-[8px] text-muted-foreground truncate pl-3 mt-0.5">
                            {item.channel && item.format 
                              ? `${item.channel} • ${item.format}` 
                              : item.channel || item.format || 'Conteúdo'}
                          </p>

                          {/* Hover Glow */}
                          {hoveredItem === item.id && (
                            <motion.div
                              className="absolute inset-0 rounded-lg bg-primary/10 pointer-events-none"
                              layoutId="hover-glow"
                            />
                          )}
                        </motion.button>
                      ))}
                      
                      {dayItems.length > 3 && (
                        <span className="text-[9px] text-muted-foreground text-center">
                          +{dayItems.length - 3} mais
                        </span>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>

      {/* Timeline Label */}
      <div className="absolute top-4 left-8 flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium">
          Timeline Janela {days}D
        </span>
      </div>

      {/* Brand */}
      <div className="absolute top-4 right-8">
        <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">
          SQUAD Engine
        </span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-8 flex items-center gap-6 text-[9px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span>Hoje</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Atrasado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-muted-foreground" />
          <span>Agendado</span>
        </div>
      </div>
    </div>
  );
}
