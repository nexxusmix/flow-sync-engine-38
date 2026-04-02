import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InstagramPost, POST_STATUSES, FORMATS, PILLARS, InstagramCampaign } from '@/hooks/useInstagramEngine';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { FileText, Download, Loader2, Sparkles, CheckCircle2, BarChart3, Calendar, Target, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

export function CampaignPDFReport({ campaign, posts }: Props) {
  const [generating, setGenerating] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Campaign stats
  const published = posts.filter(p => p.status === 'published').length;
  const ready = posts.filter(p => p.status === 'ready').length;
  const inProd = posts.filter(p => p.status === 'in_production').length;
  const ideas = posts.filter(p => p.status === 'idea').length;
  const aiGen = posts.filter(p => p.ai_generated).length;
  const withHook = posts.filter(p => p.hook).length;
  const withCaption = posts.filter(p => p.caption_short || p.caption_long).length;
  const completionRate = posts.length > 0 ? Math.round((published / posts.length) * 100) : 0;

  const pillarDist = PILLARS.map(pl => ({
    ...pl,
    count: posts.filter(p => p.pillar === pl.key).length,
  })).filter(p => p.count > 0);

  const formatDist = FORMATS.map(fmt => ({
    ...fmt,
    count: posts.filter(p => p.format === fmt.key).length,
  })).filter(f => f.count > 0);

  const handleGetAIAnalysis = async () => {
    setLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('instagram-ai', {
        body: {
          action: 'campaign_report_analysis',
          context: {
            campaign_name: campaign.name,
            objective: campaign.objective,
            target_audience: campaign.target_audience,
            budget: campaign.budget,
            total_posts: posts.length,
            published,
            ready,
            in_production: inProd,
            ideas,
            ai_generated: aiGen,
            completion_rate: completionRate,
            pillar_distribution: pillarDist.map(p => `${p.label}: ${p.count}`).join(', '),
            format_distribution: formatDist.map(f => `${f.label}: ${f.count}`).join(', '),
          }
        }
      });
      if (error) throw error;
      setAiAnalysis(data?.output?.analysis || data?.analysis || 'Análise gerada com sucesso.');
    } catch {
      setAiAnalysis(`Campanha "${campaign.name}" com ${completionRate}% de conclusão. ${published} posts publicados de ${posts.length} planejados. ${aiGen > 0 ? `${aiGen} gerados por IA.` : ''} Recomendação: ${completionRate < 50 ? 'Acelerar produção e priorizar posts prontos.' : 'Manter ritmo e focar em qualidade.'}`);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      const htmlContent = buildReportHTML();
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '210mm';
      iframe.style.height = '297mm';
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument!;
      doc.open();
      doc.write(htmlContent);
      doc.close();

      await new Promise(r => setTimeout(r, 500));
      iframe.contentWindow!.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
      toast.success('PDF gerado! Use Ctrl+P para salvar.');
    } catch {
      toast.error('Erro ao gerar PDF');
    } finally {
      setGenerating(false);
    }
  };

  const buildReportHTML = () => {
    const now = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const postRows = posts.map(p => {
      const status = POST_STATUSES.find(s => s.key === p.status);
      const fmt = FORMATS.find(f => f.key === p.format);
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:#e0e0e0;font-size:11px">${p.title}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:#888;font-size:11px">${status?.label || p.status}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:#888;font-size:11px">${fmt?.label || p.format}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:#888;font-size:11px">${p.ai_generated ? '⚡ IA' : 'Manual'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:#888;font-size:11px">${p.scheduled_at ? format(new Date(p.scheduled_at), 'dd/MM/yyyy', { locale: ptBR }) : '—'}</td>
      </tr>`;
    }).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatório ${campaign.name}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');
      * { margin:0; padding:0; box-sizing:border-box; }
      body { background:#000; color:#fff; font-family:'Space Grotesk',sans-serif; padding:40px; }
      .header { border-bottom:2px solid #009CCA; padding-bottom:24px; margin-bottom:32px; }
      .header h1 { font-size:28px; font-weight:700; color:#009CCA; }
      .header p { color:#666; font-size:12px; margin-top:4px; }
      .kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:32px; }
      .kpi { background:#0a0a0a; border:1px solid #1a1a1a; border-radius:8px; padding:16px; }
      .kpi .label { color:#666; font-size:10px; text-transform:uppercase; letter-spacing:1px; }
      .kpi .value { color:#fff; font-size:24px; font-weight:700; margin-top:4px; }
      .kpi .sub { color:#009CCA; font-size:11px; margin-top:2px; }
      .section { margin-bottom:28px; }
      .section h2 { font-size:14px; color:#009CCA; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px; border-left:3px solid #009CCA; padding-left:12px; }
      table { width:100%; border-collapse:collapse; background:#0a0a0a; border-radius:8px; overflow:hidden; }
      th { padding:10px 12px; text-align:left; color:#009CCA; font-size:10px; text-transform:uppercase; letter-spacing:1px; border-bottom:2px solid #1a1a1a; }
      .analysis { background:#0a0a0a; border:1px solid #1a1a1a; border-radius:8px; padding:20px; color:#ccc; font-size:12px; line-height:1.8; white-space:pre-wrap; }
      .footer { margin-top:40px; padding-top:16px; border-top:1px solid #1a1a1a; color:#444; font-size:9px; text-align:center; }
      @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
    </style></head><body>
    <div class="header">
      <h1>📊 ${campaign.name}</h1>
      <p>Relatório de Campanha · Gerado em ${now}</p>
      ${campaign.objective ? `<p style="color:#999;font-size:11px;margin-top:8px">${campaign.objective}</p>` : ''}
    </div>
    <div class="kpi-grid">
      <div class="kpi"><div class="label">Posts</div><div class="value">${posts.length}</div><div class="sub">${published} publicados</div></div>
      <div class="kpi"><div class="label">Conclusão</div><div class="value">${completionRate}%</div><div class="sub">${ready} prontos</div></div>
      <div class="kpi"><div class="label">IA</div><div class="value">${aiGen}</div><div class="sub">${posts.length > 0 ? Math.round((aiGen / posts.length) * 100) : 0}% gerado</div></div>
      <div class="kpi"><div class="label">Orçamento</div><div class="value">${campaign.budget ? `R$ ${Number(campaign.budget).toLocaleString('pt-BR')}` : '—'}</div><div class="sub">${campaign.budget && posts.length > 0 ? `R$ ${Math.round(Number(campaign.budget) / posts.length).toLocaleString('pt-BR')}/post` : ''}</div></div>
    </div>
    ${aiAnalysis ? `<div class="section"><h2>Análise IA</h2><div class="analysis">${aiAnalysis}</div></div>` : ''}
    <div class="section"><h2>Posts da Campanha</h2>
      <table><thead><tr><th>Título</th><th>Status</th><th>Formato</th><th>Origem</th><th>Agenda</th></tr></thead><tbody>${postRows}</tbody></table>
    </div>
    <div class="section"><h2>Distribuição</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="kpi"><div class="label">Por Pilar</div>${pillarDist.map(p => `<div style="display:flex;justify-content:space-between;margin-top:6px"><span style="color:#999;font-size:11px">${p.label}</span><span style="color:#fff;font-size:11px;font-weight:600">${p.count}</span></div>`).join('')}</div>
        <div class="kpi"><div class="label">Por Formato</div>${formatDist.map(f => `<div style="display:flex;justify-content:space-between;margin-top:6px"><span style="color:#999;font-size:11px">${f.label}</span><span style="color:#fff;font-size:11px;font-weight:600">${f.count}</span></div>`).join('')}</div>
      </div>
    </div>
    <div class="footer">SQUAD · Relatório gerado automaticamente · ${now}</div>
    </body></html>`;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Relatório da Campanha</h4>
            <p className="text-[10px] text-muted-foreground">PDF completo com métricas, timeline e análise IA</p>
          </div>
        </div>
      </div>

      {/* Preview KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Posts', value: posts.length, icon: <BarChart3 className="w-3.5 h-3.5" />, sub: `${published} pub` },
          { label: 'Conclusão', value: `${completionRate}%`, icon: <Target className="w-3.5 h-3.5" />, sub: `${ready} prontos` },
          { label: 'Gerado IA', value: aiGen, icon: <Zap className="w-3.5 h-3.5" />, sub: `${posts.length > 0 ? Math.round((aiGen / posts.length) * 100) : 0}%` },
          { label: 'Período', value: campaign.start_date ? format(new Date(campaign.start_date), 'dd/MM', { locale: ptBR }) : '—', icon: <Calendar className="w-3.5 h-3.5" />, sub: campaign.end_date ? `até ${format(new Date(campaign.end_date), 'dd/MM', { locale: ptBR })}` : '' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="glass-card p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-muted-foreground">{kpi.icon}</span>
                <span className="text-[9px] text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-lg font-bold text-foreground">{kpi.value}</p>
              <p className="text-[9px] text-primary">{kpi.sub}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* AI Analysis section */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide">Análise Inteligente</h5>
          <Button size="sm" variant="outline" className="gap-1 text-[9px] h-6" onClick={handleGetAIAnalysis} disabled={loadingAI}>
            {loadingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {aiAnalysis ? 'Refazer' : 'Gerar'} Análise IA
          </Button>
        </div>
        {aiAnalysis ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="p-3 bg-muted/10 rounded-lg border border-border/20">
              <p className="text-[10px] text-foreground/80 leading-relaxed whitespace-pre-wrap">{aiAnalysis}</p>
            </div>
          </motion.div>
        ) : (
          <p className="text-[10px] text-muted-foreground text-center py-4">Clique em "Gerar Análise IA" para incluir recomendações no relatório</p>
        )}
      </Card>

      {/* Distribution preview */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="glass-card p-3">
          <h5 className="text-[9px] text-muted-foreground uppercase mb-2">Pilares</h5>
          {pillarDist.map(p => (
            <div key={p.key} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-[9px] text-foreground">{p.label}</span>
              </div>
              <span className="text-[9px] font-semibold text-foreground">{p.count}</span>
            </div>
          ))}
        </Card>
        <Card className="glass-card p-3">
          <h5 className="text-[9px] text-muted-foreground uppercase mb-2">Formatos</h5>
          {formatDist.map(f => (
            <div key={f.key} className="flex items-center justify-between py-1">
              <span className="text-[9px] text-foreground">{f.label}</span>
              <span className="text-[9px] font-semibold text-foreground">{f.count}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Generate button */}
      <Button className="w-full gap-2" onClick={handleGeneratePDF} disabled={generating}>
        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        Gerar Relatório PDF
      </Button>
    </div>
  );
}
