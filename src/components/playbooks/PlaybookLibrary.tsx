import { useState } from 'react';
import { usePlaybooks, useDeletePlaybook, PLAYBOOK_CATEGORIES } from '@/hooks/usePlaybooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Trash2, Copy, MoreVertical, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  onEdit: (id: string) => void;
  onNew: () => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-primary/15 text-primary',
  archived: 'bg-destructive/15 text-destructive',
};

export function PlaybookLibrary({ onEdit, onNew }: Props) {
  const { playbooks, isLoading } = usePlaybooks();
  const deletePb = useDeletePlaybook();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  const filtered = playbooks.filter(pb => {
    if (search && !pb.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter !== 'all' && pb.category !== catFilter) return false;
    return true;
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar playbooks..." className="pl-8 h-9 text-sm" />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {PLAYBOOK_CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onNew} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Novo Playbook
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <span className="material-symbols-rounded text-4xl text-muted-foreground/40">menu_book</span>
          <p className="text-sm text-muted-foreground">Nenhum playbook encontrado.</p>
          <Button variant="outline" size="sm" onClick={onNew} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Criar primeiro playbook
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(pb => {
            const cat = PLAYBOOK_CATEGORIES.find(c => c.key === pb.category);
            return (
              <div
                key={pb.id}
                className="glass-card rounded-xl p-5 hover:border-primary/20 transition-all cursor-pointer group"
                onClick={() => onEdit(pb.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-rounded text-lg text-primary">{cat?.icon || 'description'}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground line-clamp-1">{pb.title}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5">{cat?.label || pb.category}</Badge>
                        <Badge className={`text-[10px] py-0 px-1.5 border-0 ${statusColors[pb.status] || statusColors.draft}`}>
                          {pb.status === 'active' ? 'Ativo' : pb.status === 'archived' ? 'Arquivado' : 'Rascunho'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit(pb.id); }}>
                        <span className="material-symbols-rounded text-sm mr-2">edit</span> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); deletePb.mutate(pb.id); }}>
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {pb.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{pb.description}</p>}

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>v{pb.version_number}</span>
                  <span>{pb.usage_count}x usado</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
