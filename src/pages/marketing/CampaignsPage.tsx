import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useMarketingStore } from "@/stores/marketingStore";
import { Campaign } from "@/types/marketing";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Plus, Megaphone, Sparkles, Calendar, DollarSign,
  MoreHorizontal, Play, Pause, Archive, Trash2, Loader2, Package, FileDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { generateCampaignPackage, isAIError, GenerateCampaignPackageResult } from "@/lib/ai";
import { CampaignPackagesSection } from "@/components/campaigns";

function CampaignCard({ 
  campaign, 
  campaigns,
  onStatusChange,
  onDelete,
  onExportPdf,
  isExporting,
}: { 
  campaign: Campaign;
  campaigns: Campaign[];
  onStatusChange: (status: Campaign['status']) => void;
  onDelete: () => void;
  onExportPdf: () => void;
  isExporting: boolean;
}) {
  const [showPackages, setShowPackages] = useState(false);
  
  const statusColors = {
    draft: 'bg-muted-foreground',
    active: 'bg-primary',
    paused: 'bg-muted-foreground/50',
    ended: 'bg-destructive',
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
            campaign.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
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

      <div className="flex gap-2 mt-4">
        <Button variant="outline" className="flex-1" size="sm"
          onClick={() => window.location.href = `/marketing/pipeline?campaign=${campaign.id}`}>
          Ver Conteúdos
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowPackages(true)}
          className="gap-1"
        >
          <Package className="w-3 h-3" />
          Pacotes
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExportPdf}
          disabled={isExporting}
          className="gap-1"
        >
          {isExporting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <FileDown className="w-3 h-3" />
          )}
          PDF
        </Button>
      </div>

      {/* Packages Sheet */}
      <Sheet open={showPackages} onOpenChange={setShowPackages}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              {campaign.name}
            </SheetTitle>
          </SheetHeader>
          <CampaignPackagesSection campaign={campaign} campaigns={campaigns} />
        </SheetContent>
      </Sheet>
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

  const [searchParams, setSearchParams] = useSearchParams();
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [isGeneratingPackage, setIsGeneratingPackage] = useState(false);
  const [packageResultOpen, setPackageResultOpen] = useState(false);
  const [generatedPackage, setGeneratedPackage] = useState<GenerateCampaignPackageResult | null>(null);
  const [selectedCampaignForPackage, setSelectedCampaignForPackage] = useState<Campaign | null>(null);
  const [exportingCampaignId, setExportingCampaignId] = useState<string | null>(null);
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
    if (searchParams.get('new') === 'true') {
      setIsNewCampaignOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const handleExportCampaignPdf = async (campaignId: string) => {
    setExportingCampaignId(campaignId);
    try {
      const { data, error } = await supabase.functions.invoke('export-campaign-pdf', {
        body: { campaign_id: campaignId }
      });

      if (error) throw error;

      if (data?.public_url) {
        window.open(data.public_url, '_blank');
        toast.success('PDF do pacote criativo gerado!');
      } else {
        throw new Error('URL não retornada');
      }
    } catch (err: any) {
      console.error('Export Campaign PDF error:', err);
      toast.error(err.message || 'Erro ao exportar PDF');
    } finally {
      setExportingCampaignId(null);
    }
  };

  const handleGeneratePackage = async (campaign?: Campaign) => {
    // If no campaign passed, use first active campaign or first draft
    const targetCampaign = campaign || activeCampaigns[0] || draftCampaigns[0];
    
    if (!targetCampaign) {
      toast.error('Crie uma campanha primeiro para gerar o pacote criativo.');
      return;
    }

    setSelectedCampaignForPackage(targetCampaign);
    setIsGeneratingPackage(true);
    
    try {
      const result = await generateCampaignPackage({
        campaign: {
          id: targetCampaign.id,
          name: targetCampaign.name,
          objective: targetCampaign.objective || undefined,
          offer: targetCampaign.offer || undefined,
          audience: targetCampaign.audience || undefined,
          start_date: targetCampaign.start_date || undefined,
          end_date: targetCampaign.end_date || undefined,
          budget: targetCampaign.budget || undefined,
        }
      });

      if (isAIError(result)) {
        if (result.status === 429) {
          toast.error('Limite de requisições excedido. Tente novamente em alguns segundos.');
        } else if (result.status === 402) {
          toast.error('Créditos insuficientes. Adicione créditos para continuar.');
        } else {
          toast.error(result.error || 'Erro ao gerar pacote criativo');
        }
        return;
      }

      setGeneratedPackage(result);
      setPackageResultOpen(true);
      toast.success('Pacote criativo gerado com sucesso!');
    } catch (err) {
      console.error('handleGeneratePackage error:', err);
      toast.error('Erro ao gerar pacote. Tente novamente.');
    } finally {
      setIsGeneratingPackage(false);
    }
  };

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
            <Button 
              variant="outline"
              onClick={() => handleGeneratePackage()}
              disabled={isGeneratingPackage}
            >
              {isGeneratingPackage ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {isGeneratingPackage ? 'Gerando...' : 'Gerar Pacote com IA'}
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
                  campaigns={campaigns}
                  onStatusChange={(status) => handleStatusChange(campaign.id, status)}
                  onDelete={() => handleDelete(campaign.id)}
                  onExportPdf={() => handleExportCampaignPdf(campaign.id)}
                  isExporting={exportingCampaignId === campaign.id}
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
                  campaigns={campaigns}
                  onStatusChange={(status) => handleStatusChange(campaign.id, status)}
                  onDelete={() => handleDelete(campaign.id)}
                  onExportPdf={() => handleExportCampaignPdf(campaign.id)}
                  isExporting={exportingCampaignId === campaign.id}
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
                  campaigns={campaigns}
                  onStatusChange={(status) => handleStatusChange(campaign.id, status)}
                  onDelete={() => handleDelete(campaign.id)}
                  onExportPdf={() => handleExportCampaignPdf(campaign.id)}
                  isExporting={exportingCampaignId === campaign.id}
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

        {/* Package Result Sheet */}
        <Sheet open={packageResultOpen} onOpenChange={setPackageResultOpen}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Pacote Criativo
                {selectedCampaignForPackage && (
                  <span className="text-xs text-muted-foreground font-normal">
                    — {selectedCampaignForPackage.name}
                  </span>
                )}
              </SheetTitle>
            </SheetHeader>
            
            {generatedPackage && (
              <div className="space-y-6 mt-6">
                {/* Concept Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Conceito Narrativo
                  </h4>
                  <div className="space-y-2 pl-3 border-l-2 border-muted">
                    {generatedPackage.concept.headline && (
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase">Headline</span>
                        <p className="text-sm font-medium text-foreground">{generatedPackage.concept.headline}</p>
                      </div>
                    )}
                    {generatedPackage.concept.subheadline && (
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase">Subheadline</span>
                        <p className="text-sm text-foreground">{generatedPackage.concept.subheadline}</p>
                      </div>
                    )}
                    {generatedPackage.concept.big_idea && (
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase">Big Idea</span>
                        <p className="text-sm text-foreground">{generatedPackage.concept.big_idea}</p>
                      </div>
                    )}
                    {generatedPackage.concept.premissa && (
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase">Premissa</span>
                        <p className="text-sm text-foreground">{generatedPackage.concept.premissa}</p>
                      </div>
                    )}
                    {generatedPackage.concept.tom && (
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase">Tom</span>
                        <p className="text-sm text-foreground">{generatedPackage.concept.tom}</p>
                      </div>
                    )}
                    {generatedPackage.concept.argumento_comercial && (
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase">Argumento Comercial</span>
                        <p className="text-sm text-foreground">{generatedPackage.concept.argumento_comercial}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Script Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Roteiro Base
                  </h4>
                  <div className="space-y-2 pl-3 border-l-2 border-muted">
                    {generatedPackage.script.hook && (
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase">Hook</span>
                        <p className="text-sm text-foreground">{generatedPackage.script.hook}</p>
                      </div>
                    )}
                    {generatedPackage.script.desenvolvimento && (
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase">Desenvolvimento</span>
                        <p className="text-sm text-foreground whitespace-pre-line">{generatedPackage.script.desenvolvimento}</p>
                      </div>
                    )}
                    {generatedPackage.script.cta && (
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase">CTA</span>
                        <p className="text-sm text-foreground">{generatedPackage.script.cta}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Suggestions */}
                {generatedPackage.content_suggestions && generatedPackage.content_suggestions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Sugestões de Conteúdo
                    </h4>
                    <div className="space-y-2">
                      {generatedPackage.content_suggestions.map((suggestion, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-foreground">{suggestion.title}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {suggestion.format}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{suggestion.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button 
                    className="w-full" 
                    onClick={() => setPackageResultOpen(false)}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}
