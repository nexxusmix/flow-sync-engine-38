import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInstagramHooks, useInstagramAI, useSaveHooks, PILLARS } from '@/hooks/useInstagramEngine';
import { Loader2, Sparkles, Search, Star, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const HOOK_CATEGORIES = [
  { key: 'autoridade', label: 'Autoridade' },
  { key: 'luxury', label: 'Luxury' },
  { key: 'bastidores', label: 'Bastidores' },
  { key: 'educacao', label: 'Educação' },
  { key: 'venda', label: 'Venda Consultiva' },
];

export function ScriptsTab() {
  const { data: hooks, isLoading } = useInstagramHooks();
  const aiMutation = useInstagramAI();
  const saveHooks = useSaveHooks();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredHooks = (hooks || []).filter(h => {
    if (search && !h.hook_text.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory !== 'all' && h.category !== filterCategory) return false;
    return true;
  });

  const handleGenerate = async (category: string) => {
    setGenerating(true);
    try {
      const result = await aiMutation.mutateAsync({
        action: 'generate_hooks',
        data: { category, count: 5 },
      });
      if (Array.isArray(result)) {
        await saveHooks.mutateAsync(result.map((h: any) => ({
          hook_text: h.hook_text,
          category: h.category || category,
          format: h.format || 'reel',
          hook_score: h.hook_score || 0,
          score_breakdown: h.score_breakdown || null,
          ai_generated: true,
        })));
        toast.success(`${result.length} hooks gerados com IA`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Erro ao gerar hooks');
    } finally {
      setGenerating(false);
    }
  };

  const copyHook = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const scoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-muted-foreground';
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Biblioteca de Hooks</h3>
          <p className="text-xs text-muted-foreground">{filteredHooks.length} hooks • Ordenado por score</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[140px] text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {HOOK_CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => handleGenerate(filterCategory === 'all' ? 'autoridade' : filterCategory)}
            disabled={generating}
          >
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Gerar com IA
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar hooks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 text-sm"
        />
      </div>

      {/* Hooks List */}
      {filteredHooks.length === 0 ? (
        <Card className="glass-card p-8 text-center">
          <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">Nenhum hook ainda. Gere seus primeiros hooks com IA!</p>
          <Button size="sm" onClick={() => handleGenerate('autoridade')} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Gerar 5 Hooks de Autoridade
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredHooks.map(h => (
            <Card key={h.id} className="glass-card p-4 hover:border-primary/20 transition-colors group">
              <div className="flex items-start gap-4">
                <div className={`text-xl font-bold tabular-nums w-10 text-center ${scoreColor(h.hook_score)}`}>
                  {h.hook_score}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed">{h.hook_text}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {h.category && (
                      <Badge variant="secondary" className="text-[9px]">
                        {HOOK_CATEGORIES.find(c => c.key === h.category)?.label || h.category}
                      </Badge>
                    )}
                    {h.hook_score >= 85 && (
                      <Badge className="bg-amber-500/15 text-amber-400 text-[9px] gap-0.5">
                        <Star className="w-2.5 h-2.5" /> Viral Potential
                      </Badge>
                    )}
                    {h.ai_generated && <Badge variant="outline" className="text-[9px]">IA</Badge>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copyHook(h.id, h.hook_text)}
                >
                  {copiedId === h.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
