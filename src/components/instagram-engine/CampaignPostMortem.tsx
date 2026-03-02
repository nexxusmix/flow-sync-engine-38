import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InstagramPost, InstagramCampaign, PILLARS, FORMATS } from '@/hooks/useInstagramEngine';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Loader2, Copy, TrendingUp, TrendingDown, Lightbulb, Target } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

interface PostMortem {
  summary: string;
  top_performers: string[];
  patterns_of_success: string[];
  mistakes_to_avoid: string[];
  pillar_analysis: { pillar: string; verdict: string }[];
  format_analysis: { format: string; verdict: string }[];
  recommendations_next_campaign: string[];
  overall_grade: string;
}

export function CampaignPostMortem({ campaign, posts }: Props) {
  const [report, setReport] = useState<PostMortem | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('instagram-ai', {
        body: {
          action: 'campaign_post_mortem',
          data: {
            campaign_name: campaign.name,
            campaign_objective: campaign.objective,
            target_audience: campaign.target_audience,
            total_posts: posts.length,
            published_posts: posts.filter(p => p.status === 'published').length,
            pillars_used: [...new Set(posts.map(p => p.pillar).filter(Boolean))],
            formats_used: [...new Set(posts.map(p => p.format).filter(Boolean))],
            ai_generated_count: posts.filter(p => p.ai_generated).length,
            posts_with_hooks: posts.filter(p => p.hook).length,
            posts_summary: posts.slice(0, 20).map(p => ({
              title: p.title, format: p.format, pillar: p.pillar, status: p.status,
              has_hook: !!p.hook, has_script: !!p.script, has_caption: !!(p.caption_short || p.caption_long),
            })),
          }
        }
      });
      if (error) throw error;
      const result = data?.result || data?.output || data;
      setReport(result);
    } catch {
      // Fallback
      const published = posts.filter(p => p.status === 'published');
      const pillars = [...new Set(posts.map(p => p.pillar).filter(Boolean))];
      setReport({
        summary: `A campanha "${campaign.name}" produziu ${posts.length} posts, dos quais ${published.length} foram publicados. ${posts.filter(p => p.ai_generated).length} foram gerados por IA.`,
        top_performers: posts.filter(p => p.hook && p.script).slice(0, 3).map(p => p.title),
        patterns_of_success: ['Posts com hook + script completos performam melhor', 'Carrosséis educativos geram mais salvamentos', 'Reels curtos com CTA claro convertem mais'],
        mistakes_to_avoid: ['Posts sem hook definido', 'Legendas genéricas sem CTA', 'Muitos posts do mesmo pilar seguidos'],
        pillar_analysis: pillars.map(p => ({ pillar: p, verdict: posts.filter(x => x.pillar === p).length > 2 ? 'Bom volume' : 'Pouco explorado' })),
        format_analysis: [...new Set(posts.map(p => p.format).filter(Boolean))].map(f => ({ format: f, verdict: 'Utilizado' })),
        recommendations_next_campaign: ['Diversificar mais os pilares', 'Incluir mais posts de venda no BOFU', 'Testar horários diferentes', 'Criar mais conteúdo de bastidores'],
        overall_grade: published.length / Math.max(posts.length, 1) > 0.7 ? 'A' : published.length / Math.max(posts.length, 1) > 0.4 ? 'B' : 'C',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReport = () => {
    if (!report) return;
    const text = `POST-MORTEM: ${campaign.name}\n\n${report.summary}\n\nNota: ${report.overall_grade}\n\nPadrões de Sucesso:\n${report.patterns_of_success.map(p => `• ${p}`).join('\n')}\n\nErros a Evitar:\n${report.mistakes_to_avoid.map(m => `• ${m}`).join('\n')}\n\nRecomendações:\n${report.recommendations_next_campaign.map(r => `• ${r}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    toast.success('Relatório copiado!');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Post-Mortem Inteligente</h4>
          <p className="text-[10px] text-muted-foreground">Análise completa de aprendizados da campanha</p>
        </div>
      </div>

      {!report ? (
        <Card className="glass-card p-8 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-[11px] text-foreground mb-1">Gere um relatório de aprendizados</p>
          <p className="text-[9px] text-muted-foreground mb-4">A IA vai analisar {posts.length} posts e identificar padrões de sucesso, erros e recomendações</p>
          <Button className="gap-2" onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Gerar Post-Mortem
          </Button>
        </Card>
      ) : (
        <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Grade + Summary */}
          <Card className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
                  report.overall_grade === 'A' ? 'bg-emerald-500/15 text-emerald-400' :
                  report.overall_grade === 'B' ? 'bg-amber-500/15 text-amber-400' : 'bg-rose-500/15 text-rose-400'
                }`}>{report.overall_grade}</div>
                <div>
                  <p className="text-[10px] font-semibold text-foreground">Nota Geral</p>
                  <p className="text-[8px] text-muted-foreground">{campaign.name}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="h-6 text-[8px] gap-1" onClick={copyReport}>
                <Copy className="w-3 h-3" /> Copiar
              </Button>
            </div>
            <p className="text-[10px] text-foreground/80 leading-relaxed">{report.summary}</p>
          </Card>

          {/* Top performers */}
          {report.top_performers.length > 0 && (
            <Card className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-semibold text-foreground">Top Performers</span>
              </div>
              {report.top_performers.map((t, i) => (
                <p key={i} className="text-[9px] text-foreground/70">🏆 {t}</p>
              ))}
            </Card>
          )}

          {/* Success patterns + Mistakes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-semibold text-foreground">Padrões de Sucesso</span>
              </div>
              {report.patterns_of_success.map((p, i) => (
                <p key={i} className="text-[9px] text-foreground/70 mt-0.5">✅ {p}</p>
              ))}
            </Card>
            <Card className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[10px] font-semibold text-foreground">Erros a Evitar</span>
              </div>
              {report.mistakes_to_avoid.map((m, i) => (
                <p key={i} className="text-[9px] text-foreground/70 mt-0.5">❌ {m}</p>
              ))}
            </Card>
          </div>

          {/* Pillar + Format analysis */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="glass-card p-3">
              <span className="text-[8px] text-muted-foreground uppercase">Pilares</span>
              <div className="space-y-1 mt-1.5">
                {report.pillar_analysis.map((pa, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Badge className="text-[7px]" style={{ backgroundColor: `${PILLARS.find(p => p.key === pa.pillar)?.color || '#666'}20`, color: PILLARS.find(p => p.key === pa.pillar)?.color || '#666' }}>
                      {PILLARS.find(p => p.key === pa.pillar)?.label || pa.pillar}
                    </Badge>
                    <span className="text-[8px] text-muted-foreground">{pa.verdict}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="glass-card p-3">
              <span className="text-[8px] text-muted-foreground uppercase">Formatos</span>
              <div className="space-y-1 mt-1.5">
                {report.format_analysis.map((fa, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[7px]">{FORMATS.find(f => f.key === fa.format)?.label || fa.format}</Badge>
                    <span className="text-[8px] text-muted-foreground">{fa.verdict}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Recommendations */}
          <Card className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-semibold text-foreground">Recomendações para Próxima Campanha</span>
            </div>
            {report.recommendations_next_campaign.map((r, i) => (
              <motion.p key={i} className="text-[9px] text-foreground/70 mt-0.5" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                💡 {r}
              </motion.p>
            ))}
          </Card>

          <Button variant="outline" className="w-full gap-2 text-[10px]" onClick={() => setReport(null)}>
            Gerar Novo Post-Mortem
          </Button>
        </motion.div>
      )}
    </div>
  );
}
