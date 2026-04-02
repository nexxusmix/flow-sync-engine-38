import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InstagramCampaign, InstagramPost, useInstagramAI, PILLARS, FORMATS, POST_STATUSES } from '@/hooks/useInstagramEngine';
import { BookOpen, Sparkles, Loader2, CheckCircle, XCircle, AlertTriangle, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

export function CampaignAutopsy({ campaign, posts }: Props) {
  const ai = useInstagramAI();
  const [autopsy, setAutopsy] = useState<any>(null);

  const handleGenerate = async () => {
    const postsSummary = posts.slice(0, 30).map(p => ({
      title: p.title,
      format: p.format,
      pillar: p.pillar,
      status: p.status,
      hook: p.hook?.slice(0, 60),
      ai_generated: p.ai_generated,
    }));

    const statusBreakdown = POST_STATUSES.map(s => `${s.label}: ${posts.filter(p => p.status === s.key).length}`).join(', ');

    try {
      const result = await ai.mutateAsync({
        action: 'generate_from_context',
        data: {
          command: `Faça uma AUTOPSIA COMPLETA da campanha "${campaign.name}".

Dados:
- Objetivo: ${campaign.objective || 'N/A'}
- Público: ${campaign.target_audience || 'N/A'}
- Período: ${campaign.start_date || '?'} a ${campaign.end_date || '?'}
- Status dos posts: ${statusBreakdown}
- Total de posts: ${posts.length}

Posts (amostra):
${JSON.stringify(postsSummary, null, 1)}

Retorne JSON com:
- overall_score: número 0-100
- verdict: "sucesso" | "parcial" | "fracasso"
- executive_summary: string 3-5 frases
- what_worked: array de 3-5 strings do que funcionou
- what_failed: array de 3-5 strings do que falhou
- patterns_discovered: array de 3-5 padrões identificados
- missed_opportunities: array de 2-3 oportunidades perdidas
- format_performance: array de objetos {format, score: 0-100, insight}
- pillar_performance: array de objetos {pillar, score: 0-100, insight}
- playbook: objeto {name, description, key_tactics: string[], ideal_audience, ideal_duration, content_mix: string[]}
- next_campaign_recommendations: array de 3-5 recomendações para a próxima campanha`,
          format: 'autopsy',
        },
      });
      setAutopsy(result);
      toast.success('Autopsia da campanha gerada!');
    } catch { /* handled */ }
  };

  if (!autopsy) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Campaign Autopsy & Learning Engine</h3>
        </div>
        <Card className="p-8 bg-card/30 border-border/20 text-center">
          <BookOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-xs text-muted-foreground mb-3">Gere uma análise detalhada do que funcionou e do que pode melhorar</p>
          <p className="text-[10px] text-muted-foreground/60 mb-4">A IA analisará todos os posts, formatos e pilares para criar um playbook reutilizável</p>
          <Button className="gap-2" onClick={handleGenerate} disabled={ai.isPending}>
            {ai.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Gerar Autopsia
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Campaign Autopsy</h3>
          <Badge className={`text-[9px] ${autopsy.verdict === 'sucesso' ? 'bg-primary/10 text-primary' : autopsy.verdict === 'parcial' ? 'bg-muted text-muted-foreground' : 'bg-destructive/10 text-destructive'}`}>
            {autopsy.verdict === 'sucesso' ? '🏆 Sucesso' : autopsy.verdict === 'parcial' ? '⚡ Parcial' : '❌ Fracasso'}
          </Badge>
        </div>
        {autopsy.overall_score !== undefined && (
          <div className={`text-2xl font-bold ${autopsy.overall_score >= 70 ? 'text-primary' : autopsy.overall_score >= 40 ? 'text-muted-foreground' : 'text-destructive'}`}>
            {autopsy.overall_score}/100
          </div>
        )}
      </div>

      {/* Summary */}
      {autopsy.executive_summary && (
        <Card className="p-4 bg-primary/5 border-primary/10">
          <p className="text-xs text-foreground">{autopsy.executive_summary}</p>
        </Card>
      )}

      {/* What worked / failed */}
      <div className="grid md:grid-cols-2 gap-4">
        {Array.isArray(autopsy.what_worked) && (
          <Card className="p-4 bg-card/50 border-border/30">
            <div className="flex items-center gap-1.5 mb-3">
              <CheckCircle className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-semibold text-primary">O que funcionou</h4>
            </div>
            <div className="space-y-1.5">
              {autopsy.what_worked.map((item: string, i: number) => (
                <div key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                  <span className="text-primary shrink-0">✓</span> {item}
                </div>
              ))}
            </div>
          </Card>
        )}
        {Array.isArray(autopsy.what_failed) && (
          <Card className="p-4 bg-card/50 border-border/30">
            <div className="flex items-center gap-1.5 mb-3">
              <XCircle className="w-4 h-4 text-destructive" />
              <h4 className="text-xs font-semibold text-destructive">O que falhou</h4>
            </div>
            <div className="space-y-1.5">
              {autopsy.what_failed.map((item: string, i: number) => (
                <div key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                  <span className="text-destructive shrink-0">✗</span> {item}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Patterns */}
      {Array.isArray(autopsy.patterns_discovered) && (
        <Card className="p-4 bg-card/50 border-border/30">
          <h4 className="text-xs font-semibold text-foreground mb-3">🔍 Padrões Descobertos</h4>
          <div className="space-y-1.5">
            {autopsy.patterns_discovered.map((p: string, i: number) => (
              <div key={i} className="text-[10px] text-muted-foreground p-2 bg-background/40 rounded">
                💡 {p}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Format/Pillar performance */}
      <div className="grid md:grid-cols-2 gap-4">
        {Array.isArray(autopsy.format_performance) && (
          <Card className="p-4 bg-card/50 border-border/30">
            <h4 className="text-xs font-semibold text-foreground mb-3">📊 Performance por Formato</h4>
            <div className="space-y-2">
              {autopsy.format_performance.map((f: any) => (
                <div key={f.format} className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[8px] w-20 justify-center">{FORMATS.find(x => x.key === f.format)?.label || f.format}</Badge>
                  <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${f.score}%` }} />
                  </div>
                  <span className="text-[9px] text-muted-foreground w-8 text-right">{f.score}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
        {Array.isArray(autopsy.pillar_performance) && (
          <Card className="p-4 bg-card/50 border-border/30">
            <h4 className="text-xs font-semibold text-foreground mb-3">🏛️ Performance por Pilar</h4>
            <div className="space-y-2">
              {autopsy.pillar_performance.map((p: any) => (
                <div key={p.pillar} className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[8px] w-20 justify-center">{PILLARS.find(x => x.key === p.pillar)?.label || p.pillar}</Badge>
                  <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${p.score}%` }} />
                  </div>
                  <span className="text-[9px] text-muted-foreground w-8 text-right">{p.score}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Playbook */}
      {autopsy.playbook && (
        <Card className="p-5 bg-gradient-to-b from-primary/5 to-transparent border-primary/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-semibold text-primary">📚 Playbook Gerado</h4>
            </div>
            <Badge variant="outline" className="text-[8px]">Reutilizável</Badge>
          </div>
          <h5 className="text-sm font-semibold text-foreground mb-1">{autopsy.playbook.name}</h5>
          <p className="text-[10px] text-muted-foreground mb-3">{autopsy.playbook.description}</p>

          {Array.isArray(autopsy.playbook.key_tactics) && (
            <div className="mb-3">
              <span className="text-[10px] font-medium text-foreground">Táticas-chave:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {autopsy.playbook.key_tactics.map((t: string, i: number) => (
                  <Badge key={i} className="bg-primary/10 text-primary text-[8px]">{t}</Badge>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(autopsy.playbook.content_mix) && (
            <div>
              <span className="text-[10px] font-medium text-foreground">Mix de conteúdo:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {autopsy.playbook.content_mix.map((m: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-[8px]">{m}</Badge>
                ))}
              </div>
            </div>
          )}

          {autopsy.playbook.ideal_audience && (
            <p className="text-[9px] text-muted-foreground mt-2">👥 Audiência ideal: {autopsy.playbook.ideal_audience}</p>
          )}
          {autopsy.playbook.ideal_duration && (
            <p className="text-[9px] text-muted-foreground">📅 Duração ideal: {autopsy.playbook.ideal_duration}</p>
          )}
        </Card>
      )}

      {/* Next campaign recommendations */}
      {Array.isArray(autopsy.next_campaign_recommendations) && (
        <Card className="p-4 bg-card/50 border-border/30">
          <h4 className="text-xs font-semibold text-foreground mb-3">🚀 Recomendações para a Próxima Campanha</h4>
          <div className="space-y-2">
            {autopsy.next_campaign_recommendations.map((rec: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                <span className="text-primary font-bold">{i + 1}.</span> {rec}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Button variant="outline" className="w-full text-xs" onClick={handleGenerate} disabled={ai.isPending}>
        {ai.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        Regenerar Autopsia
      </Button>
    </div>
  );
}
