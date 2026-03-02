import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { InstagramCampaign, useInstagramAI } from '@/hooks/useInstagramEngine';
import { Eye, Sparkles, Loader2, Plus, X, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
}

interface Competitor {
  name: string;
  handle: string;
}

export function CampaignCompetitorShadow({ campaign }: Props) {
  const ai = useInstagramAI();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [newName, setNewName] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);

  const addCompetitor = () => {
    if (!newName.trim()) return;
    setCompetitors(prev => [...prev, { name: newName, handle: newHandle || newName }]);
    setNewName('');
    setNewHandle('');
  };

  const removeCompetitor = (i: number) => setCompetitors(prev => prev.filter((_, j) => j !== i));

  const handleAnalyze = async () => {
    if (competitors.length === 0) { toast.error('Adicione ao menos 1 concorrente'); return; }

    try {
      const res = await ai.mutateAsync({
        action: 'generate_from_context',
        data: {
          command: `Analise os CONCORRENTES da campanha "${campaign.name}" e gere um shadow board.

Nosso objetivo: ${campaign.objective || 'geral'}
Nosso público: ${campaign.target_audience || 'geral'}

Concorrentes para analisar:
${competitors.map(c => `- ${c.name} (@${c.handle})`).join('\n')}

Baseando-se no conhecimento geral sobre esses perfis/nichos, retorne JSON com:
- competitors: array de objetos (1 por concorrente), cada com:
  - name: nome
  - handle: @handle
  - estimated_frequency: string (ex: "5 posts/semana")
  - main_formats: array de formatos mais usados
  - main_pillars: array de pilares temáticos
  - tone: string descrevendo o tom
  - strengths: array de 2-3 pontos fortes
  - weaknesses: array de 2-3 pontos fracos
  - threat_level: "high"|"medium"|"low"
- opportunity_windows: array de 3-5 janelas de oportunidade onde os concorrentes estão ausentes (formato, horário, tema)
- differentiation_gaps: array de 3-5 lacunas de diferenciação (coisas que nenhum concorrente faz bem)
- benchmark_comparison: objeto {our_strengths: string[], their_advantage: string[], neutral: string[]}
- strategic_recommendations: array de 4-5 recomendações estratégicas
- competitive_heat_score: número 0-100 (intensidade competitiva do mercado)`,
          format: 'competitor_shadow',
        },
      });
      setAnalysis(res);
      toast.success('Shadow Board gerado! 👁️');
    } catch { /* handled */ }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Competitor Shadow Board</h3>
        </div>
      </div>

      {/* Add competitors */}
      <Card className="p-4 bg-card/50 border-border/30 space-y-3">
        <h4 className="text-[10px] text-muted-foreground font-medium">Concorrentes para monitorar:</h4>
        {competitors.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {competitors.map((c, i) => (
              <Badge key={i} variant="outline" className="text-[9px] gap-1 pr-1">
                {c.name}
                <button onClick={() => removeCompetitor(i)}><X className="w-3 h-3" /></button>
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome do concorrente" className="text-xs flex-1" onKeyDown={e => e.key === 'Enter' && addCompetitor()} />
          <Input value={newHandle} onChange={e => setNewHandle(e.target.value)} placeholder="@handle" className="text-xs w-32" onKeyDown={e => e.key === 'Enter' && addCompetitor()} />
          <Button size="icon" variant="outline" className="shrink-0" onClick={addCompetitor}><Plus className="w-3.5 h-3.5" /></Button>
        </div>
        <Button className="w-full gap-2" onClick={handleAnalyze} disabled={ai.isPending || competitors.length === 0}>
          {ai.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
          Analisar Concorrentes
        </Button>
      </Card>

      {analysis && (
        <div className="space-y-4">
          {/* Heat score */}
          {analysis.competitive_heat_score !== undefined && (
            <Card className="p-4 bg-card/50 border-border/30 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-foreground">Intensidade Competitiva</h4>
                <p className="text-[9px] text-muted-foreground">Nível de competição no nicho</p>
              </div>
              <div className={`text-2xl font-bold ${analysis.competitive_heat_score >= 70 ? 'text-red-400' : analysis.competitive_heat_score >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {analysis.competitive_heat_score}
              </div>
            </Card>
          )}

          {/* Competitor cards */}
          {Array.isArray(analysis.competitors) && (
            <div className="grid md:grid-cols-2 gap-3">
              {analysis.competitors.map((c: any, i: number) => (
                <Card key={i} className="p-4 bg-card/50 border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-foreground">{c.name}</span>
                    <span className="text-[9px] text-muted-foreground">@{c.handle}</span>
                    <Badge className={`text-[7px] ml-auto ${c.threat_level === 'high' ? 'bg-red-400/10 text-red-400' : c.threat_level === 'medium' ? 'bg-amber-400/10 text-amber-400' : 'bg-emerald-400/10 text-emerald-400'}`}>
                      {c.threat_level}
                    </Badge>
                  </div>
                  <div className="text-[9px] text-muted-foreground mb-2">📊 {c.estimated_frequency} · Tom: {c.tone}</div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {c.main_formats?.map((f: string) => <Badge key={f} variant="outline" className="text-[7px]">{f}</Badge>)}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[8px] text-emerald-400 font-medium">Forças:</span>
                      {c.strengths?.map((s: string, j: number) => <div key={j} className="text-[8px] text-muted-foreground">✓ {s}</div>)}
                    </div>
                    <div>
                      <span className="text-[8px] text-red-400 font-medium">Fraquezas:</span>
                      {c.weaknesses?.map((w: string, j: number) => <div key={j} className="text-[8px] text-muted-foreground">✗ {w}</div>)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Opportunity windows */}
          {Array.isArray(analysis.opportunity_windows) && (
            <Card className="p-4 bg-card/50 border-border/30">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-semibold text-emerald-400">Janelas de Oportunidade</h4>
              </div>
              <div className="space-y-1.5">
                {analysis.opportunity_windows.map((o: any, i: number) => (
                  <div key={i} className="p-2 bg-emerald-500/5 rounded text-[10px] text-muted-foreground">🎯 {typeof o === 'string' ? o : o.description || JSON.stringify(o)}</div>
                ))}
              </div>
            </Card>
          )}

          {/* Differentiation gaps */}
          {Array.isArray(analysis.differentiation_gaps) && (
            <Card className="p-4 bg-card/50 border-border/30">
              <h4 className="text-xs font-semibold text-foreground mb-3">💎 Lacunas de Diferenciação</h4>
              <div className="space-y-1.5">
                {analysis.differentiation_gaps.map((g: any, i: number) => (
                  <div key={i} className="p-2 bg-background/40 rounded text-[10px] text-muted-foreground">💡 {typeof g === 'string' ? g : g.description || JSON.stringify(g)}</div>
                ))}
              </div>
            </Card>
          )}

          {/* Benchmark */}
          {analysis.benchmark_comparison && (
            <div className="grid md:grid-cols-3 gap-3">
              {Array.isArray(analysis.benchmark_comparison.our_strengths) && (
                <Card className="p-3 bg-card/50 border-border/30">
                  <h5 className="text-[9px] font-semibold text-emerald-400 mb-2">✅ Nossas Vantagens</h5>
                  {analysis.benchmark_comparison.our_strengths.map((s: string, i: number) => <div key={i} className="text-[9px] text-muted-foreground">• {s}</div>)}
                </Card>
              )}
              {Array.isArray(analysis.benchmark_comparison.their_advantage) && (
                <Card className="p-3 bg-card/50 border-border/30">
                  <h5 className="text-[9px] font-semibold text-red-400 mb-2">⚠️ Vantagem Deles</h5>
                  {analysis.benchmark_comparison.their_advantage.map((s: string, i: number) => <div key={i} className="text-[9px] text-muted-foreground">• {s}</div>)}
                </Card>
              )}
              {Array.isArray(analysis.benchmark_comparison.neutral) && (
                <Card className="p-3 bg-card/50 border-border/30">
                  <h5 className="text-[9px] font-semibold text-muted-foreground mb-2">⚖️ Neutro</h5>
                  {analysis.benchmark_comparison.neutral.map((s: string, i: number) => <div key={i} className="text-[9px] text-muted-foreground">• {s}</div>)}
                </Card>
              )}
            </div>
          )}

          {/* Recommendations */}
          {Array.isArray(analysis.strategic_recommendations) && (
            <Card className="p-4 bg-card/50 border-border/30">
              <h4 className="text-xs font-semibold text-foreground mb-3">🚀 Recomendações Estratégicas</h4>
              <div className="space-y-1.5">
                {analysis.strategic_recommendations.map((r: string, i: number) => (
                  <div key={i} className="text-[10px] text-muted-foreground flex items-start gap-2">
                    <span className="text-primary font-bold">{i + 1}.</span> {r}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
