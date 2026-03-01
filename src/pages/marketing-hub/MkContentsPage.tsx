/**
 * MkContentsPage — Pipeline de Conteúdos CONTENT_OS V4.0
 * Kanban holográfico com geração IA integrada + drag & drop
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MkAppShell } from "@/components/marketing-hub/MkAppShell";
import { MkStatusBadge, MkEmptyState } from "@/components/marketing-hub/mk-ui";
import { PipelineContentCard } from "@/components/marketing-hub/pipeline";
import { useMarketingStore } from "@/stores/marketingStore";
import { ContentItemStatus, CONTENT_ITEM_STAGES, CONTENT_CHANNELS } from "@/types/marketing";
import { motion } from "framer-motion";
import { Plus, Search, List, LayoutGrid } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const stageVariant: Record<string, "blue" | "amber" | "emerald" | "purple" | "red" | "slate" | "cyan"> = {
  briefing: "slate", writing: "blue", recording: "purple", editing: "amber",
  review: "amber", approved: "emerald", scheduled: "cyan", published: "blue", archived: "slate",
};

export default function MkContentsPage() {
  const navigate = useNavigate();
  const { contentItems, fetchContentItems, createContentItem, updateContentStatus, deleteContentItem, fetchCampaigns } = useMarketingStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [view, setView] = useState<"grid" | "kanban">("kanban");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", channel: "", format: "", status: "briefing" });
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

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

  const handleDrop = (e: React.DragEvent, stageType: ContentItemStatus) => {
    e.preventDefault();
    setDragOverStage(null);
    const itemId = e.dataTransfer.getData("contentItemId");
    if (itemId) {
      updateContentStatus(itemId, stageType);
      toast.success(`Movido para ${CONTENT_ITEM_STAGES.find(s => s.type === stageType)?.name}`);
    }
  };

  const stageCounts = CONTENT_ITEM_STAGES.map(s => ({
    ...s,
    count: contentItems.filter(i => i.status === s.type).length,
  }));

  return (
    <MkAppShell title="Pipeline Conteúdos" sectionCode="02" sectionLabel="Content_Pipeline">
      {/* Stats bar */}
      <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-none">
        {stageCounts.map((s) => (
          <button
            key={s.type}
            onClick={() => setStatusFilter(statusFilter === s.type ? "all" : s.type)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] uppercase tracking-[0.08em] font-medium transition-all whitespace-nowrap ${
              statusFilter === s.type
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-border/30 text-muted-foreground hover:border-border hover:text-foreground/60"
            }`}
          >
            <span>{s.name}</span>
            <span className={`text-[9px] font-mono ${s.count > 0 ? "text-primary" : "text-muted-foreground/30"}`}>
              {s.count}
            </span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-mono text-primary">{filtered.length}</span>
          <span>itens {statusFilter !== "all" ? `em "${CONTENT_ITEM_STAGES.find(s => s.type === statusFilter)?.name}"` : "no total"}</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar conteúdo..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted/20 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30 transition-colors"
            />
          </div>
          <div className="flex rounded-lg border border-border/30 overflow-hidden">
            <button
              onClick={() => setView("grid")}
              className={`p-2 transition-colors ${view === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setView("kanban")}
              className={`p-2 transition-colors ${view === "kanban" ? "bg-primary/10 text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-primary/30 bg-primary/10 text-primary text-[11px] font-medium hover:bg-primary/15 transition-colors shrink-0 uppercase tracking-wider"
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
            const isOver = dragOverStage === stage.type;
            return (
              <div
                key={stage.type}
                className={`min-w-[260px] max-w-[280px] flex-shrink-0 transition-all ${isOver ? "ring-1 ring-primary/40 rounded-lg" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.type); }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => handleDrop(e, stage.type)}
              >
                <div className="flex items-center gap-2 mb-3 px-1">
                  <MkStatusBadge label={stage.name} variant={stageVariant[stage.type] || "slate"} />
                  <span className="text-[10px] font-mono text-muted-foreground/30">{items.length}</span>
                </div>
                <div className="space-y-2.5">
                  {items.map(item => (
                    <PipelineContentCard
                      key={item.id}
                      item={item}
                      onStatusChange={updateContentStatus}
                      onDelete={deleteContentItem}
                      onRefresh={fetchContentItems}
                      onClick={() => navigate(`/m/content/${item.id}`)}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("contentItemId", item.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                    />
                  ))}
                  {items.length === 0 && (
                    <div className={`rounded-lg border border-dashed py-8 flex items-center justify-center transition-all ${
                      isOver ? "border-primary/30 bg-primary/5" : "border-border/30"
                    }`}>
                      <span className="text-[10px] text-muted-foreground/30">{isOver ? "Solte aqui" : "Vazio"}</span>
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
                onClick={() => navigate(`/m/content/${item.id}`)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-medium text-foreground">Novo Conteúdo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-muted-foreground text-[10px] uppercase tracking-wider">Título *</Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="bg-muted/20 border-border text-foreground mt-1.5 text-xs h-9"
                placeholder="Reel de lançamento..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-muted-foreground text-[10px] uppercase tracking-wider">Canal</Label>
                <select
                  value={form.channel}
                  onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                  className="w-full mt-1.5 py-2 px-3 rounded-lg bg-muted/20 border border-border text-xs text-foreground/70 focus:outline-none focus:border-primary/30"
                >
                  <option value="">Selecionar</option>
                  {CONTENT_CHANNELS.map(c => <option key={c.type} value={c.type}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-muted-foreground text-[10px] uppercase tracking-wider">Status</Label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full mt-1.5 py-2 px-3 rounded-lg bg-muted/20 border border-border text-xs text-foreground/70 focus:outline-none focus:border-primary/30"
                >
                  {CONTENT_ITEM_STAGES.map(s => <option key={s.type} value={s.type}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="w-full py-2.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-medium hover:bg-primary/15 transition-colors uppercase tracking-wider"
            >
              Criar Conteúdo
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </MkAppShell>
  );
}
