import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, MoreVertical, Pin, PinOff, Archive, CheckCircle2, Clock, AlertTriangle,
  ChevronRight, Inbox, Bell, Shield, Zap, MessageSquare, Receipt, Briefcase,
  ArrowRight, Eye, ExternalLink, RotateCcw, X,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useUnifiedInbox, useInboxMutations, useInboxItemActions,
  SOURCE_MODULES, ITEM_TYPES, PRIORITY_OPTIONS,
  type InboxItem, type InboxFilters, type InboxPriority, type InboxItemStatus,
} from "@/hooks/useUnifiedInbox";
import { sc } from "@/lib/colors";

// ── Priority helpers ──────────────────────────────────────
const priorityStyle = (p: InboxPriority) => {
  switch (p) {
    case "critical": return sc.priority("urgent");
    case "high": return sc.priority("high");
    case "medium": return sc.priority("medium");
    case "low": return sc.priority("low");
  }
};

const priorityLabel: Record<InboxPriority, string> = {
  low: "Baixa", medium: "Média", high: "Alta", critical: "Crítica",
};

const statusLabel: Record<string, string> = {
  unread: "Não lido", read: "Lido", in_progress: "Em andamento", resolved: "Resolvido", archived: "Arquivado",
};

const typeIcon: Record<string, typeof Inbox> = {
  notification: Bell,
  approval: Shield,
  message: MessageSquare,
  alert: AlertTriangle,
  error: AlertTriangle,
  reminder: Clock,
  task: CheckCircle2,
  event: Zap,
};

const moduleIcon: Record<string, string> = {
  crm: "handshake", projects: "movie_filter", contracts: "gavel",
  finance: "payments", portal: "language", automations: "manufacturing",
  tasks: "checklist", system: "settings",
};

// ── Views ─────────────────────────────────────────────────
const VIEWS = [
  { key: "all", label: "Todos", icon: Inbox },
  { key: "pending", label: "Pendentes", icon: Clock },
  { key: "critical", label: "Críticos", icon: AlertTriangle },
  { key: "approvals", label: "Aprovações", icon: Shield },
  { key: "messages", label: "Mensagens", icon: MessageSquare },
  { key: "automations", label: "Automações", icon: Zap },
  { key: "finance", label: "Financeiro", icon: Receipt },
  { key: "projects", label: "Projetos", icon: Briefcase },
  { key: "archived", label: "Arquivados", icon: Archive },
] as const;

