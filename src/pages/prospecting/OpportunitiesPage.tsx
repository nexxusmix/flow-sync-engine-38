import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useProspectingStore } from "@/stores/prospectingStore";
import { ProspectOpportunity, OpportunityStage, OPPORTUNITY_STAGES } from "@/types/prospecting";
import { 
  Plus, Search, MoreHorizontal, Phone, Mail, Calendar,
  TrendingUp, AlertTriangle, ChevronRight, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

function OpportunityCard({ 
  opportunity, 
  onMove,
  onEdit,
}: { 
  opportunity: ProspectOpportunity;
  onMove: (stage: OpportunityStage) => void;
  onEdit: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const prospect = (opportunity as any).prospects;
  const isOverdue = opportunity.next_action_at && new Date(opportunity.next_action_at) < new Date();

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('opportunityId', opportunity.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`glass-card rounded-xl p-4 cursor-grab active:cursor-grabbing border border-transparent hover:border-primary/20 transition-all ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${isOverdue ? 'border-l-2 border-l-destructive' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium text-foreground truncate">{opportunity.title}</h4>
          <p className="text-[10px] text-primary font-medium uppercase tracking-wider">
            {prospect?.company_name || 'Empresa'}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>
            {OPPORTUNITY_STAGES.map((stage) => (
              <DropdownMenuItem 
                key={stage.type} 
                onClick={() => onMove(stage.type)}
                disabled={stage.type === opportunity.stage}
              >
                Mover para {stage.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Value */}
      <div className="mb-3">
        <p className="text-lg font-medium text-foreground">{formatCurrency(opportunity.estimated_value)}</p>
        {opportunity.probability > 0 && (
          <p className="text-[10px] text-muted-foreground">{opportunity.probability}% probabilidade</p>
        )}
      </div>

      {/* Next Action */}
      {opportunity.next_action_at && (
        <div className={`flex items-center gap-2 text-[10px] ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
          {isOverdue ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
          <span>
            {new Date(opportunity.next_action_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </span>
          {opportunity.next_action_type && (
            <span className="capitalize">• {opportunity.next_action_type}</span>
          )}
        </div>
      )}

      {/* Fit Score */}
      {opportunity.fit_score && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <span className={`text-[9px] px-2 py-0.5 rounded font-medium ${
            opportunity.fit_score === 'high' ? 'bg-primary/10 text-primary' :
            opportunity.fit_score === 'medium' ? 'bg-muted text-muted-foreground' :
            'bg-muted text-muted-foreground/60'
          }`}>
            Fit {opportunity.fit_score === 'high' ? 'Alto' : opportunity.fit_score === 'medium' ? 'Médio' : 'Baixo'}
          </span>
        </div>
      )}
    </div>
  );
}

function KanbanColumn({ 
  stage, 
  opportunities,
  onMove,
  onEdit,
}: { 
  stage: typeof OPPORTUNITY_STAGES[0];
  opportunities: ProspectOpportunity[];
  onMove: (oppId: string, stage: OpportunityStage) => void;
  onEdit: (opp: ProspectOpportunity) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  
  const totalValue = opportunities.reduce((acc, o) => acc + (o.estimated_value || 0), 0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const oppId = e.dataTransfer.getData('opportunityId');
    if (oppId) {
      onMove(oppId, stage.type);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div 
      className="flex-shrink-0 w-72 md:w-80"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="glass-card rounded-t-2xl p-4 border-b-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
            <h3 className="font-medium text-foreground text-sm">{stage.name}</h3>
          </div>
          <span className="text-xs font-medium text-foreground bg-muted px-2 py-0.5 rounded-full">
            {opportunities.length}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground font-light">
          {formatCurrency(totalValue)}
        </p>
      </div>

      {/* Column Content */}
      <div className={`glass-card rounded-b-2xl rounded-t-none p-3 space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto custom-scrollbar transition-all ${
        isDragOver ? 'bg-primary/5 border-primary/30' : ''
      }`}>
        {opportunities.map((opp) => (
          <OpportunityCard
            key={opp.id}
            opportunity={opp}
            onMove={(s) => onMove(opp.id, s)}
            onEdit={() => onEdit(opp)}
          />
        ))}

        {opportunities.length === 0 && (
          <div className={`text-center py-8 text-muted-foreground rounded-xl transition-all ${
            isDragOver ? 'bg-primary/10 border-2 border-dashed border-primary/30' : ''
          }`}>
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-light">{isDragOver ? 'Solte aqui' : 'Vazio'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OpportunitiesPage() {
  const { 
    opportunities, 
    prospects,
    fetchOpportunities, 
    fetchProspects,
    createOpportunity,
    updateOpportunity,
    moveOpportunityStage,
    getOpportunitiesByStage,
    opportunityFilters,
    setOpportunityFilters,
  } = useProspectingStore();

  const [isNewOppOpen, setIsNewOppOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<ProspectOpportunity | null>(null);
  const [newOpp, setNewOpp] = useState({
    prospect_id: '',
    title: '',
    estimated_value: '',
    probability: '30',
  });

  useEffect(() => {
    fetchOpportunities();
    fetchProspects();
  }, []);

  const handleCreateOpportunity = async () => {
    if (!newOpp.prospect_id) {
      toast.error('Selecione um target');
      return;
    }

    const prospect = prospects.find(p => p.id === newOpp.prospect_id);
    await createOpportunity(newOpp.prospect_id, {
      title: newOpp.title || prospect?.company_name || 'Nova Oportunidade',
      estimated_value: Number(newOpp.estimated_value) || undefined,
      probability: Number(newOpp.probability) || 30,
      stage: 'new',
    });

    setNewOpp({ prospect_id: '', title: '', estimated_value: '', probability: '30' });
    setIsNewOppOpen(false);
    toast.success('Oportunidade criada');
  };

  const handleMoveStage = async (oppId: string, stage: OpportunityStage) => {
    await moveOpportunityStage(oppId, stage);
    if (stage === 'won') {
      toast.success('Oportunidade ganha! Você pode criar um projeto a partir dela.');
    } else if (stage === 'lost') {
      toast.info('Oportunidade marcada como perdida');
    }
  };

  // Filter out won/lost for active pipeline
  const activeStages = OPPORTUNITY_STAGES.filter(s => !['won', 'lost'].includes(s.type));

  return (
    <DashboardLayout title="Pipeline de Prospecção">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-medium text-foreground tracking-tight">Pipeline</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {opportunities.length} oportunidades
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-9 w-[200px]"
                value={opportunityFilters.search}
                onChange={(e) => setOpportunityFilters({ search: e.target.value })}
              />
            </div>
            <Button onClick={() => setIsNewOppOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Oportunidade
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <ScrollArea className="w-full pb-4">
          <div className="flex gap-4 min-w-max pb-4 px-1">
            {activeStages.map((stage) => (
              <KanbanColumn
                key={stage.type}
                stage={stage}
                opportunities={getOpportunitiesByStage(stage.type)}
                onMove={handleMoveStage}
                onEdit={setEditingOpp}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Won/Lost Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card rounded-xl p-4 border-l-2 border-l-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ganhas</p>
                <p className="text-xl font-medium text-primary">
                  {getOpportunitiesByStage('won').length}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 border-l-2 border-l-destructive">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Perdidas</p>
                <p className="text-xl font-medium text-destructive">
                  {getOpportunitiesByStage('lost').length}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* New Opportunity Dialog */}
        <Dialog open={isNewOppOpen} onOpenChange={setIsNewOppOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Oportunidade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Target *</Label>
                <Select 
                  value={newOpp.prospect_id} 
                  onValueChange={(v) => setNewOpp({ ...newOpp, prospect_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um target" />
                  </SelectTrigger>
                  <SelectContent>
                    {prospects.filter(p => p.status === 'active').map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.company_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Título</Label>
                <Input
                  value={newOpp.title}
                  onChange={(e) => setNewOpp({ ...newOpp, title: e.target.value })}
                  placeholder="Nome da oportunidade"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor Estimado</Label>
                  <Input
                    type="number"
                    value={newOpp.estimated_value}
                    onChange={(e) => setNewOpp({ ...newOpp, estimated_value: e.target.value })}
                    placeholder="R$ 0"
                  />
                </div>
                <div>
                  <Label>Probabilidade (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newOpp.probability}
                    onChange={(e) => setNewOpp({ ...newOpp, probability: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewOppOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateOpportunity}>Criar Oportunidade</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Opportunity Dialog */}
        <Dialog open={!!editingOpp} onOpenChange={(open) => { if (!open) setEditingOpp(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Oportunidade</DialogTitle>
            </DialogHeader>
            {editingOpp && (
              <>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={editingOpp.title}
                      onChange={(e) => setEditingOpp({ ...editingOpp, title: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Valor Estimado</Label>
                      <Input
                        type="number"
                        value={editingOpp.estimated_value || ''}
                        onChange={(e) => setEditingOpp({ ...editingOpp, estimated_value: Number(e.target.value) || 0 })}
                        placeholder="R$ 0"
                      />
                    </div>
                    <div>
                      <Label>Probabilidade (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={editingOpp.probability || ''}
                        onChange={(e) => setEditingOpp({ ...editingOpp, probability: Number(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Fit Score</Label>
                    <Select
                      value={editingOpp.fit_score || ''}
                      onValueChange={(v: any) => setEditingOpp({ ...editingOpp, fit_score: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">Alto</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="low">Baixo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Estágio</Label>
                    <Select
                      value={editingOpp.stage}
                      onValueChange={(v: any) => setEditingOpp({ ...editingOpp, stage: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPPORTUNITY_STAGES.map(s => (
                          <SelectItem key={s.type} value={s.type}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Próxima Ação</Label>
                      <Input
                        type="date"
                        value={editingOpp.next_action_at ? new Date(editingOpp.next_action_at).toISOString().split('T')[0] : ''}
                        onChange={(e) => setEditingOpp({ ...editingOpp, next_action_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                      />
                    </div>
                    <div>
                      <Label>Tipo da Ação</Label>
                      <Select
                        value={editingOpp.next_action_type || ''}
                        onValueChange={(v: any) => setEditingOpp({ ...editingOpp, next_action_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dm">DM</SelectItem>
                          <SelectItem value="call">Ligação</SelectItem>
                          <SelectItem value="email">E-mail</SelectItem>
                          <SelectItem value="followup">Follow-up</SelectItem>
                          <SelectItem value="meeting">Reunião</SelectItem>
                          <SelectItem value="proposal">Proposta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Notas da Próxima Ação</Label>
                    <Input
                      value={editingOpp.next_action_notes || ''}
                      onChange={(e) => setEditingOpp({ ...editingOpp, next_action_notes: e.target.value })}
                      placeholder="O que fazer na próxima ação..."
                    />
                  </div>
                  <div>
                    <Label>Responsável</Label>
                    <Input
                      value={editingOpp.owner_name || ''}
                      onChange={(e) => setEditingOpp({ ...editingOpp, owner_name: e.target.value })}
                      placeholder="Nome do responsável"
                    />
                  </div>
                  <div>
                    <Label>Resumo da Conversa</Label>
                    <Textarea
                      value={editingOpp.conversation_summary || ''}
                      onChange={(e) => setEditingOpp({ ...editingOpp, conversation_summary: e.target.value })}
                      placeholder="Contexto da negociação..."
                      rows={3}
                    />
                  </div>
                  {editingOpp.stage === 'lost' && (
                    <div>
                      <Label>Motivo da Perda</Label>
                      <Textarea
                        value={editingOpp.lost_reason || ''}
                        onChange={(e) => setEditingOpp({ ...editingOpp, lost_reason: e.target.value })}
                        placeholder="Por que foi perdida..."
                        rows={2}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingOpp(null)}>Cancelar</Button>
                  <Button onClick={async () => {
                    await updateOpportunity(editingOpp.id, {
                      title: editingOpp.title,
                      estimated_value: editingOpp.estimated_value,
                      probability: editingOpp.probability,
                      fit_score: editingOpp.fit_score,
                      stage: editingOpp.stage,
                      next_action_at: editingOpp.next_action_at,
                      next_action_type: editingOpp.next_action_type,
                      next_action_notes: editingOpp.next_action_notes,
                      owner_name: editingOpp.owner_name,
                      conversation_summary: editingOpp.conversation_summary,
                      lost_reason: editingOpp.lost_reason,
                    });
                    setEditingOpp(null);
                    toast.success('Oportunidade atualizada');
                  }}>Salvar</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
