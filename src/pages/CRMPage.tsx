import { useState, useRef, MouseEvent } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KanbanColumn } from "@/components/crm/KanbanColumn";
import { Deal } from "@/components/crm/KanbanCard";
import { Filter, ChevronDown, Plus, Sparkles } from "lucide-react";

const stages = [
  { id: 'lead', title: 'Leads', color: 'bg-zinc-500' },
  { id: 'qualificacao', title: 'Qualificação', color: 'bg-blue-500' },
  { id: 'diagnostico', title: 'Diagnóstico', color: 'bg-indigo-500' },
  { id: 'proposta', title: 'Proposta', color: 'bg-amber-500' },
  { id: 'negociacao', title: 'Negociação', color: 'bg-orange-500' },
  { id: 'fechado', title: 'Fechado', color: 'bg-emerald-500' },
  { id: 'onboarding', title: 'Onboarding', color: 'bg-purple-500' },
  { id: 'posvenda', title: 'Pós-Venda', color: 'bg-pink-500' }
];

const deals: Deal[] = [
  { id: 1, title: 'Campanha Institucional', company: 'Grupo Soma', value: 120000, stage: 'negociacao', score: 92, tags: ['Ticket Alto', 'Urgente'], ownerInitials: 'AG', lastActivity: '2h' },
  { id: 2, title: 'Vídeo Manifesto', company: 'Reserva', value: 45000, stage: 'proposta', score: 78, tags: ['Varejo'], ownerInitials: 'JP', lastActivity: '1d' },
  { id: 3, title: 'Cobertura Evento', company: 'XP Inc', value: 15000, stage: 'lead', score: 45, tags: ['Inbound'], ownerInitials: 'AG', lastActivity: '5m' },
  { id: 4, title: 'Série Reels', company: 'Track & Field', value: 22000, stage: 'qualificacao', score: 65, tags: ['Recorrência'], ownerInitials: 'MS', lastActivity: '3h' },
  { id: 5, title: 'Tour Virtual 360', company: 'Mitre Realty', value: 8000, stage: 'fechado', score: 99, tags: ['Imobiliário'], ownerInitials: 'JP', lastActivity: '1w' },
  { id: 6, title: 'Filme Produto', company: 'Natura', value: 65000, stage: 'diagnostico', score: 85, tags: ['Beleza'], ownerInitials: 'AG', lastActivity: '4h' },
  { id: 7, title: 'Onboarding Kit', company: 'Nubank', value: 35000, stage: 'onboarding', score: 95, tags: ['Tech'], ownerInitials: 'MS', lastActivity: '2d' },
  { id: 8, title: 'Renovação Anual', company: 'Itaú BBA', value: 200000, stage: 'posvenda', score: 88, tags: ['Upsell'], ownerInitials: 'AG', lastActivity: '1mo' },
  { id: 9, title: 'Social Media Q3', company: 'Bauducco', value: 18000, stage: 'lead', score: 55, tags: ['Food'], ownerInitials: 'JP', lastActivity: '10m' },
];

export default function CRMPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [activeView, setActiveView] = useState<'kanban' | 'lista'>('kanban');

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

  const totalForecast = deals.reduce((acc, deal) => acc + deal.value, 0);

  return (
    <DashboardLayout title="Cine CRM">
      <div className="space-y-6 animate-fade-in">
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
                Forecast: R$ {(totalForecast / 1000).toFixed(0)}.000
              </span>
            </div>

            {/* New Deal Button */}
            <button className="btn-primary">
              <Plus className="w-4 h-4" />
              Novo Deal
            </button>
          </div>
        </div>

        {/* Kanban Board Area */}
        <div 
          ref={scrollRef}
          className="overflow-x-auto pb-4 custom-scrollbar cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          <div className="flex gap-4 min-w-max p-1">
            {stages.map(stage => (
              <KanbanColumn
                key={stage.id}
                title={stage.title}
                color={stage.color}
                count={deals.filter(d => d.stage === stage.id).length}
                deals={deals.filter(d => d.stage === stage.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
