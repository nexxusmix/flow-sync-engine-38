import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  TrendingDown,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface HealthSnapshot {
  id: string;
  project_id: string;
  score: number;
  status: "healthy" | "attention" | "at_risk" | "critical";
  executive_summary: string | null;
  risks: any[];
  action_items: any[];
  alerts: any[];
  observations: string[];
  created_at: string;
}

interface ProjectRow {
  id: string;
  name: string;
  client_name: string | null;
}

interface Row {
  project: ProjectRow;
  snapshot: HealthSnapshot | null;
}

const STATUS_STYLES = {
  healthy: {
    label: "Saudável",
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/30",
    text: "text-emerald-500",
    border: "border-emerald-500/20",
  },
  attention: {
    label: "Atenção",
    dot: "bg-yellow-500",
    ring: "ring-yellow-500/30",
    text: "text-yellow-500",
    border: "border-yellow-500/20",
  },
  at_risk: {
    label: "Em risco",
    dot: "bg-orange-500",
    ring: "ring-orange-500/30",
    text: "text-orange-500",
    border: "border-orange-500/20",
  },
  critical: {
    label: "Crítico",
    dot: "bg-red-500",
    ring: "ring-red-500/40",
    text: "text-red-500",
    border: "border-red-500/30",
  },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

export function ProjectHealthRadar() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const load = async () => {
    const { data: projects } = await supabase
      .from("projects")
      .select("id,name,client_name")
      .in("status", ["active", "in_progress", "paused"])
      .limit(50);

    if (!projects || projects.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const ids = projects.map((p) => p.id);
    const { data: snaps } = await (supabase as any)
      .from("project_health_snapshots")
      .select("*")
      .in("project_id", ids)
      .order("created_at", { ascending: false });

    const latest: Record<string, HealthSnapshot> = {};
    for (const s of (snaps || []) as HealthSnapshot[]) {
      if (!latest[s.project_id]) latest[s.project_id] = s;
    }

    setRows(
      projects.map((p) => ({
        project: p as any,
        snapshot: latest[p.id] || null,
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "analyze-projects-health",
        { body: {} },
      );
      if (error) throw error;
      toast.success(
        `${data.analyzed} projetos analisados${data.failed ? ` · ${data.failed} falharam` : ""}`,
      );
      await load();
    } catch (e: any) {
      toast.error(e.message || "Falha ao analisar");
    } finally {
      setAnalyzing(false);
    }
  };

  const counts = rows.reduce(
    (acc, r) => {
      const s = r.snapshot?.status || "unanalyzed";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const critical = rows
    .filter(
      (r) => r.snapshot?.status === "critical" || r.snapshot?.status === "at_risk",
    )
    .sort((a, b) => (a.snapshot?.score ?? 100) - (b.snapshot?.score ?? 100))
    .slice(0, 6);

  const latestTs = rows
    .map((r) => r.snapshot?.created_at)
    .filter(Boolean)
    .sort()
    .pop();

  if (loading) {
    return (
      <Card className="glass-card p-6 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  return (
    <Card className="glass-card p-4 md:p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="text-sm uppercase tracking-[0.3em] font-medium text-foreground">
              Radar de Saúde · IA
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            {latestTs
              ? `Última análise ${timeAgo(latestTs)} · ${rows.length} projetos ativos`
              : `${rows.length} projetos · nenhuma análise ainda`}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={runAnalysis}
          disabled={analyzing || rows.length === 0}
          className="gap-2"
        >
          {analyzing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {analyzing ? "Analisando…" : "Analisar agora"}
        </Button>
      </div>

      {/* Aggregate counts */}
      <div className="grid grid-cols-4 gap-2">
        {(["healthy", "attention", "at_risk", "critical"] as const).map((k) => {
          const s = STATUS_STYLES[k];
          return (
            <div
              key={k}
              className={`rounded-lg border ${s.border} px-3 py-2 flex items-center gap-2`}
            >
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              <div>
                <div className={`text-lg font-light ${s.text}`}>
                  {counts[k] || 0}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Critical/at-risk list */}
      <AnimatePresence>
        {critical.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Precisa atenção imediata
            </div>
            {critical.map(({ project, snapshot }) => {
              const s = STATUS_STYLES[snapshot!.status];
              const topRisk = snapshot?.risks?.[0];
              const topAction = snapshot?.action_items?.[0];
              return (
                <Link
                  key={project.id}
                  to={`/projetos/${project.id}`}
                  className={`block rounded-lg border ${s.border} bg-background/40 hover:bg-background/60 transition-colors p-3`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ring-1 ${s.ring} ${s.text} text-xs font-mono shrink-0`}
                    >
                      {snapshot?.score ?? "—"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate">
                          <div className="text-sm font-medium text-foreground truncate">
                            {project.name}
                          </div>
                          {project.client_name && (
                            <div className="text-[11px] text-muted-foreground truncate">
                              {project.client_name}
                            </div>
                          )}
                        </div>
                        <span
                          className={`text-[10px] uppercase tracking-wider ${s.text} shrink-0`}
                        >
                          {s.label}
                        </span>
                      </div>
                      {topRisk && (
                        <div className="mt-2 text-xs text-muted-foreground flex items-start gap-1">
                          <TrendingDown className="w-3 h-3 mt-0.5 shrink-0" />
                          <span className="truncate">
                            <strong className="text-foreground/80">
                              {topRisk.title}:
                            </strong>{" "}
                            {topRisk.description}
                          </span>
                        </div>
                      )}
                      {topAction && (
                        <div className="mt-1 text-xs text-primary/90 flex items-start gap-1">
                          <Zap className="w-3 h-3 mt-0.5 shrink-0" />
                          <span className="truncate">
                            Próxima ação: {topAction.title}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {rows.length > 0 && critical.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-emerald-500/90 py-2">
          <CheckCircle2 className="w-4 h-4" /> Nenhum projeto em risco crítico.
        </div>
      )}

      {rows.length === 0 && (
        <div className="text-center py-6 text-xs text-muted-foreground">
          Nenhum projeto ativo para analisar.
        </div>
      )}
    </Card>
  );
}
