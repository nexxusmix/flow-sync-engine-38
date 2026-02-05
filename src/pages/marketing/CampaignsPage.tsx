import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useMarketingStore } from "@/stores/marketingStore";
import { Campaign } from "@/types/marketing";
import { useNavigate } from "react-router-dom";
import { 
  Plus, Megaphone, Sparkles, Calendar, DollarSign,
  MoreHorizontal, Play, Pause, Archive, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function CampaignCard({ 
  campaign, 
  onStatusChange,
  onDelete,
}: { 
  campaign: Campaign;
  onStatusChange: (status: Campaign['status']) => void;
  onDelete: () => void;
}) {
  const statusColors = {
    draft: 'bg-slate-500',
    active: 'bg-emerald-500',
    paused: 'bg-amber-500',
    ended: 'bg-red-500',
  };

  const statusLabels = {
    draft: 'Rascunho',
    active: 'Ativa',
    paused: 'Pausada',
    ended: 'Encerrada',
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <motion.div
      className="glass-card rounded-xl p-6 border border-transparent hover:border-primary/20 transition-all"
      whileHover={{ scale: 1.01 }}
      layout
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            campaign.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
          )}>
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">{campaign.name}</h3>
            <span className={cn(
              "text-[9px] px-2 py-0.5 rounded font-medium text-white",
              statusColors[campaign.status]
            )}>
              {statusLabels[campaign.status]}
            </span>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {campaign.status !== 'active' && (
              <DropdownMenuItem onClick={() => onStatusChange('active')}>
                <Play className="w-4 h-4 mr-2" />
                Ativar
              </DropdownMenuItem>
            )}
            {campaign.status === 'active' && (
              <DropdownMenuItem onClick={() => onStatusChange('paused')}>
                <Pause className="w-4 h-4 mr-2" />
                Pausar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onStatusChange('ended')}>
              <Archive className="w-4 h-4 mr-2" />
              Encerrar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-500">
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {campaign.objective && (
        <p className="text-[11px] text-muted-foreground mb-4 line-clamp-2">
          {campaign.objective}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 text-[10px]">
        <div>
          <span className="text-muted-foreground block mb-1">Período</span>
          <span className="text-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {campaign.start_date 
              ? `${new Date(campaign.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${campaign.end_date ? new Date(campaign.end_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '...'}`
              : 'Não definido'
            }
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block mb-1">Budget</span>
          <span className="text-foreground flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {formatCurrency(campaign.budget)}
          </span>
        </div>
      </div>

      <Button variant="outline" className="w-full mt-4" size="sm">
        Ver Conteúdos
      </Button>
    </motion.div>
  );
}

export default function CampaignsPage() {
  const navigate = useNavigate();
  const { 
    campaigns, 
    fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  } = useMarketingStore();

  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    objective: '',
    offer: '',
    audience: '',
    start_date: '',
    end_date: '',
    budget: '',
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreateCampaign = async () => {
    if (!newCampaign.name) {
      toast.error('Nome é obrigatório');
      return;
    }

    await createCampaign({
      name: newCampaign.name,
      objective: newCampaign.objective || undefined,
      offer: newCampaign.offer || undefined,
      audience: newCampaign.audience || undefined,
      start_date: newCampaign.start_date || undefined,
      end_date: newCampaign.end_date || undefined,
      budget: newCampaign.budget ? Number(newCampaign.budget) : undefined,
      status: 'draft',
    });

    setNewCampaign({ name: '', objective: '', offer: '', audience: '', start_date: '', end_date: '', budget: '' });
    setIsNewCampaignOpen(false);
    toast.success('Campanha criada');
  };

  const handleStatusChange = async (campaignId: string, status: Campaign['status']) => {
    await updateCampaign(campaignId, { status });
    toast.success(`Campanha ${status === 'active' ? 'ativada' : status === 'paused' ? 'pausada' : 'encerrada'}`);
  };

  const handleDelete = async (campaignId: string) => {
    await deleteCampaign(campaignId);
    toast.success('Campanha excluída');
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const draftCampaigns = campaigns.filter(c => c.status === 'draft');
  const endedCampaigns = campaigns.filter(c => ['paused', 'ended'].includes(c.status));

  return (
    <DashboardLayout title="Campanhas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-medium text-foreground tracking-tight">Campanhas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {activeCampaigns.length} campanhas ativas
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Pacote com IA
            </Button>
            <Button onClick={() => setIsNewCampaignOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </div>
        </div>

        {/* Active Campaigns */}
        {activeCampaigns.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              Ativas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onStatusChange={(status) => handleStatusChange(campaign.id, status)}
                  onDelete={() => handleDelete(campaign.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Draft Campaigns */}
        {draftCampaigns.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-500" />
              Rascunhos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {draftCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onStatusChange={(status) => handleStatusChange(campaign.id, status)}
                  onDelete={() => handleDelete(campaign.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Ended Campaigns */}
        {endedCampaigns.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              Encerradas / Pausadas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
              {endedCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onStatusChange={(status) => handleStatusChange(campaign.id, status)}
                  onDelete={() => handleDelete(campaign.id)}
                />
              ))}
            </div>
          </div>
        )}

        {campaigns.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Nenhuma campanha criada</p>
            <Button variant="outline" className="mt-4" onClick={() => setIsNewCampaignOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar primeira campanha
            </Button>
          </div>
        )}

        {/* New Campaign Dialog */}
        <Dialog open={isNewCampaignOpen} onOpenChange={setIsNewCampaignOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Campanha</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="Ex: Lançamento Verão 2025"
                />
              </div>
              <div>
                <Label>Objetivo</Label>
                <Textarea
                  value={newCampaign.objective}
                  onChange={(e) => setNewCampaign({ ...newCampaign, objective: e.target.value })}
                  placeholder="O que queremos alcançar com esta campanha?"
                  rows={2}
                />
              </div>
              <div>
                <Label>Oferta</Label>
                <Input
                  value={newCampaign.offer}
                  onChange={(e) => setNewCampaign({ ...newCampaign, offer: e.target.value })}
                  placeholder="Ex: 20% de desconto no pacote completo"
                />
              </div>
              <div>
                <Label>Público Alvo</Label>
                <Input
                  value={newCampaign.audience}
                  onChange={(e) => setNewCampaign({ ...newCampaign, audience: e.target.value })}
                  placeholder="Ex: Empresários 30-50 anos, São Paulo"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={newCampaign.start_date}
                    onChange={(e) => setNewCampaign({ ...newCampaign, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={newCampaign.end_date}
                    onChange={(e) => setNewCampaign({ ...newCampaign, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Budget (R$)</Label>
                <Input
                  type="number"
                  value={newCampaign.budget}
                  onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewCampaignOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateCampaign}>Criar Campanha</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
