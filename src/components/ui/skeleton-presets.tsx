import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";
import { motion } from "framer-motion";

const shimmer = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent";

/* ── Card Skeleton ─────────────────────────────── */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("rounded-xl border border-border/20 bg-card/30 p-4 space-y-3", shimmer, className)}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24 bg-muted/40" />
        <Skeleton className="h-3 w-3 rounded-full bg-muted/30" />
      </div>
      <Skeleton className="h-6 w-16 bg-muted/50" />
      <Skeleton className="h-1.5 w-full rounded-full bg-muted/20" />
    </motion.div>
  );
}

/* ── Stat Card Skeleton ────────────────────────── */
export function StatSkeleton({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("rounded-xl border border-border/15 bg-card/30 p-3 space-y-2", shimmer, className)}
    >
      <Skeleton className="h-2.5 w-16 bg-muted/30" />
      <Skeleton className="h-5 w-12 bg-muted/50" />
      <Skeleton className="h-2 w-20 bg-muted/20" />
    </motion.div>
  );
}

/* ── List Item Skeleton ────────────────────────── */
export function ListItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 py-2 px-3", className)}>
      <Skeleton className="w-4 h-4 rounded bg-muted/30 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-2.5 w-3/4 bg-muted/40" />
        <Skeleton className="h-2 w-1/2 bg-muted/20" />
      </div>
      <Skeleton className="h-2.5 w-10 bg-muted/20" />
    </div>
  );
}

/* ── Table Row Skeleton ────────────────────────── */
export function TableRowSkeleton({ cols = 5, className }: { cols?: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 py-2.5 px-3", className)}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-2.5 bg-muted/30",
            i === 0 ? "w-8" : i === 1 ? "flex-1" : "w-16"
          )}
        />
      ))}
    </div>
  );
}

/* ── Plan Block Skeleton ───────────────────────── */
export function PlanBlockSkeleton({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-xl border border-border/20 bg-card/30 p-3 space-y-2", shimmer, className)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3 rounded bg-muted/30" />
          <Skeleton className="h-3 w-28 bg-muted/40" />
        </div>
        <Skeleton className="h-5 w-14 rounded-md bg-muted/20" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-2 w-12 bg-muted/20" />
        <Skeleton className="h-2 w-16 bg-muted/20" />
        <Skeleton className="h-2 w-10 bg-muted/20" />
      </div>
      <Skeleton className="h-0.5 w-full rounded-full bg-muted/15" />
    </motion.div>
  );
}

/* ── Grid of Skeletons ─────────────────────────── */
export function SkeletonGrid({ count = 6, type = 'card', cols = "md:grid-cols-2 lg:grid-cols-3" }: {
  count?: number;
  type?: 'card' | 'stat' | 'plan';
  cols?: string;
}) {
  const Component = type === 'stat' ? StatSkeleton : type === 'plan' ? PlanBlockSkeleton : CardSkeleton;
  return (
    <div className={cn("grid gap-2", cols)}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Component />
        </motion.div>
      ))}
    </div>
  );
}

/* ── List of Skeletons ─────────────────────────── */
export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <ListItemSkeleton />
        </motion.div>
      ))}
    </div>
  );
}
