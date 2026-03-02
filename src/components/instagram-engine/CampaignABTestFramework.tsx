import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InstagramCampaign, InstagramPost, useInstagramAI, useUpdatePost } from '@/hooks/useInstagramEngine';
import { GitCompare, Sparkles, Loader2, Plus, Trophy, Eye, ArrowRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

interface ABTest {
  id: string;
  name: string;
  field: 'hook' | 'caption_short' | 'cta';
  postId: string;
  variantA: string;
  variantB: string;
  winner: 'a' | 'b' | null;
  status: 'running' | 'completed';
}

const FIELD_LABELS: Record<string, string> = {
  hook: 'Hook',
  caption_short: 'Legenda Curta',
  cta: 'CTA',
};

export function CampaignABTestFramework({ campaign, posts }: Props) {
  const ai = useInstagramAI();
  const updatePost = useUpdatePost();
  const [tests, setTests] = useState<ABTest[]>([]);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  // New test form
  const [newTest, setNewTest] = useState({
    name: '',
    field: 'hook' as 'hook' | 'caption_short' | 'cta',
    postId: '',
  });

  const selectedPost = posts.find(p => p.id === newTest.postId);

  const handleCreate = () => {
    if (!newTest.name || !newTest.postId || !selectedPost) {
      toast.error('Preencha nome e selecione um post');
      return;
    }

    const originalValue = selectedPost[newTest.field] || '';
    const test: ABTest = {
      id: crypto.randomUUID(),
      name: newTest.name,
      field: newTest.field,
      postId: newTest.postId,
      variantA: originalValue,
      variantB: '',
      winner: null,
      status: 'running',
    };

    setTests(prev => [...prev, test]);
    setCreating(false);
    setNewTest({ name: '', field: 'hook', postId: '' });
    toast.success('Teste A/B criado!');
  };

  const handleGenerateVariant = async (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;
    const post = posts.find(p => p.id === test.postId);
    if (!post) return;

    setGenerating(testId);
    try {
      const result = await ai.mutateAsync({
        action: 'generate_from_context',
        data: {
          command: `Crie uma variação ALTERNATIVA para o campo "${FIELD_LABELS[test.field]}" deste post.
Original: "${test.variantA}"
Contexto do post: ${post.title}
Formato: ${post.format}
Pilar: ${post.pillar || 'geral'}

Crie uma versão diferente mas igualmente forte. Mude o ângulo, tom ou abordagem.
Retorne APENAS o texto da variação, sem JSON.`,
          field: test.field,
        },
      });

      const variantText = typeof result === 'string' ? result : result?.[test.field] || result?.text || JSON.stringify(result);

      setTests(prev => prev.map(t =>
        t.id === testId ? { ...t, variantB: variantText } : t
      ));
      toast.success('Variante B gerada!');
    } catch {
      // handled
    } finally {
      setGenerating(null);
    }
  };

  const handleSelectWinner = async (testId: string, winner: 'a' | 'b') => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    const winnerText = winner === 'a' ? test.variantA : test.variantB;

    try {
      await updatePost.mutateAsync({
        id: test.postId,
        [test.field]: winnerText,
      } as any);

      setTests(prev => prev.map(t =>
        t.id === testId ? { ...t, winner, status: 'completed' as const } : t
      ));
      toast.success(`Variante ${winner.toUpperCase()} aplicada ao post!`);
    } catch {
      // handled
    }
  };

  const activeTests = tests.filter(t => t.status === 'running');
  const completedTests = tests.filter(t => t.status === 'completed');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">A/B Testing Framework</h3>
          <Badge variant="outline" className="text-[10px]">{activeTests.length} ativo(s)</Badge>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8" onClick={() => setCreating(true)}>
          <Plus className="w-3.5 h-3.5" /> Novo Teste
        </Button>
      </div>

      {/* Create form */}
      {creating && (
        <Card className="p-4 bg-card/50 border-primary/20 space-y-3">
          <h4 className="text-xs font-semibold text-foreground">Criar Teste A/B</h4>
          <Input
            placeholder="Nome do teste (ex: Hook Emocional vs Racional)"
            value={newTest.name}
            onChange={e => setNewTest(prev => ({ ...prev, name: e.target.value }))}
            className="text-xs h-8"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Campo a testar</label>
              <Select value={newTest.field} onValueChange={v => setNewTest(prev => ({ ...prev, field: v as any }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hook">Hook</SelectItem>
                  <SelectItem value="caption_short">Legenda Curta</SelectItem>
                  <SelectItem value="cta">CTA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Post</label>
              <Select value={newTest.postId} onValueChange={v => setNewTest(prev => ({ ...prev, postId: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  {posts.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="text-xs h-7" onClick={handleCreate}>Criar</Button>
            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setCreating(false)}>Cancelar</Button>
          </div>
        </Card>
      )}

      {/* Active Tests */}
      {activeTests.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Testes Ativos</h4>
          {activeTests.map(test => {
            const post = posts.find(p => p.id === test.postId);
            return (
              <Card key={test.id} className="p-4 bg-card/50 border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="text-xs font-semibold text-foreground">{test.name}</h5>
                    <p className="text-[10px] text-muted-foreground">{post?.title} — {FIELD_LABELS[test.field]}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px] text-red-400 hover:text-red-300"
                    onClick={() => setTests(prev => prev.filter(t => t.id !== test.id))}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Variant A */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-primary/15 text-primary text-[9px]">A (Original)</Badge>
                    </div>
                    <div className="p-2 bg-muted/10 rounded-md text-xs text-muted-foreground min-h-[60px]">
                      {test.variantA || <span className="italic">Vazio</span>}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-7 text-[10px] gap-1"
                      onClick={() => handleSelectWinner(test.id, 'a')}
                    >
                      <Trophy className="w-3 h-3" /> Escolher A
                    </Button>
                  </div>

                  {/* Variant B */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-amber-500/15 text-amber-400 text-[9px]">B (Variação)</Badge>
                    </div>
                    {test.variantB ? (
                      <div className="p-2 bg-muted/10 rounded-md text-xs text-muted-foreground min-h-[60px]">
                        {test.variantB}
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full min-h-[60px] text-[10px] gap-1"
                        onClick={() => handleGenerateVariant(test.id)}
                        disabled={generating === test.id}
                      >
                        {generating === test.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        Gerar Variante B com IA
                      </Button>
                    )}
                    {test.variantB && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-7 text-[10px] gap-1"
                        onClick={() => handleSelectWinner(test.id, 'b')}
                      >
                        <Trophy className="w-3 h-3" /> Escolher B
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Completed Tests */}
      {completedTests.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Concluídos</h4>
          {completedTests.map(test => (
            <Card key={test.id} className="p-3 bg-card/30 border-border/20">
              <div className="flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-foreground font-medium">{test.name}</span>
                <Badge className={`text-[9px] ${test.winner === 'a' ? 'bg-primary/15 text-primary' : 'bg-amber-500/15 text-amber-400'}`}>
                  Vencedor: {test.winner?.toUpperCase()}
                </Badge>
                <span className="text-[10px] text-muted-foreground">{FIELD_LABELS[test.field]}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tests.length === 0 && !creating && (
        <Card className="p-8 bg-card/30 border-border/20 text-center">
          <GitCompare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Crie testes A/B para comparar variações de hooks, legendas e CTAs</p>
        </Card>
      )}
    </div>
  );
}
