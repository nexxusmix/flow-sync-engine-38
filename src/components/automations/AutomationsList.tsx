import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Play, Pause, Copy, Trash2, Edit, Zap, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useAutomationsList,
  useToggleAutomationStatus,
  useDeleteAutomation,
  useDuplicateAutomation,
  MODULE_OPTIONS,
  TRIGGER_TYPES,
  type Automation,
  type AutomationStatus,
} from "@/hooks/useAutomations";
import { sc } from "@/lib/colors";

interface Props {
  onEdit: (id: string) => void;
  onCreate: () => void;
}

const STATUS_LABELS: Record<AutomationStatus, string> = {
  draft: "Rascunho",
  active: "Ativa",
  paused: "Pausada",
  error: "Com Erro",
  testing: "Em Teste",
};

export function AutomationsList({ onEdit, onCreate }: Props) {
  const { data: automations = [], isLoading } = useAutomationsList();
  const toggleStatus = useToggleAutomationStatus();
  const deleteAuto = useDeleteAutomation();
  const duplicateAuto = useDuplicateAutomation();

  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = automations.filter((a) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterModule !== "all" && a.module !== filterModule) return false;
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    total: automations.length,
    active: automations.filter((a) => a.status === "active").length,
    errors: automations.filter((a) => a.status === "error").length,
    totalExecutions: automations.reduce((s, a) => s + a.execution_count, 0),
  };

  const getStatusStyle = (status: AutomationStatus) => {
    switch (status) {
      case "active": return sc.status("active");
      case "paused": return sc.status("pending");
      case "error": return sc.status("error");
      case "draft": return sc.status("draft");
      case "testing": return sc.status("in_progress");
    }
  };

  const getTriggerLabel = (type: string) =>
    TRIGGER_TYPES.find((t) => t.key === type)?.label || type;

  const getModuleLabel = (mod: string) =>
    MODULE_OPTIONS.find((m) => m.key === mod)?.label || mod;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground text-sm">Carregando automações...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: "⚡" },
          { label: "Ativas", value: stats.active, icon: "✓" },
          { label: "Com Erro", value: stats.errors, icon: "⚠" },
          { label: "Execuções", value: stats.totalExecutions, icon: "▶" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{s.icon}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{s.label}</span>
            </div>
            <p className="text-xl font-bold tracking-tighter">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar automação..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card/50"
          />
        </div>
        <Select value={filterModule} onValueChange={setFilterModule}>
          <SelectTrigger className="w-[160px] bg-card/50">
            <SelectValue placeholder="Módulo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os módulos</SelectItem>
            {MODULE_OPTIONS.map((m) => (
              <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] bg-card/50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={onCreate} className="gap-2">
          <Zap className="w-4 h-4" />
          Nova Automação
        </Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Zap className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Nenhuma automação encontrada</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Crie sua primeira automação ou use um template</p>
          <Button onClick={onCreate} variant="outline" className="mt-4 gap-2">
            <Zap className="w-4 h-4" /> Criar Automação
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((auto) => {
            const style = getStatusStyle(auto.status);
            const successRate = auto.execution_count > 0
              ? Math.round((auto.success_count / auto.execution_count) * 100)
              : null;

            return (
              <div
                key={auto.id}
                className="glass-card rounded-xl p-4 hover:border-primary/20 transition-all cursor-pointer group"
                onClick={() => onEdit(auto.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Status dot */}
                  <div className={`w-9 h-9 rounded-lg ${style.bg} flex items-center justify-center flex-shrink-0`}>
                    <Zap className={`w-4 h-4 ${style.text}`} />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-medium text-foreground truncate">{auto.name}</h3>
                      <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${style.text} ${style.border}`}>
                        {STATUS_LABELS[auto.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{getModuleLabel(auto.module)}</span>
                      <span>·</span>
                      <span>{getTriggerLabel(auto.trigger_type)}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-6 text-xs text-muted-foreground">
                    <div className="text-center">
                      <p className="font-semibold text-foreground">{auto.execution_count}</p>
                      <p className="text-[10px]">execuções</p>
                    </div>
                    {successRate !== null && (
                      <div className="text-center">
                        <p className={`font-semibold ${sc.score(successRate).text}`}>{successRate}%</p>
                        <p className="text-[10px]">sucesso</p>
                      </div>
                    )}
                    <div className="text-center">
                      <p className="font-semibold text-foreground">
                        {auto.last_executed_at
                          ? format(new Date(auto.last_executed_at), "dd/MM HH:mm", { locale: ptBR })
                          : "—"}
                      </p>
                      <p className="text-[10px]">última exec.</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(auto.id); }}>
                        <Edit className="w-4 h-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      {auto.status === "active" ? (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleStatus.mutate({ id: auto.id, status: "paused" }); }}>
                          <Pause className="w-4 h-4 mr-2" /> Pausar
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleStatus.mutate({ id: auto.id, status: "active" }); }}>
                          <Play className="w-4 h-4 mr-2" /> Ativar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); duplicateAuto.mutate(auto.id); }}>
                        <Copy className="w-4 h-4 mr-2" /> Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => { e.stopPropagation(); deleteAuto.mutate(auto.id); }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
