import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ExecutiveActionBlock } from "@/components/dashboard/ExecutiveActionBlock";
import { ProjectWithStages } from "@/hooks/useProjects";
import { motion, AnimatePresence } from "framer-motion";

interface RiskItem {
  type: string;
  severity: "red" | "yellow" | "green";
  title: string;
  description: string;
}

interface ProjectInsights {
  executive_summary: string;
  risk_assessment: {
    delay_probability: number;
    delay_severity: string;
    financial_risk: string;
    client_health: string;
    risks: RiskItem[];
  };
  completion_forecast: {
    predicted_date: string;
    confidence: string;
    days_delta: number;
  };
  action_items: Array<{
    priority: number;
    title: string;
    reason: string;
    impact_area: string;
  }>;
  bottlenecks: Array<{
    stage: string;
    issue: string;
    avg_days_stuck?: number;
  }>;
}

interface Props {
  project: ProjectWithStages;
  tasks: any[] | undefined;
  revenues: any[] | undefined;
}

const CACHE_KEY = (id: string) => `project-insights-${id}`;
const CACHE_TTL = 30 * 60 * 1000; // 30 min

function getCached(projectId: string): ProjectInsights | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY(projectId));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function setCache(projectId: string, data: ProjectInsights) {
  localStorage.setItem(CACHE_KEY(projectId), JSON.stringify({ data, ts: Date.now() }));
}

const severityStyles: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  red: { bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive", dot: "🔴" },
  yellow: { bg: "bg-muted", border: "border-border", text: "text-muted-foreground", dot: "🟡" },
  green: { bg: "bg-primary/10", border: "border-primary/30", text: "text-primary", dot: "🟢" },
};

export function ProjectAIAnalysis({ project, tasks, revenues }: Props) {
  const [insights, setInsights] = useState<ProjectInsights | null>(() => getCached(project.id));
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-project-insights", {
        body: {
          project: {
            id: project.id,
            name: project.name,
            status: project.status,
            due_date: project.due_date,
            contract_value: project.contract_value,
            health_score: project.health_score,
            stage_current: project.stage_current,
            client_name: project.client_name,
            has_payment_block: (project as any).has_payment_block,
          },
          tasks: (tasks || []).map((t: any) => ({
            status: t.status,
            priority: t.priority,
            created_at: t.created_at,
            completed_at: t.completed_at,
            time_spent_seconds: t.time_spent_seconds,
          })),
          revenues: revenues || [],
          stages: (project.stages || []).map((s) => ({
            title: s.title,
            status: s.status,
            planned_end: s.planned_end,
          })),
        },
      });

      if (error) throw error;
      setInsights(data);
      setCache(project.id, data);
      toast.success("Análise IA gerada com sucesso");
    } catch (err: any) {
      console.error("AI analysis error:", err);
      toast.error(err.message || "Erro ao gerar análise IA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-primary text-mono uppercase tracking-[0.4em] font-bold text-xs flex items-center gap-2">
          <Brain className="w-4 h-4" /> Análise IA do Projeto
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={generate}
          disabled={loading}
          className="gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {insights ? "Atualizar Análise" : "Gerar Análise IA"}
        </Button>
      </div>

      <AnimatePresence>
        {insights && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Executive Summary */}
            <Card className="glass-card p-4 border-primary/20">
              <p className="text-sm text-foreground leading-relaxed">{insights.executive_summary}</p>
            </Card>

            {/* Risks */}
            {insights.risk_assessment.risks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.risk_assessment.risks.map((risk, i) => {
                  const style = severityStyles[risk.severity] || severityStyles.yellow;
                  return (
                    <Card key={i} className={`p-3 border ${style.border} ${style.bg}`}>
                      <div className="flex items-start gap-2">
                        <span className="text-sm">{style.dot}</span>
                        <div>
                          <h4 className={`text-sm font-medium ${style.text}`}>{risk.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{risk.description}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Action Items */}
            {insights.action_items.length > 0 && (
              <ExecutiveActionBlock actions={insights.action_items} />
            )}

            {/* Bottlenecks */}
            {insights.bottlenecks.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Gargalos Detectados
                </span>
                <div className="flex flex-wrap gap-2">
                  {insights.bottlenecks.map((b, i) => (
                    <div key={i} className="bg-muted/50 border border-border px-3 py-2 text-xs">
                      <strong>{b.stage}</strong>: {b.issue}
                      {b.avg_days_stuck != null && (
                        <span className="text-muted-foreground"> · ~{b.avg_days_stuck}d parado</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
