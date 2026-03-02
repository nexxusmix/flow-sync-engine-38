/**
 * Semantic Color System — SQUAD / Sonance
 *
 * Centraliza TODO o mapeamento de cores da plataforma.
 * Regra: Azul (primary) + Branco + Cinza. Vermelho apenas para erro/destrutivo.
 *
 * USO:
 *   import { sc } from "@/lib/colors";
 *   <div className={sc.status("paid")} />
 *   <span className={sc.priority("high")} />
 *   <div className={sc.score(85)} />
 */

// ─── Status ───────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { text: string; bg: string; border: string }> = {
  // positivos
  active:    { text: "text-primary",            bg: "bg-primary/15",       border: "border-primary/30" },
  completed: { text: "text-primary",            bg: "bg-primary/15",       border: "border-primary/30" },
  done:      { text: "text-primary",            bg: "bg-primary/15",       border: "border-primary/30" },
  paid:      { text: "text-primary",            bg: "bg-primary/15",       border: "border-primary/30" },
  approved:  { text: "text-primary",            bg: "bg-primary/15",       border: "border-primary/30" },
  published: { text: "text-primary",            bg: "bg-primary/15",       border: "border-primary/30" },
  verified:  { text: "text-primary",            bg: "bg-primary/15",       border: "border-primary/30" },
  success:   { text: "text-primary",            bg: "bg-primary/15",       border: "border-primary/30" },

  // neutros / pendentes
  pending:    { text: "text-muted-foreground",  bg: "bg-muted",            border: "border-border" },
  draft:      { text: "text-muted-foreground",  bg: "bg-muted",            border: "border-border" },
  paused:     { text: "text-muted-foreground",  bg: "bg-muted",            border: "border-border" },
  queued:     { text: "text-muted-foreground",  bg: "bg-muted",            border: "border-border" },
  processing: { text: "text-muted-foreground",  bg: "bg-muted",            border: "border-border" },
  review:     { text: "text-muted-foreground",  bg: "bg-muted",            border: "border-border" },
  warning:    { text: "text-muted-foreground",  bg: "bg-muted",            border: "border-border" },
  in_progress:{ text: "text-primary/70",        bg: "bg-primary/10",       border: "border-primary/20" },

  // negativos / erro
  rejected:  { text: "text-destructive",        bg: "bg-destructive/15",   border: "border-destructive/30" },
  overdue:   { text: "text-destructive",        bg: "bg-destructive/15",   border: "border-destructive/30" },
  error:     { text: "text-destructive",        bg: "bg-destructive/15",   border: "border-destructive/30" },
  cancelled: { text: "text-destructive",        bg: "bg-destructive/15",   border: "border-destructive/30" },
  failed:    { text: "text-destructive",        bg: "bg-destructive/15",   border: "border-destructive/30" },
  danger:    { text: "text-destructive",        bg: "bg-destructive/15",   border: "border-destructive/30" },
};

const FALLBACK_STATUS = { text: "text-muted-foreground", bg: "bg-muted", border: "border-border" };

// ─── Prioridade ───────────────────────────────────────────────────────
const PRIORITY_MAP: Record<string, { text: string; bg: string; dot: string }> = {
  urgent:  { text: "text-destructive",        bg: "bg-destructive/15",  dot: "bg-destructive" },
  high:    { text: "text-destructive",        bg: "bg-destructive/15",  dot: "bg-destructive" },
  medium:  { text: "text-muted-foreground",   bg: "bg-muted",           dot: "bg-muted-foreground" },
  normal:  { text: "text-muted-foreground",   bg: "bg-muted",           dot: "bg-muted-foreground" },
  low:     { text: "text-muted-foreground/60",bg: "bg-muted/50",        dot: "bg-muted-foreground/50" },
};

const FALLBACK_PRIORITY = { text: "text-muted-foreground", bg: "bg-muted", dot: "bg-muted-foreground" };

