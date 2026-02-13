import { useState, useRef, MouseEvent } from "react";
import { formatCurrencyBRL } from "@/utils/format";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KanbanColumn } from "@/components/crm/KanbanColumn";
import { useCRM, CRM_STAGES, Deal } from "@/hooks/useCRM";
import { useAuth } from "@/hooks/useAuth";
import { Filter, ChevronDown, Plus, Sparkles, Users, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function CRMPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [activeView, setActiveView] = useState<'kanban' | 'lista'>('kanban');
  
  const { isLoading: authLoading } = useAuth();
  const { deals, metrics, isLoading: dataLoading, moveDealToStage, deleteDeal } = useCRM();
  
  // Loading during auth check or data fetch (hooks handle user existence internally)
  const isLoading = authLoading || dataLoading;

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

  // Transform deals for KanbanColumn format
  const transformedDeals = deals.map(deal => ({
    id: deal.id,
    title: deal.title,
    company: deal.company,
    value: deal.value,
    probability: deal.score || 50,
    stage: deal.stage,
    initials: deal.contactName?.split(' ').map(n => n[0]).slice(0, 2) || ['?'],
    daysInStage: 0,
    nextAction: deal.nextAction,
    score: deal.score || 0,
    tags: [] as string[],
    ownerInitials: 'SQ',
    lastActivity: deal.updatedAt || new Date().toISOString(),
  }));

  const hasDeals = deals.length > 0;

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
      <div className="space-y-6 animate-fade-in max-w-[1600px] 2xl:max-w-[1800px] mx-auto">
        {/* Header Title */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tighter text-foreground">
            Pipeline <span className="squad-logo-text font-normal text-muted-foreground">Comercial</span>
          </h1>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">Live Sync</span>
          </div>
        </div>

        {/* CRM Filter Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
            <button className="chip flex items-center gap-2">
              <Filter className="w-3 h-3" />
              Owner: Todos
              <ChevronDown className="w-3 h-3" />
            </button>
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
            <button className="btn-primary">
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
              {CRM_STAGES.map(stage => (
                <KanbanColumn
                  key={stage.id}
                  title={stage.title}
                  color={stage.color}
                  count={transformedDeals.filter(d => d.stage === stage.id).length}
                  deals={transformedDeals.filter(d => d.stage === stage.id)}
                  onDeleteDeal={(id) => deleteDeal(id)}
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
            <Button className="mt-6" size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Deal
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
