import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InstagramCampaign, InstagramPost, useInstagramAI, useUpdatePost } from '@/hooks/useInstagramEngine';
import { GitCompare, Sparkles, Loader2, Plus, Trophy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

interface ABTest {
  id: string;
  campaign_id: string;
  post_id: string;
  name: string;
  field: string;
  variant_a: string;
  variant_b: string;
  winner: string | null;
  status: string;
  created_at: string;
}

const FIELD_LABELS: Record<string, string> = {
  hook: 'Hook',
  caption_short: 'Legenda Curta',
  cta: 'CTA',
};

function useABTests(campaignId: string) {
  return useQuery({
    queryKey: ['instagram-ab-tests', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_ab_tests')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false }) as any;
      if (error) throw error;
      return (data || []) as ABTest[];
    },
  });
}

export function CampaignABTestFramework({ campaign, posts }: Props) {
  const ai = useInstagramAI();
  const updatePost = useUpdatePost();
  const qc = useQueryClient();
  const { data: tests = [], isLoading } = useABTests(campaign.id);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  const [newTest, setNewTest] = useState({
    name: '',
    field: 'hook' as string,
    postId: '',
  });

  const selectedPost = posts.find(p => p.id === newTest.postId);

  const handleCreate = async () => {
    if (!newTest.name || !newTest.postId || !selectedPost) {
      toast.error('Preencha nome e selecione um post');
      return;
    }

    const originalValue = (selectedPost as any)[newTest.field] || '';

    const { error } = await (supabase
      .from('instagram_ab_tests') as any)
      .insert({
        campaign_id: campaign.id,
        post_id: newTest.postId,
        name: newTest.name,
        field: newTest.field,
        variant_a: originalValue,
        variant_b: '',
        status: 'running',
      });

    if (error) {
      toast.error('Erro ao criar teste');
      return;
    }

    qc.invalidateQueries({ queryKey: ['instagram-ab-tests', campaign.id] });
    setCreating(false);
    setNewTest({ name: '', field: 'hook', postId: '' });
    toast.success('Teste A/B criado!');
  };

  const handleGenerateVariant = async (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;
    const post = posts.find(p => p.id === test.post_id);
    if (!post) return;

    setGenerating(testId);
    try {
      const result = await ai.mutateAsync({
        action: 'generate_from_context',
        data: {
          command: `Crie uma variação ALTERNATIVA para o campo "${FIELD_LABELS[test.field]}" deste post.
Original: "${test.variant_a}"
Contexto do post: ${post.title}
Formato: ${post.format}
Pilar: ${post.pillar || 'geral'}

Crie uma versão diferente mas igualmente forte. Mude o ângulo, tom ou abordagem.
Retorne APENAS o texto da variação, sem JSON.`,
          field: test.field,
        },
      });

      const variantText = typeof result === 'string' ? result : (result as any)?.[test.field] || (result as any)?.text || JSON.stringify(result);

      await (supabase
        .from('instagram_ab_tests') as any)
        .update({ variant_b: variantText })
        .eq('id', testId);

      qc.invalidateQueries({ queryKey: ['instagram-ab-tests', campaign.id] });
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

    const winnerText = winner === 'a' ? test.variant_a : test.variant_b;

    try {
      await updatePost.mutateAsync({
        id: test.post_id,
        [test.field]: winnerText,
      } as any);

      await (supabase
        .from('instagram_ab_tests') as any)
        .update({ winner, status: 'completed' })
        .eq('id', testId);

      qc.invalidateQueries({ queryKey: ['instagram-ab-tests', campaign.id] });
      toast.success(`Variante ${winner.toUpperCase()} aplicada ao post!`);
    } catch {
      // handled
    }
  };

  const handleDelete = async (testId: string) => {
    await (supabase.from('instagram_ab_tests') as any).delete().eq('id', testId);
    qc.invalidateQueries({ queryKey: ['instagram-ab-tests', campaign.id] });
    toast.success('Teste removido');
  };

  const activeTests = tests.filter(t => t.status === 'running');
  const completedTests = tests.filter(t => t.status === 'completed');

  if (isLoading) {
    return <Card className="p-8 bg-card/30 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></Card>;
  }

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
              <Select value={newTest.field} onValueChange={v => setNewTest(prev => ({ ...prev, field: v }))}>
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

      {activeTests.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Testes Ativos</h4>
          {activeTests.map(test => {
            const post = posts.find(p => p.id === test.post_id);
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
                    className="h-6 text-[10px] text-destructive hover:text-destructive/80"
                    onClick={() => handleDelete(test.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-primary/15 text-primary text-[9px]">A (Original)</Badge>
                    </div>
                    <div className="p-2 bg-muted/10 rounded-md text-xs text-muted-foreground min-h-[60px]">
                      {test.variant_a || <span className="italic">Vazio</span>}
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

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-muted text-muted-foreground text-[9px]">B (Variação)</Badge>
                    </div>
                    {test.variant_b ? (
                      <div className="p-2 bg-muted/10 rounded-md text-xs text-muted-foreground min-h-[60px]">
                        {test.variant_b}
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
                    {test.variant_b && (
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

      {completedTests.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Concluídos</h4>
          {completedTests.map(test => (
            <Card key={test.id} className="p-3 bg-card/30 border-border/20">
              <div className="flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-foreground font-medium">{test.name}</span>
                <Badge className={`text-[9px] ${test.winner === 'a' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
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
