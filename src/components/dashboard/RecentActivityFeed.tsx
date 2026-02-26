import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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

// ── types ──────────────────────────────────────────────────────────────────
type ModuleKey = "lead" | "project" | "task" | "contract";

interface RecentItem {
  id: string;
  module: ModuleKey;
  label: string;
  sub: string;
  status: string;
  statusColor: string;
  href: string;
  createdAt: string;
}

// ── status helpers ─────────────────────────────────────────────────────────
const leadStageLabel: Record<string, string> = {
  lead: "Lead",
  qualificacao: "Qualificação",
  diagnostico: "Diagnóstico",
  proposta: "Proposta",
  negociacao: "Negociação",
  fechado: "Fechado",
  onboarding: "Onboarding",
  pos_venda: "Pós-venda",
  lost: "Perdido",
};

const taskStatusLabel: Record<string, { label: string; color: string }> = {
  backlog: { label: "Backlog", color: "text-muted-foreground" },
  todo: { label: "A Fazer", color: "text-amber-500" },
  in_progress: { label: "Em Andamento", color: "text-blue-500" },
  in_review: { label: "Em Revisão", color: "text-violet-500" },
  done: { label: "Concluída", color: "text-emerald-500" },
};

const contractStatusLabel: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "text-muted-foreground" },
  active: { label: "Ativo", color: "text-emerald-500" },
  signed: { label: "Assinado", color: "text-blue-500" },
  expired: { label: "Expirado", color: "text-red-500" },
  cancelled: { label: "Cancelado", color: "text-red-500" },
};

const projectStatusLabel: Record<string, { label: string; color: string }> = {
  active: { label: "Ativo", color: "text-emerald-500" },
  paused: { label: "Pausado", color: "text-amber-500" },
  completed: { label: "Concluído", color: "text-blue-500" },
  archived: { label: "Arquivado", color: "text-muted-foreground" },
};

// ── module meta ────────────────────────────────────────────────────────────
const MODULE_META: Record<ModuleKey, { label: string; icon: React.ElementType; color: string; href: string }> = {
  lead: { label: "Lead", icon: UserPlus, color: "text-primary", href: "/crm" },
  project: { label: "Projeto", icon: FolderOpen, color: "text-violet-500", href: "/projetos" },
  task: { label: "Tarefa", icon: CheckSquare, color: "text-amber-500", href: "/tarefas" },
  contract: { label: "Contrato", icon: FileSignature, color: "text-blue-500", href: "/contratos" },
};

// ── data fetcher ───────────────────────────────────────────────────────────
async function fetchRecentItems(): Promise<RecentItem[]> {
  const LIMIT = 5;

  const [leadsRes, projectsRes, tasksRes, contractsRes] = await Promise.all([
    supabase
      .from("crm_deals")
      .select("id, title, stage_key, created_at")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("projects")
      .select("id, name, client_name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("tasks")
      .select("id, title, status, category, created_at")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("contracts")
      .select("id, project_name, client_name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
  ]);

  const items: RecentItem[] = [];

  // leads
  for (const d of leadsRes.data || []) {
    const stage = leadStageLabel[d.stage_key] || d.stage_key;
    items.push({
      id: d.id,
      module: "lead",
      label: d.title,
      sub: stage,
      status: stage,
      statusColor: d.stage_key === "fechado" ? "text-emerald-500" : d.stage_key === "lost" ? "text-red-500" : "text-primary",
      href: `/crm`,
      createdAt: d.created_at,
    });
  }

  // projects
  for (const p of projectsRes.data || []) {
    const s = projectStatusLabel[p.status] || { label: p.status, color: "text-muted-foreground" };
    items.push({
      id: p.id,
      module: "project",
      label: p.name,
      sub: p.client_name || "—",
      status: s.label,
      statusColor: s.color,
      href: `/projetos/${p.id}`,
      createdAt: p.created_at,
    });
  }

  // tasks
  for (const t of tasksRes.data || []) {
    const s = taskStatusLabel[t.status] || { label: t.status, color: "text-muted-foreground" };
    items.push({
      id: t.id,
      module: "task",
      label: t.title,
      sub: t.category || "—",
      status: s.label,
      statusColor: s.color,
      href: `/tarefas`,
      createdAt: t.created_at,
    });
  }

  // contracts
  for (const c of contractsRes.data || []) {
    const s = contractStatusLabel[c.status] || { label: c.status, color: "text-muted-foreground" };
    items.push({
      id: c.id,
      module: "contract",
      label: c.project_name || "Contrato",
      sub: c.client_name || "—",
      status: s.label,
      statusColor: s.color,
      href: `/contratos/${c.id}`,
      createdAt: c.created_at,
    });
  }

  // Sort by created_at desc and take top 12
  return items
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 12);
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

  return (
    <motion.div
      className="glass-card rounded-[2rem] p-6"
      initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: 0.2, type: "spring", stiffness: 70, damping: 18 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-normal text-foreground">Recentes</h2>
          <p className="text-mono text-muted-foreground uppercase tracking-wider font-light">
            Últimos itens criados em todos os módulos
          </p>
        </div>
        <Clock className="w-4 h-4 text-muted-foreground/50" />
      </div>

      {/* Module filter chips */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        <button
          onClick={() => setActiveFilter("all")}
          className={cn(
            "text-mono uppercase tracking-wider px-3 py-1 rounded-full border transition-colors",
            activeFilter === "all"
              ? "border-primary/50 bg-primary/10 text-primary"
              : "border-white/10 text-muted-foreground hover:border-white/20"
          )}
        >
          Todos
        </button>
        {modules.map((m) => {
          const meta = MODULE_META[m];
          const Icon = meta.icon;
          return (
            <button
              key={m}
              onClick={() => setActiveFilter(m)}
              className={cn(
                "flex items-center gap-1.5 text-mono uppercase tracking-wider px-3 py-1 rounded-full border transition-colors",
                activeFilter === m
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-white/10 text-muted-foreground hover:border-white/20"
              )}
            >
              <Icon className={cn("w-3 h-3", activeFilter === m ? "text-primary" : meta.color)} />
              {meta.label}s
            </button>
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
        <div className="divide-y divide-white/[0.04]">
          {filtered.map((item, idx) => {
            const meta = MODULE_META[item.module];
            const Icon = meta.icon;
            const timeAgo = formatDistanceToNow(new Date(item.createdAt), {
              addSuffix: true,
              locale: ptBR,
            });

            return (
              <motion.div
                key={`${item.module}-${item.id}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Link
                  to={item.href}
                  className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-white/[0.03] transition-colors group"
                >
                  {/* Module icon */}
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                    <Icon className={cn("w-4 h-4", meta.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-normal text-foreground truncate">{item.label}</p>
                    <p className="text-mono text-muted-foreground truncate">{item.sub}</p>
                  </div>

                  {/* Status + time */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={cn("text-caption uppercase tracking-wide font-normal", item.statusColor)}>
                      {item.status}
                    </span>
                    <span className="text-caption text-muted-foreground/50">{timeAgo}</span>
                  </div>

                  {/* Arrow on hover */}
                  <ArrowRight className="w-3 h-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Footer CTA */}
      {filtered.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/[0.04] flex justify-center">
          <button
            onClick={() => navigate(activeFilter !== "all" ? MODULE_META[activeFilter].href : "/crm")}
            className="text-mono uppercase tracking-wider text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            Ver mais <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

// Need React import for useState

