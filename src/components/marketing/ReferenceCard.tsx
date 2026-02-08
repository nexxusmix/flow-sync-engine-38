import { InstagramReference } from "@/types/marketing";
import { 
  MoreHorizontal, Trash2, ExternalLink, Edit, Image, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ReferenceCardProps {
  reference: InstagramReference;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function ReferenceCard({ 
  reference, 
  onEdit,
  onDelete,
  showActions = true,
}: ReferenceCardProps) {
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
        {showActions && (
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
                    Ver Original
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
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
