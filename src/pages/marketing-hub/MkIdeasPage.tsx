/**
 * MkIdeasPage — Banco de Ideias CONTENT_OS V4.0
 * Grid holográfico com geração IA, filtros, promoção para pipeline
 */
import { useEffect, useState, useCallback } from "react";
import { MkAppShell } from "@/components/marketing-hub/MkAppShell";
import { MkCard, MkStatusBadge, MkEmptyState } from "@/components/marketing-hub/mk-ui";
import { useMarketingStore } from "@/stores/marketingStore";
import { ContentIdea, CONTENT_PILLARS, CONTENT_CHANNELS, CONTENT_FORMATS, InstagramReference } from "@/types/marketing";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Sparkles, ArrowRight, Star, MoreHorizontal,
  Trash2, Loader2, Instagram, Lightbulb, Zap, Filter
} from "lucide-react";
import { ReferencePicker } from "@/components/marketing/ReferencePicker";
import { useReferenceLinkCount } from "@/hooks/useReferenceLinks";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { generateIdeas, isAIError } from "@/lib/ai";

/* ── Pillar variant map ── */
const PILLAR_VARIANT: Record<string, "blue" | "amber" | "emerald" | "purple" | "red" | "cyan" | "slate"> = {
  autoridade: "purple",
  bastidores: "amber",
  cases: "emerald",
  oferta: "red",
  prova_social: "blue",
  educacional: "cyan",
};

/* ── Idea Card ── */
function IdeaCard({
  idea, onPromote, onDelete, onLinkReference,
}: {
  idea: ContentIdea;
  onPromote: () => void;
  onDelete: () => void;
  onLinkReference: () => void;
}) {
  const { count: referenceCount, fetchCount } = useReferenceLinkCount("idea", idea.id);
  const pillar = CONTENT_PILLARS.find(p => p.type === idea.pillar);
  const channel = CONTENT_CHANNELS.find(c => c.type === idea.channel);
  const format = CONTENT_FORMATS.find(f => f.type === idea.format);

  useEffect(() => { fetchCount(); }, [fetchCount]);

  return (
    <MkCard hover className="flex flex-col gap-3 group h-full">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {idea.score > 0 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
              <Star className="w-3 h-3 text-primary fill-primary" />
              <span className="text-[9px] font-mono text-primary">{idea.score}</span>
            </div>
          )}
          {referenceCount > 0 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
              <Instagram className="w-2.5 h-2.5 text-primary/70" />
              <span className="text-[9px] font-mono text-primary/70">{referenceCount}</span>
            </div>
          )}
          {idea.ai_generated && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[rgba(0,156,202,0.08)] border border-[rgba(0,156,202,0.15)]">
              <Sparkles className="w-2.5 h-2.5 text-[hsl(195,100%,50%)]" />
              <span className="text-[9px] text-[hsl(195,100%,55%)]">IA</span>
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 text-white/15 hover:text-white/50 transition-colors rounded opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#111114] border-white/10">
            <DropdownMenuItem onClick={onPromote} className="text-xs text-white/60">
              <ArrowRight className="w-3 h-3 mr-2 text-primary" />
              Promover para Produção
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLinkReference} className="text-xs text-white/60">
              <Instagram className="w-3 h-3 mr-2 text-primary/70" />
              Vincular Referência
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-xs text-destructive focus:text-destructive">
              <Trash2 className="w-3 h-3 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Title */}
      <h3 className="text-[13px] font-medium text-white/80 leading-snug line-clamp-2 group-hover:text-white transition-colors">
        {idea.title}
      </h3>

      {/* Hook */}
      {idea.hook && (
        <p className="text-[10px] text-white/25 line-clamp-2 italic leading-relaxed">
          "{idea.hook}"
        </p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mt-auto pt-2 border-t border-white/[0.04]">
        {pillar && (
          <MkStatusBadge label={pillar.name} variant={PILLAR_VARIANT[idea.pillar || ""] || "slate"} className="text-[8px] px-2 py-0" />
        )}
        {channel && (
          <span className="text-[8px] px-2 py-0.5 rounded border border-white/[0.06] text-white/25 uppercase tracking-wider">
            {channel.name}
          </span>
        )}
        {format && (
          <span className="text-[8px] px-2 py-0.5 rounded border border-white/[0.06] text-white/25 uppercase tracking-wider">
            {format.name}
          </span>
        )}
      </div>

      {/* Promote CTA */}
      <button
        onClick={onPromote}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md border border-primary/20 bg-primary/5 text-primary text-[10px] uppercase tracking-wider font-medium opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10"
      >
        <ArrowRight className="w-3 h-3" />
        Produzir
      </button>
    </MkCard>
  );
}