// ─── Score / Health (0-100) ───────────────────────────────────────────
function scoreColors(value: number) {
  if (value >= 75) return { text: "text-primary",          bg: "bg-primary/15",        border: "border-primary/30" };
  if (value >= 50) return { text: "text-muted-foreground", bg: "bg-muted",             border: "border-border" };
  if (value >= 25) return { text: "text-muted-foreground", bg: "bg-muted",             border: "border-border" };
  return              { text: "text-destructive",      bg: "bg-destructive/15",    border: "border-destructive/30" };
}

// ─── Risk (0-100, inverso de score) ───────────────────────────────────
function riskColors(value: number) {
  if (value <= 25) return { text: "text-primary",          bg: "bg-primary/15",        border: "border-primary/30" };
  if (value <= 50) return { text: "text-muted-foreground", bg: "bg-muted",             border: "border-border" };
  if (value <= 75) return { text: "text-muted-foreground", bg: "bg-muted",             border: "border-border" };
  return              { text: "text-destructive",      bg: "bg-destructive/15",    border: "border-destructive/30" };
}

// ─── Trend ────────────────────────────────────────────────────────────
function trendColors(direction: "up" | "down" | "flat") {
  if (direction === "up")   return { text: "text-primary",          icon: "text-primary" };
  if (direction === "down") return { text: "text-destructive",      icon: "text-destructive" };
  return                       { text: "text-muted-foreground", icon: "text-muted-foreground" };
}

// ─── Energy ───────────────────────────────────────────────────────────
const ENERGY_MAP: Record<string, { text: string; bg: string }> = {
  baixa: { text: "text-primary/60",       bg: "bg-primary/10" },
  media: { text: "text-primary",          bg: "bg-primary/15" },
  alta:  { text: "text-destructive",      bg: "bg-destructive/15" },
};

// ─── Financial ────────────────────────────────────────────────────────
const FINANCIAL = {
  revenue:  { text: "text-primary",          bg: "bg-primary/10",       dot: "bg-primary" },
  expense:  { text: "text-muted-foreground", bg: "bg-muted",            dot: "bg-muted-foreground" },
  profit:   { text: "text-primary",          bg: "bg-primary/15",       dot: "bg-primary" },
  loss:     { text: "text-destructive",      bg: "bg-destructive/10",   dot: "bg-destructive" },
} as const;

// ─── Funnel levels (by depth) ─────────────────────────────────────────
function funnelLevel(depth: number, total: number) {
  const opacity = Math.max(15, Math.round(80 - (depth / Math.max(total - 1, 1)) * 60));
  return {
    bg: `bg-primary/${opacity}`,
    text: `text-primary${opacity < 50 ? `/${opacity + 20}` : ""}`,
    border: `border-primary/${Math.max(10, opacity - 10)}`,
  };
}

// ─── Public API ───────────────────────────────────────────────────────
export const sc = {
  /** Status badge/text colors */
  status: (key: string) => STATUS_MAP[key.toLowerCase()] ?? FALLBACK_STATUS,

  /** Priority colors */
  priority: (key: string) => PRIORITY_MAP[key.toLowerCase()] ?? FALLBACK_PRIORITY,

  /** Score/health 0-100 (higher = better) */
  score: scoreColors,

  /** Risk 0-100 (higher = worse) */
  risk: riskColors,

  /** Trend direction */
  trend: trendColors,

  /** Energy level */
  energy: (key: string) => ENERGY_MAP[key.toLowerCase()] ?? ENERGY_MAP.media,

  /** Financial type */
  financial: (key: keyof typeof FINANCIAL) => FINANCIAL[key],

  /** Funnel level by depth index */
  funnel: funnelLevel,

  /** Raw maps for iteration */
  maps: { STATUS_MAP, PRIORITY_MAP, ENERGY_MAP, FINANCIAL },
} as const;

export type StatusKey = keyof typeof STATUS_MAP;
export type PriorityKey = keyof typeof PRIORITY_MAP;
export type EnergyKey = keyof typeof ENERGY_MAP;
export type FinancialKey = keyof typeof FINANCIAL;
