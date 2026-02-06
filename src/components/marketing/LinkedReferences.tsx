import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { InstagramReference } from "@/types/marketing";
import { 
  Plus, Instagram, Image, ExternalLink, X, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReferencePicker } from "./ReferencePicker";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LinkedReferencesProps {
  entityType: 'idea' | 'content';
  entityId: string;
  className?: string;
}

export function LinkedReferences({ entityType, entityId, className }: LinkedReferencesProps) {
  const [references, setReferences] = useState<InstagramReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    fetchLinkedReferences();
  }, [entityId]);

  const fetchLinkedReferences = async () => {
    setIsLoading(true);
    
    const column = entityType === 'idea' ? 'content_idea_id' : 'content_item_id';
    
    const { data, error } = await supabase
      .from('instagram_references')
      .select('*')
      .eq(column, entityId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReferences(data as InstagramReference[]);
    }
    setIsLoading(false);
  };

  const handleLink = async (ref: InstagramReference) => {
    const column = entityType === 'idea' ? 'content_idea_id' : 'content_item_id';
    
    const { error } = await supabase
      .from('instagram_references')
      .update({ [column]: entityId })
      .eq('id', ref.id);

    if (error) {
      throw error;
    }

    // Refresh list
    await fetchLinkedReferences();
    toast.success('Referência vinculada!');
  };

  const handleUnlink = async (refId: string) => {
    const column = entityType === 'idea' ? 'content_idea_id' : 'content_item_id';
    
    const { error } = await supabase
      .from('instagram_references')
      .update({ [column]: null })
      .eq('id', refId);

    if (!error) {
      setReferences(references.filter(r => r.id !== refId));
      toast.success('Referência desvinculada');
    } else {
      toast.error('Erro ao desvincular');
    }
  };

  const linkedIds = references.map(r => r.id);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Instagram className="w-4 h-4" />
          Referências
        </h4>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsPickerOpen(true)}
          className="h-7 text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Vincular
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : references.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {references.map((ref) => (
            <div 
              key={ref.id}
              className="group relative flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50 hover:border-border transition-colors"
            >
              {/* Thumbnail */}
              <div className="w-10 h-10 rounded bg-muted overflow-hidden flex-shrink-0">
                {ref.thumbnail_url || ref.media_url ? (
                  <img 
                    src={ref.thumbnail_url || ref.media_url} 
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-foreground line-clamp-1">
                  {ref.note || ref.caption || 'Referência'}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {ref.media_type && (
                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">
                      {ref.media_type}
                    </Badge>
                  )}
                  {ref.permalink && (
                    <a 
                      href={ref.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => handleUnlink(ref.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-destructive/10"
              >
                <X className="w-3 h-3 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-xs">Nenhuma referência vinculada</p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2 text-xs"
            onClick={() => setIsPickerOpen(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Adicionar referência
          </Button>
        </div>
      )}

      {/* Picker Dialog */}
      <ReferencePicker
        open={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        onSelect={handleLink}
        excludeIds={linkedIds}
      />
    </div>
  );
}
