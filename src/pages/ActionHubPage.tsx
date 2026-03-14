import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useActionItems, generateActionItems, ActionItem } from "@/hooks/useActionItems";
import { ActionCard } from "@/components/action-hub/ActionCard";
import { MessageDraftModal } from "@/components/action-hub/MessageDraftModal";
import { motion } from "framer-motion";
import { Zap, Search, Filter, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const filters = [
  { key: "all", label: "Todas" },
  { key: "financial", label: "Financeiro" },
  { key: "deadline", label: "Prazos" },
  { key: "delivery", label: "Entregas" },
  { key: "follow_up", label: "Contato" },
  { key: "production_step", label: "Produção" },
  { key: "alert", label: "Alertas" },
];

const timeFilters = [
  { key: "all", label: "Todas" },
  { key: "today", label: "Hoje" },
  { key: "7days", label: "7 dias" },
  { key: "overdue", label: "Atrasados" },
];

export default function ActionHubPage() {
  const { items, isLoading, completeAction, snoozeAction } = useActionItems();
  const [messageItem, setMessageItem] = useState<ActionItem | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    generateActionItems();
  }, []);

  const filteredItems = items.filter(item => {
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    if (search && !item.title.toLowerCase().includes(search.toLowerCase()) && !item.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (timeFilter === "today") {
      const today = new Date().toDateString();
      if (!item.due_at || new Date(item.due_at).toDateString() !== today) return false;
    }
    if (timeFilter === "7days") {
      if (!item.due_at) return false;
      const diff = (new Date(item.due_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (diff > 7 || diff < 0) return false;
    }
    if (timeFilter === "overdue") {
      if (!item.due_at || new Date(item.due_at) >= new Date()) return false;
    }
    return true;
  });

  return (
    <DashboardLayout title="Central de Ações">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          initial={{ opacity: 0, y: -15, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ type: "spring", stiffness: 80 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-normal text-foreground uppercase tracking-tight">Central de Ações</h1>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                {items.length} ações · {items.filter(i => i.priority === "P0").length} críticas
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Buscar por cliente ou projeto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted/20 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/30 transition-colors"
            />
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="flex flex-wrap gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-1 mr-4">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-[9px] text-muted-foreground font-mono uppercase">Tipo:</span>
          </div>
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setTypeFilter(f.key)}
              className={cn(
                "text-[10px] px-3 py-1.5 rounded-lg font-mono uppercase transition-colors",
                typeFilter === f.key ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted/20 text-muted-foreground hover:bg-muted/30"
              )}
            >
              {f.label}
            </button>
          ))}
          <div className="w-px h-6 bg-border/30 mx-2" />
          {timeFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setTimeFilter(f.key)}
              className={cn(
                "text-[10px] px-3 py-1.5 rounded-lg font-mono uppercase transition-colors",
                timeFilter === f.key ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted/20 text-muted-foreground hover:bg-muted/30"
              )}
            >
              {f.label}
            </button>
          ))}
        </motion.div>

        {/* Items List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredItems.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            {filteredItems.map(item => (
              <ActionCard
                key={item.id}
                item={item}
                onComplete={(id) => completeAction.mutate(id)}
                onSnooze={(id, until) => snoozeAction.mutate({ id, until })}
                onGenerateMessage={setMessageItem}
                onDelegate={async (id, userId, userName) => {
                  await supabase.from("action_items" as any)
                    .update({ metadata: { ...item.metadata, assignee_id: userId, assignee_name: userName } } as any)
                    .eq("id", id);
                }}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            className="flex flex-col items-center justify-center py-16 glass-card rounded-[2rem]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-7 h-7 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-lg text-muted-foreground font-light">Nenhuma ação pendente</p>
            <p className="text-xs text-muted-foreground/50 mt-1">Tudo sob controle — continue assim! ✓</p>
          </motion.div>
        )}
      </div>

      <MessageDraftModal
        item={messageItem}
        open={!!messageItem}
        onClose={() => setMessageItem(null)}
      />
    </DashboardLayout>
  );
}
