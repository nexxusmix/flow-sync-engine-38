import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  UserPlus,
  FolderOpen,
  CheckSquare,
  FileSignature,
  ArrowRight,
  Clock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card3D,
  Magnetic,
  TextReveal,
  AnimatedCounter,
  Shimmer,
  StaggerContainer,
  StaggerItem,
} from "@/components/client-portal/animations";

// ── types ──────────────────────────────────────────────────────────────────
type ModuleKey = "lead" | "project" | "task" | "contract";

interface RecentItem {
  id: string;
  module: ModuleKey;
  label: string;
  sub: string;
  status: string;
  statusVariant: string;
  href: string;
  createdAt: string;
}

// ── status helpers ─────────────────────────────────────────────────────────
const leadStageLabel: Record<string, string> = {
  lead: "Lead", qualificacao: "Qualificação", diagnostico: "Diagnóstico",
  proposta: "Proposta", negociacao: "Negociação", fechado: "Fechado",
  onboarding: "Onboarding", pos_venda: "Pós-venda", lost: "Perdido",
};

const taskStatusLabel: Record<string, { label: string; variant: string }> = {
  backlog: { label: "Backlog", variant: "slate" },
  todo: { label: "A Fazer", variant: "amber" },
  in_progress: { label: "Em Andamento", variant: "blue" },
  in_review: { label: "Em Revisão", variant: "purple" },
  done: { label: "Concluída", variant: "emerald" },
};

const contractStatusLabel: Record<string, { label: string; variant: string }> = {
  draft: { label: "Rascunho", variant: "slate" },
  active: { label: "Ativo", variant: "emerald" },
  signed: { label: "Assinado", variant: "blue" },
  expired: { label: "Expirado", variant: "red" },
  cancelled: { label: "Cancelado", variant: "red" },
};

const projectStatusLabel: Record<string, { label: string; variant: string }> = {
  active: { label: "Ativo", variant: "emerald" },
  paused: { label: "Pausado", variant: "amber" },
  completed: { label: "Concluído", variant: "blue" },
  archived: { label: "Arquivado", variant: "slate" },
};

// ── status badge styles ───────────────────────────────────────────────────
const badgeStyles: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  slate: "bg-white/[0.04] text-muted-foreground border-white/10",
  cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

// ── module meta ────────────────────────────────────────────────────────────
const MODULE_META: Record<ModuleKey, { label: string; icon: React.ElementType; gradient: string; href: string }> = {
  lead: { label: "Lead", icon: UserPlus, gradient: "from-primary/20 to-primary/5", href: "/crm" },
  project: { label: "Projeto", icon: FolderOpen, gradient: "from-violet-500/20 to-violet-500/5", href: "/projetos" },
  task: { label: "Tarefa", icon: CheckSquare, gradient: "from-amber-500/20 to-amber-500/5", href: "/tarefas" },
  contract: { label: "Contrato", icon: FileSignature, gradient: "from-blue-500/20 to-blue-500/5", href: "/contratos" },
};

// ── data fetcher ───────────────────────────────────────────────────────────
async function fetchRecentItems(): Promise<RecentItem[]> {
  const LIMIT = 5;
  const [leadsRes, projectsRes, tasksRes, contractsRes] = await Promise.all([
    supabase.from("crm_deals").select("id, title, stage_key, created_at").order("created_at", { ascending: false }).limit(LIMIT),
    supabase.from("projects").select("id, name, client_name, status, created_at").order("created_at", { ascending: false }).limit(LIMIT),
    supabase.from("tasks").select("id, title, status, category, created_at").order("created_at", { ascending: false }).limit(LIMIT),
    supabase.from("contracts").select("id, project_name, client_name, status, created_at").order("created_at", { ascending: false }).limit(LIMIT),
  ]);

  const items: RecentItem[] = [];

  for (const d of leadsRes.data || []) {
    const stage = leadStageLabel[d.stage_key] || d.stage_key;
    items.push({ id: d.id, module: "lead", label: d.title, sub: stage, status: stage,
      statusVariant: d.stage_key === "fechado" ? "emerald" : d.stage_key === "lost" ? "red" : "cyan",
      href: `/crm`, createdAt: d.created_at });
  }
  for (const p of projectsRes.data || []) {
    const s = projectStatusLabel[p.status] || { label: p.status, variant: "slate" };
    items.push({ id: p.id, module: "project", label: p.name, sub: p.client_name || "—", status: s.label,
      statusVariant: s.variant, href: `/projetos/${p.id}`, createdAt: p.created_at });
  }
  for (const t of tasksRes.data || []) {
    const s = taskStatusLabel[t.status] || { label: t.status, variant: "slate" };
    items.push({ id: t.id, module: "task", label: t.title, sub: t.category || "—", status: s.label,
      statusVariant: s.variant, href: `/tarefas`, createdAt: t.created_at });
  }
  for (const c of contractsRes.data || []) {
    const s = contractStatusLabel[c.status] || { label: c.status, variant: "slate" };
    items.push({ id: c.id, module: "contract", label: c.project_name || "Contrato", sub: c.client_name || "—",
      status: s.label, statusVariant: s.variant, href: `/contratos/${c.id}`, createdAt: c.created_at });
  }

  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 12);
}

