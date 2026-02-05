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
import { Plus, Search, LayoutList, LayoutGrid, Filter } from "lucide-react";
import { PROJECT_TEMPLATES } from "@/data/projectTemplates";
import { CLIENTS, TEAM_MEMBERS } from "@/data/projectsMockData";
import { useState } from "react";

export function ProjectsHeader() {
  const { 
    filters, 
    setFilters, 
    viewMode, 
    setViewMode, 
    setNewProjectModalOpen,
    resetFilters 
  } = useProjectsStore();
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-4">
      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar projetos..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="pl-9 bg-muted/50 border-border/50"
            />
          </div>

          {/* Filter Toggle (Mobile) */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden"
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <LayoutList className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="h-8 px-3"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>

          {/* New Project Button */}
          <Button 
            onClick={() => setNewProjectModalOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Projeto</span>
          </Button>
        </div>
      </div>

      {/* Filters Row */}
      <div className={`flex flex-wrap gap-3 ${showFilters ? 'block' : 'hidden sm:flex'}`}>
        {/* Status */}
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters({ status: value as any })}
        >
          <SelectTrigger className="w-[130px] bg-muted/50">
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
          <SelectTrigger className="w-[160px] bg-muted/50">
            <SelectValue placeholder="Template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Templates</SelectItem>
            {PROJECT_TEMPLATES.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Client */}
        <Select
          value={filters.client}
          onValueChange={(value) => setFilters({ client: value })}
        >
          <SelectTrigger className="w-[150px] bg-muted/50">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Clientes</SelectItem>
            {CLIENTS.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.company}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Owner */}
        <Select
          value={filters.owner}
          onValueChange={(value) => setFilters({ owner: value })}
        >
          <SelectTrigger className="w-[150px] bg-muted/50">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {TEAM_MEMBERS.map(m => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Deadline */}
        <Select
          value={filters.deadline}
          onValueChange={(value) => setFilters({ deadline: value as any })}
        >
          <SelectTrigger className="w-[140px] bg-muted/50">
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
        {(filters.status !== 'all' || filters.template !== 'all' || 
          filters.client !== 'all' || filters.owner !== 'all' || 
          filters.deadline !== 'all' || filters.search) && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
