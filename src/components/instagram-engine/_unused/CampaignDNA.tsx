import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InstagramCampaign, InstagramPost, useInstagramAI, useInstagramCampaigns, PILLARS, FORMATS } from '@/hooks/useInstagramEngine';
import { Dna, Sparkles, Loader2, Copy, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

export function CampaignDNA({ campaign, posts }: Props) {
  const ai = useInstagramAI();
  const { data: allCampaigns } = useInstagramCampaigns();
  const qc = useQueryClient();
  const [dna, setDna] = useState<any>(null);
  const [cloneName, setCloneName] = useState('');
  const [cloneAudience, setCloneAudience] = useState('');
  const [cloning, setCloning] = useState(false);

  const stats = useMemo(() => {
    const formatDist = FORMATS.map(f => ({ key: f.key, label: f.label, count: posts.filter(p => p.format === f.key).length })).filter(f => f.count > 0).sort((a, b) => b.count - a.count);
    const pillarDist = PILLARS.map(p => ({ key: p.key, label: p.label, count: posts.filter(x => x.pillar === p.key).length })).filter(p => p.count > 0).sort((a, b) => b.count - a.count);
    const total = posts.length;
    const aiGen = posts.filter(p => p.ai_generated).length;
    return { formatDist, pillarDist, total, aiGen };
  }, [posts]);

  const handleExtractDNA = async () => {
    try {
      const result = await ai.mutateAsync({
        action: 'generate_from_context',
        data: {
          command: `Extraia o DNA da campanha "${campaign.name}".

Dados:
- Objetivo: ${campaign.objective || 'N/A'}
- Público: ${campaign.target_audience || 'N/A'}
- Total posts: ${stats.total}
- Distribuição formatos: ${stats.formatDist.map(f => `${f.label}: ${f.count}`).join(', ')}
- Distribuição pilares: ${stats.pillarDist.map(p => `${p.label}: ${p.count}`).join(', ')}
- Posts IA: ${stats.aiGen}/${stats.total}

Retorne JSON com:
- dna_name: nome criativo para o DNA (2-3 palavras)
- dna_description: descrição do padrão (2-3 frases)
- format_mix: array de {format, percentage} (soma = 100)
- pillar_mix: array de {pillar, percentage} (soma = 100)
- cadence: objeto {posts_per_week, best_days: string[], best_times: string[]}
- tone_profile: array de 3-5 adjetivos do tom
- content_patterns: array de 3-5 padrões identificados
- hook_style: string descrevendo o estilo de gancho predominante
- cta_style: string descrevendo o estilo de CTA
- success_formula: string com a fórmula de sucesso em 1 frase
- clone_instructions: array de 5 passos para replicar este DNA em outra campanha
- compatibility_score: número 0-100 de quão replicável é este DNA`,
          format: 'campaign_dna',
        },
      });
      setDna(result);
      toast.success('DNA extraído com sucesso! 🧬');
    } catch { /* handled */ }
  };

  const handleClone = async () => {
    if (!cloneName.trim()) { toast.error('Nome da nova campanha é obrigatório'); return; }
    setCloning(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const wid = session?.session?.user?.user_metadata?.workspace_id;
      const { error } = await supabase.from('instagram_campaigns' as any).insert({
        name: cloneName,
        objective: campaign.objective,
        target_audience: cloneAudience || campaign.target_audience,
        status: 'planning',
        start_date: null,
        end_date: null,
        workspace_id: wid,
        user_id: session?.session?.user?.id,
      } as any);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['instagram-campaigns'] });
      toast.success(`Campanha "${cloneName}" criada com DNA clonado!`);
      setCloneName('');
      setCloneAudience('');
    } catch {
      toast.error('Erro ao clonar campanha');
    } finally {
      setCloning(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dna className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Campaign DNA & Clonagem</h3>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8" onClick={handleExtractDNA} disabled={ai.isPending}>
          {ai.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Extrair DNA
        </Button>
      </div>

      {/* Current stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 bg-card/50 border-border/30 text-center">
          <div className="text-lg font-bold text-foreground">{stats.total}</div>
          <div className="text-[9px] text-muted-foreground">Posts</div>
        </Card>
        <Card className="p-3 bg-card/50 border-border/30 text-center">
          <div className="text-lg font-bold text-foreground">{stats.formatDist.length}</div>
          <div className="text-[9px] text-muted-foreground">Formatos</div>
        </Card>
        <Card className="p-3 bg-card/50 border-border/30 text-center">
          <div className="text-lg font-bold text-foreground">{stats.pillarDist.length}</div>
          <div className="text-[9px] text-muted-foreground">Pilares</div>
        </Card>
        <Card className="p-3 bg-card/50 border-border/30 text-center">
          <div className="text-lg font-bold text-foreground">{Math.round((stats.aiGen / Math.max(1, stats.total)) * 100)}%</div>
          <div className="text-[9px] text-muted-foreground">Gerado IA</div>
        </Card>
      </div>

      {/* DNA Result */}
      {dna && (
        <div className="space-y-4">
          <Card className="p-5 bg-gradient-to-b from-primary/5 to-transparent border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Dna className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-bold text-primary">{dna.dna_name}</h4>
              {dna.compatibility_score !== undefined && (
                <Badge className="bg-primary/10 text-primary text-[8px] ml-auto">{dna.compatibility_score}% replicável</Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">{dna.dna_description}</p>
            {dna.success_formula && (
              <div className="mt-2 p-2 bg-background/40 rounded text-[10px] text-foreground">🏆 {dna.success_formula}</div>
            )}
          </Card>

          {/* Mix */}
          <div className="grid md:grid-cols-2 gap-4">
            {Array.isArray(dna.format_mix) && (
              <Card className="p-4 bg-card/50 border-border/30">
                <h4 className="text-xs font-semibold text-foreground mb-3">📐 Mix de Formatos</h4>
                <div className="space-y-2">
                  {dna.format_mix.map((f: any) => (
                    <div key={f.format} className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[8px] w-20 justify-center">{FORMATS.find(x => x.key === f.format)?.label || f.format}</Badge>
                      <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full" style={{ width: `${f.percentage}%` }} />
                      </div>
                      <span className="text-[9px] text-muted-foreground w-8 text-right">{f.percentage}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            {Array.isArray(dna.pillar_mix) && (
              <Card className="p-4 bg-card/50 border-border/30">
                <h4 className="text-xs font-semibold text-foreground mb-3">🏛️ Mix de Pilares</h4>
                <div className="space-y-2">
                  {dna.pillar_mix.map((p: any) => (
                    <div key={p.pillar} className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[8px] w-20 justify-center">{PILLARS.find(x => x.key === p.pillar)?.label || p.pillar}</Badge>
                      <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full" style={{ width: `${p.percentage}%` }} />
                      </div>
                      <span className="text-[9px] text-muted-foreground w-8 text-right">{p.percentage}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Tone + Patterns */}
          <div className="grid md:grid-cols-2 gap-4">
            {Array.isArray(dna.tone_profile) && (
              <Card className="p-4 bg-card/50 border-border/30">
                <h4 className="text-xs font-semibold text-foreground mb-2">🎭 Perfil de Tom</h4>
                <div className="flex flex-wrap gap-1.5">
                  {dna.tone_profile.map((t: string) => (
                    <Badge key={t} className="bg-primary/10 text-primary text-[8px]">{t}</Badge>
                  ))}
                </div>
                {dna.hook_style && <p className="text-[9px] text-muted-foreground mt-2">🎯 Hook: {dna.hook_style}</p>}
                {dna.cta_style && <p className="text-[9px] text-muted-foreground">📣 CTA: {dna.cta_style}</p>}
              </Card>
            )}
            {Array.isArray(dna.content_patterns) && (
              <Card className="p-4 bg-card/50 border-border/30">
                <h4 className="text-xs font-semibold text-foreground mb-2">🔍 Padrões</h4>
                <div className="space-y-1">
                  {dna.content_patterns.map((p: string, i: number) => (
                    <div key={i} className="text-[10px] text-muted-foreground">• {p}</div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Cadence */}
          {dna.cadence && (
            <Card className="p-4 bg-card/50 border-border/30">
              <h4 className="text-xs font-semibold text-foreground mb-2">📅 Cadência</h4>
              <div className="flex gap-4 text-[10px] text-muted-foreground">
                <div>Posts/semana: <span className="text-foreground font-medium">{dna.cadence.posts_per_week}</span></div>
                {Array.isArray(dna.cadence.best_days) && <div>Dias: <span className="text-foreground font-medium">{dna.cadence.best_days.join(', ')}</span></div>}
                {Array.isArray(dna.cadence.best_times) && <div>Horários: <span className="text-foreground font-medium">{dna.cadence.best_times.join(', ')}</span></div>}
              </div>
            </Card>
          )}

          {/* Clone instructions */}
          {Array.isArray(dna.clone_instructions) && (
            <Card className="p-4 bg-card/50 border-border/30">
              <h4 className="text-xs font-semibold text-foreground mb-3">📋 Passos para Clonar</h4>
              <div className="space-y-1.5">
                {dna.clone_instructions.map((step: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                    <span className="text-primary font-bold shrink-0">{i + 1}.</span> {step}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Clone action */}
          <Card className="p-4 bg-card/50 border-border/30 space-y-3">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
              <Copy className="w-4 h-4 text-primary" /> Clonar DNA em Nova Campanha
            </h4>
            <div className="grid md:grid-cols-2 gap-2">
              <Input value={cloneName} onChange={e => setCloneName(e.target.value)} placeholder="Nome da nova campanha" className="text-xs" />
              <Input value={cloneAudience} onChange={e => setCloneAudience(e.target.value)} placeholder="Novo público-alvo (opcional)" className="text-xs" />
            </div>
            <Button className="w-full gap-2" onClick={handleClone} disabled={cloning}>
              {cloning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Clonar Campanha
            </Button>
          </Card>
        </div>
      )}

      {!dna && (
        <Card className="p-8 bg-card/30 border-border/20 text-center">
          <Dna className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Extraia o DNA desta campanha para identificar padrões e clonar para novas campanhas</p>
        </Card>
      )}
    </div>
  );
}
