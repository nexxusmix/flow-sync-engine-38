import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useInstagramPosts, useAIMemory, InstagramPost, POST_STATUSES, FORMATS, PILLARS } from '@/hooks/useInstagramEngine';
import { Search, Copy, Check, FileText, Image, Hash, Sparkles, BookOpen, Play, Layers, Filter, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

type LibraryFilter = 'all' | 'captions' | 'hooks' | 'scripts' | 'hashtags' | 'thumbnails' | 'ai_memory';

const FILTERS: { key: LibraryFilter; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'Tudo', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { key: 'captions', label: 'Legendas', icon: <FileText className="w-3.5 h-3.5" /> },
  { key: 'hooks', label: 'Hooks', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { key: 'scripts', label: 'Roteiros', icon: <Play className="w-3.5 h-3.5" /> },
  { key: 'hashtags', label: 'Hashtags', icon: <Hash className="w-3.5 h-3.5" /> },
  { key: 'thumbnails', label: 'Imagens', icon: <Image className="w-3.5 h-3.5" /> },
  { key: 'ai_memory', label: 'Memória IA', icon: <Sparkles className="w-3.5 h-3.5" /> },
];

interface LibraryItem {
  id: string;
  type: 'caption_short' | 'caption_medium' | 'caption_long' | 'hook' | 'script' | 'hashtags' | 'cta' | 'pinned_comment' | 'cover_suggestion' | 'thumbnail' | 'ai_memory';
  label: string;
  content: string;
  post_title: string;
  post_id: string;
  format: string;
  pillar: string | null;
  ai_generated: boolean;
  created_at: string;
  thumbnail_url?: string;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success('Copiado!');
}

export function LibraryTab() {
  const { data: posts, isLoading } = useInstagramPosts();
  const { data: memories } = useAIMemory();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const items = useMemo(() => {
    const result: LibraryItem[] = [];
    const allPosts = posts || [];

    allPosts.forEach((post) => {
      const base = {
        post_title: post.title,
        post_id: post.id,
        format: post.format,
        pillar: post.pillar,
        ai_generated: post.ai_generated,
        created_at: post.created_at,
      };

      if (post.hook) result.push({ ...base, id: `${post.id}-hook`, type: 'hook', label: 'Hook', content: post.hook });
      if (post.caption_short) result.push({ ...base, id: `${post.id}-cs`, type: 'caption_short', label: 'Legenda Curta', content: post.caption_short });
      if (post.caption_medium) result.push({ ...base, id: `${post.id}-cm`, type: 'caption_medium', label: 'Legenda Média', content: post.caption_medium });
      if (post.caption_long) result.push({ ...base, id: `${post.id}-cl`, type: 'caption_long', label: 'Legenda Longa', content: post.caption_long });
      if (post.script) result.push({ ...base, id: `${post.id}-script`, type: 'script', label: 'Roteiro', content: post.script });
      if (post.cta) result.push({ ...base, id: `${post.id}-cta`, type: 'cta', label: 'CTA', content: post.cta });
      if (post.pinned_comment) result.push({ ...base, id: `${post.id}-pc`, type: 'pinned_comment', label: 'Comentário Fixado', content: post.pinned_comment });
      if (post.cover_suggestion) result.push({ ...base, id: `${post.id}-cover`, type: 'cover_suggestion', label: 'Sugestão de Capa', content: post.cover_suggestion });
      if (post.hashtags?.length) result.push({ ...base, id: `${post.id}-hash`, type: 'hashtags', label: 'Hashtags', content: post.hashtags.map(h => `#${h}`).join(' ') });
      if (post.thumbnail_url) result.push({ ...base, id: `${post.id}-thumb`, type: 'thumbnail', label: 'Thumbnail', content: post.thumbnail_url, thumbnail_url: post.thumbnail_url });
    });

    // Add AI memory items
    if (memories?.length) {
      memories.forEach((mem: any) => {
        result.push({
          id: `mem-${mem.id}`,
          type: 'ai_memory',
          label: `Memória: ${mem.memory_type}`,
          content: `Tipo: ${mem.memory_type} | Categoria: ${mem.category || '—'} | Formato: ${mem.format || '—'} | Tópico: ${mem.topic || '—'}${mem.field_name ? ` | Campo: ${mem.field_name}` : ''}${mem.engagement_score ? ` | Score: ${mem.engagement_score}` : ''}`,
          post_title: mem.topic || mem.category || mem.memory_type,
          post_id: '',
          format: mem.format || '',
          pillar: mem.category,
          ai_generated: true,
          created_at: mem.created_at,
        });
      });
    }

    return result;
  }, [posts, memories]);

  const filtered = useMemo(() => {
    let list = items;

    if (filter === 'captions') list = list.filter(i => ['caption_short', 'caption_medium', 'caption_long', 'cta', 'pinned_comment'].includes(i.type));
    else if (filter === 'hooks') list = list.filter(i => i.type === 'hook');
    else if (filter === 'scripts') list = list.filter(i => i.type === 'script');
    else if (filter === 'hashtags') list = list.filter(i => i.type === 'hashtags');
    else if (filter === 'thumbnails') list = list.filter(i => i.type === 'thumbnail');
    else if (filter === 'ai_memory') list = list.filter(i => i.type === 'ai_memory');

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => i.content.toLowerCase().includes(q) || i.post_title.toLowerCase().includes(q) || i.label.toLowerCase().includes(q));
    }

    return list;
  }, [items, filter, search]);

  const handleCopy = (item: LibraryItem) => {
    copyToClipboard(item.content);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'hook': return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
      case 'script': return <Play className="w-3.5 h-3.5 text-blue-400" />;
      case 'hashtags': return <Hash className="w-3.5 h-3.5 text-emerald-400" />;
      case 'thumbnail': return <Image className="w-3.5 h-3.5 text-purple-400" />;
      case 'ai_memory': return <Sparkles className="w-3.5 h-3.5 text-primary" />;
      default: return <FileText className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const stats = useMemo(() => ({
    total: items.length,
    captions: items.filter(i => ['caption_short', 'caption_medium', 'caption_long', 'cta', 'pinned_comment'].includes(i.type)).length,
    hooks: items.filter(i => i.type === 'hook').length,
    scripts: items.filter(i => i.type === 'script').length,
    hashtags: items.filter(i => i.type === 'hashtags').length,
    thumbnails: items.filter(i => i.type === 'thumbnail').length,
    ai_generated: items.filter(i => i.ai_generated).length,
  }), [items]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { label: 'Total', value: stats.total, color: 'text-foreground' },
          { label: 'Legendas', value: stats.captions, color: 'text-blue-400' },
          { label: 'Hooks', value: stats.hooks, color: 'text-amber-400' },
          { label: 'Roteiros', value: stats.scripts, color: 'text-emerald-400' },
          { label: 'Hashtags', value: stats.hashtags, color: 'text-purple-400' },
          { label: 'Imagens', value: stats.thumbnails, color: 'text-pink-400' },
          { label: 'Gerado IA', value: stats.ai_generated, color: 'text-primary' },
        ].map(s => (
          <Card key={s.label} className="glass-card p-3 text-center border border-border/50">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar na biblioteca..."
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <Button
              key={f.key}
              variant={filter === f.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.key)}
              className="gap-1 text-[11px] h-8 whitespace-nowrap shrink-0"
            >
              {f.icon}
              {f.label}
              {filter === f.key && <Badge variant="secondary" className="text-[9px] ml-0.5 px-1">{filtered.length}</Badge>}
            </Button>
          ))}
        </div>
      </div>

      {/* Library Grid */}
      {filtered.length === 0 ? (
        <Card className="glass-card p-12 text-center border border-border/50">
          <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum item encontrado</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Gere conteúdo com IA para popular sua biblioteca</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(item => (
            <Card
              key={item.id}
              className="glass-card border border-border/50 overflow-hidden hover:border-primary/30 transition-colors group cursor-pointer"
              onClick={() => setSelectedItem(item)}
            >
              {/* Thumbnail preview for image items */}
              {item.type === 'thumbnail' && item.thumbnail_url && (
                <div className="h-32 overflow-hidden">
                  <img src={item.thumbnail_url} alt={item.post_title} className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}

              <div className="p-3 space-y-2">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {typeIcon(item.type)}
                    <Badge variant="secondary" className="text-[9px] shrink-0">{item.label}</Badge>
                    {item.ai_generated && <Sparkles className="w-3 h-3 text-primary shrink-0" />}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={(e) => { e.stopPropagation(); handleCopy(item); }}
                  >
                    {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>

                {/* Post title */}
                <p className="text-xs font-medium text-foreground line-clamp-1">{item.post_title}</p>

                {/* Content preview */}
                {item.type !== 'thumbnail' && (
                  <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">{item.content}</p>
                )}

                {/* Footer */}
                <div className="flex items-center gap-2 pt-1">
                  {item.pillar && (
                    <Badge
                      className="text-[8px] px-1.5 py-0"
                      style={{ backgroundColor: PILLARS.find(p => p.key === item.pillar)?.color + '22', color: PILLARS.find(p => p.key === item.pillar)?.color }}
                    >
                      {PILLARS.find(p => p.key === item.pillar)?.label || item.pillar}
                    </Badge>
                  )}
                  {item.format && (
                    <span className="text-[9px] text-muted-foreground uppercase">{FORMATS.find(f => f.key === item.format)?.label || item.format}</span>
                  )}
                  <span className="text-[9px] text-muted-foreground/50 ml-auto">
                    {format(new Date(item.created_at), 'dd/MM/yy', { locale: ptBR })}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={open => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  {typeIcon(selectedItem.type)}
                  {selectedItem.label}
                  {selectedItem.ai_generated && <Badge variant="secondary" className="text-[9px]">IA</Badge>}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">{selectedItem.post_title}</p>
              </DialogHeader>

              <ScrollArea className="max-h-[55vh] mt-3">
                {selectedItem.type === 'thumbnail' && selectedItem.thumbnail_url ? (
                  <div className="space-y-3">
                    <img src={selectedItem.thumbnail_url} alt={selectedItem.post_title} className="w-full rounded-lg" />
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs w-full" asChild>
                      <a href={selectedItem.thumbnail_url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-3.5 h-3.5" /> Abrir Imagem
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{selectedItem.content}</p>
                  </div>
                )}
              </ScrollArea>

              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs flex-1" onClick={() => handleCopy(selectedItem)}>
                  {copiedId === selectedItem.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copiar
                </Button>
              </div>

              <div className="flex items-center gap-2 mt-2">
                {selectedItem.pillar && (
                  <Badge
                    className="text-[9px]"
                    style={{ backgroundColor: PILLARS.find(p => p.key === selectedItem.pillar)?.color + '22', color: PILLARS.find(p => p.key === selectedItem.pillar)?.color }}
                  >
                    {PILLARS.find(p => p.key === selectedItem.pillar)?.label}
                  </Badge>
                )}
                {selectedItem.format && (
                  <Badge variant="secondary" className="text-[9px]">{FORMATS.find(f => f.key === selectedItem.format)?.label || selectedItem.format}</Badge>
                )}
                <span className="text-[9px] text-muted-foreground ml-auto">
                  {format(new Date(selectedItem.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
