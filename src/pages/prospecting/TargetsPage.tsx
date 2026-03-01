import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useProspectingStore } from "@/stores/prospectingStore";
import { Prospect, ProspectList } from "@/types/prospecting";
import { 
  Plus, Search, Filter, Upload, MoreHorizontal, 
  Instagram, Globe, Linkedin, Mail, Phone, Ban,
  Building2, MapPin, User, ChevronRight, FileSpreadsheet, X, Check, AlertCircle
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
import { DropZone } from "@/components/ui/DropZone";
import { ScrollArea } from "@/components/ui/scroll-area";

const CSV_COLUMN_MAP: Record<string, string> = {
  'empresa': 'company_name', 'company': 'company_name', 'company_name': 'company_name', 'nome': 'company_name',
  'nicho': 'niche', 'niche': 'niche', 'segmento': 'niche',
  'cidade': 'city', 'city': 'city',
  'instagram': 'instagram', 'ig': 'instagram',
  'website': 'website', 'site': 'website', 'url': 'website',
  'email': 'email', 'e-mail': 'email',
  'telefone': 'phone', 'phone': 'phone', 'cel': 'phone', 'celular': 'phone', 'whatsapp': 'phone',
  'decisor': 'decision_maker_name', 'decision_maker': 'decision_maker_name', 'decision_maker_name': 'decision_maker_name',
  'cargo': 'decision_maker_role', 'cargo_decisor': 'decision_maker_role', 'decision_maker_role': 'decision_maker_role',
  'prioridade': 'priority', 'priority': 'priority',
  'notas': 'notes', 'notes': 'notes', 'observacoes': 'notes',
  'linkedin': 'linkedin',
};

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const firstLine = lines[0];
  const sep = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';
  const headers = firstLine.split(sep).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(sep).map(v => v.trim().replace(/^["']|["']$/g, ''));
    if (vals.every(v => !v)) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
    rows.push(row);
  }
  return rows;
}

function mapCSVToProspects(rows: Record<string, string>[]): Partial<Prospect>[] {
  return rows.map(row => {
    const prospect: Record<string, any> = { status: 'active', priority: 'medium' };
    for (const [csvCol, value] of Object.entries(row)) {
      const mappedKey = CSV_COLUMN_MAP[csvCol.toLowerCase().trim()];
      if (mappedKey && value) {
        if (mappedKey === 'priority') {
          const v = value.toLowerCase();
          prospect[mappedKey] = v === 'alta' || v === 'high' ? 'high' : v === 'baixa' || v === 'low' ? 'low' : 'medium';
        } else {
          prospect[mappedKey] = value;
        }
      }
    }
    return prospect as Partial<Prospect>;
  }).filter(p => p.company_name);
}

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
    <div className={`glass-card rounded-xl p-4 border ${prospect.status === 'blacklisted' ? 'border-destructive/20 opacity-60' : 'border-transparent hover:border-primary/20'} transition-all`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-foreground truncate">{prospect.company_name}</h4>
            {prospect.status === 'blacklisted' && (
              <Ban className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
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
                <DropdownMenuItem onClick={onBlacklist} className="text-destructive">
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
    importProspects,
    prospectFilters,
    setProspectFilters,
    getFilteredProspects,
  } = useProspectingStore();

  const [isNewProspectOpen, setIsNewProspectOpen] = useState(false);
  const [isNewListOpen, setIsNewListOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<Partial<Prospect>[]>([]);
  const [importListId, setImportListId] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
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

  const handleCSVFiles = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      const mapped = mapCSVToProspects(rows);
      if (mapped.length === 0) {
        toast.error('Nenhum target válido encontrado. Verifique se a coluna "empresa" ou "company_name" existe.');
        return;
      }
      setCsvPreview(mapped);
    };
    reader.readAsText(file);
  };

  const handleImportConfirm = async () => {
    if (csvPreview.length === 0) return;
    setIsImporting(true);
    try {
      const toImport = csvPreview.map(p => ({
        ...p,
        ...(importListId ? { list_id: importListId } : {}),
      }));
      await importProspects(toImport);
      toast.success(`${csvPreview.length} targets importados com sucesso!`);
      setCsvPreview([]);
      setIsImportOpen(false);
      setImportListId('');
    } catch {
      toast.error('Erro ao importar targets');
    } finally {
      setIsImporting(false);
    }
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
            <Button variant="outline" onClick={() => { setCsvPreview([]); setIsImportOpen(true); }}>
              <Upload className="w-4 h-4 mr-2" />
              Importar CSV
            </Button>
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

        {/* Edit Prospect Dialog */}
        <Dialog open={!!editingProspect} onOpenChange={(open) => { if (!open) setEditingProspect(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Target</DialogTitle>
            </DialogHeader>
            {editingProspect && (
              <>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Empresa *</Label>
                      <Input
                        value={editingProspect.company_name || ''}
                        onChange={(e) => setEditingProspect({ ...editingProspect, company_name: e.target.value })}
                        placeholder="Nome da empresa"
                      />
                    </div>
                    <div>
                      <Label>Nicho</Label>
                      <Input
                        value={editingProspect.niche || ''}
                        onChange={(e) => setEditingProspect({ ...editingProspect, niche: e.target.value })}
                        placeholder="Ex: Incorporadora"
                      />
                    </div>
                    <div>
                      <Label>Cidade</Label>
                      <Input
                        value={editingProspect.city || ''}
                        onChange={(e) => setEditingProspect({ ...editingProspect, city: e.target.value })}
                        placeholder="Ex: São Paulo"
                      />
                    </div>
                    <div>
                      <Label>Instagram</Label>
                      <Input
                        value={editingProspect.instagram || ''}
                        onChange={(e) => setEditingProspect({ ...editingProspect, instagram: e.target.value })}
                        placeholder="@empresa"
                      />
                    </div>
                    <div>
                      <Label>Website</Label>
                      <Input
                        value={editingProspect.website || ''}
                        onChange={(e) => setEditingProspect({ ...editingProspect, website: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label>E-mail</Label>
                      <Input
                        type="email"
                        value={editingProspect.email || ''}
                        onChange={(e) => setEditingProspect({ ...editingProspect, email: e.target.value })}
                        placeholder="contato@empresa.com"
                      />
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <Input
                        value={editingProspect.phone || ''}
                        onChange={(e) => setEditingProspect({ ...editingProspect, phone: e.target.value })}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div>
                      <Label>Decisor</Label>
                      <Input
                        value={editingProspect.decision_maker_name || ''}
                        onChange={(e) => setEditingProspect({ ...editingProspect, decision_maker_name: e.target.value })}
                        placeholder="Nome do decisor"
                      />
                    </div>
                    <div>
                      <Label>Cargo do Decisor</Label>
                      <Input
                        value={editingProspect.decision_maker_role || ''}
                        onChange={(e) => setEditingProspect({ ...editingProspect, decision_maker_role: e.target.value })}
                        placeholder="CEO, Diretor..."
                      />
                    </div>
                    <div>
                      <Label>Prioridade</Label>
                      <Select
                        value={editingProspect.priority}
                        onValueChange={(v: any) => setEditingProspect({ ...editingProspect, priority: v })}
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
                        value={editingProspect.list_id || ''}
                        onValueChange={(v) => setEditingProspect({ ...editingProspect, list_id: v })}
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
                      value={editingProspect.notes || ''}
                      onChange={(e) => setEditingProspect({ ...editingProspect, notes: e.target.value })}
                      placeholder="Observações sobre o target..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingProspect(null)}>Cancelar</Button>
                  <Button onClick={async () => {
                    if (!editingProspect.company_name) {
                      toast.error('Nome da empresa é obrigatório');
                      return;
                    }
                    await updateProspect(editingProspect.id, {
                      company_name: editingProspect.company_name,
                      niche: editingProspect.niche,
                      city: editingProspect.city,
                      instagram: editingProspect.instagram,
                      website: editingProspect.website,
                      email: editingProspect.email,
                      phone: editingProspect.phone,
                      decision_maker_name: editingProspect.decision_maker_name,
                      decision_maker_role: editingProspect.decision_maker_role,
                      priority: editingProspect.priority,
                      list_id: editingProspect.list_id,
                      notes: editingProspect.notes,
                    });
                    setEditingProspect(null);
                    toast.success('Target atualizado');
                  }}>Salvar</Button>
                </DialogFooter>
              </>
            )}
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

        {/* Import CSV Dialog */}
        <Dialog open={isImportOpen} onOpenChange={(open) => { if (!open) { setCsvPreview([]); setImportListId(''); } setIsImportOpen(open); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                Importar Targets via CSV
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {csvPreview.length === 0 ? (
                <>
                  <DropZone
                    onFiles={handleCSVFiles}
                    multiple={false}
                    accept=".csv,.tsv,.txt,.xls,.xlsx"
                  >
                    <div className="flex flex-col items-center justify-center gap-2 py-4">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Arraste um arquivo CSV aqui ou clique para selecionar
                      </p>
                      <p className="text-[10px] text-muted-foreground/60">
                        Formatos: .csv, .tsv — Separadores: vírgula, ponto-e-vírgula ou tab
                      </p>
                    </div>
                  </DropZone>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-xs font-medium text-foreground mb-2">Colunas reconhecidas automaticamente:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['empresa', 'nicho', 'cidade', 'instagram', 'website', 'email', 'telefone', 'decisor', 'cargo', 'prioridade', 'notas', 'linkedin'].map(col => (
                        <span key={col} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{col}</span>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Também aceita nomes em inglês: company_name, niche, city, phone, etc.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">{csvPreview.length} targets encontrados</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setCsvPreview([])}>
                      <X className="w-4 h-4 mr-1" />
                      Limpar
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Adicionar à lista (opcional)</Label>
                    <Select value={importListId} onValueChange={setImportListId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sem lista específica" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sem lista</SelectItem>
                        {lists.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <ScrollArea className="max-h-[300px] rounded-lg border border-border">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50 sticky top-0">
                          <tr>
                            <th className="text-left p-2 font-medium text-muted-foreground">#</th>
                            <th className="text-left p-2 font-medium text-muted-foreground">Empresa</th>
                            <th className="text-left p-2 font-medium text-muted-foreground">Nicho</th>
                            <th className="text-left p-2 font-medium text-muted-foreground">Cidade</th>
                            <th className="text-left p-2 font-medium text-muted-foreground">Instagram</th>
                            <th className="text-left p-2 font-medium text-muted-foreground">E-mail</th>
                            <th className="text-left p-2 font-medium text-muted-foreground">Prioridade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.slice(0, 50).map((p, i) => (
                            <tr key={i} className="border-t border-border/50 hover:bg-muted/20">
                              <td className="p-2 text-muted-foreground">{i + 1}</td>
                              <td className="p-2 font-medium text-foreground">{p.company_name}</td>
                              <td className="p-2 text-muted-foreground">{p.niche || '—'}</td>
                              <td className="p-2 text-muted-foreground">{p.city || '—'}</td>
                              <td className="p-2 text-muted-foreground">{p.instagram || '—'}</td>
                              <td className="p-2 text-muted-foreground">{p.email || '—'}</td>
                              <td className="p-2">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  p.priority === 'high' ? 'bg-destructive/10 text-destructive' : 
                                  p.priority === 'low' ? 'bg-muted text-muted-foreground' : 
                                  'bg-primary/10 text-primary'
                                }`}>
                                  {p.priority === 'high' ? 'Alta' : p.priority === 'low' ? 'Baixa' : 'Média'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {csvPreview.length > 50 && (
                      <p className="text-[10px] text-muted-foreground text-center py-2">
                        Mostrando 50 de {csvPreview.length} targets
                      </p>
                    )}
                  </ScrollArea>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsImportOpen(false); setCsvPreview([]); }}>Cancelar</Button>
              <Button onClick={handleImportConfirm} disabled={csvPreview.length === 0 || isImporting}>
                {isImporting ? 'Importando...' : `Importar ${csvPreview.length} Targets`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
