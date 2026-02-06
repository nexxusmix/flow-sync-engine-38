import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { InstagramReference } from "@/types/marketing";
import { 
  Plus, Search, Instagram, ExternalLink, MoreHorizontal,
  Trash2, Tag, Image, Link2, Upload, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ReferenceFormData {
  permalink: string;
  caption: string;
  thumbnail_url: string;
  note: string;
  tags: string;
  media_type: string;
}

const MEDIA_TYPES = [
  { value: 'post', label: 'Post' },
  { value: 'reel', label: 'Reel' },
  { value: 'story', label: 'Story' },
  { value: 'carousel', label: 'Carrossel' },
];

function ReferenceCard({ 
  reference, 
  onDelete,
}: { 
  reference: InstagramReference;
  onDelete: () => void;
}) {
  return (
    <motion.div
      className={cn(
        "glass-card rounded-xl overflow-hidden border border-transparent",
        "hover:border-primary/20 transition-all cursor-pointer group"
      )}
      whileHover={{ scale: 1.01, y: -2 }}
      layout
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-muted relative">
        {reference.thumbnail_url || reference.media_url ? (
          <img 
            src={reference.thumbnail_url || reference.media_url} 
            alt={reference.caption || 'Referência'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Type Badge */}
        {reference.media_type && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 left-2 text-[9px] bg-black/60 text-white border-0"
          >
            {reference.media_type}
          </Badge>
        )}
        
        {/* Actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="h-7 w-7 p-0 bg-black/60 hover:bg-black/80">
                <MoreHorizontal className="w-4 h-4 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {reference.permalink && (
                <DropdownMenuItem onClick={() => window.open(reference.permalink!, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver no Instagram
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onDelete} className="text-red-500">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-2">
        {reference.caption && (
          <p className="text-xs text-foreground line-clamp-2">
            {reference.caption}
          </p>
        )}
        
        {reference.note && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 italic">
            "{reference.note}"
          </p>
        )}
        
        {/* Tags */}
        {reference.tags && reference.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {reference.tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {reference.tags.length > 3 && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                +{reference.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ReferencesPage() {
  const [references, setReferences] = useState<InstagramReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isNewRefOpen, setIsNewRefOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newRef, setNewRef] = useState<ReferenceFormData>({
    permalink: '',
    caption: '',
    thumbnail_url: '',
    note: '',
    tags: '',
    media_type: 'post',
  });

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

  const handleCreate = async () => {
    if (!newRef.permalink) {
      toast.error('URL do post é obrigatória');
      return;
    }

    setIsSaving(true);
    try {
      const tagsArray = newRef.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const { data, error } = await supabase
        .from('instagram_references')
        .insert([{
          permalink: newRef.permalink,
          caption: newRef.caption || null,
          thumbnail_url: newRef.thumbnail_url || null,
          note: newRef.note || null,
          tags: tagsArray.length > 0 ? tagsArray : null,
          media_type: newRef.media_type,
        }])
        .select()
        .single();

      if (error) throw error;

      setReferences([data as InstagramReference, ...references]);
      setIsNewRefOpen(false);
      resetForm();
      toast.success('Referência salva!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar referência');
    } finally {
      setIsSaving(false);
    }
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

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `references/${Date.now()}.${ext}`;
      
      const { data, error } = await supabase.storage
        .from('marketing-assets')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('marketing-assets')
        .getPublicUrl(fileName);

      setNewRef({ ...newRef, thumbnail_url: urlData.publicUrl });
      toast.success('Imagem enviada!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar imagem');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setNewRef({
      permalink: '',
      caption: '',
      thumbnail_url: '',
      note: '',
      tags: '',
      media_type: 'post',
    });
  };

  // Filter logic
  const filteredRefs = references.filter(r => {
    const matchSearch = !searchTerm || 
      r.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchType = filterType === 'all' || r.media_type === filterType;
    
    return matchSearch && matchType;
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
          <Button onClick={() => setIsNewRefOpen(true)}>
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
              {MEDIA_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
                onDelete={() => handleDelete(ref.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Instagram className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Nenhuma referência encontrada</p>
            <Button variant="outline" className="mt-4" onClick={() => setIsNewRefOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar primeira referência
            </Button>
          </div>
        )}

        {/* New Reference Dialog */}
        <Dialog open={isNewRefOpen} onOpenChange={setIsNewRefOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Referência</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>URL do Post *</Label>
                <Input
                  value={newRef.permalink}
                  onChange={(e) => setNewRef({ ...newRef, permalink: e.target.value })}
                  placeholder="https://instagram.com/p/..."
                />
              </div>

              <div>
                <Label>Tipo</Label>
                <Select 
                  value={newRef.media_type} 
                  onValueChange={(v) => setNewRef({ ...newRef, media_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDIA_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Thumbnail</Label>
                <div className="flex gap-2">
                  <Input
                    value={newRef.thumbnail_url}
                    onChange={(e) => setNewRef({ ...newRef, thumbnail_url: e.target.value })}
                    placeholder="URL da imagem ou faça upload"
                    className="flex-1"
                  />
                  <label className="cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden"
                      onChange={handleThumbnailUpload}
                    />
                    <Button type="button" variant="outline" size="icon" disabled={isUploading} asChild>
                      <span>
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
                {newRef.thumbnail_url && (
                  <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden bg-muted">
                    <img src={newRef.thumbnail_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <Label>Legenda / Descrição</Label>
                <Textarea
                  value={newRef.caption}
                  onChange={(e) => setNewRef({ ...newRef, caption: e.target.value })}
                  placeholder="Copie a legenda ou descreva o conteúdo"
                  rows={3}
                />
              </div>

              <div>
                <Label>Nota / Por que salvar</Label>
                <Input
                  value={newRef.note}
                  onChange={(e) => setNewRef({ ...newRef, note: e.target.value })}
                  placeholder="Ex: Boa estrutura de carrossel"
                />
              </div>

              <div>
                <Label>Tags (separadas por vírgula)</Label>
                <Input
                  value={newRef.tags}
                  onChange={(e) => setNewRef({ ...newRef, tags: e.target.value })}
                  placeholder="storytelling, carrossel, educacional"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsNewRefOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Salvar Referência
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
