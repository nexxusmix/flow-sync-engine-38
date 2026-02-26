/**
 * MkContentsPage — Pipeline de Conteúdos CONTENT_OS V4.0
 * Kanban holográfico com geração IA integrada
 */
import { useEffect, useState } from "react";
import { MkAppShell } from "@/components/marketing-hub/MkAppShell";
import { MkStatusBadge, MkEmptyState } from "@/components/marketing-hub/mk-ui";
import { PipelineContentCard } from "@/components/marketing-hub/pipeline";
import { useMarketingStore } from "@/stores/marketingStore";
import { ContentItemStatus, CONTENT_ITEM_STAGES, CONTENT_CHANNELS } from "@/types/marketing";
import { motion } from "framer-motion";
import { Plus, Search, List, LayoutGrid, Kanban } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const stageVariant: Record<string, "blue" | "amber" | "emerald" | "purple" | "red" | "slate" | "cyan"> = {
  briefing: "slate", writing: "blue", recording: "purple", editing: "amber",
  review: "amber", approved: "emerald", scheduled: "cyan", published: "blue", archived: "slate",
};

export default function MkContentsPage() {
  const { contentItems, fetchContentItems, createContentItem, updateContentStatus, deleteContentItem, fetchCampaigns } = useMarketingStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [view, setView] = useState<"grid" | "kanban">("kanban");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", channel: "", format: "", status: "briefing" });

  useEffect(() => { fetchContentItems(); fetchCampaigns(); }, []);

  const filtered = contentItems.filter(i => {
    if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    return true;
  });

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error("Título obrigatório"); return; }
    await createContentItem({ title: form.title, channel: (form.channel || undefined) as any, format: (form.format || undefined) as any, status: form.status as ContentItemStatus });
    toast.success("Conteúdo criado!");
    setDialogOpen(false);
    setForm({ title: "", channel: "", format: "", status: "briefing" });
  };

  // Stage counts for header stats
  const stageCounts = CONTENT_ITEM_STAGES.map(s => ({
    ...s,
    count: contentItems.filter(i => i.status === s.type).length,
  }));

  return (
    <MkAppShell title="Pipeline Conteúdos" sectionCode="02" sectionLabel="Content_Pipeline">
      {/* Stats bar */}
      <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-none">
        {stageCounts.map((s, i) => (
          <button
            key={s.type}
            onClick={() => setStatusFilter(statusFilter === s.type ? "all" : s.type)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] uppercase tracking-[0.08em] font-medium transition-all whitespace-nowrap ${
              statusFilter === s.type
                ? "bg-[rgba(0,156,202,0.1)] border-[rgba(0,156,202,0.3)] text-[hsl(195,100%,60%)]"
                : "border-white/[0.04] text-white/30 hover:border-white/10 hover:text-white/50"
            }`}
          >
            <span>{s.name}</span>
            <span className={`text-[9px] font-mono ${s.count > 0 ? "text-[hsl(195,100%,50%)]" : "text-white/15"}`}>
              {s.count}
            </span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 text-[11px] text-white/25">
          <span className="font-mono text-[hsl(195,100%,50%)]">{filtered.length}</span>
          <span>itens {statusFilter !== "all" ? `em "${CONTENT_ITEM_STAGES.find(s => s.type === statusFilter)?.name}"` : "no total"}</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar conteúdo..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/70 placeholder:text-white/15 focus:outline-none focus:border-[rgba(0,156,202,0.3)] transition-colors"
            />
          </div>
          <div className="flex rounded-lg border border-white/[0.06] overflow-hidden">
            <button
              onClick={() => setView("grid")}
              className={`p-2 transition-colors ${view === "grid" ? "bg-[rgba(0,156,202,0.12)] text-[hsl(195,100%,55%)]" : "text-white/20 hover:text-white/40"}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setView("kanban")}
              className={`p-2 transition-colors ${view === "kanban" ? "bg-[rgba(0,156,202,0.12)] text-[hsl(195,100%,55%)]" : "text-white/20 hover:text-white/40"}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[rgba(0,156,202,0.3)] bg-[rgba(0,156,202,0.08)] text-[hsl(195,100%,55%)] text-[11px] font-medium hover:bg-[rgba(0,156,202,0.15)] transition-colors shrink-0 uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <MkEmptyState
          icon="article"
          title="Nenhum conteúdo"
          description="Crie seu primeiro conteúdo para iniciar o pipeline de produção."
          action={{ label: "Novo Conteúdo", onClick: () => setDialogOpen(true) }}
        />
      ) : view === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none">
          {CONTENT_ITEM_STAGES.map(stage => {
            const items = filtered.filter(i => i.status === stage.type);
            return (
              <div key={stage.type} className="min-w-[260px] max-w-[280px] flex-shrink-0">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <MkStatusBadge label={stage.name} variant={stageVariant[stage.type] || "slate"} />
                  <span className="text-[10px] font-mono text-white/15">{items.length}</span>
                </div>
                <div className="space-y-2.5">
                  {items.map(item => (
                    <PipelineContentCard
                      key={item.id}
                      item={item}
                      onStatusChange={updateContentStatus}
                      onDelete={deleteContentItem}
                      onRefresh={fetchContentItems}
                    />
                  ))}
                  {items.length === 0 && (
                    <div className="rounded-lg border border-dashed border-white/[0.04] py-8 flex items-center justify-center">
                      <span className="text-[10px] text-white/10">Vazio</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.03 }}
            >
              <PipelineContentCard
                item={item}
                onStatusChange={updateContentStatus}
                onDelete={deleteContentItem}
                onRefresh={fetchContentItems}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0a0a0c] border-white/[0.08] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-medium text-white/90">Novo Conteúdo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-white/40 text-[10px] uppercase tracking-wider">Título *</Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="bg-white/[0.03] border-white/[0.08] text-white/80 mt-1.5 text-xs h-9"
                placeholder="Reel de lançamento..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/40 text-[10px] uppercase tracking-wider">Canal</Label>
                <select
                  value={form.channel}
                  onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                  className="w-full mt-1.5 py-2 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-white/60 focus:outline-none focus:border-[rgba(0,156,202,0.3)]"
                >
                  <option value="">Selecionar</option>
                  {CONTENT_CHANNELS.map(c => <option key={c.type} value={c.type}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-white/40 text-[10px] uppercase tracking-wider">Status</Label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full mt-1.5 py-2 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-white/60 focus:outline-none focus:border-[rgba(0,156,202,0.3)]"
                >
                  {CONTENT_ITEM_STAGES.map(s => <option key={s.type} value={s.type}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="w-full py-2.5 rounded-lg border border-[rgba(0,156,202,0.3)] bg-[rgba(0,156,202,0.1)] text-[hsl(195,100%,55%)] text-xs font-medium hover:bg-[rgba(0,156,202,0.18)] transition-colors uppercase tracking-wider"
            >
              Criar Conteúdo
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </MkAppShell>
  );
}
