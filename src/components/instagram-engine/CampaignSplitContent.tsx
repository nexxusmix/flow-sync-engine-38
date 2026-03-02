import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { InstagramCampaign, InstagramPost, useInstagramAI, useCreatePost } from '@/hooks/useInstagramEngine';
import { Scissors, Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

export function CampaignSplitContent({ campaign, posts }: Props) {
  const ai = useInstagramAI();
  const createPost = useCreatePost();
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);
  const [customContent, setCustomContent] = useState('');
  const [splits, setSplits] = useState<any[]>([]);

  const handleSplit = async () => {
    const source = selectedPost
      ? `Título: "${selectedPost.title}"\nFormato: ${selectedPost.format}\nGancho: ${selectedPost.hook || 'N/A'}\nRoteiro: ${selectedPost.script?.slice(0, 500) || 'N/A'}\nLegenda: ${selectedPost.caption_long?.slice(0, 500) || selectedPost.caption_short || 'N/A'}`
      : customContent;

    if (!source.trim()) { toast.error('Selecione um post ou cole conteúdo'); return; }

    try {
      const result = await ai.mutateAsync({
        action: 'generate_from_context',
        data: {
          command: `REPURPOSE: Pegue este conteúdo e crie 6-8 micro-conteúdos derivados.

Conteúdo original:
${source}

Campanha: "${campaign.name}"
Público: ${campaign.target_audience || 'geral'}

Retorne JSON com:
- original_summary: resumo do conteúdo original (1 frase)
- splits: array de 6-8 micro-conteúdos, cada com:
  - title: título do micro-conteúdo
  - format: "story"|"reel"|"single"|"carousel"
  - type: "quote"|"teaser"|"behind_the_scenes"|"data_point"|"mini_tutorial"|"poll"|"reaction"|"thread"
  - hook: gancho
  - caption_short: legenda curta
  - caption_long: legenda completa
  - pillar: pilar sugerido
  - timing: quando publicar relativo ao original (ex: "-2d", "+1d", "mesmo dia")
  - effort_level: "low"|"medium"|"high"
- repurpose_strategy: string com a estratégia de repurpose
- total_reach_multiplier: string estimando multiplicação de alcance (ex: "3-5x")`,
          format: 'split_content',
        },
      });
      setSplits(result?.splits || []);
      toast.success(`${result?.splits?.length || 0} micro-conteúdos gerados! ✂️`);
    } catch { /* handled */ }
  };

  const handleSaveAll = async () => {
    let saved = 0;
    for (const s of splits) {
      try {
        await createPost.mutateAsync({
          title: s.title,
          format: s.format,
          hook: s.hook,
          caption_short: s.caption_short,
          caption_long: s.caption_long,
          pillar: s.pillar,
          status: 'planned',
          campaign_id: campaign.id,
          ai_generated: true,
        });
        saved++;
      } catch { /* continue */ }
    }
    toast.success(`${saved} posts salvos!`);
  };

  const effortColors: Record<string, string> = {
    low: 'bg-emerald-400/10 text-emerald-400',
    medium: 'bg-amber-400/10 text-amber-400',
    high: 'bg-red-400/10 text-red-400',
  };

  const publishedPosts = posts.filter(p => ['published', 'ready', 'creating'].includes(p.status));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scissors className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Split Content Engine</h3>
        </div>
      </div>

      {splits.length === 0 && (
        <div className="space-y-3">
          {/* Select existing post */}
          {publishedPosts.length > 0 && (
            <Card className="p-4 bg-card/50 border-border/30">
              <h4 className="text-[10px] text-muted-foreground font-medium mb-2">Selecione um post existente para fatiar:</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {publishedPosts.slice(0, 15).map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPost(p); setCustomContent(''); }}
                    className={`w-full text-left p-2 rounded text-[10px] transition-colors ${selectedPost?.id === p.id ? 'bg-primary/10 border border-primary/20' : 'bg-background/40 hover:bg-background/60'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[7px]">{p.format}</Badge>
                      <span className="text-foreground truncate">{p.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Or paste content */}
          <Card className="p-4 bg-card/50 border-border/30">
            <h4 className="text-[10px] text-muted-foreground font-medium mb-2">Ou cole conteúdo longo para fatiar:</h4>
            <Textarea
              value={customContent}
              onChange={e => { setCustomContent(e.target.value); setSelectedPost(null); }}
              placeholder="Cole aqui o roteiro, legenda longa, transcrição de vídeo..."
              className="text-xs min-h-[80px]"
            />
          </Card>

          <Button className="w-full gap-2" onClick={handleSplit} disabled={ai.isPending}>
            {ai.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
            Fatiar em Micro-Conteúdos
          </Button>
        </div>
      )}

      {splits.length > 0 && (
        <div className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            {splits.map((s, i) => (
              <Card key={i} className="p-4 bg-card/50 border-border/30">
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <Badge variant="outline" className="text-[7px]">{s.format}</Badge>
                  <Badge className={`text-[7px] ${effortColors[s.effort_level] || 'bg-muted/20 text-muted-foreground'}`}>{s.effort_level}</Badge>
                  <Badge variant="outline" className="text-[7px]">{s.type}</Badge>
                  {s.timing && <span className="text-[8px] text-muted-foreground ml-auto">📅 {s.timing}</span>}
                </div>
                <h5 className="text-xs font-semibold text-foreground mb-1">{s.title}</h5>
                {s.hook && <p className="text-[9px] text-primary/80 mb-1">🎯 {s.hook}</p>}
                <p className="text-[9px] text-muted-foreground line-clamp-2">{s.caption_short}</p>
              </Card>
            ))}
          </div>

          <Button className="w-full gap-2" onClick={handleSaveAll} disabled={createPost.isPending}>
            {createPost.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Salvar Todos na Campanha
          </Button>
          <Button variant="outline" className="w-full text-xs" onClick={() => setSplits([])}>
            Voltar
          </Button>
        </div>
      )}
    </div>
  );
}
