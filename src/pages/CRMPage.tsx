import { useState, useRef, MouseEvent } from "react";
import { formatCurrencyBRL } from "@/utils/format";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KanbanColumn } from "@/components/crm/KanbanColumn";
import { DealDrawer } from "@/components/crm/DealDrawer";
import { useCRM, CRM_STAGES, Deal } from "@/hooks/useCRM";
import { useAuth } from "@/hooks/useAuth";
import { Filter, ChevronDown, Plus, Sparkles, Users, Loader2, Search, X as XIcon, Flame, Snowflake, ThermometerSun } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CRMPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [activeView, setActiveView] = useState<'kanban' | 'lista'>('kanban');
  const [showNewDealDialog, setShowNewDealDialog] = useState(false);
  const [newDealStage, setNewDealStage] = useState('lead');
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [tempFilter, setTempFilter] = useState<string | null>(null);
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  
  // New deal form state
  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealValue, setNewDealValue] = useState('');
  const [newDealContactId, setNewDealContactId] = useState('');
  const [newDealTemperature, setNewDealTemperature] = useState('warm');
  const [newDealSource, setNewDealSource] = useState('');
  
  const { isLoading: authLoading } = useAuth();
  const { deals, contacts, stages, metrics, isLoading: dataLoading, moveDealToStage, deleteDeal, createDeal, isCreatingDeal } = useCRM();
  
  const isLoading = authLoading || dataLoading;
  
  // Use stages from DB (with fallback to CRM_STAGES)
  const activeStages = stages.length > 0 ? stages : CRM_STAGES;

  const handleMouseDown = (e: MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Transform deals for KanbanColumn format - filter by stage.key
  const transformedDeals = deals.map(deal => ({
    id: deal.id,
    title: deal.title,
    company: deal.company,
    value: deal.value,
    probability: deal.score || 50,
    stage: deal.stage, // This is stage_key from useCRM
    initials: deal.contactName?.split(' ').map(n => n[0]).slice(0, 2) || ['?'],
    daysInStage: 0,
    nextAction: deal.nextAction,
    score: deal.score || 0,
    tags: [] as string[],
    ownerInitials: 'SQ',
    lastActivity: deal.updatedAt || new Date().toISOString(),
  }));

  const hasFilters = searchQuery || tempFilter || minValue || maxValue;

  // Apply filters
  const filteredDeals = transformedDeals.filter(d => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!d.title.toLowerCase().includes(q) && !(d.company || '').toLowerCase().includes(q)) return false;
    }
    if (minValue && d.value < parseFloat(minValue)) return false;
    if (maxValue && d.value > parseFloat(maxValue)) return false;
    return true;
  });

  // Also filter raw deals for temperature (which is on Deal, not transformedDeal)
  const tempFilteredIds = tempFilter
    ? new Set(deals.filter(d => (d as any).temperature === tempFilter).map(d => d.id))
    : null;

  const finalDeals = tempFilteredIds
    ? filteredDeals.filter(d => tempFilteredIds.has(d.id))
    : filteredDeals;

  const hasDeals = deals.length > 0;
  
  const openNewDealDialog = (stage?: string) => {
    setNewDealStage(stage || 'lead');
    setNewDealTitle('');
    setNewDealValue('');
    setNewDealContactId('');
    setNewDealTemperature('warm');
    setNewDealSource('');
    setShowNewDealDialog(true);
  };

  const handleCreateDeal = () => {
    if (!newDealTitle.trim()) return;
    createDeal({
      title: newDealTitle,
      stage: newDealStage,
      value: parseFloat(newDealValue) || 0,
      contactId: newDealContactId || undefined,
      temperature: newDealTemperature,
      source: newDealSource || undefined,
    });
    setShowNewDealDialog(false);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Cine CRM">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Cine CRM">
      <div className="space-y-4 md:space-y-6 animate-fade-in max-w-[1600px] 2xl:max-w-[1800px] mx-auto">
        {/* Header Title */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tighter text-foreground">
            Pipeline <span className="squad-logo-text font-normal text-muted-foreground">Comercial</span>
          </h1>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black text-primary uppercase tracking-wider">Live Sync</span>
          </div>
        </div>

        {/* CRM Filter Header */}
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* View Toggle */}
            <div className="flex rounded-full border border-border p-1">
              <button 
                onClick={() => setActiveView('kanban')}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                  activeView === 'kanban' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Kanban
              </button>
              <button 
                onClick={() => setActiveView('lista')}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                  activeView === 'lista' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Lista
              </button>
            </div>

            {/* Filter Button */}
            <button className="chip flex items-center gap-2" onClick={() => setTempFilter(null)}>
              <Filter className="w-3 h-3" />
              Owner: Todos
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* Temperature Filters */}
            <div className="flex items-center gap-1">
              {[
                { key: 'hot', label: 'Quente', icon: Flame, color: 'text-primary' },
                { key: 'warm', label: 'Morno', icon: ThermometerSun, color: 'text-muted-foreground' },
                { key: 'cold', label: 'Frio', icon: Snowflake, color: 'text-blue-400' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setTempFilter(tempFilter === t.key ? null : t.key)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all border ${
                    tempFilter === t.key
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                  }`}
                >
                  <t.icon className={`w-3 h-3 ${tempFilter !== t.key ? t.color : ''}`} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search + Value Filters */}
          <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
            <div className="relative flex-1 md:flex-none md:w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar deal..."
                className="w-full pl-9 pr-8 py-2 rounded-full bg-muted border border-border text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <XIcon className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>
            <input
              type="number"
              value={minValue}
              onChange={e => setMinValue(e.target.value)}
              placeholder="Mín R$"
              className="w-24 px-3 py-2 rounded-full bg-muted border border-border text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
            />
            <input
              type="number"
              value={maxValue}
              onChange={e => setMaxValue(e.target.value)}
              placeholder="Máx R$"
              className="w-24 px-3 py-2 rounded-full bg-muted border border-border text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
            />
            {hasFilters && (
              <button
                onClick={() => { setSearchQuery(''); setTempFilter(null); setMinValue(''); setMaxValue(''); }}
                className="text-[9px] font-bold text-destructive uppercase tracking-wider hover:underline flex items-center gap-1"
              >
                <XIcon className="w-3 h-3" /> Limpar
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Forecast Badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-wider">
                Forecast: {formatCurrencyBRL(metrics.forecast)}
              </span>
            </div>

            {/* New Deal Button */}
            <button className="btn-primary" onClick={() => openNewDealDialog()}>
              <Plus className="w-4 h-4" />
              Novo Deal
            </button>
          </div>
        </div>

        {/* Kanban Board Area or Empty State */}
        {hasDeals ? (
          <div 
            ref={scrollRef}
            className="overflow-x-auto pb-4 custom-scrollbar cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
            <div className="flex gap-4 min-w-max p-1">
              {activeStages.map(stage => (
                <KanbanColumn
                  key={stage.key}
                  title={stage.title}
                  color={stage.color}
                  stageKey={stage.key}
                  count={finalDeals.filter(d => d.stage === stage.key).length}
                  deals={finalDeals.filter(d => d.stage === stage.key)}
                  onDeleteDeal={(id) => deleteDeal(id)}
                  onMoveDeal={(dealId, toStage) => moveDealToStage({ dealId, stage: toStage })}
                  onOpenDeal={(id) => setSelectedDealId(id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-card p-12 flex flex-col items-center justify-center min-h-[400px]">
            <EmptyState
              type="neutral"
              icon={Users}
              title="Nenhum deal no CRM"
              description="Comece adicionando seu primeiro deal para acompanhar o pipeline comercial"
            />
            <Button className="mt-6" size="lg" onClick={() => openNewDealDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Deal
            </Button>
          </div>
        )}
      </div>

      {/* New Deal Dialog */}
      <Dialog open={showNewDealDialog} onOpenChange={setShowNewDealDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Deal</DialogTitle>
            <DialogDescription>Adicione uma nova oportunidade ao pipeline</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="deal-title">Título *</Label>
              <Input 
                id="deal-title"
                placeholder="Ex: Vídeo institucional - Empresa X" 
                value={newDealTitle}
                onChange={(e) => setNewDealTitle(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deal-value">Valor (R$)</Label>
                <Input 
                  id="deal-value"
                  type="number"
                  placeholder="0"
                  value={newDealValue}
                  onChange={(e) => setNewDealValue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Temperatura</Label>
                <Select value={newDealTemperature} onValueChange={setNewDealTemperature}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cold">Frio</SelectItem>
                    <SelectItem value="warm">Morno</SelectItem>
                    <SelectItem value="hot">Quente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contato</Label>
              <Select value={newDealContactId} onValueChange={setNewDealContactId}>
                <SelectTrigger><SelectValue placeholder="Selecionar contato" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {contacts.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.company ? ` (${c.company})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stage</Label>
                <Select value={newDealStage} onValueChange={setNewDealStage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {activeStages.map(s => (
                      <SelectItem key={s.key} value={s.key}>{s.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deal-source">Origem</Label>
                <Input 
                  id="deal-source"
                  placeholder="Ex: Instagram, Indicação"
                  value={newDealSource}
                  onChange={(e) => setNewDealSource(e.target.value)}
                />
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={handleCreateDeal}
              disabled={!newDealTitle.trim() || isCreatingDeal}
            >
              {isCreatingDeal ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Criar Deal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deal Drawer */}
      <DealDrawer
        deal={selectedDealId ? deals.find(d => d.id === selectedDealId) || null : null}
        open={!!selectedDealId}
        onClose={() => setSelectedDealId(null)}
      />
    </DashboardLayout>
  );
}
