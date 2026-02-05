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
    <div className="space-y-4">
      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar projetos..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="pl-10 h-11 bg-muted/30 border-border/50 rounded-xl focus:bg-muted/50 transition-colors"
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

          {/* Filter Toggle */}
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="h-11 w-11 rounded-xl relative"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
            )}
          </Button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl border border-border/50">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-9 px-4 rounded-lg gap-2"
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px] font-medium">Lista</span>
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="h-9 px-4 rounded-lg gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px] font-medium">Board</span>
            </Button>
          </div>

          {/* New Project Button with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-11 px-6 rounded-xl gap-2 shadow-lg shadow-primary/20">
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
      </div>

      {/* Filters Row */}
      {showFilters && (
        <div className="glass-card rounded-2xl p-4 animate-fade-in">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Status */}
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ status: value as any })}
            >
              <SelectTrigger className="w-[130px] h-10 bg-muted/30 border-border/50 rounded-xl">
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
            <Select
              value={filters.template}
              onValueChange={(value) => setFilters({ template: value as any })}
            >
              <SelectTrigger className="w-[160px] h-10 bg-muted/30 border-border/50 rounded-xl">
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
            <Select
              value={filters.deadline}
              onValueChange={(value) => setFilters({ deadline: value as any })}
            >
              <SelectTrigger className="w-[140px] h-10 bg-muted/30 border-border/50 rounded-xl">
                <SelectValue placeholder="Prazo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="7days">Próx. 7 dias</SelectItem>
                <SelectItem value="30days">Próx. 30 dias</SelectItem>
                <SelectItem value="atrasado">Atrasados</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetFilters}
                className="h-10 px-4 rounded-xl text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
