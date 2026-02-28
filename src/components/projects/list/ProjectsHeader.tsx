import { useProjectsStore } from "@/stores/projectsStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, LayoutList, LayoutGrid, X, SlidersHorizontal, Sparkles } from "lucide-react";
import { PROJECT_TEMPLATES } from "@/data/projectTemplates";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ProjectsHeader() {
  const { 
    filters, 
    setFilters,
    viewMode, 
    setViewMode,
    setAIProjectModalOpen,
    setNewProjectModalOpen,
    resetFilters 
  } = useProjectsStore();
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = filters.status !== 'all' || filters.template !== 'all' || 
    filters.deadline !== 'all' || filters.search;

  return (
    <div className="space-y-3">
      {/* Primary Row: Search + New Project only */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar projetos..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="pl-10 h-10 bg-muted/30 border-border/50 rounded-xl focus:bg-muted/50 transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => setFilters({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Secondary: filters toggle */}
        <Button
          variant={showFilters ? "secondary" : "ghost"}
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className="h-10 w-10 rounded-xl relative shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
          )}
        </Button>

        {/* New Project */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-10 px-5 rounded-xl gap-2 shadow-lg shadow-primary/20 shrink-0">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Projeto</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setNewProjectModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Manualmente
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAIProjectModalOpen(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              Criar com IA
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Collapsible toolbar: view mode + filters */}
      {showFilters && (
        <div className="glass-card rounded-2xl p-3 animate-fade-in">
          <div className="flex flex-wrap gap-3 items-center">
            {/* View Toggle */}
            <div className="flex items-center gap-1 p-0.5 bg-muted/40 rounded-lg border border-border/40">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3 rounded-md gap-1.5"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Lista</span>
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="h-8 px-3 rounded-md gap-1.5"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Board</span>
              </Button>
            </div>

            <div className="w-px h-6 bg-border/50 hidden sm:block" />

            {/* Status */}
            <Select value={filters.status} onValueChange={(v) => setFilters({ status: v as any })}>
              <SelectTrigger className="w-[120px] h-8 bg-muted/30 border-border/50 rounded-lg text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ok">Ok</SelectItem>
                <SelectItem value="em_risco">Em Risco</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
                <SelectItem value="bloqueado">Bloqueado</SelectItem>
              </SelectContent>
            </Select>

            {/* Template */}
            <Select value={filters.template} onValueChange={(v) => setFilters({ template: v as any })}>
              <SelectTrigger className="w-[140px] h-8 bg-muted/30 border-border/50 rounded-lg text-xs">
                <SelectValue placeholder="Template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Templates</SelectItem>
                {PROJECT_TEMPLATES.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Deadline */}
            <Select value={filters.deadline} onValueChange={(v) => setFilters({ deadline: v as any })}>
              <SelectTrigger className="w-[120px] h-8 bg-muted/30 border-border/50 rounded-lg text-xs">
                <SelectValue placeholder="Prazo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="7days">Próx. 7 dias</SelectItem>
                <SelectItem value="30days">Próx. 30 dias</SelectItem>
                <SelectItem value="atrasado">Atrasados</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 px-3 rounded-lg text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
