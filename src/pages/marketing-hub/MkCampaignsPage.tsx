import { useEffect, useState } from "react";
import { MkAppShell } from "@/components/marketing-hub/MkAppShell";
import { MkCard, MkStatusBadge, MkEmptyState, MkSectionHeader } from "@/components/marketing-hub/mk-ui";
import { useMarketingStore } from "@/stores/marketingStore";
import { Campaign, CampaignStatus } from "@/types/marketing";
import { motion } from "framer-motion";
import { Plus, Search, MoreVertical, Calendar, DollarSign, Target } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusMap: Record<CampaignStatus, { label: string; variant: "blue" | "amber" | "emerald" | "purple" | "red" | "slate" }> = {
  draft: { label: "Rascunho", variant: "slate" },
  planning: { label: "Planejamento", variant: "purple" },
  active: { label: "Ativa", variant: "emerald" },
  paused: { label: "Pausada", variant: "amber" },
  ended: { label: "Encerrada", variant: "red" },
  completed: { label: "Concluída", variant: "blue" },
};

export default function MkCampaignsPage() {
  const { campaigns, fetchCampaigns, createCampaign, deleteCampaign } = useMarketingStore();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", objective: "", audience: "", budget: "", start_date: "", end_date: "" });

  useEffect(() => { fetchCampaigns(); }, []);

  const filtered = campaigns.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error("Nome obrigatório"); return; }
    await createCampaign({
      name: form.name,
      objective: form.objective || undefined,
      audience: form.audience || undefined,
      budget: form.budget ? Number(form.budget) : undefined,
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
      status: "draft",
    });
    toast.success("Campanha criada!");
    setDialogOpen(false);
    setForm({ name: "", objective: "", audience: "", budget: "", start_date: "", end_date: "" });
  };

  return (
    <MkAppShell title="Campanhas">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Campanhas</h1>
          <p className="text-sm text-white/30 mt-1">{campaigns.length} campanhas no total</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar campanha..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[hsl(210,100%,55%)]/40"
            />
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(210,100%,55%)] text-white text-sm font-medium hover:bg-[hsl(210,100%,50%)] transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Campanha</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <MkEmptyState
          icon="campaign"
          title="Nenhuma campanha"
          description="Crie sua primeira campanha para organizar conteúdos e criativos."
          action={{ label: "Nova Campanha", onClick: () => setDialogOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <CampaignCard campaign={c} onDelete={() => { deleteCampaign(c.id); toast.success("Campanha removida"); }} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111114] border-white/[0.08] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-white/90">Nova Campanha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-white/50 text-xs">Nome *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-white/[0.04] border-white/[0.08] text-white mt-1" placeholder="Black Friday 2026" />
            </div>
            <div>
              <Label className="text-white/50 text-xs">Objetivo</Label>
              <Textarea value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} className="bg-white/[0.04] border-white/[0.08] text-white mt-1" rows={2} placeholder="Aumentar vendas em 30%" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/50 text-xs">Início</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="bg-white/[0.04] border-white/[0.08] text-white mt-1" />
              </div>
              <div>
                <Label className="text-white/50 text-xs">Fim</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="bg-white/[0.04] border-white/[0.08] text-white mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-white/50 text-xs">Orçamento (R$)</Label>
              <Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} className="bg-white/[0.04] border-white/[0.08] text-white mt-1" placeholder="5000" />
            </div>
            <div>
              <Label className="text-white/50 text-xs">Público-alvo</Label>
              <Input value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} className="bg-white/[0.04] border-white/[0.08] text-white mt-1" placeholder="Empreendedores 25-45" />
            </div>
            <button onClick={handleCreate} className="w-full py-2.5 rounded-xl bg-[hsl(210,100%,55%)] text-white text-sm font-medium hover:bg-[hsl(210,100%,50%)] transition-colors">
              Criar Campanha
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </MkAppShell>
  );
}

function CampaignCard({ campaign: c, onDelete }: { campaign: Campaign; onDelete: () => void }) {
  const s = statusMap[c.status] || statusMap.draft;
  return (
    <MkCard hover>
      <div className="flex items-start justify-between mb-3">
        <MkStatusBadge label={s.label} variant={s.variant} />
        <button onClick={e => { e.stopPropagation(); onDelete(); }} className="text-white/20 hover:text-white/60 transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
      <h3 className="text-base font-semibold text-white/85 mb-1 line-clamp-1">{c.name}</h3>
      {c.objective && <p className="text-xs text-white/30 line-clamp-2 mb-3">{c.objective}</p>}
      <div className="flex items-center gap-4 text-[11px] text-white/30 mt-auto pt-2 border-t border-white/[0.04]">
        {c.start_date && (
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(c.start_date), "dd MMM", { locale: ptBR })}</span>
        )}
        {c.budget && (
          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />R$ {c.budget.toLocaleString("pt-BR")}</span>
        )}
        {c.audience && (
          <span className="flex items-center gap-1 truncate"><Target className="w-3 h-3" />{c.audience}</span>
        )}
      </div>
    </MkCard>
  );
}
