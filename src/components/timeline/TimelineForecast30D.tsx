import { useRef, useEffect, useState, useMemo } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { TimelineMilestone } from "@/types/timeline";
import { cn } from "@/lib/utils";
import { format, addDays, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TimelineForecast30DProps {
  milestones: TimelineMilestone[];
  projectId?: string; // If provided, filter milestones for this project
  className?: string;
}

// Check if device prefers reduced motion or is mobile
const useReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    setIsMobile(window.innerWidth < 1024);

    const handleChange = () => setReducedMotion(mediaQuery.matches);
    const handleResize = () => setIsMobile(window.innerWidth < 1024);

    mediaQuery.addEventListener("change", handleChange);
    window.addEventListener("resize", handleResize);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return reducedMotion || isMobile;
};

export function TimelineForecast30D({ milestones, projectId, className }: TimelineForecast30DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const reducedMotion = useReducedMotion();
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);

  // Mouse tracking for tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [2, -2]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-3, 3]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Filter and sort milestones
  const today = new Date();
  const thirtyDaysLater = addDays(today, 30);

  const filteredMilestones = useMemo(() => {
    let filtered = milestones.filter((m) => {
      const date = new Date(m.date);
      return date >= today && date <= thirtyDaysLater;
    });

    if (projectId) {
      filtered = filtered.filter((m) => m.projectId === projectId);
    }

    // Sort by severity (critical first) then by date
    return filtered
      .sort((a, b) => {
        const severityOrder = { critical: 0, risk: 1, normal: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      })
      .slice(0, 5);
  }, [milestones, projectId]);

  const getPositionOnLine = (dateStr: string) => {
    const date = new Date(dateStr);
    const totalDays = 30;
    const daysFromToday = differenceInDays(date, today);
    return Math.max(0, Math.min(100, (daysFromToday / totalDays) * 100));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-destructive";
      case "risk":
        return "bg-muted-foreground";
      default:
        return "bg-muted-foreground/60";
    }
  };

  const getSeverityGlow = (severity: string) => {
    switch (severity) {
      case "critical":
        return "shadow-[0_0_12px_2px_rgba(239,68,68,0.5)]";
      case "risk":
        return "shadow-[0_0_12px_2px_rgba(245,158,11,0.4)]";
      default:
        return "shadow-[0_0_8px_1px_rgba(255,255,255,0.15)]";
    }
  };

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        "relative rounded-[1.5rem] border border-white/[0.06] bg-black/40 backdrop-blur-sm overflow-hidden min-h-[180px]",
        className
      )}
      style={{
        transformStyle: "preserve-3d",
        rotateX: reducedMotion ? 0 : rotateX,
        rotateY: reducedMotion ? 0 : rotateY,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Grain overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Light sweep animation on scroll */}
      {!reducedMotion && isInView && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ x: "-100%", opacity: 0 }}
          animate={{ x: "200%", opacity: [0, 0.1, 0] }}
          transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
          style={{
            background: "linear-gradient(90deg, transparent, rgba(0,163,211,0.15), transparent)",
            width: "50%",
          }}
        />
      )}

      {/* Content */}
      <div className="relative p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="text-[10px] md:text-xs font-light text-muted-foreground tracking-[0.3em] uppercase">
              Timeline Forecast
            </span>
            <span className="text-[10px] md:text-xs font-light text-primary tracking-[0.2em]">// 30D</span>
          </div>

          {/* Engine Active Badge */}
          <motion.div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={!reducedMotion ? { 
                boxShadow: [
                  "0 0 4px 1px rgba(0,163,211,0.4)",
                  "0 0 8px 2px rgba(0,163,211,0.6)",
                  "0 0 4px 1px rgba(0,163,211,0.4)"
                ]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-[9px] md:text-[10px] font-medium text-primary tracking-wider uppercase">
              Squad Engine Active
            </span>
          </motion.div>
        </div>

        {/* Timeline Line */}
        <div className="relative h-24 md:h-28">
          {/* Main horizontal line */}
          <motion.div
            className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-white/10 -translate-y-1/2"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={isInView ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            style={{ transformOrigin: "left" }}
          />

          {/* Today marker */}
          <motion.div
            className="absolute top-0 bottom-0 left-0 flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.5 }}
          >
            {/* Vertical line */}
            <div className="w-[1px] h-full bg-primary/50" />
            
            {/* Today dot */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary"
              animate={!reducedMotion ? {
                boxShadow: [
                  "0 0 8px 2px rgba(0,163,211,0.5)",
                  "0 0 16px 4px rgba(0,163,211,0.7)",
                  "0 0 8px 2px rgba(0,163,211,0.5)"
                ]
              } : { boxShadow: "0 0 8px 2px rgba(0,163,211,0.5)" }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* Today label */}
            <span className="absolute -bottom-1 text-[8px] text-primary font-medium tracking-wide">HOJE</span>
          </motion.div>

          {/* Milestone points */}
          {filteredMilestones.map((milestone, index) => {
            const position = getPositionOnLine(milestone.date);
            const isHovered = hoveredPoint === milestone.id;

            return (
              <motion.div
                key={milestone.id}
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `${position}%` }}
                initial={{ opacity: 0, scale: 0 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                transition={{ 
                  delay: 0.6 + index * 0.1,
                  type: "spring",
                  stiffness: 300,
                  damping: 20
                }}
                onMouseEnter={() => setHoveredPoint(milestone.id)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Point */}
                <motion.div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full cursor-pointer transition-all duration-300",
                    getSeverityColor(milestone.severity),
                    isHovered && getSeverityGlow(milestone.severity)
                  )}
                  animate={isHovered && !reducedMotion ? { scale: 1.4 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                />

                {/* Tooltip */}
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2 bottom-full mb-4 pointer-events-none z-10"
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={isHovered ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-black/90 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 min-w-[180px] shadow-xl">
                    <p className="text-[10px] text-primary font-medium mb-1">
                      {format(new Date(milestone.date), "dd MMM", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-foreground font-medium mb-1 line-clamp-1">
                      {milestone.title}
                    </p>
                    {milestone.projectName && !projectId && (
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        {milestone.projectName}
                      </p>
                    )}
                    {milestone.severity !== "normal" && (
                      <div className={cn(
                        "inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[9px] font-medium",
                        milestone.severity === "critical" 
                          ? "bg-destructive/20 text-destructive" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {milestone.severity === "critical" ? "Crítico" : "Risco"}
                      </div>
                    )}
                  </div>
                  {/* Tooltip arrow */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-black/90 border-r border-b border-white/10 rotate-45 -mt-1" />
                </motion.div>
              </motion.div>
            );
          })}

          {/* Empty state - always show line, elegant message */}
          {filteredMilestones.length === 0 && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                <div className="w-2 h-2 rounded-full bg-emerald-500/60" />
                <p className="text-xs text-muted-foreground font-light">Nenhum evento crítico nos próximos 30 dias</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Subtle gradient border glow */}
      <div className="absolute inset-0 rounded-[1.5rem] pointer-events-none">
        <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-500" />
      </div>
    </motion.div>
  );
}