export function UnifiedInboxView() {
  const [filters, setFilters] = useState<InboxFilters>({ view: "all" });
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { items, isLoading, counts } = useUnifiedInbox({ ...filters, search: search || undefined });
  const { updateStatus, markRead, togglePin, bulkAction, logAction } = useInboxMutations();
  const { data: itemActions = [] } = useInboxItemActions(selectedId);

  const selectedItem = items.find((i) => i.id === selectedId);

  const handleSelect = useCallback((item: InboxItem) => {
    setSelectedId(item.id);
    if (item.status === "unread") markRead.mutate(item.id);
  }, [markRead]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkResolve = () => {
    if (selectedIds.size === 0) return;
    bulkAction.mutate({ ids: Array.from(selectedIds), status: "resolved" });
    setSelectedIds(new Set());
  };

  const handleBulkArchive = () => {
    if (selectedIds.size === 0) return;
    bulkAction.mutate({ ids: Array.from(selectedIds), status: "archived" });
    setSelectedIds(new Set());
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-0">
      {/* Left: View Sidebar */}
      <div className="w-[200px] border-r border-border flex-shrink-0 py-3 px-2 space-y-0.5 overflow-y-auto hidden lg:block">
        {VIEWS.map((v) => {
          const Icon = v.icon;
          const count = v.key === "all" ? counts?.total
            : v.key === "critical" ? counts?.critical
            : v.key === "approvals" ? counts?.approvals
            : v.key === "pending" ? counts?.unread
            : undefined;
          return (
            <button
              key={v.key}
              onClick={() => setFilters({ ...filters, view: v.key as any })}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs transition-colors ${
                filters.view === v.key
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="flex-1 text-left">{v.label}</span>
              {count !== undefined && count > 0 && (
                <span className={`text-[10px] min-w-[18px] text-center rounded-full px-1 py-0.5 ${
                  v.key === "critical" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {/* Module counts */}
        <div className="pt-3 mt-3 border-t border-border">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider px-3 font-medium">Por módulo</span>
          {SOURCE_MODULES.filter((m) => (counts?.byModule?.[m.key] || 0) > 0).map((m) => (
            <button
              key={m.key}
              onClick={() => setFilters({ ...filters, view: m.key as any })}
              className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <span className="material-symbols-rounded text-[14px]">{m.icon}</span>
              <span className="flex-1 text-left">{m.label}</span>
              <span className="text-[10px] text-muted-foreground/60">{counts?.byModule?.[m.key]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Center: Items List */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
          {/* Mobile view selector */}
          <div className="lg:hidden">
            <Select value={filters.view || "all"} onValueChange={(v) => setFilters({ ...filters, view: v as any })}>
              <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {VIEWS.map((v) => <SelectItem key={v.key} value={v.key}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar na inbox..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-card/50"
            />
          </div>

          <Select value={filters.priority || "all"} onValueChange={(v) => setFilters({ ...filters, priority: v as any })}>
            <SelectTrigger className="w-[120px] h-8 text-xs bg-card/50"><SelectValue placeholder="Prioridade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {PRIORITY_OPTIONS.map((p) => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-1 ml-2">
              <Badge variant="outline" className="text-[10px]">{selectedIds.size} selecionados</Badge>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleBulkResolve}>
                <CheckCircle2 className="w-3 h-3" /> Resolver
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleBulkArchive}>
                <Archive className="w-3 h-3" /> Arquivar
              </Button>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-sm text-muted-foreground animate-pulse">Carregando inbox...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Inbox className="w-10 h-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Inbox vazia</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">Nenhum item para esta visão</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {items.map((item) => {
                const pStyle = priorityStyle(item.priority);
                const Icon = typeIcon[item.type || "notification"] || Bell;
                const isSelected = selectedId === item.id;
                const isChecked = selectedIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors group ${
                      isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30 border-l-2 border-l-transparent"
                    } ${item.status === "unread" ? "bg-primary/[0.02]" : ""}`}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleSelection(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-shrink-0"
                    />

                    {/* Priority indicator */}
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${pStyle.dot}`} />

                    {/* Type icon */}
                    <div className={`w-7 h-7 rounded-lg ${
                      item.priority === "critical" ? "bg-destructive/10" : "bg-muted"
                    } flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-3.5 h-3.5 ${
                        item.priority === "critical" ? "text-destructive" : "text-muted-foreground"
                      }`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {item.pinned && <Pin className="w-3 h-3 text-primary flex-shrink-0" />}
                        <span className={`text-sm truncate ${item.status === "unread" ? "font-semibold text-foreground" : "text-foreground/80"}`}>
                          {item.title}
                        </span>
                        {item.requires_approval && (
                          <Badge className="bg-primary/15 text-primary border-0 text-[9px] px-1 py-0 h-4">Aprovação</Badge>
                        )}
                        {item.priority === "critical" && (
                          <Badge className="bg-destructive/15 text-destructive border-0 text-[9px] px-1 py-0 h-4">Crítico</Badge>
                        )}
                      </div>
                      {item.summary && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{item.summary}</p>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[10px] text-muted-foreground/60 hidden md:inline">
                        {SOURCE_MODULES.find((m) => m.key === item.source_module)?.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                      </span>

                      {/* Quick actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: item.id, status: "resolved" }); }}>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Resolver
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePin.mutate({ id: item.id, pinned: !item.pinned }); }}>
                            {item.pinned ? <PinOff className="w-3.5 h-3.5 mr-2" /> : <Pin className="w-3.5 h-3.5 mr-2" />}
                            {item.pinned ? "Desafixar" : "Fixar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: item.id, status: "archived" }); }}>
                            <Archive className="w-3.5 h-3.5 mr-2" /> Arquivar
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
      </div>

      {/* Right: Detail Panel */}
      {selectedItem && (
        <div className="w-[380px] border-l border-border flex-shrink-0 overflow-y-auto hidden xl:block">
          <InboxDetailPanel
            item={selectedItem}
            actions={itemActions}
            onClose={() => setSelectedId(null)}
            onResolve={() => updateStatus.mutate({ id: selectedItem.id, status: "resolved" })}
            onArchive={() => { updateStatus.mutate({ id: selectedItem.id, status: "archived" }); setSelectedId(null); }}
            onPin={() => togglePin.mutate({ id: selectedItem.id, pinned: !selectedItem.pinned })}
            onLogAction={(type, note) => logAction.mutate({ inbox_item_id: selectedItem.id, action_type: type, note })}
          />
        </div>
      )}

      {/* Mobile detail sheet */}
      <Sheet open={!!selectedItem && typeof window !== "undefined" && window.innerWidth < 1280} onOpenChange={() => setSelectedId(null)}>
        <SheetContent side="right" className="w-full sm:w-[400px] p-0">
          {selectedItem && (
            <InboxDetailPanel
              item={selectedItem}
              actions={itemActions}
              onClose={() => setSelectedId(null)}
              onResolve={() => updateStatus.mutate({ id: selectedItem.id, status: "resolved" })}
              onArchive={() => { updateStatus.mutate({ id: selectedItem.id, status: "archived" }); setSelectedId(null); }}
              onPin={() => togglePin.mutate({ id: selectedItem.id, pinned: !selectedItem.pinned })}
              onLogAction={(type, note) => logAction.mutate({ inbox_item_id: selectedItem.id, action_type: type, note })}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────
function InboxDetailPanel({
  item,
  actions,
  onClose,
  onResolve,
  onArchive,
  onPin,
  onLogAction,
}: {
  item: InboxItem;
  actions: any[];
  onClose: () => void;
  onResolve: () => void;
  onArchive: () => void;
  onPin: () => void;
  onLogAction: (type: string, note?: string) => void;
}) {
  const pStyle = priorityStyle(item.priority);
  const moduleDef = SOURCE_MODULES.find((m) => m.key === item.source_module);
  const typeDef = ITEM_TYPES.find((t) => t.key === item.item_type);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
        <span className="flex-1 text-xs text-muted-foreground font-medium">Detalhes</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onPin} title={item.pinned ? "Desafixar" : "Fixar"}>
            {item.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onArchive} title="Arquivar">
            <Archive className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Title & badges */}
        <div>
          <h2 className="text-sm font-semibold text-foreground leading-snug">{item.title}</h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className={`text-[10px] py-0 ${pStyle.text}`}>
              {priorityLabel[item.priority]}
            </Badge>
            <Badge variant="outline" className="text-[10px] py-0">
              {statusLabel[item.status] || item.status}
            </Badge>
            {moduleDef && (
              <Badge variant="outline" className="text-[10px] py-0 gap-1">
                <span className="material-symbols-rounded text-[10px]">{moduleDef.icon}</span>
                {moduleDef.label}
              </Badge>
            )}
            {typeDef && (
              <Badge variant="outline" className="text-[10px] py-0">{typeDef.label}</Badge>
            )}
          </div>
        </div>

        {/* Summary */}
        {item.summary && (
          <div className="glass-card rounded-lg p-3">
            <p className="text-xs text-foreground/80 leading-relaxed">{item.summary}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground">Criado em</span>
            <p className="font-medium text-foreground">{format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
          </div>
          {item.source_entity_type && (
            <div>
              <span className="text-muted-foreground">Entidade</span>
              <p className="font-medium text-foreground">{item.source_entity_type}</p>
            </div>
          )}
          {item.resolved_at && (
            <div>
              <span className="text-muted-foreground">Resolvido em</span>
              <p className="font-medium text-foreground">{format(new Date(item.resolved_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
            </div>
          )}
        </div>

        {/* Payload */}
        {item.payload_json && Object.keys(item.payload_json).length > 0 && (
          <div className="glass-card rounded-lg p-3">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Dados adicionais</span>
            <div className="mt-2 space-y-1">
              {Object.entries(item.payload_json).map(([k, v]) => (
                <div key={k} className="flex items-start gap-2 text-xs">
                  <span className="text-muted-foreground min-w-[80px]">{k}:</span>
                  <span className="text-foreground break-all">{typeof v === "string" ? v : JSON.stringify(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action history */}
        {actions.length > 0 && (
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Histórico de ações</span>
            <div className="mt-2 space-y-2">
              {actions.map((a) => (
                <div key={a.id} className="flex items-start gap-2 text-xs">
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">{a.action_type}</p>
                    {a.note && <p className="text-muted-foreground">{a.note}</p>}
                    <p className="text-muted-foreground/60 text-[10px]">
                      {format(new Date(a.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions bar */}
      <div className="px-4 py-3 border-t border-border flex items-center gap-2">
        {item.requires_approval && item.status !== "resolved" && (
          <>
            <Button size="sm" className="flex-1 gap-1" onClick={() => { onLogAction("approved"); onResolve(); }}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
            </Button>
            <Button size="sm" variant="outline" className="flex-1 gap-1 text-destructive border-destructive/30" onClick={() => { onLogAction("rejected"); onResolve(); }}>
              <X className="w-3.5 h-3.5" /> Rejeitar
            </Button>
          </>
        )}
        {!item.requires_approval && item.status !== "resolved" && (
          <Button size="sm" className="flex-1 gap-1" onClick={onResolve}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Marcar como resolvido
          </Button>
        )}
        {item.source_entity_id && (
          <Button size="sm" variant="outline" className="gap-1" onClick={() => { /* navigate to source */ }}>
            <ExternalLink className="w-3.5 h-3.5" /> Abrir origem
          </Button>
        )}
      </div>
    </div>
  );
}
