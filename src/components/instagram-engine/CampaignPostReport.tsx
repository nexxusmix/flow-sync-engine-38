import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInstagramAI, InstagramCampaign, InstagramPost, POST_STATUSES, FORMATS, PILLARS } from '@/hooks/useInstagramEngine';
import { Loader2, FileBarChart, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignPostReport({ campaign, posts, open, onOpenChange }: Props) {
  const [report, setReport] = useState<any>(null);
  const ai = useInstagramAI();

  const generateReport = async () => {
    const published = posts.filter(p => p.status === 'published').length;
    const aiGenerated = posts.filter(p => p.ai_generated).length;
    const formats: Record<string, number> = {};
    const pillars: Record<string, number> = {};
    posts.forEach(p => {
      formats[p.format] = (formats[p.format] || 0) + 1;
      if (p.pillar) pillars[p.pillar] = (pillars[p.pillar] || 0) + 1;
    });

    try {
      const result = await ai.mutateAsync({
        action: 'campaign_ai_tool',
        data: {
          tool: 'post_report',
          campaign: {
            name: campaign.name,
            objective: campaign.objective,
            target_audience: campaign.target_audience,
            budget: campaign.budget,
            start_date: campaign.start_date,
            end_date: campaign.end_date,
            total_posts: posts.length,
            published_posts: published,
            ai_generated_posts: aiGenerated,
            formats,
            pillars,
            post_titles: posts.map(p => p.title),
            post_hooks: posts.filter(p => p.hook).map(p => p.hook),
            completion_rate: posts.length ? Math.round((published / posts.length) * 100) : 0,
          },
        },
      });
      setReport(result);
      toast.success('Relatório gerado!');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const copyAll = () => {
    if (!report) return;
    const text = typeof report === 'string' ? report : JSON.stringify(report, null, 2);
    navigator.clipboard.writeText(text);
    toast.success('Relatório copiado!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-primary" />
            Relatório Pós-Campanha — {campaign.name}
          </DialogTitle>
        </DialogHeader>

        {!report ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <FileBarChart className="w-12 h-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Gere um relatório completo com análise de performance, aprendizados e recomendações para a próxima campanha.
            </p>
            <Button onClick={generateReport} disabled={ai.isPending} className="gap-2">
              {ai.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileBarChart className="w-4 h-4" />}
              {ai.isPending ? 'Analisando campanha...' : 'Gerar Relatório'}
            </Button>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="pr-3 space-y-4">
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={copyAll}>
                  <Copy className="w-3 h-3" /> Copiar Tudo
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={generateReport} disabled={ai.isPending}>
                  {ai.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Regenerar
                </Button>
              </div>

              {typeof report === 'object' && !Array.isArray(report) ? (
                Object.entries(report).map(([key, value]) => (
                  <Card key={key} className="glass-card p-4">
                    <h5 className="text-[11px] font-semibold text-primary uppercase tracking-wide mb-2">
                      {key.replace(/_/g, ' ')}
                    </h5>
                    <div className="text-[12px] text-foreground/80 whitespace-pre-wrap leading-relaxed">
                      {typeof value === 'string' ? value : Array.isArray(value) ? (
                        <ul className="space-y-1">
                          {(value as any[]).map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              <span>{typeof item === 'string' ? item : JSON.stringify(item)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : JSON.stringify(value, null, 2)}
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="glass-card p-4">
                  <div className="text-[12px] text-foreground/80 whitespace-pre-wrap leading-relaxed">
                    {typeof report === 'string' ? report : JSON.stringify(report, null, 2)}
                  </div>
                </Card>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
