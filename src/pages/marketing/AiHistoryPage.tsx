import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { AI_ACTIONS_REGISTRY } from "@/ai/actions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Brain, Clock, CheckCircle2, XCircle, Search, Filter,
  ChevronDown, Copy, RotateCcw, Loader2, Sparkles, Zap,
  ArrowUpDown, Eye
} from "lucide-react";
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
}

const ACTION_LABELS: Record<string, { label: string; icon: typeof Brain; color: string }> = {
  'marketing.generateCopy': { label: 'Gerar Copy', icon: Sparkles, color: 'text-primary' },
  'marketing.generateIdeas': { label: 'Gerar Ideias', icon: Zap, color: 'text-amber-500' },
  'projects.generateBrief': { label: 'Gerar Briefing', icon: Brain, color: 'text-blue-500' },
};

function getActionMeta(key: string) {
  return ACTION_LABELS[key] || { label: key, icon: Brain, color: 'text-muted-foreground' };
}

function OutputPreview({ data, className }: { data: any; className?: string }) {
  if (!data) return <span className="text-muted-foreground/40 text-xs">Sem output</span>;

  const entries = Object.entries(data).filter(([, v]) => v && typeof v !== 'object');
  const arrayEntries = Object.entries(data).filter(([, v]) => Array.isArray(v));

  return (
    <div className={cn("space-y-2", className)}>
      {entries.map(([key, value]) => (
        <div key={key} className="space-y-0.5">
          <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50 font-mono">{key}</span>
          <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap line-clamp-4">
            {String(value)}
          </p>
        </div>
      ))}
      {arrayEntries.map(([key, value]) => (
        <div key={key} className="space-y-1">
          <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50 font-mono">{key} ({(value as any[]).length})</span>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {(value as any[]).slice(0, 5).map((item, i) => (
              <div key={i} className="text-[10px] text-foreground/60 bg-muted/30 rounded px-2 py-1">
                {typeof item === 'string' ? item : JSON.stringify(item).slice(0, 120)}
              </div>
            ))}
            {(value as any[]).length > 5 && (
              <span className="text-[9px] text-muted-foreground/40">+{(value as any[]).length - 5} mais</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AiHistoryPage() {
  const [runs, setRuns] = useState<AiRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [selectedRun, setSelectedRun] = useState<AiRun | null>(null);
  const [compareRuns, setCompareRuns] = useState<AiRun[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("ai_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      toast.error("Erro ao carregar histórico");
    } else {
      setRuns(data || []);
    }
    setIsLoading(false);
  };

  const filteredRuns = useMemo(() => {
    let result = runs;
    if (filterAction !== "all") result = result.filter(r => r.action_key === filterAction);
    if (filterStatus !== "all") result = result.filter(r => r.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.action_key.toLowerCase().includes(q) ||
        JSON.stringify(r.input_json).toLowerCase().includes(q) ||
        JSON.stringify(r.output_json).toLowerCase().includes(q)
      );
    }
    if (sortOrder === "asc") result = [...result].reverse();
    return result;
  }, [runs, filterAction, filterStatus, search, sortOrder]);

  const uniqueActions = useMemo(() => [...new Set(runs.map(r => r.action_key))], [runs]);

  const stats = useMemo(() => ({
    total: runs.length,
    success: runs.filter(r => r.status === "success").length,
    error: runs.filter(r => r.status === "error").length,
    avgDuration: Math.round(runs.filter(r => r.duration_ms).reduce((s, r) => s + (r.duration_ms || 0), 0) / Math.max(runs.filter(r => r.duration_ms).length, 1)),
  }), [runs]);

  const handleCopyOutput = (run: AiRun) => {
    if (!run.output_json) return;
    navigator.clipboard.writeText(JSON.stringify(run.output_json, null, 2));
    toast.success("Output copiado!");
  };

  const toggleCompare = (run: AiRun) => {
    setCompareRuns(prev => {
      const exists = prev.find(r => r.id === run.id);
      if (exists) return prev.filter(r => r.id !== run.id);
      if (prev.length >= 2) return [prev[1], run];
      return [...prev, run];
    });
  };

  return (
    <DashboardLayout title="Histórico IA">
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold text-foreground">Histórico IA</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Todas as gerações, outputs e métricas</p>
          </div>
          <div className="flex items-center gap-2">
            {compareRuns.length > 0 && (
              <Button
                variant={isComparing ? "default" : "outline"}
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setIsComparing(!isComparing)}
              >
                <Eye className="w-3.5 h-3.5" />
                Comparar ({compareRuns.length}/2)
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={fetchRuns} className="gap-1.5 text-xs">
              <RotateCcw className="w-3.5 h-3.5" /> Atualizar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Total", value: stats.total, icon: Brain, color: "text-foreground" },
            { label: "Sucesso", value: stats.success, icon: CheckCircle2, color: "text-primary" },
            { label: "Erros", value: stats.error, icon: XCircle, color: "text-destructive" },
            { label: "Média", value: `${(stats.avgDuration / 1000).toFixed(1)}s`, icon: Clock, color: "text-muted-foreground" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="p-3 rounded-xl border border-border/20 bg-card">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={cn("w-3 h-3", s.color)} />
                  <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50">{s.label}</span>
                </div>
                <span className={cn("text-xl font-light font-mono", s.color)}>{s.value}</span>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por input, output ou ação..."
              className="pl-8 h-8 text-xs"
            />
          </div>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <Filter className="w-3 h-3 mr-1.5 text-muted-foreground/40" />
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              {uniqueActions.map(a => (
                <SelectItem key={a} value={a}>{getActionMeta(a).label}</SelectItem>
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
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => setSortOrder(o => o === "desc" ? "asc" : "desc")}
          >
            <ArrowUpDown className="w-3 h-3" />
            {sortOrder === "desc" ? "Recentes" : "Antigos"}
          </Button>
        </div>

        {/* Compare Mode */}
        <AnimatePresence>
          {isComparing && compareRuns.length === 2 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-primary/15 bg-primary/3">
                <div className="flex items-center gap-2 col-span-2 mb-2">
                  <Eye className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-foreground">Comparação de Outputs</span>
                  <Button variant="ghost" size="sm" className="ml-auto h-6 text-[10px]" onClick={() => { setIsComparing(false); setCompareRuns([]); }}>
                    Fechar
                  </Button>
                </div>
                {compareRuns.map(run => {
                  const meta = getActionMeta(run.action_key);
                  return (
                    <div key={run.id} className="space-y-2 p-3 rounded-lg border border-border/20 bg-card">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[9px]">{meta.label}</Badge>
                        <span className="text-[9px] text-muted-foreground/40 font-mono">
                          {format(new Date(run.created_at), "dd/MM HH:mm")}
                        </span>
                        {run.duration_ms && (
                          <span className="text-[9px] text-muted-foreground/30 font-mono ml-auto">{(run.duration_ms / 1000).toFixed(1)}s</span>
                        )}
                      </div>
                      <OutputPreview data={run.output_json} />
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Runs List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="text-center py-16">
            <Brain className="w-6 h-6 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma geração encontrada</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredRuns.map((run, i) => {
              const meta = getActionMeta(run.action_key);
              const Icon = meta.icon;
              const isSelected = compareRuns.some(r => r.id === run.id);
              const inputTitle = run.input_json?.title || run.input_json?.id || "";

              return (
                <motion.div
                  key={run.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className={cn(
                    "group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer",
                    isSelected
                      ? "border-primary/25 bg-primary/5"
                      : "border-border/15 hover:border-border/30 bg-card"
                  )}
                  onClick={() => setSelectedRun(run)}
                >
                  {/* Compare checkbox */}
                  <button
                    onClick={e => { e.stopPropagation(); toggleCompare(run); }}
                    className={cn(
                      "w-4 h-4 rounded border-2 shrink-0 transition-all flex items-center justify-center",
                      isSelected ? "bg-primary border-primary" : "border-border/30 hover:border-primary/40"
                    )}
                  >
                    {isSelected && <CheckCircle2 className="w-2.5 h-2.5 text-primary-foreground" />}
                  </button>

                  {/* Icon */}
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-muted/30")}>
                    <Icon className={cn("w-3.5 h-3.5", meta.color)} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{meta.label}</span>
                      {inputTitle && (
                        <span className="text-[10px] text-muted-foreground/40 truncate max-w-[200px]">
                          — {inputTitle}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-muted-foreground/40 font-mono">
                        {format(new Date(run.created_at), "dd MMM yyyy · HH:mm", { locale: ptBR })}
                      </span>
                      {run.duration_ms && (
                        <span className="text-[9px] text-muted-foreground/30 font-mono flex items-center gap-0.5">
                          <Clock className="w-2 h-2" /> {(run.duration_ms / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <Badge
                    variant="outline"
                    className={cn("text-[8px] shrink-0", {
                      "border-primary/20 text-primary": run.status === "success",
                      "border-destructive/20 text-destructive": run.status === "error",
                      "border-amber-500/20 text-amber-500": run.status === "pending",
                    })}
                  >
                    {run.status === "success" ? "Sucesso" : run.status === "error" ? "Erro" : "Pendente"}
                  </Badge>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={e => { e.stopPropagation(); handleCopyOutput(run); }}
                      title="Copiar output"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedRun} onOpenChange={open => !open && setSelectedRun(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm">
                {selectedRun && (() => {
                  const meta = getActionMeta(selectedRun.action_key);
                  const Icon = meta.icon;
                  return (
                    <>
                      <Icon className={cn("w-4 h-4", meta.color)} />
                      {meta.label}
                      <Badge variant="outline" className={cn("text-[8px] ml-2", {
                        "text-primary": selectedRun.status === "success",
                        "text-destructive": selectedRun.status === "error",
                      })}>
                        {selectedRun.status}
                      </Badge>
                    </>
                  );
                })()}
              </DialogTitle>
            </DialogHeader>

            {selectedRun && (
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4 pb-4">
                  {/* Meta */}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
                    <span className="font-mono">{format(new Date(selectedRun.created_at), "dd/MM/yyyy HH:mm:ss")}</span>
                    {selectedRun.duration_ms && <span className="font-mono">{(selectedRun.duration_ms / 1000).toFixed(2)}s</span>}
                    {selectedRun.entity_type && <span>{selectedRun.entity_type}: {selectedRun.entity_id?.slice(0, 8)}...</span>}
                  </div>

                  {/* Error */}
                  {selectedRun.error_message && (
                    <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/15">
                      <span className="text-[9px] uppercase tracking-wider text-destructive/60 font-mono">Erro</span>
                      <p className="text-xs text-destructive mt-1">{selectedRun.error_message}</p>
                    </div>
                  )}

                  {/* Input */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50 font-mono">Input</span>
                    <pre className="text-[10px] text-foreground/70 bg-muted/20 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
                      {JSON.stringify(selectedRun.input_json, null, 2)}
                    </pre>
                  </div>

                  {/* Output */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50 font-mono">Output</span>
                      {selectedRun.output_json && (
                        <Button variant="ghost" size="sm" className="h-5 gap-1 text-[9px]" onClick={() => handleCopyOutput(selectedRun)}>
                          <Copy className="w-2.5 h-2.5" /> Copiar
                        </Button>
                      )}
                    </div>
                    {selectedRun.output_json ? (
                      <div className="bg-muted/20 rounded-lg p-3">
                        <OutputPreview data={selectedRun.output_json} />
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/40">Sem output disponível</p>
                    )}
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
