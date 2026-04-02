import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { InstagramCampaign, InstagramPost, useInstagramAI } from '@/hooks/useInstagramEngine';
import { Hash, TrendingUp, AlertTriangle, Sparkles, Loader2, Copy, Ban, Star, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

interface HashtagStat {
  tag: string;
  count: number;
  posts: string[];
}

export function CampaignHashtagIntelligence({ campaign, posts }: Props) {
  const ai = useInstagramAI();
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [newBlacklist, setNewBlacklist] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);

  // Analyze all hashtags across campaign posts
  const hashtagStats = useMemo(() => {
    const map: Record<string, HashtagStat> = {};
    posts.forEach(p => {
      (p.hashtags || []).forEach(tag => {
        const clean = tag.replace(/^#/, '').toLowerCase();
        if (!clean) return;
        if (!map[clean]) map[clean] = { tag: clean, count: 0, posts: [] };
        map[clean].count++;
        map[clean].posts.push(p.title);
      });
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [posts]);

  const totalHashtags = posts.reduce((sum, p) => sum + (p.hashtags || []).length, 0);
  const uniqueHashtags = hashtagStats.length;
  const avgPerPost = posts.length ? (totalHashtags / posts.length).toFixed(1) : '0';
  const overused = hashtagStats.filter(h => h.count > posts.length * 0.5);
  const blacklisted = hashtagStats.filter(h => blacklist.includes(h.tag));

  const handleAddBlacklist = () => {
    if (!newBlacklist.trim()) return;
    const tags = newBlacklist.split(',').map(t => t.trim().replace(/^#/, '').toLowerCase()).filter(Boolean);
    setBlacklist(prev => [...new Set([...prev, ...tags])]);
    setNewBlacklist('');
    toast.success(`${tags.length} hashtag(s) adicionada(s) à blacklist`);
  };

  const handleAISuggest = async () => {
    try {
      const result = await ai.mutateAsync({
        action: 'generate_from_context',
        data: {
          command: `Analise as hashtags desta campanha "${campaign.name}" e sugira:
1. "optimal_sets": 3 conjuntos otimizados de 15-20 hashtags cada (mix de alto alcance, médio alcance e nicho)
2. "avoid": lista de hashtags a evitar e por quê
3. "trending": 10 hashtags em tendência relevantes para o nicho
4. "score": pontuação de 0-100 da estratégia atual de hashtags
5. "tips": 3 dicas para melhorar

Hashtags atuais mais usadas: ${hashtagStats.slice(0, 20).map(h => `#${h.tag}(${h.count}x)`).join(', ')}
Objetivo: ${campaign.objective || 'engajamento'}
Público: ${campaign.target_audience || 'geral'}

Retorne JSON com as chaves acima.`,
          format: 'analysis',
        },
      });
      setAiSuggestions(result);
      toast.success('Análise de hashtags gerada!');
    } catch {
      // error handled by mutation
    }
  };

  const copySet = (tags: string[]) => {
    navigator.clipboard.writeText(tags.map(t => `#${t}`).join(' '));
    toast.success('Hashtags copiadas!');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hash className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Hashtag Intelligence</h3>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8" onClick={handleAISuggest} disabled={ai.isPending}>
          {ai.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Análise IA
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 bg-card/50 border-border/30 text-center">
          <div className="text-lg font-bold text-primary">{uniqueHashtags}</div>
          <div className="text-[10px] text-muted-foreground">Únicas</div>
        </Card>
        <Card className="p-3 bg-card/50 border-border/30 text-center">
          <div className="text-lg font-bold text-foreground">{avgPerPost}</div>
          <div className="text-[10px] text-muted-foreground">Média/Post</div>
        </Card>
        <Card className="p-3 bg-card/50 border-border/30 text-center">
          <div className="text-lg font-bold text-amber-400">{overused.length}</div>
          <div className="text-[10px] text-muted-foreground">Overused (&gt;50%)</div>
        </Card>
        <Card className="p-3 bg-card/50 border-border/30 text-center">
          <div className="text-lg font-bold text-red-400">{blacklisted.length}</div>
          <div className="text-[10px] text-muted-foreground">Blacklisted</div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Top Hashtags */}
        <Card className="p-4 bg-card/50 border-border/30">
          <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-primary" /> Ranking de Hashtags
          </h4>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {hashtagStats.slice(0, 25).map((h, i) => (
              <div key={h.tag} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-5 text-right">{i + 1}</span>
                <div className="flex-1 flex items-center gap-1.5">
                  <span className="text-xs text-foreground">#{h.tag}</span>
                  {h.count > posts.length * 0.5 && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                  {blacklist.includes(h.tag) && <Ban className="w-3 h-3 text-red-400" />}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(h.count / (hashtagStats[0]?.count || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-6">{h.count}x</span>
                </div>
              </div>
            ))}
            {hashtagStats.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhuma hashtag encontrada nos posts</p>
            )}
          </div>
        </Card>

        {/* Blacklist */}
        <Card className="p-4 bg-card/50 border-border/30">
          <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <Ban className="w-3.5 h-3.5 text-red-400" /> Blacklist
          </h4>
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="Adicionar hashtags (separar por vírgula)..."
              value={newBlacklist}
              onChange={e => setNewBlacklist(e.target.value)}
              className="text-xs h-8"
              onKeyDown={e => e.key === 'Enter' && handleAddBlacklist()}
            />
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleAddBlacklist}>
              Adicionar
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {blacklist.map(tag => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[10px] border-red-400/30 text-red-400 cursor-pointer hover:bg-red-400/10"
                onClick={() => setBlacklist(prev => prev.filter(t => t !== tag))}
              >
                #{tag} ✕
              </Badge>
            ))}
            {blacklist.length === 0 && (
              <p className="text-[10px] text-muted-foreground">Nenhuma hashtag na blacklist</p>
            )}
          </div>
        </Card>
      </div>

      {/* AI Suggestions */}
      {aiSuggestions && (
        <div className="space-y-4">
          {/* Score */}
          {aiSuggestions.score !== undefined && (
            <Card className="p-4 bg-card/50 border-border/30">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-amber-400" />
                <div>
                  <span className="text-2xl font-bold text-foreground">{aiSuggestions.score}</span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
                <span className="text-xs text-muted-foreground ml-2">Score da estratégia de hashtags</span>
              </div>
            </Card>
          )}

          {/* Optimal Sets */}
          {Array.isArray(aiSuggestions.optimal_sets) && aiSuggestions.optimal_sets.map((set: any, i: number) => (
            <Card key={i} className="p-4 bg-card/50 border-border/30">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-foreground">Set {i + 1}</h4>
                <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1" onClick={() => copySet(Array.isArray(set) ? set : set.tags || [])}>
                  <Copy className="w-3 h-3" /> Copiar
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {(Array.isArray(set) ? set : set.tags || []).map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-[10px]">#{tag}</Badge>
                ))}
              </div>
            </Card>
          ))}

          {/* Tips */}
          {Array.isArray(aiSuggestions.tips) && (
            <Card className="p-4 bg-card/50 border-border/30">
              <h4 className="text-xs font-semibold text-foreground mb-2">💡 Dicas</h4>
              <ul className="space-y-1.5">
                {aiSuggestions.tips.map((tip: string, i: number) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                    <span className="text-primary">•</span> {tip}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
