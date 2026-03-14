import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InstagramPost, PILLARS, InstagramCampaign } from '@/hooks/useInstagramEngine';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, Sparkles, Copy, Check, Loader2, TrendingUp, Target, Zap, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

interface HashtagCluster {
  name: string;
  tags: string[];
  relevance: number;
  saturation: 'low' | 'medium' | 'high';
}

const SATURATION_STYLES = {
  low: { label: 'Baixa', color: 'bg-primary/15 text-primary' },
  medium: { label: 'Média', color: 'bg-muted text-muted-foreground' },
  high: { label: 'Alta', color: 'bg-destructive/15 text-destructive' },
};

export function CampaignHashtagPlanner({ campaign, posts }: Props) {
  const qc = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [clusters, setClusters] = useState<HashtagCluster[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [customTag, setCustomTag] = useState('');
  const [copied, setCopied] = useState(false);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);

  // Extract existing hashtags from posts
  const existingTags = useMemo(() => {
    const tagMap: Record<string, number> = {};
    posts.forEach(p => {
      if (p.hashtags) {
        const raw = p.hashtags as unknown;
        const tags: string[] = typeof raw === 'string' 
          ? (raw as string).split(/[\s,#]+/).filter(Boolean)
          : Array.isArray(raw) ? raw : [];
        tags.forEach(t => {
          const clean = t.replace('#', '').toLowerCase().trim();
          if (clean) tagMap[clean] = (tagMap[clean] || 0) + 1;
        });
      }
    });
    return Object.entries(tagMap).sort((a, b) => b[1] - a[1]);
  }, [posts]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('instagram-ai', {
        body: {
          action: 'generate_hashtags',
          context: {
            campaign_name: campaign.name,
            objective: campaign.objective,
            target_audience: campaign.target_audience,
            existing_hashtags: existingTags.slice(0, 20).map(([tag]) => tag),
            pillars: posts.map(p => p.pillar).filter(Boolean),
          }
        }
      });

      if (error) throw error;
      const output = data?.output || data;
      if (output?.clusters) {
        setClusters(output.clusters);
      }
    } catch (e) {
      // Fallback: generate local clusters
      const niches = [...new Set(posts.map(p => p.pillar).filter(Boolean))];
      const fallbackClusters: HashtagCluster[] = [
        {
          name: 'Nicho Principal',
          tags: [`${campaign.name.toLowerCase().replace(/\s+/g, '')}`, 'marketing', 'estrategia', 'conteudo', 'digital', 'negocios'],
          relevance: 95,
          saturation: 'medium',
        },
        {
          name: 'Engajamento',
          tags: ['dicas', 'aprenda', 'dicasdemarketing', 'empreendedorismo', 'growthhacking', 'socialmedia'],
          relevance: 80,
          saturation: 'high',
        },
        {
          name: 'Long-tail',
          tags: [`${campaign.name.toLowerCase().replace(/\s+/g, '')}2026`, 'marketingdigital2026', 'estrategiadigital', 'contentmarketing'],
          relevance: 70,
          saturation: 'low',
        },
      ];
      setClusters(fallbackClusters);
    } finally {
      setGenerating(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else if (next.size < 30) next.add(tag);
      else toast.info('Máximo de 30 hashtags');
      return next;
    });
  };

  const addCustom = () => {
    const clean = customTag.replace('#', '').toLowerCase().trim();
    if (clean && !selectedTags.has(clean)) {
      if (selectedTags.size >= 30) { toast.info('Máximo de 30'); return; }
      setSelectedTags(prev => new Set([...prev, clean]));
      setCustomTag('');
    }
  };

  const copyAll = () => {
    const text = [...selectedTags].map(t => `#${t}`).join(' ');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Hashtags copiadas!');
  };

  const applyToPost = async (postId: string) => {
    setApplyingTo(postId);
    try {
      const hashtagsArr = [...selectedTags].map(t => `#${t}`);
      await supabase.from('instagram_posts').update({ hashtags: hashtagsArr }).eq('id', postId);
      qc.invalidateQueries({ queryKey: ['instagram-posts'] });
      toast.success('Hashtags aplicadas ao post!');
    } catch { toast.error('Erro ao aplicar'); }
    finally { setApplyingTo(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Hash className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Planejador de Hashtags</h4>
            <p className="text-[10px] text-muted-foreground">{selectedTags.size}/30 selecionadas · {existingTags.length} usadas na campanha</p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5 text-[10px]" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Gerar Clusters IA
        </Button>
      </div>

      {/* Existing tags from campaign */}
      {existingTags.length > 0 && (
        <Card className="glass-card p-4">
          <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Mais Usadas na Campanha</h5>
          <div className="flex flex-wrap gap-1.5">
            {existingTags.slice(0, 15).map(([tag, count], i) => (
              <motion.div key={tag} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
                <Badge
                  variant={selectedTags.has(tag) ? 'default' : 'outline'}
                  className={`text-[8px] cursor-pointer transition-all hover:scale-105 ${selectedTags.has(tag) ? '' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  #{tag} <span className="ml-1 opacity-50">×{count}</span>
                </Badge>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* AI Clusters */}
      <AnimatePresence>
        {clusters.length > 0 && (
          <div className="space-y-3">
            {clusters.map((cluster, ci) => {
              const sat = SATURATION_STYLES[cluster.saturation];
              return (
                <motion.div key={cluster.name} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.1 }}>
                  <Card className="glass-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-foreground">{cluster.name}</span>
                        <Badge className={`${sat.color} text-[7px]`}>Saturação {sat.label}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground">{cluster.relevance}% relevância</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cluster.tags.map((tag, ti) => (
                        <motion.div key={tag} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: ci * 0.1 + ti * 0.03 }}>
                          <Badge
                            variant={selectedTags.has(tag) ? 'default' : 'outline'}
                            className="text-[8px] cursor-pointer hover:scale-105 transition-all"
                            onClick={() => toggleTag(tag)}
                          >
                            #{tag}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Custom tag + selected */}
      <Card className="glass-card p-4">
        <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Selecionadas ({selectedTags.size}/30)</h5>
        <div className="flex gap-2 mb-3">
          <Input
            value={customTag}
            onChange={e => setCustomTag(e.target.value)}
            placeholder="Adicionar hashtag..."
            className="text-[10px] h-7"
            onKeyDown={e => e.key === 'Enter' && addCustom()}
          />
          <Button size="sm" variant="outline" className="h-7 text-[9px]" onClick={addCustom}><Plus className="w-3 h-3" /></Button>
        </div>
        {selectedTags.size > 0 ? (
          <>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[...selectedTags].map(tag => (
                <Badge key={tag} className="text-[8px] gap-1 cursor-pointer" onClick={() => toggleTag(tag)}>
                  #{tag} <X className="w-2.5 h-2.5" />
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="gap-1 text-[9px] h-6" onClick={copyAll}>
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copiado!' : 'Copiar todas'}
              </Button>
            </div>
          </>
        ) : (
          <p className="text-[10px] text-muted-foreground text-center py-3">Clique nas hashtags acima para selecionar</p>
        )}
      </Card>

      {/* Apply to posts */}
      {selectedTags.size > 0 && posts.filter(p => p.status !== 'published').length > 0 && (
        <Card className="glass-card p-4">
          <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Aplicar a Posts</h5>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {posts.filter(p => p.status !== 'published').map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/10 transition-colors">
                <span className="text-[10px] text-foreground truncate flex-1">{p.title}</span>
                <Button size="sm" variant="ghost" className="h-5 text-[8px] shrink-0" onClick={() => applyToPost(p.id)} disabled={applyingTo === p.id}>
                  {applyingTo === p.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : 'Aplicar'}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
