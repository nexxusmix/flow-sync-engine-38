import { useState, useMemo } from 'react';
import { ExternalLink, Search, LayoutGrid, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  FIGMA_TEMPLATES,
  TEMPLATE_CATEGORIES,
  TEMPLATE_ASPECTS,
  type FigmaTemplate,
  type TemplateCategory,
} from '@/lib/figma-community-templates';

interface TemplateGalleryProps {
  selectedTemplateId: string | null;
  onSelectTemplate: (template: FigmaTemplate | null) => void;
}

export function TemplateGallery({ selectedTemplateId, onSelectTemplate }: TemplateGalleryProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all');

  const filtered = useMemo(() => {
    let result = FIGMA_TEMPLATES;
    if (activeCategory !== 'all') {
      result = result.filter(t => t.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.includes(q)) ||
        t.author.toLowerCase().includes(q)
      );
    }
    return result;
  }, [search, activeCategory]);

  const categories = Object.entries(TEMPLATE_CATEGORIES) as [TemplateCategory, string][];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <LayoutGrid className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">Templates Figma</h3>
        <Badge variant="secondary" className="text-[10px]">{FIGMA_TEMPLATES.length}</Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar template..."
          className="pl-8 h-8 text-xs"
        />
      </div>

      {/* Category Chips */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveCategory('all')}
          className={cn(
            "px-2.5 py-1 rounded-full text-[10px] transition-colors border",
            activeCategory === 'all'
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
          )}
        >
          Todos
        </button>
        {categories.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] transition-colors border",
              activeCategory === key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <ScrollArea className="h-[280px]">
        <div className="grid grid-cols-2 gap-2 pr-2">
          {filtered.map(template => {
            const isSelected = selectedTemplateId === template.id;
            return (
              <div
                key={template.id}
                onClick={() => onSelectTemplate(isSelected ? null : template)}
                className={cn(
                  "relative rounded-lg border p-2.5 cursor-pointer transition-all group",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-muted/20 hover:bg-muted/40 hover:border-muted-foreground/30"
                )}
              >
                {/* Placeholder Thumbnail */}
                <div className="aspect-square rounded bg-muted/50 mb-2 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
                  <LayoutGrid className="w-6 h-6 text-muted-foreground/40" />
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>

                <p className="text-[11px] font-medium text-foreground leading-tight line-clamp-2 mb-1">
                  {template.name}
                </p>

                <div className="flex items-center justify-between gap-1">
                  <Badge variant="outline" className="text-[8px] px-1 py-0">
                    {TEMPLATE_ASPECTS[template.aspect]}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(template.figma_url, '_blank');
                    }}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>

                <p className="text-[9px] text-muted-foreground mt-0.5">
                  por {template.author}
                </p>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            Nenhum template encontrado
          </p>
        )}
      </ScrollArea>
    </div>
  );
}
