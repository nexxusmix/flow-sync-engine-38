/**
 * AIAuditView - Audit trail for AI actions
 */

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Filter, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { sc } from "@/lib/colors";
import type { useAIGovernance } from "@/hooks/useAIGovernance";

interface Props {
  governance: ReturnType<typeof useAIGovernance>;
}

export function AIAuditView({ governance }: Props) {
  const { runs, events, isLoading } = governance;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Merge runs + events into unified list
  const allItems = [
    ...runs.map(r => ({
      id: r.id,
      type: "ai_run" as const,
      action: r.action_key,
      module: r.action_key?.split("_")[0] || "system",
      user_id: r.user_id,
      status: r.status === "completed" ? "success" : r.status,
      error: r.error_message,
      duration: r.duration_ms,
      tokens: 0,
      cost: 0,
      created_at: r.created_at,
      raw: r,
    })),
    ...events.map(e => ({
      id: e.id,
      type: "usage_event" as const,
      action: e.action_type,
      module: e.source_module,
      user_id: e.user_id,
      status: e.status,
      error: e.error_message,
      duration: e.execution_time_ms,
      tokens: (e.tokens_input || 0) + (e.tokens_output || 0),
      cost: Number(e.estimated_cost || 0),
      created_at: e.created_at,
      raw: e,
    })),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at));

  const filtered = allItems.filter(item => {
    if (search && !item.action.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && item.status !== statusFilter) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ação..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {["success", "error", "pending"].map(s => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => setStatusFilter(statusFilter === s ? null : s)}
            >
              {s === "success" ? "Sucesso" : s === "error" ? "Erro" : "Pendente"}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Data</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Ação</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Módulo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Tokens</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Tempo</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(item.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{item.action}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{item.module}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={item.status === "success" || item.status === "completed" ? "default" : "destructive"}
                      className="text-[10px]"
                    >
                      {item.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-right text-muted-foreground">
                    {item.tokens > 0 ? item.tokens.toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-right text-muted-foreground">
                    {item.duration ? `${item.duration}ms` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setSelectedItem(item)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhum registro encontrado
          </div>
        )}
        {filtered.length > 100 && (
          <div className="p-3 text-center text-xs text-muted-foreground border-t border-border">
            Mostrando 100 de {filtered.length} registros
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Execução</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Ação:</span></div>
                  <div className="font-mono text-xs">{selectedItem.action}</div>
                  <div><span className="text-muted-foreground">Módulo:</span></div>
                  <div className="capitalize">{selectedItem.module}</div>
                  <div><span className="text-muted-foreground">Status:</span></div>
                  <div><Badge variant={selectedItem.status === "success" || selectedItem.status === "completed" ? "default" : "destructive"} className="text-[10px]">{selectedItem.status}</Badge></div>
                  <div><span className="text-muted-foreground">Tokens:</span></div>
                  <div>{selectedItem.tokens > 0 ? selectedItem.tokens.toLocaleString() : "—"}</div>
                  <div><span className="text-muted-foreground">Custo:</span></div>
                  <div>{selectedItem.cost > 0 ? `$${selectedItem.cost.toFixed(6)}` : "—"}</div>
                  <div><span className="text-muted-foreground">Tempo:</span></div>
                  <div>{selectedItem.duration ? `${selectedItem.duration}ms` : "—"}</div>
                  <div><span className="text-muted-foreground">Data:</span></div>
                  <div>{format(new Date(selectedItem.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</div>
                </div>
                {selectedItem.error && (
                  <div className="mt-3 p-3 bg-destructive/10 rounded-lg">
                    <p className="text-xs font-medium text-destructive mb-1">Erro:</p>
                    <p className="text-xs text-muted-foreground">{selectedItem.error}</p>
                  </div>
                )}
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Dados brutos:</p>
                  <pre className="text-[10px] bg-muted/30 p-3 rounded-lg overflow-x-auto max-h-48">
                    {JSON.stringify(selectedItem.raw, null, 2)}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
