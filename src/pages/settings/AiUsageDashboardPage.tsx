import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, differenceInCalendarDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Brain, Clock, CheckCircle2, XCircle, Zap, TrendingUp,
  BarChart3, Activity, Loader2, RotateCcw, Search, Filter,
  ArrowUpDown, Copy, Eye, ChevronRight, User, Users
} from "lucide-react";
import { getAiActionLabel } from "@/ai/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { sc } from "@/lib/colors";

interface AiRun {
  id: string;
  action_key: string;
  entity_type: string | null;
  entity_id: string | null;
  input_json: any;
  output_json: any;
  status: string;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
  user_id: string;
}

// Estimate tokens from JSON payload size (rough: ~4 chars per token)
function estimateTokens(json: any): number {
  if (!json) return 0;
  const str = typeof json === "string" ? json : JSON.stringify(json);
  return Math.round(str.length / 4);
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export default function AiUsageDashboardPage() {
  const [runs, setRuns] = useState<AiRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [periodDays, setPeriodDays] = useState(30);
  const [selectedRun, setSelectedRun] = useState<AiRun | null>(null);
  const [viewMode, setViewMode] = useState<"mine" | "all">("mine");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  useEffect(() => {
    fetchRuns();
  }, [periodDays]);

  const fetchRuns = async () => {
    setIsLoading(true);
    const since = subDays(new Date(), periodDays).toISOString();
    const { data, error } = await supabase
      .from("ai_runs")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) {
      toast.error("Erro ao carregar dados de uso IA");
    } else {
      setRuns(data || []);
    }
    setIsLoading(false);
  };

  // Filter by user when in "mine" mode
  const scopedRuns = useMemo(() => {
    if (viewMode === "all" || !currentUserId) return runs;
    return runs.filter(r => r.user_id === currentUserId);
  }, [runs, viewMode, currentUserId]);

  // ─── Computed Stats ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = scopedRuns.length;
    const success = scopedRuns.filter(r => r.status === "success").length;
    const errors = scopedRuns.filter(r => r.status === "error").length;
    const durations = scopedRuns.filter(r => r.duration_ms).map(r => r.duration_ms!);
    const avgDuration = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;
    const totalInputTokens = scopedRuns.reduce((s, r) => s + estimateTokens(r.input_json), 0);
    const totalOutputTokens = scopedRuns.reduce((s, r) => s + estimateTokens(r.output_json), 0);
    const totalTokens = totalInputTokens + totalOutputTokens;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 0;

    return { total, success, errors, avgDuration, totalTokens, totalInputTokens, totalOutputTokens, successRate };
  }, [scopedRuns]);

  // ─── Daily Chart Data ────────────────────────────────────────────────
  const dailyData = useMemo(() => {
    const days = Math.min(periodDays, 30);
    const buckets: { date: string; count: number; tokens: number; errors: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = startOfDay(subDays(new Date(), i));
      buckets.push({ date: format(d, "dd/MM"), count: 0, tokens: 0, errors: 0 });
    }
    scopedRuns.forEach(r => {
      const dayIdx = days - 1 - differenceInCalendarDays(new Date(), parseISO(r.created_at));
      if (dayIdx >= 0 && dayIdx < buckets.length) {
        buckets[dayIdx].count++;
        buckets[dayIdx].tokens += estimateTokens(r.input_json) + estimateTokens(r.output_json);
        if (r.status === "error") buckets[dayIdx].errors++;
      }
    });
    return buckets;
  }, [scopedRuns, periodDays]);

  const maxCount = Math.max(...dailyData.map(d => d.count), 1);
  const maxTokens = Math.max(...dailyData.map(d => d.tokens), 1);

  // ─── Actions Breakdown ───────────────────────────────────────────────
  const actionBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; tokens: number; errors: number; avgMs: number }>();
    scopedRuns.forEach(r => {
      const existing = map.get(r.action_key) || { count: 0, tokens: 0, errors: 0, avgMs: 0 };
      existing.count++;
      existing.tokens += estimateTokens(r.input_json) + estimateTokens(r.output_json);
      if (r.status === "error") existing.errors++;
      if (r.duration_ms) existing.avgMs += r.duration_ms;
      map.set(r.action_key, existing);
    });
    return [...map.entries()]
      .map(([key, v]) => ({ key, label: getAiActionLabel(key), ...v, avgMs: v.count > 0 ? Math.round(v.avgMs / v.count) : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [scopedRuns]);

  // ─── Filtered Runs ───────────────────────────────────────────────────
  const filteredRuns = useMemo(() => {
    let result = scopedRuns;
    if (filterAction !== "all") result = result.filter(r => r.action_key === filterAction);
    if (filterStatus !== "all") result = result.filter(r => r.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.action_key.toLowerCase().includes(q) ||
        JSON.stringify(r.input_json).toLowerCase().includes(q)
      );
    }
    return result;
  }, [scopedRuns, filterAction, filterStatus, search]);

  const uniqueActions = useMemo(() => [...new Set(scopedRuns.map(r => r.action_key))], [scopedRuns]);

  return (
    <DashboardLayout title="Uso de IA">
      <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold text-foreground">Dashboard de Uso IA</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Consumo, performance e histórico de ações de inteligência artificial</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-border/30 p-0.5">
              <Button
                variant={viewMode === "mine" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("mine")}
                className="gap-1 text-xs h-7 px-2.5"
              >
                <User className="w-3 h-3" /> Meu uso
              </Button>
              <Button
                variant={viewMode === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("all")}
                className="gap-1 text-xs h-7 px-2.5"
              >
                <Users className="w-3 h-3" /> Todos
              </Button>
            </div>
            <Select value={String(periodDays)} onValueChange={v => setPeriodDays(Number(v))}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="14">Últimos 14 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchRuns} className="gap-1.5 text-xs h-8">
              <RotateCcw className="w-3.5 h-3.5" /> Atualizar
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
          </div>
        ) : (
          <>
            {/* KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {[
                { label: "Execuções", value: stats.total, icon: Zap, color: "text-foreground" },
                { label: "Sucesso", value: `${stats.successRate}%`, icon: CheckCircle2, color: sc.status("success").text },
                { label: "Erros", value: stats.errors, icon: XCircle, color: sc.status("error").text },
                { label: "Tempo médio", value: `${(stats.avgDuration / 1000).toFixed(1)}s`, icon: Clock, color: "text-muted-foreground" },
                { label: "Tokens (est.)", value: formatNumber(stats.totalTokens), icon: Activity, color: "text-primary" },
                { label: "Tokens/exec", value: stats.total > 0 ? formatNumber(Math.round(stats.totalTokens / stats.total)) : "–", icon: BarChart3, color: "text-primary/70" },
              ].map(kpi => {
                const Icon = kpi.icon;
                return (
                  <div key={kpi.label} className="p-3 rounded-xl border border-border/20 bg-card">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className={cn("w-3 h-3", kpi.color)} />
                      <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50">{kpi.label}</span>
                    </div>
                    <span className={cn("text-xl font-light font-mono", kpi.color)}>{kpi.value}</span>
                  </div>
                );
              })}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Daily Executions Chart */}
              <div className="p-4 rounded-xl border border-border/20 bg-card space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary/60" />
                  <span className="text-xs font-medium text-foreground">Execuções por dia</span>
                </div>
                <div className="flex items-end gap-[2px] h-28">
                  {dailyData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                      <div
                        className="w-full rounded-t bg-primary/70 transition-all hover:bg-primary min-h-[2px]"
                        style={{ height: `${Math.max((d.count / maxCount) * 100, 2)}%` }}
                      />
                      {d.errors > 0 && (
                        <div
                          className="w-full rounded-t bg-destructive/60 min-h-[1px]"
                          style={{ height: `${Math.max((d.errors / maxCount) * 100, 1)}%` }}
                        />
                      )}
                      {/* Tooltip */}
                      <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 bg-popover border border-border rounded-lg px-2 py-1 shadow-md whitespace-nowrap">
                        <p className="text-[9px] font-mono text-foreground">{d.date} — {d.count} exec</p>
                        {d.errors > 0 && <p className="text-[9px] text-destructive">{d.errors} erros</p>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[8px] text-muted-foreground/40 font-mono">
                  <span>{dailyData[0]?.date}</span>
                  <span>{dailyData[dailyData.length - 1]?.date}</span>
                </div>
              </div>

              {/* Daily Tokens Chart */}
              <div className="p-4 rounded-xl border border-border/20 bg-card space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary/60" />
                  <span className="text-xs font-medium text-foreground">Tokens estimados por dia</span>
                </div>
                <div className="flex items-end gap-[2px] h-28">
                  {dailyData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                      <div
                        className="w-full rounded-t bg-primary/40 transition-all hover:bg-primary/70 min-h-[2px]"
                        style={{ height: `${Math.max((d.tokens / maxTokens) * 100, 2)}%` }}
                      />
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 bg-popover border border-border rounded-lg px-2 py-1 shadow-md whitespace-nowrap">
                        <p className="text-[9px] font-mono text-foreground">{d.date} — {formatNumber(d.tokens)} tokens</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[8px] text-muted-foreground/40 font-mono">
                  <span>{dailyData[0]?.date}</span>
                  <span>{dailyData[dailyData.length - 1]?.date}</span>
                </div>
              </div>
            </div>

            {/* Actions Breakdown */}
            <div className="p-4 rounded-xl border border-border/20 bg-card space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary/60" />
                <span className="text-xs font-medium text-foreground">Breakdown por ação</span>
              </div>
              {actionBreakdown.length === 0 ? (
                <p className="text-xs text-muted-foreground/40 py-4 text-center">Sem dados no período</p>
              ) : (
                <div className="space-y-2">
                  {actionBreakdown.slice(0, 12).map(a => {
                    const pct = stats.total > 0 ? (a.count / stats.total) * 100 : 0;
                    const errorRate = a.count > 0 ? Math.round((a.errors / a.count) * 100) : 0;
                    return (
                      <div key={a.key} className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono text-foreground/80 truncate flex-1" title={a.key}>{a.label}</span>
                          <span className="text-muted-foreground/50 font-mono text-[10px]">{a.count}×</span>
                          <span className="text-muted-foreground/40 font-mono text-[10px]">{formatNumber(a.tokens)} tok</span>
                          <span className="text-muted-foreground/40 font-mono text-[10px]">{(a.avgMs / 1000).toFixed(1)}s</span>
                          {errorRate > 0 && (
                            <Badge variant="outline" className="text-[8px] border-destructive/20 text-destructive">
                              {errorRate}% erro
                            </Badge>
                          )}
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary/50 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por ação ou input..."
                  className="pl-8 h-8 text-xs"
                />
              </div>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="w-48 h-8 text-xs">
                  <Filter className="w-3 h-3 mr-1.5 text-muted-foreground/40" />
                  <SelectValue placeholder="Ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  {uniqueActions.map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* History Table */}
            <div className="rounded-xl border border-border/20 bg-card overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border/10 flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-primary/60" />
                <span className="text-xs font-medium text-foreground">Histórico de execuções</span>
                <span className="text-[9px] text-muted-foreground/40 ml-auto">{filteredRuns.length} registros</span>
              </div>
              <ScrollArea className="max-h-[420px]">
                {filteredRuns.length === 0 ? (
                  <div className="text-center py-12">
                    <Brain className="w-5 h-5 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground/40">Nenhuma execução encontrada</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/10">
                    {filteredRuns.slice(0, 100).map((run, i) => {
                      const statusStyle = sc.status(run.status);
                      const tokens = estimateTokens(run.input_json) + estimateTokens(run.output_json);
                      return (
                        <motion.div
                          key={run.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: Math.min(i * 0.01, 0.2) }}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 cursor-pointer transition-colors group"
                          onClick={() => setSelectedRun(run)}
                        >
                          <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusStyle.bg.replace("/15", ""))} />
                          <span className="text-xs font-mono text-foreground/80 truncate w-48">{run.action_key}</span>
                          <Badge variant="outline" className={cn("text-[8px] shrink-0", statusStyle.text, statusStyle.border)}>
                            {run.status === "success" ? "OK" : run.status === "error" ? "Erro" : "..."}
                          </Badge>
                          <span className="text-[9px] text-muted-foreground/40 font-mono">{formatNumber(tokens)} tok</span>
                          {run.duration_ms && (
                            <span className="text-[9px] text-muted-foreground/30 font-mono flex items-center gap-0.5">
                              <Clock className="w-2 h-2" /> {(run.duration_ms / 1000).toFixed(1)}s
                            </span>
                          )}
                          <span className="text-[9px] text-muted-foreground/40 font-mono ml-auto">
                            {format(parseISO(run.created_at), "dd MMM · HH:mm", { locale: ptBR })}
                          </span>
                          <ChevronRight className="w-3 h-3 text-muted-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedRun} onOpenChange={open => !open && setSelectedRun(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm">
                <Brain className="w-4 h-4 text-primary" />
                {selectedRun?.action_key}
                {selectedRun && (
                  <Badge variant="outline" className={cn("text-[8px] ml-2", sc.status(selectedRun.status).text)}>
                    {selectedRun.status}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            {selectedRun && (
              <ScrollArea className="flex-1 overflow-y-auto">
                <div className="space-y-4 pr-2">
                  {/* Meta */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { label: "Data", value: format(parseISO(selectedRun.created_at), "dd/MM/yyyy HH:mm:ss") },
                      { label: "Duração", value: selectedRun.duration_ms ? `${(selectedRun.duration_ms / 1000).toFixed(2)}s` : "–" },
                      { label: "Tokens (est.)", value: formatNumber(estimateTokens(selectedRun.input_json) + estimateTokens(selectedRun.output_json)) },
                      { label: "Entidade", value: selectedRun.entity_type ? `${selectedRun.entity_type}` : "–" },
                    ].map(m => (
                      <div key={m.label} className="p-2 rounded-lg bg-muted/30">
                        <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50 block">{m.label}</span>
                        <span className="text-xs font-mono text-foreground">{m.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Error */}
                  {selectedRun.error_message && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <span className="text-[9px] uppercase tracking-[0.12em] text-destructive/60 block mb-1">Erro</span>
                      <p className="text-xs text-destructive font-mono whitespace-pre-wrap">{selectedRun.error_message}</p>
                    </div>
                  )}

                  {/* Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50">Input</span>
                      <Button
                        variant="ghost" size="sm" className="h-5 px-1.5 text-[9px]"
                        onClick={() => { navigator.clipboard.writeText(JSON.stringify(selectedRun.input_json, null, 2)); toast.success("Input copiado!"); }}
                      >
                        <Copy className="w-2.5 h-2.5 mr-1" /> Copiar
                      </Button>
                    </div>
                    <pre className="text-[10px] font-mono text-foreground/60 bg-muted/30 rounded-lg p-3 overflow-x-auto max-h-40 whitespace-pre-wrap">
                      {JSON.stringify(selectedRun.input_json, null, 2)}
                    </pre>
                  </div>

                  {/* Output */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50">Output</span>
                      {selectedRun.output_json && (
                        <Button
                          variant="ghost" size="sm" className="h-5 px-1.5 text-[9px]"
                          onClick={() => { navigator.clipboard.writeText(JSON.stringify(selectedRun.output_json, null, 2)); toast.success("Output copiado!"); }}
                        >
                          <Copy className="w-2.5 h-2.5 mr-1" /> Copiar
                        </Button>
                      )}
                    </div>
                    <pre className="text-[10px] font-mono text-foreground/60 bg-muted/30 rounded-lg p-3 overflow-x-auto max-h-60 whitespace-pre-wrap">
                      {selectedRun.output_json ? JSON.stringify(selectedRun.output_json, null, 2) : "Sem output"}
                    </pre>
                  </div>
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
