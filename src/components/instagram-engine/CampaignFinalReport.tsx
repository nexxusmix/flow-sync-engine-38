import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InstagramPost, InstagramCampaign, useInstagramAI } from '@/hooks/useInstagramEngine';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Loader2, Sparkles, Trophy, TrendingUp, AlertTriangle, Lightbulb, Download } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface Goal {
  id: string;
  title: string;
  metric_key: string;
  target_value: number;
  current_value: number;
  unit: string;
}

export function CampaignFinalReport({ campaign, posts, open, onOpenChange }: Props) {
  const ai = useInstagramAI();
  const [report, setReport] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const { data: goals } = useQuery({
    queryKey: ['campaign-goals', campaign.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_campaign_goals' as any)
        .select('*')
        .eq('campaign_id', campaign.id);
      if (error) throw error;
      return (data || []) as unknown as Goal[];
    },
    enabled: open,
  });

  const published = posts.filter(p => p.status === 'published');
  const topPosts = [...published].sort((a, b) => (b.hashtags?.length || 0) - (a.hashtags?.length || 0)).slice(0, 3);

  const goalsStatus = (goals || []).map(g => ({
    title: g.title,
    target: g.target_value,
    current: g.current_value,
    unit: g.unit,
    achieved: g.current_value >= g.target_value,
    pct: g.target_value > 0 ? Math.round((g.current_value / g.target_value) * 100) : 0,
  }));

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await ai.mutateAsync({
        action: 'generate_from_context',
        data: {
          command: `Gere um relatório executivo completo para a campanha "${campaign.name}".
          
Dados:
- Objetivo: ${campaign.objective || 'N/A'}
- Público: ${campaign.target_audience || 'N/A'}
- Período: ${campaign.start_date || '?'} a ${campaign.end_date || '?'}
- Budget: R$ ${campaign.budget || 0}
- Total de posts: ${posts.length}
- Publicados: ${published.length}
- Top posts: ${topPosts.map(p => `"${p.title}" (${p.format})`).join(', ')}
- Metas: ${goalsStatus.map(g => `${g.title}: ${g.current}/${g.target} ${g.unit} (${g.pct}%)`).join('; ')}
- Formatos usados: ${[...new Set(posts.map(p => p.format))].join(', ')}
- Pilares: ${[...new Set(posts.filter(p => p.pillar).map(p => p.pillar))].join(', ')}

Estruture em markdown com:
## Resumo Executivo
## Resultados vs Metas
## Top Performers
## Análise de Formatos & Pilares
## Pontos de Melhoria
## Recomendações para Próxima Campanha
## ROI Estimado

Escreva em português BR, tom profissional e analítico, com dados concretos.`,
          field: 'script',
        },
      });
      setReport(typeof result === 'string' ? result : result?.script || result?.caption_long || JSON.stringify(result));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyReport = () => {
    if (report) {
      navigator.clipboard.writeText(report);
      toast.success('Relatório copiado!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-primary" />
            Relatório Final — {campaign.name}
          </DialogTitle>
        </DialogHeader>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <Card className="p-2.5 text-center">
            <p className="text-lg font-bold text-foreground">{posts.length}</p>
            <p className="text-[9px] text-muted-foreground">Posts Totais</p>
          </Card>
          <Card className="p-2.5 text-center">
            <p className="text-lg font-bold text-primary">{published.length}</p>
            <p className="text-[9px] text-muted-foreground">Publicados</p>
          </Card>
          <Card className="p-2.5 text-center">
            <p className="text-lg font-bold text-foreground">
              {goalsStatus.filter(g => g.achieved).length}/{goalsStatus.length}
            </p>
            <p className="text-[9px] text-muted-foreground">Metas Atingidas</p>
          </Card>
          <Card className="p-2.5 text-center">
            <p className="text-lg font-bold text-foreground">
              R$ {(campaign.budget || 0).toLocaleString()}
            </p>
            <p className="text-[9px] text-muted-foreground">Budget</p>
          </Card>
        </div>

        {/* Goals summary */}
        {goalsStatus.length > 0 && (
          <div className="space-y-1.5 mb-4">
            <h5 className="text-[10px] uppercase text-muted-foreground font-medium">Metas</h5>
            {goalsStatus.map((g, i) => (
              <div key={i} className="flex items-center gap-2">
                {g.achieved ? <Trophy className="w-3 h-3 text-primary" /> : <AlertTriangle className="w-3 h-3 text-muted-foreground" />}
                <span className="text-[11px] text-foreground flex-1">{g.title}</span>
                <span className="text-[10px] text-muted-foreground">{g.current}/{g.target} {g.unit}</span>
                <Badge variant="outline" className={`text-[9px] ${g.achieved ? 'text-primary' : 'text-muted-foreground'}`}>
                  {g.pct}%
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* AI Report */}
        {!report ? (
          <div className="text-center py-6">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
            <p className="text-xs text-muted-foreground mb-3">Gere um relatório executivo completo com análise da IA</p>
            <Button onClick={handleGenerate} disabled={generating} className="gap-1.5">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? 'Gerando relatório...' : 'Gerar Relatório com IA'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-end gap-1.5">
              <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7" onClick={handleCopyReport}>
                <Download className="w-3 h-3" /> Copiar
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7" onClick={handleGenerate} disabled={generating}>
                {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Regenerar
              </Button>
            </div>
            <Card className="glass-card p-5 prose prose-sm prose-invert max-w-none text-foreground">
              <ReactMarkdown>{report}</ReactMarkdown>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
