import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { InstagramReference } from "@/types/marketing";
import { REFERENCE_MEDIA_TYPES } from "@/types/reference-links";
import { 
  Plus, Search, Instagram, Loader2, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ReferenceCard } from "@/components/marketing/ReferenceCard";
import { ReferenceFormDialog } from "@/components/marketing/ReferenceFormDialog";

export default function ReferencesPage() {
  const [references, setReferences] = useState<InstagramReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  
  // Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRef, setEditingRef] = useState<InstagramReference | null>(null);

  // Get unique tags for filter
  const allTags = Array.from(
    new Set(references.flatMap(r => r.tags || []))
  ).sort();

  useEffect(() => {
    fetchReferences();
  }, []);

  const fetchReferences = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('instagram_references')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReferences(data as InstagramReference[]);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('instagram_references')
      .delete()
      .eq('id', id);

    if (!error) {
      setReferences(references.filter(r => r.id !== id));
      toast.success('Referência removida');
    } else {
      toast.error('Erro ao remover');
    }
  };

  const handleEdit = (ref: InstagramReference) => {
    setEditingRef(ref);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setEditingRef(null);
    setIsFormOpen(true);
  };

  const handleSaved = (ref: InstagramReference) => {
    if (editingRef) {
      // Update existing
      setReferences(prev => prev.map(r => r.id === ref.id ? ref : r));
    } else {
      // Add new
      setReferences(prev => [ref, ...prev]);
    }
    setEditingRef(null);
  };

  // Filter logic
  const filteredRefs = references.filter(r => {
    const matchSearch = !searchTerm || 
      r.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchType = filterType === 'all' || r.media_type === filterType;
    
    const matchTag = filterTag === 'all' || r.tags?.includes(filterTag);
    
    return matchSearch && matchType && matchTag;
  });

  return (
    <DashboardLayout title="Referências">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-medium text-foreground tracking-tight">Referências de Instagram</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {references.length} referências salvas
            </p>
          </div>
          <Button onClick={handleNew}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Referência
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por legenda, nota ou tag..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {REFERENCE_MEDIA_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {allTags.length > 0 && (
            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as tags</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {(filterType !== 'all' || filterTag !== 'all' || searchTerm) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterTag('all');
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {(filterType !== 'all' || filterTag !== 'all') && (
          <div className="flex flex-wrap gap-2">
            {filterType !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Tipo: {REFERENCE_MEDIA_TYPES.find(t => t.value === filterType)?.label}
              </Badge>
            )}
            {filterTag !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Tag: {filterTag}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {filteredRefs.length} resultados
            </span>
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredRefs.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredRefs.map((ref) => (
              <ReferenceCard
                key={ref.id}
                reference={ref}
                onEdit={() => handleEdit(ref)}
                onDelete={() => handleDelete(ref.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Instagram className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Nenhuma referência encontrada</p>
            <Button variant="outline" className="mt-4" onClick={handleNew}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar primeira referência
            </Button>
          </div>
        )}

        {/* Form Dialog */}
        <ReferenceFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          reference={editingRef}
          onSaved={handleSaved}
        />
      </div>
    </DashboardLayout>
  );
}