/* ── Main Page ── */
export default function MkIdeasPage() {
  const navigate = useNavigate();
  const {
    ideas, fetchIdeas, createIdea, deleteIdea, promoteIdeaToContent,
    ideaFilters, setIdeaFilters, getFilteredIdeas,
  } = useMarketingStore();

  const [isNewIdeaOpen, setIsNewIdeaOpen] = useState(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [isRefPickerOpen, setIsRefPickerOpen] = useState(false);
  const [selectedIdeaForRef, setSelectedIdeaForRef] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [newIdea, setNewIdea] = useState({
    title: "", hook: "", pillar: "" as any, format: "" as any,
    channel: "" as any, target: "", notes: "",
  });

  useEffect(() => { fetchIdeas(); }, []);

  const filteredIdeas = getFilteredIdeas();

  const handleGenerateIdeas = async () => {
    setIsGeneratingIdeas(true);
    try {
      const result = await generateIdeas({
        pillar: ideaFilters.pillar,
        channel: ideaFilters.channel,
        format: ideaFilters.format,
      });
      if (isAIError(result)) {
        if (result.status === 429) toast.error("Limite de requisições excedido.");
        else if (result.status === 402) toast.error("Créditos insuficientes.");
        else toast.error(result.error || "Erro ao gerar ideias");
        return;
      }
      const ideaList = result.ideas || [];
      let savedCount = 0;
      for (const idea of ideaList) {
        await createIdea({ title: idea.title, hook: idea.hook, pillar: idea.pillar as any, channel: idea.channel as any, format: idea.format as any, target: idea.target, score: idea.score, status: "backlog", ai_generated: true });
        savedCount++;
      }
      await fetchIdeas();
      toast.success(`${savedCount} ideias geradas!`);
    } catch (err) {
      toast.error("Erro ao gerar ideias.");
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const handleCreateIdea = async () => {
    if (!newIdea.title) { toast.error("Título obrigatório"); return; }
    await createIdea({
      title: newIdea.title, hook: newIdea.hook || undefined, pillar: newIdea.pillar || undefined,
      format: newIdea.format || undefined, channel: newIdea.channel || undefined,
      target: newIdea.target || undefined, notes: newIdea.notes || undefined, status: "backlog",
    });
    setNewIdea({ title: "", hook: "", pillar: "", format: "", channel: "", target: "", notes: "" });
    setIsNewIdeaOpen(false);
    toast.success("Ideia salva!");
  };

  const handlePromote = async (ideaId: string) => {
    const item = await promoteIdeaToContent(ideaId);
    if (item) { toast.success("Ideia promovida!"); navigate(`/m/conteudos`); }
  };

  const handleDelete = async (ideaId: string) => {
    await deleteIdea(ideaId);
    toast.success("Ideia removida");
  };

  const handleOpenRefPicker = (ideaId: string) => {
    setSelectedIdeaForRef(ideaId);
    setIsRefPickerOpen(true);
  };

  const handleLinkReference = async (ref: InstagramReference) => {
    if (!selectedIdeaForRef) return;
    const { error } = await supabase.from("reference_links").insert({
      reference_id: ref.id, entity_type: "idea", entity_id: selectedIdeaForRef,
    });
    if (error) {
      if (error.code === "23505") toast.error("Referência já vinculada");
      else toast.error("Erro ao vincular");
      return;
    }
    toast.success("Referência vinculada!");
    setSelectedIdeaForRef(null);
  };

  // Stats
  const totalIdeas = ideas.length;
  const aiIdeas = ideas.filter(i => i.ai_generated).length;
  const avgScore = ideas.length > 0 ? Math.round(ideas.reduce((s, i) => s + (i.score || 0), 0) / ideas.length) : 0;

  return (
    <MkAppShell title="Banco de Ideias" sectionCode="03" sectionLabel="Idea_Bank">
      {/* Stats */}
      <div className="flex items-center gap-4 mb-6">
        {[
          { label: "Total", value: totalIdeas, color: "hsl(195,100%,50%)" },
          { label: "IA", value: aiIdeas, color: "hsl(280,80%,60%)" },
          { label: "Score Médio", value: avgScore, color: "hsl(45,100%,60%)" },
        ].map(stat => (
          <div key={stat.label} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.04]">
            <span className="text-[13px] font-mono font-medium" style={{ color: stat.color }}>{stat.value}</span>
            <span className="text-[9px] text-white/25 uppercase tracking-wider">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
            <input
              value={ideaFilters.search}
              onChange={e => setIdeaFilters({ search: e.target.value })}
              placeholder="Buscar ideias..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/70 placeholder:text-white/15 focus:outline-none focus:border-[rgba(0,156,202,0.3)] transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "p-2 rounded-lg border transition-colors",
              showFilters
                ? "bg-[rgba(0,156,202,0.1)] border-[rgba(0,156,202,0.3)] text-[hsl(195,100%,55%)]"
                : "border-white/[0.06] text-white/25 hover:text-white/50"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateIdeas}
            disabled={isGeneratingIdeas}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-purple-500/25 bg-purple-500/8 text-purple-300 text-[10px] font-medium hover:bg-purple-500/15 transition-colors uppercase tracking-wider disabled:opacity-50"
          >
            {isGeneratingIdeas ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {isGeneratingIdeas ? "Gerando..." : "Gerar 10 com IA"}
          </button>
          <button
            onClick={() => setIsNewIdeaOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[rgba(0,156,202,0.3)] bg-[rgba(0,156,202,0.08)] text-[hsl(195,100%,55%)] text-[10px] font-medium hover:bg-[rgba(0,156,202,0.15)] transition-colors uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Ideia
          </button>
        </div>
      </div>

      {/* Filter pills */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-wrap gap-3 mb-6"
        >
          <div>
            <span className="text-[9px] text-white/20 uppercase tracking-wider mb-1.5 block">Pilar</span>
            <div className="flex gap-1 flex-wrap">
              <FilterPill label="Todos" active={ideaFilters.pillar === "all"} onClick={() => setIdeaFilters({ pillar: "all" })} />
              {CONTENT_PILLARS.map(p => (
                <FilterPill key={p.type} label={p.name} active={ideaFilters.pillar === p.type} onClick={() => setIdeaFilters({ pillar: p.type as any })} />
              ))}
            </div>
          </div>
          <div>
            <span className="text-[9px] text-white/20 uppercase tracking-wider mb-1.5 block">Canal</span>
            <div className="flex gap-1 flex-wrap">
              <FilterPill label="Todos" active={ideaFilters.channel === "all"} onClick={() => setIdeaFilters({ channel: "all" })} />
              {CONTENT_CHANNELS.map(c => (
                <FilterPill key={c.type} label={c.name} active={ideaFilters.channel === c.type} onClick={() => setIdeaFilters({ channel: c.type as any })} />
              ))}
            </div>
          </div>
          <div>
            <span className="text-[9px] text-white/20 uppercase tracking-wider mb-1.5 block">Formato</span>
            <div className="flex gap-1 flex-wrap">
              <FilterPill label="Todos" active={ideaFilters.format === "all"} onClick={() => setIdeaFilters({ format: "all" })} />
              {CONTENT_FORMATS.map(f => (
                <FilterPill key={f.type} label={f.name} active={ideaFilters.format === f.type} onClick={() => setIdeaFilters({ format: f.type as any })} />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Grid */}
      {filteredIdeas.length === 0 ? (
        <MkEmptyState
          icon="lightbulb"
          title="Nenhuma ideia"
          description="Crie ou gere ideias com IA para alimentar seu pipeline de conteúdo."
          action={{ label: "Nova Ideia", onClick: () => setIsNewIdeaOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredIdeas.map((idea, i) => (
            <motion.div
              key={idea.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.03 }}
            >
              <IdeaCard
                idea={idea}
                onPromote={() => handlePromote(idea.id)}
                onDelete={() => handleDelete(idea.id)}
                onLinkReference={() => handleOpenRefPicker(idea.id)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* New Idea Dialog */}
      <Dialog open={isNewIdeaOpen} onOpenChange={setIsNewIdeaOpen}>
        <DialogContent className="bg-[#0a0a0c] border-white/[0.08] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-medium text-white/90">Nova Ideia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-white/40 text-[10px] uppercase tracking-wider">Título *</Label>
              <Input value={newIdea.title} onChange={e => setNewIdea({ ...newIdea, title: e.target.value })}
                className="bg-white/[0.03] border-white/[0.08] text-white/80 mt-1.5 text-xs h-9" placeholder="Behind the scenes do set" />
            </div>
            <div>
              <Label className="text-white/40 text-[10px] uppercase tracking-wider">Hook / Gancho</Label>
              <Input value={newIdea.hook} onChange={e => setNewIdea({ ...newIdea, hook: e.target.value })}
                className="bg-white/[0.03] border-white/[0.08] text-white/80 mt-1.5 text-xs h-9" placeholder="'Como filmamos X em apenas 2 horas'" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-white/40 text-[10px] uppercase tracking-wider">Pilar</Label>
                <select value={newIdea.pillar} onChange={e => setNewIdea({ ...newIdea, pillar: e.target.value })}
                  className="w-full mt-1.5 py-2 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-white/60 focus:outline-none">
                  <option value="">—</option>
                  {CONTENT_PILLARS.map(p => <option key={p.type} value={p.type}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-white/40 text-[10px] uppercase tracking-wider">Canal</Label>
                <select value={newIdea.channel} onChange={e => setNewIdea({ ...newIdea, channel: e.target.value })}
                  className="w-full mt-1.5 py-2 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-white/60 focus:outline-none">
                  <option value="">—</option>
                  {CONTENT_CHANNELS.map(c => <option key={c.type} value={c.type}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-white/40 text-[10px] uppercase tracking-wider">Formato</Label>
                <select value={newIdea.format} onChange={e => setNewIdea({ ...newIdea, format: e.target.value })}
                  className="w-full mt-1.5 py-2 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-white/60 focus:outline-none">
                  <option value="">—</option>
                  {CONTENT_FORMATS.map(f => <option key={f.type} value={f.type}>{f.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label className="text-white/40 text-[10px] uppercase tracking-wider">Público Alvo</Label>
              <Input value={newIdea.target} onChange={e => setNewIdea({ ...newIdea, target: e.target.value })}
                className="bg-white/[0.03] border-white/[0.08] text-white/80 mt-1.5 text-xs h-9" placeholder="Empresários que querem produzir vídeos" />
            </div>
            <div>
              <Label className="text-white/40 text-[10px] uppercase tracking-wider">Notas</Label>
              <Textarea value={newIdea.notes} onChange={e => setNewIdea({ ...newIdea, notes: e.target.value })}
                className="bg-white/[0.03] border-white/[0.08] text-white/80 mt-1.5 text-xs resize-none" rows={3} placeholder="Anotações, referências..." />
            </div>
            <button onClick={handleCreateIdea}
              className="w-full py-2.5 rounded-lg border border-[rgba(0,156,202,0.3)] bg-[rgba(0,156,202,0.1)] text-[hsl(195,100%,55%)] text-xs font-medium hover:bg-[rgba(0,156,202,0.18)] transition-colors uppercase tracking-wider">
              Salvar Ideia
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reference Picker */}
      <ReferencePicker open={isRefPickerOpen} onOpenChange={setIsRefPickerOpen} onSelect={handleLinkReference} />
    </MkAppShell>
  );
}

/* ── Filter Pill ── */
function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded text-[9px] uppercase tracking-wider font-medium border transition-all",
        active
          ? "bg-[rgba(0,156,202,0.1)] border-[rgba(0,156,202,0.3)] text-[hsl(195,100%,55%)]"
          : "border-white/[0.04] text-white/25 hover:text-white/40 hover:border-white/10"
      )}
    >
      {label}
    </button>
  );
}
