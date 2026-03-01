import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useProspectingStore } from "@/stores/prospectingStore";
import { Prospect, ProspectList } from "@/types/prospecting";
import { 
  Plus, Search, Filter, Upload, MoreHorizontal, 
  Instagram, Globe, Linkedin, Mail, Phone, Ban,
  Building2, MapPin, User, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

function ProspectCard({ 
  prospect, 
  onCreateOpportunity,
  onBlacklist,
  onEdit,
}: { 
  prospect: Prospect;
  onCreateOpportunity: () => void;
  onBlacklist: () => void;
  onEdit: () => void;
}) {
  const priorityColors = {
    high: 'bg-destructive/10 text-destructive border-destructive/20',
    medium: 'bg-muted text-muted-foreground border-border',
    low: 'bg-muted text-muted-foreground border-border',
  };

  const statusColors = {
    active: 'text-primary',
    paused: 'text-muted-foreground',
    blacklisted: 'text-destructive',
  };

  return (
    <div className={`glass-card rounded-xl p-4 border ${prospect.status === 'blacklisted' ? 'border-red-500/20 opacity-60' : 'border-transparent hover:border-primary/20'} transition-all`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-foreground truncate">{prospect.company_name}</h4>
            {prospect.status === 'blacklisted' && (
              <Ban className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            )}
          </div>
          {prospect.niche && (
            <p className="text-[10px] text-primary font-medium uppercase tracking-wider mb-2">{prospect.niche}</p>
          )}
          
          {/* Contact Info */}
          <div className="flex flex-wrap gap-2 mt-3">
            {prospect.instagram && (
              <a href={`https://instagram.com/${prospect.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary">
                <Instagram className="w-3 h-3" />
                <span className="truncate max-w-[80px]">{prospect.instagram}</span>
              </a>
            )}
            {prospect.website && (
              <a href={prospect.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary">
                <Globe className="w-3 h-3" />
                Site
              </a>
            )}
            {prospect.email && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Mail className="w-3 h-3" />
                <span className="truncate max-w-[100px]">{prospect.email}</span>
              </span>
            )}
            {prospect.phone && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Phone className="w-3 h-3" />
                {prospect.phone}
              </span>
            )}
          </div>

          {/* Decision Maker & Location */}
          <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
            {prospect.decision_maker_name && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {prospect.decision_maker_name}
              </span>
            )}
            {prospect.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {prospect.city}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`text-[9px] px-2 py-0.5 rounded border font-medium ${priorityColors[prospect.priority]}`}>
            {prospect.priority === 'high' ? 'Alta' : prospect.priority === 'medium' ? 'Média' : 'Baixa'}
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onCreateOpportunity}>
                <ChevronRight className="w-4 h-4 mr-2" />
                Criar Oportunidade
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                Editar
              </DropdownMenuItem>
              {prospect.status !== 'blacklisted' && (
                <DropdownMenuItem onClick={onBlacklist} className="text-red-500">
                  <Ban className="w-4 h-4 mr-2" />
                  Não Contatar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export default function TargetsPage() {
  const { 
    prospects, 
    lists,
    fetchProspects, 
    fetchLists,
    createProspect,
    createList,
    updateProspect,
    blacklistProspect,
    createOpportunity,
    prospectFilters,
    setProspectFilters,
    getFilteredProspects,
  } = useProspectingStore();

  const [isNewProspectOpen, setIsNewProspectOpen] = useState(false);
  const [isNewListOpen, setIsNewListOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [newProspect, setNewProspect] = useState<Partial<Prospect>>({
    priority: 'medium',
    status: 'active',
  });
  const [newList, setNewList] = useState({ name: '', segment: '' });

  useEffect(() => {
    fetchProspects();
    fetchLists();
  }, []);

  const filteredProspects = getFilteredProspects();

  const handleCreateProspect = async () => {
    if (!newProspect.company_name) {
      toast.error('Nome da empresa é obrigatório');
      return;
    }
    
    await createProspect(newProspect);
    setNewProspect({ priority: 'medium', status: 'active' });
    setIsNewProspectOpen(false);
    toast.success('Target criado com sucesso');
  };

  const handleCreateList = async () => {
    if (!newList.name) {
      toast.error('Nome da lista é obrigatório');
      return;
    }
    
    await createList(newList);
    setNewList({ name: '', segment: '' });
    setIsNewListOpen(false);
    toast.success('Lista criada com sucesso');
  };

  const handleCreateOpportunity = async (prospect: Prospect) => {
    const opp = await createOpportunity(prospect.id, {
      title: prospect.company_name,
      stage: 'new',
    });
    if (opp) {
      toast.success('Oportunidade criada');
    }
  };

  const handleBlacklist = async (prospect: Prospect) => {
    await blacklistProspect(prospect.id, 'Solicitou não contato');
    toast.success('Prospect marcado como não contatar');
  };

  return (
    <DashboardLayout title="Targets">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-medium text-foreground tracking-tight">Targets</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredProspects.length} de {prospects.length} targets
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsNewListOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Lista
            </Button>
            <Button onClick={() => setIsNewProspectOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Target
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar targets..."
              className="pl-9"
              value={prospectFilters.search}
              onChange={(e) => setProspectFilters({ search: e.target.value })}
            />
          </div>
          
          <Select 
            value={prospectFilters.list_id} 
            onValueChange={(v) => setProspectFilters({ list_id: v })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todas as listas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as listas</SelectItem>
              {lists.map((list) => (
                <SelectItem key={list.id} value={list.id}>{list.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={prospectFilters.status} 
            onValueChange={(v: any) => setProspectFilters({ status: v })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="paused">Pausados</SelectItem>
              <SelectItem value="blacklisted">Bloqueados</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={prospectFilters.priority} 
            onValueChange={(v: any) => setProspectFilters({ priority: v })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Prospects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProspects.map((prospect) => (
            <ProspectCard
              key={prospect.id}
              prospect={prospect}
              onCreateOpportunity={() => handleCreateOpportunity(prospect)}
              onBlacklist={() => handleBlacklist(prospect)}
              onEdit={() => setEditingProspect(prospect)}
            />
          ))}
        </div>

        {filteredProspects.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Nenhum target encontrado</p>
            <Button variant="outline" className="mt-4" onClick={() => setIsNewProspectOpen(true)}>
              Adicionar primeiro target
            </Button>
          </div>
        )}

        {/* New Prospect Dialog */}
        <Dialog open={isNewProspectOpen} onOpenChange={setIsNewProspectOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Target</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Empresa *</Label>
                  <Input
                    value={newProspect.company_name || ''}
                    onChange={(e) => setNewProspect({ ...newProspect, company_name: e.target.value })}
                    placeholder="Nome da empresa"
                  />
                </div>
                <div>
                  <Label>Nicho</Label>
                  <Input
                    value={newProspect.niche || ''}
                    onChange={(e) => setNewProspect({ ...newProspect, niche: e.target.value })}
                    placeholder="Ex: Incorporadora"
                  />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={newProspect.city || ''}
                    onChange={(e) => setNewProspect({ ...newProspect, city: e.target.value })}
                    placeholder="Ex: São Paulo"
                  />
                </div>
                <div>
                  <Label>Instagram</Label>
                  <Input
                    value={newProspect.instagram || ''}
                    onChange={(e) => setNewProspect({ ...newProspect, instagram: e.target.value })}
                    placeholder="@empresa"
                  />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input
                    value={newProspect.website || ''}
                    onChange={(e) => setNewProspect({ ...newProspect, website: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={newProspect.email || ''}
                    onChange={(e) => setNewProspect({ ...newProspect, email: e.target.value })}
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={newProspect.phone || ''}
                    onChange={(e) => setNewProspect({ ...newProspect, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <Label>Decisor</Label>
                  <Input
                    value={newProspect.decision_maker_name || ''}
                    onChange={(e) => setNewProspect({ ...newProspect, decision_maker_name: e.target.value })}
                    placeholder="Nome do decisor"
                  />
                </div>
                <div>
                  <Label>Cargo do Decisor</Label>
                  <Input
                    value={newProspect.decision_maker_role || ''}
                    onChange={(e) => setNewProspect({ ...newProspect, decision_maker_role: e.target.value })}
                    placeholder="CEO, Diretor..."
                  />
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select 
                    value={newProspect.priority} 
                    onValueChange={(v: any) => setNewProspect({ ...newProspect, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Lista</Label>
                  <Select 
                    value={newProspect.list_id || ''} 
                    onValueChange={(v) => setNewProspect({ ...newProspect, list_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar lista" />
                    </SelectTrigger>
                    <SelectContent>
                      {lists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>{list.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea
                  value={newProspect.notes || ''}
                  onChange={(e) => setNewProspect({ ...newProspect, notes: e.target.value })}
                  placeholder="Observações sobre o target..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewProspectOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateProspect}>Criar Target</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New List Dialog */}
        <Dialog open={isNewListOpen} onOpenChange={setIsNewListOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Lista</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Nome da Lista *</Label>
                <Input
                  value={newList.name}
                  onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                  placeholder="Ex: Incorporadoras SP"
                />
              </div>
              <div>
                <Label>Segmento</Label>
                <Input
                  value={newList.segment}
                  onChange={(e) => setNewList({ ...newList, segment: e.target.value })}
                  placeholder="Ex: Imobiliário"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewListOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateList}>Criar Lista</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
