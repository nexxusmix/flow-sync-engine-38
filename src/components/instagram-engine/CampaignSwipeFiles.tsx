import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InstagramPost, InstagramCampaign, PILLARS, FORMATS } from '@/hooks/useInstagramEngine';
import { useInstagramPosts, useInstagramCampaigns } from '@/hooks/useInstagramEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { BookMarked, Copy, Search, Filter, Star, StarOff, Zap, Hash, Bookmark, MessageSquare, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

type SwipeType = 'hook' | 'caption' | 'cta' | 'hashtags';

interface SwipeEntry {
  id: string;
  type: SwipeType;
  text: string;
  postTitle: string;
  postId: string;
  campaignName: string;
  pillar?: string;
  format?: string;
  aiGenerated: boolean;
}

export function CampaignSwipeFiles({ campaign, posts }: Props) {
  const { data: allPosts } = useInstagramPosts();
  const { data: allCampaigns } = useInstagramCampaigns();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<SwipeType | 'all'>('all');
  const [filterPillar, setFilterPillar] = useState<string>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const entries = useMemo(() => {
    const all: SwipeEntry[] = [];
    const postsToUse = allPosts || posts;
    const campaignsMap = new Map((allCampaigns || []).map(c => [c.id, c.name]));

    postsToUse.forEach(post => {
      const campName = post.campaign_id ? campaignsMap.get(post.campaign_id) || 'Sem campanha' : 'Sem campanha';

      if (post.hook) {
        all.push({ id: `hook-${post.id}`, type: 'hook', text: post.hook, postTitle: post.title, postId: post.id, campaignName: campName, pillar: post.pillar || undefined, format: post.format, aiGenerated: post.ai_generated });
      }
      if (post.caption_short) {
        all.push({ id: `cap-s-${post.id}`, type: 'caption', text: post.caption_short, postTitle: post.title, postId: post.id, campaignName: campName, pillar: post.pillar || undefined, format: post.format, aiGenerated: post.ai_generated });
      }
      if (post.caption_long) {
        all.push({ id: `cap-l-${post.id}`, type: 'caption', text: post.caption_long, postTitle: post.title, postId: post.id, campaignName: campName, pillar: post.pillar || undefined, format: post.format, aiGenerated: post.ai_generated });
      }
      if (post.cta) {
        all.push({ id: `cta-${post.id}`, type: 'cta', text: post.cta, postTitle: post.title, postId: post.id, campaignName: campName, pillar: post.pillar || undefined, format: post.format, aiGenerated: post.ai_generated });
      }
      if (post.hashtags && post.hashtags.length > 0) {
        all.push({ id: `hash-${post.id}`, type: 'hashtags', text: post.hashtags.join(' '), postTitle: post.title, postId: post.id, campaignName: campName, pillar: post.pillar || undefined, format: post.format, aiGenerated: post.ai_generated });
      }
    });

    return all;
  }, [allPosts, posts, allCampaigns]);

  const filtered = useMemo(() => {
    let items = entries;
    if (filterType !== 'all') items = items.filter(e => e.type === filterType);
    if (filterPillar !== 'all') items = items.filter(e => e.pillar === filterPillar);
    if (showFavoritesOnly) items = items.filter(e => favorites.has(e.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(e => e.text.toLowerCase().includes(q) || e.postTitle.toLowerCase().includes(q));
    }
    return items;
  }, [entries, filterType, filterPillar, showFavoritesOnly, favorites, search]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const typeConfig: Record<SwipeType, { label: string; color: string; icon: React.ReactNode }> = {
    hook: { label: 'Hook', color: 'bg-rose-500/15 text-rose-400', icon: <Zap className="w-3 h-3" /> },
    caption: { label: 'Legenda', color: 'bg-blue-500/15 text-blue-400', icon: <MessageSquare className="w-3 h-3" /> },
    cta: { label: 'CTA', color: 'bg-emerald-500/15 text-emerald-400', icon: <Tag className="w-3 h-3" /> },
    hashtags: { label: 'Hashtags', color: 'bg-amber-500/15 text-amber-400', icon: <Hash className="w-3 h-3" /> },
  };

  const stats = {
    hooks: entries.filter(e => e.type === 'hook').length,
    captions: entries.filter(e => e.type === 'caption').length,
    ctas: entries.filter(e => e.type === 'cta').length,
    hashtags: entries.filter(e => e.type === 'hashtags').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
          <BookMarked className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Banco de Swipe Files</h4>
          <p className="text-[10px] text-muted-foreground">{entries.length} itens de todas as campanhas</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(stats).map(([key, val]) => (
          <Card key={key} className="glass-card p-2 text-center cursor-pointer hover:bg-muted/10 transition-all" onClick={() => setFilterType(key === 'hooks' ? 'hook' : key === 'captions' ? 'caption' : key === 'ctas' ? 'cta' : 'hashtags')}>
            <p className="text-lg font-bold text-foreground">{val}</p>
            <p className="text-[8px] text-muted-foreground capitalize">{key}</p>
          </Card>
        ))}
      </div>

      {/* Search & filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[150px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8 h-8 text-[10px]" placeholder="Buscar hooks, legendas, CTAs..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button size="sm" variant={showFavoritesOnly ? 'default' : 'outline'} className="h-8 gap-1 text-[9px]" onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}>
          <Bookmark className="w-3 h-3" /> Favoritos ({favorites.size})
        </Button>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {(['all', 'hook', 'caption', 'cta', 'hashtags'] as const).map(t => (
          <Button key={t} size="sm" variant={filterType === t ? 'default' : 'outline'} className="text-[8px] h-6" onClick={() => setFilterType(t)}>
            {t === 'all' ? 'Todos' : typeConfig[t].label}
          </Button>
        ))}
        <span className="text-[8px] text-muted-foreground self-center mx-1">|</span>
        {(['all', ...PILLARS.map(p => p.key)] as const).map(p => (
          <Button key={p} size="sm" variant={filterPillar === p ? 'default' : 'outline'} className="text-[8px] h-6" onClick={() => setFilterPillar(p)}>
            {p === 'all' ? 'Todos' : PILLARS.find(pl => pl.key === p)?.label || p}
          </Button>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <Card className="glass-card p-8 text-center">
              <BookMarked className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-[10px] text-muted-foreground">Nenhum item encontrado</p>
            </Card>
          ) : filtered.map((entry, i) => {
            const tc = typeConfig[entry.type];
            const isFav = favorites.has(entry.id);

            return (
              <motion.div key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ delay: i * 0.02 }}>
                <Card className="glass-card p-3 hover:bg-muted/5 transition-all">
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Badge className={`${tc.color} text-[7px] gap-0.5`}>{tc.icon}{tc.label}</Badge>
                      {entry.aiGenerated && <Badge className="bg-primary/15 text-primary text-[7px]">IA</Badge>}
                      {entry.pillar && (
                        <Badge variant="outline" className="text-[7px]">{PILLARS.find(p => p.key === entry.pillar)?.label}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => toggleFavorite(entry.id)}>
                        {isFav ? <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> : <StarOff className="w-3 h-3 text-muted-foreground" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => copyToClipboard(entry.text)}>
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-[10px] text-foreground/80 leading-relaxed line-clamp-3">{entry.text}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[8px] text-muted-foreground">
                    <span className="truncate">{entry.postTitle}</span>
                    <span>·</span>
                    <span className="shrink-0">{entry.campaignName}</span>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <p className="text-[8px] text-muted-foreground text-center">{filtered.length} de {entries.length} itens</p>
    </div>
  );
}