// ── component ──────────────────────────────────────────────────────────────
export function RecentActivityFeed() {
  const navigate = useNavigate();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["recent-activity-feed"],
    queryFn: fetchRecentItems,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const modules: ModuleKey[] = ["lead", "project", "task", "contract"];
  const [activeFilter, setActiveFilter] = useState<ModuleKey | "all">("all");

  const filtered = activeFilter === "all" ? items : items.filter((i) => i.module === activeFilter);

  // Count per module
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const m of modules) c[m] = items.filter((i) => i.module === m).length;
    return c;
  }, [items]);

  return (
    <motion.div
      className="glass-card rounded-[2rem] p-6 relative overflow-hidden"
      initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: 0.2, type: "spring", stiffness: 70, damping: 18 }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-violet-500/[0.02] pointer-events-none rounded-[2rem]" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div>
          <TextReveal text="Recentes" className="text-xl font-normal text-foreground" />
          <p className="text-mono text-muted-foreground uppercase tracking-wider font-light mt-1">
            Últimos itens criados em todos os módulos
          </p>
        </div>
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="text-muted-foreground/30"
        >
          <Clock className="w-4 h-4" />
        </motion.div>
      </div>

      {/* Module filter chips with Magnetic effect */}
      <div className="flex items-center gap-2 flex-wrap mb-6 relative z-10">
        <Magnetic strength={0.15}>
          <button
            onClick={() => setActiveFilter("all")}
            className={cn(
              "text-mono uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all duration-300",
              activeFilter === "all"
                ? "border-primary/40 bg-primary/10 text-primary shadow-[0_0_12px_rgba(var(--primary),0.15)]"
                : "border-white/10 text-muted-foreground hover:border-white/20 hover:bg-white/[0.02]"
            )}
          >
            Todos
            <span className="ml-1.5 text-[10px] opacity-60">
              <AnimatedCounter value={counts.all} duration={0.8} />
            </span>
          </button>
        </Magnetic>

        {modules.map((m) => {
          const meta = MODULE_META[m];
          const Icon = meta.icon;
          const isActive = activeFilter === m;
          return (
            <Magnetic key={m} strength={0.15}>
              <button
                onClick={() => setActiveFilter(m)}
                className={cn(
                  "flex items-center gap-1.5 text-mono uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all duration-300",
                  isActive
                    ? "border-primary/40 bg-primary/10 text-primary shadow-[0_0_12px_rgba(var(--primary),0.15)]"
                    : "border-white/10 text-muted-foreground hover:border-white/20 hover:bg-white/[0.02]"
                )}
              >
                <motion.div animate={isActive ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.3 }}>
                  <Icon className="w-3 h-3" />
                </motion.div>
                {meta.label}s
                <span className="text-[10px] opacity-60">
                  <AnimatedCounter value={counts[m] || 0} duration={0.8} />
                </span>
              </button>
            </Magnetic>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50">
          <Clock className="w-8 h-8 mb-3" />
          <p className="text-sm font-light">Nenhum item recente</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-4 bottom-4 w-px bg-gradient-to-b from-primary/20 via-white/[0.06] to-transparent z-0" />

          <StaggerContainer staggerDelay={0.06} delayChildren={0.1} className="space-y-2 relative z-10">
            <AnimatePresence mode="popLayout">
              {filtered.map((item) => {
                const meta = MODULE_META[item.module];
                const Icon = meta.icon;
                const timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ptBR });

                return (
                  <StaggerItem key={`${item.module}-${item.id}`}>
                    <Card3D intensity={5} glareEnabled>
                      <Link
                        to={item.href}
                        className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300 group"
                      >
                        {/* Module icon with gradient bg */}
                        <Magnetic strength={0.25}>
                          <div className={cn(
                            "w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 transition-shadow duration-300 group-hover:shadow-lg",
                            meta.gradient,
                            "group-hover:shadow-primary/10"
                          )}>
                            <Icon className="w-4 h-4 text-foreground/70 group-hover:text-foreground transition-colors" />
                          </div>
                        </Magnetic>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-normal text-foreground truncate group-hover:text-primary/90 transition-colors">
                            {item.label}
                          </p>
                          <p className="text-mono text-muted-foreground truncate">{item.sub}</p>
                        </div>

                        {/* Status badge chip */}
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className={cn(
                            "text-[9px] uppercase tracking-[0.08em] font-medium px-2 py-0.5 rounded-md border",
                            badgeStyles[item.statusVariant] || badgeStyles.slate
                          )}>
                            {item.status}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
                            <Clock className="w-2.5 h-2.5" />
                            {timeAgo}
                          </span>
                        </div>

                        {/* Arrow with spring */}
                        <motion.div
                          className="flex-shrink-0 text-muted-foreground/20"
                          whileHover={{ x: 3 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        >
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </motion.div>
                      </Link>
                    </Card3D>
                  </StaggerItem>
                );
              })}
            </AnimatePresence>
          </StaggerContainer>
        </div>
      )}

      {/* Footer CTA with Shimmer */}
      {filtered.length > 0 && (
        <div className="mt-5 pt-4 border-t border-white/[0.04] flex justify-center relative z-10">
          <Shimmer>
            <button
              onClick={() => navigate(activeFilter !== "all" ? MODULE_META[activeFilter].href : "/crm")}
              className="text-mono uppercase tracking-wider text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors py-1 px-3"
            >
              Ver mais
              <motion.span
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight className="w-3 h-3" />
              </motion.span>
            </button>
          </Shimmer>
        </div>
      )}
    </motion.div>
  );
}
