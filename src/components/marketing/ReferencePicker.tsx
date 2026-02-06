import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { InstagramReference } from "@/types/marketing";
import { Search, Instagram, Image, Check, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReferencePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (reference: InstagramReference) => Promise<void>;
  excludeIds?: string[];
  title?: string;
}

export function ReferencePicker({ 
  open, 
  onOpenChange, 
  onSelect,
  excludeIds = [],
  title = "Vincular Referência"
}: ReferencePickerProps) {
  const [references, setReferences] = useState<InstagramReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchReferences();
      setSelectedId(null);
    }
  }, [open]);

  const fetchReferences = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('instagram_references')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Filter out already linked references
      const filtered = (data as InstagramReference[]).filter(
        r => !excludeIds.includes(r.id)
      );
      setReferences(filtered);
    }
    setIsLoading(false);
  };

  const handleConfirm = async () => {
    const ref = references.find(r => r.id === selectedId);
    if (!ref) return;

    setIsSaving(true);
    try {
      await onSelect(ref);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao vincular referência');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRefs = references.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.caption?.toLowerCase().includes(term) ||
      r.note?.toLowerCase().includes(term) ||
      r.tags?.some(t => t.toLowerCase().includes(term))
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar referências..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* References Grid */}
        <ScrollArea className="flex-1 min-h-[300px] max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRefs.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 p-1">
              {filteredRefs.map((ref) => (
                <button
                  key={ref.id}
                  type="button"
                  onClick={() => setSelectedId(ref.id)}
                  className={cn(
                    "relative rounded-lg overflow-hidden border-2 transition-all text-left",
                    selectedId === ref.id 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "border-transparent hover:border-muted-foreground/20"
                  )}
                >
                  {/* Thumbnail */}
                  <div className="aspect-square bg-muted">
                    {ref.thumbnail_url || ref.media_url ? (
                      <img 
                        src={ref.thumbnail_url || ref.media_url} 
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  
                  {/* Selected Check */}
                  {selectedId === ref.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}

                  {/* Type Badge */}
                  {ref.media_type && (
                    <Badge 
                      variant="secondary" 
                      className="absolute top-2 left-2 text-[8px] bg-black/60 text-white border-0"
                    >
                      {ref.media_type}
                    </Badge>
                  )}

                  {/* Info */}
                  <div className="p-2">
                    {ref.note ? (
                      <p className="text-[10px] text-muted-foreground line-clamp-2">
                        {ref.note}
                      </p>
                    ) : ref.caption ? (
                      <p className="text-[10px] text-muted-foreground line-clamp-2">
                        {ref.caption}
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground italic">
                        Sem descrição
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Instagram className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhuma referência disponível</p>
              <p className="text-xs mt-1">Adicione referências na página de Referências</p>
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedId || isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Vincular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
