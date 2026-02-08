import { useEffect } from "react";
import { useReferenceLinks } from "@/hooks/useReferenceLinks";
import { ReferenceEntityType } from "@/types/reference-links";
import { ReferencePicker } from "./ReferencePicker";
import { 
  Plus, Instagram, Image, ExternalLink, X, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ReferenceLinksProps {
  entityType: ReferenceEntityType;
  entityId: string;
  className?: string;
}

export function ReferenceLinksSection({ entityType, entityId, className }: ReferenceLinksProps) {
  const { links, isLoading, fetchLinks, linkReference, unlinkReference, getLinkedReferenceIds } = useReferenceLinks(entityType, entityId);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleLink = async (ref: { id: string }) => {
    const success = await linkReference(ref.id);
    if (success) {
      setIsPickerOpen(false);
    }
  };

  const linkedIds = getLinkedReferenceIds();

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Instagram className="w-4 h-4" />
          Referências
          {links.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {links.length}
            </Badge>
          )}
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
      ) : links.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {links.map((link) => {
            const ref = link.reference;
            if (!ref) return null;

            return (
              <div 
                key={link.id}
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
                  onClick={() => unlinkReference(link.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-destructive/10"
                >
                  <X className="w-3 h-3 text-destructive" />
                </button>
              </div>
            );
          })}
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
