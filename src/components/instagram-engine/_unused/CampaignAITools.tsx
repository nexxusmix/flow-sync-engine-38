import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInstagramAI, InstagramCampaign, InstagramPost } from '@/hooks/useInstagramEngine';
import { Loader2, Search, TrendingUp, DollarSign, Copy, Megaphone, Sparkles, BarChart3, Target, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ToolKey = 'competitors' | 'forecast' | 'budget_optimizer' | 'ad_copies' | 'ab_testing';

interface ToolResult {
  tool: ToolKey;
  data: any;
  generatedAt: string;
}

export function CampaignAITools({ campaign, posts, open, onOpenChange }: Props) {
  const [activeTool, setActiveTool] = useState<ToolKey>('competitors');
  const [competitorInput, setCompetitorInput] = useState('');
  const [adObjective, setAdObjective] = useState<'awareness' | 'consideration' | 'conversion'>('awareness');
  const [abField, setAbField] = useState<'hook' | 'caption' | 'cta'>('hook');
  const [abPostIndex, setAbPostIndex] = useState(0);
  const [results, setResults] = useState<Record<string, ToolResult>>({});
  const ai = useInstagramAI();

  const campaignContext = {
    name: campaign.name,
    objective: campaign.objective,
    target_audience: campaign.target_audience,
    budget: campaign.budget,
    start_date: campaign.start_date,
    end_date: campaign.end_date,
    total_posts: posts.length,
    published_posts: posts.filter(p => p.status === 'published').length,
    formats: [...new Set(posts.map(p => p.format))],
    pillars: [...new Set(posts.filter(p => p.pillar).map(p => p.pillar))],
    post_titles: posts.slice(0, 10).map(p => p.title),
    post_hooks: posts.filter(p => p.hook).slice(0, 5).map(p => p.hook),
  };

  const runTool = async (tool: ToolKey, extraData: any = {}) => {
    try {
      const result = await ai.mutateAsync({
        action: 'campaign_ai_tool',
        data: { tool, campaign: campaignContext, ...extraData },
      });
      setResults(prev => ({
        ...prev,
        [tool]: { tool, data: result, generatedAt: new Date().toISOString() },
      }));
      toast.success('Análise gerada com sucesso!');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const tools: { key: ToolKey; label: string; icon: React.ReactNode; description: string }[] = [
    { key: 'competitors', label: 'Concorrentes', icon: <Search className="w-4 h-4" />, description: 'Analise concorrentes e encontre oportunidades' },
    { key: 'forecast', label: 'Previsão', icon: <TrendingUp className="w-4 h-4" />, description: 'Projete alcance, engajamento e crescimento' },
    { key: 'budget_optimizer', label: 'Verba', icon: <DollarSign className="w-4 h-4" />, description: 'Otimize a distribuição do orçamento' },
    { key: 'ad_copies', label: 'Ads Copy', icon: <Megaphone className="w-4 h-4" />, description: 'Gere copies otimizadas para Meta Ads' },
    { key: 'ab_testing', label: 'A/B Test', icon: <Zap className="w-4 h-4" />, description: 'Gere variações para testar' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            IA Avançada — {campaign.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Tool selector sidebar */}
          <div className="w-48 shrink-0 space-y-1">
            {tools.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTool(t.key)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-[11px] transition-colors ${
                  activeTool === t.key
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-muted/30 border border-transparent'
                }`}
              >
                {t.icon}
                <div>
                  <div className="font-medium">{t.label}</div>
                  {results[t.key] && <span className="text-[9px] text-primary">✓ gerado</span>}
                </div>
              </button>
            ))}
          </div>

          {/* Content area */}
          <ScrollArea className="flex-1">
            <div className="pr-3 space-y-4">
              {/* Competitors */}
              {activeTool === 'competitors' && (
                <ToolPanel
                  title="Análise de Concorrentes"
                  description="Insira perfis de concorrentes e a IA gerará um relatório comparativo com oportunidades de diferenciação."
                >
                  <Textarea
                    placeholder="@concorrente1, @concorrente2, @concorrente3 (ou descreva o nicho/mercado)"
                    value={competitorInput}
                    onChange={e => setCompetitorInput(e.target.value)}
                    rows={2}
                  />
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={ai.isPending || !competitorInput.trim()}
                    onClick={() => runTool('competitors', { competitors: competitorInput })}
                  >
                    {ai.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Analisar Concorrentes
                  </Button>
                  {results.competitors && <ResultDisplay data={results.competitors.data} onCopy={copyToClipboard} />}
                </ToolPanel>
              )}

              {/* Forecast */}
              {activeTool === 'forecast' && (
                <ToolPanel
                  title="Previsão de Resultados"
                  description="A IA projeta alcance, engajamento e crescimento esperados com base no conteúdo planejado e benchmarks do nicho."
                >
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={ai.isPending}
                    onClick={() => runTool('forecast')}
                  >
                    {ai.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                    Gerar Previsão
                  </Button>
                  {results.forecast && <ResultDisplay data={results.forecast.data} onCopy={copyToClipboard} />}
                </ToolPanel>
              )}

              {/* Budget Optimizer */}
              {activeTool === 'budget_optimizer' && (
                <ToolPanel
                  title="Otimizador de Verba"
                  description={`Orçamento atual: R$ ${Number(campaign.budget || 0).toLocaleString()}. A IA sugere a distribuição ideal entre formatos, dias e objetivos.`}
                >
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={ai.isPending}
                    onClick={() => runTool('budget_optimizer')}
                  >
                    {ai.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                    Otimizar Verba
                  </Button>
                  {results.budget_optimizer && <ResultDisplay data={results.budget_optimizer.data} onCopy={copyToClipboard} />}
                </ToolPanel>
              )}

              {/* Ad Copies */}
              {activeTool === 'ad_copies' && (
                <ToolPanel
                  title="Gerador de Copies para Ads"
                  description="Gere headlines, descrições e CTAs otimizados para Meta Ads em cada etapa do funil."
                >
                  <div className="flex gap-2">
                    {(['awareness', 'consideration', 'conversion'] as const).map(obj => (
                      <Button
                        key={obj}
                        size="sm"
                        variant={adObjective === obj ? 'default' : 'outline'}
                        onClick={() => setAdObjective(obj)}
                        className="text-[10px]"
                      >
                        {obj === 'awareness' ? '🎯 Awareness' : obj === 'consideration' ? '🤔 Consideration' : '💰 Conversion'}
                      </Button>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={ai.isPending}
                    onClick={() => runTool('ad_copies', { objective: adObjective })}
                  >
                    {ai.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                    Gerar Copies ({adObjective})
                  </Button>
                  {results.ad_copies && <ResultDisplay data={results.ad_copies.data} onCopy={copyToClipboard} />}
                </ToolPanel>
              )}

              {/* A/B Testing */}
              {activeTool === 'ab_testing' && (
                <ToolPanel
                  title="A/B Testing de Criativos"
                  description="Gere variações de hooks, legendas ou CTAs para comparação lado a lado."
                >
                  <div className="flex gap-2 flex-wrap">
                    {(['hook', 'caption', 'cta'] as const).map(f => (
                      <Button key={f} size="sm" variant={abField === f ? 'default' : 'outline'} onClick={() => setAbField(f)} className="text-[10px]">
                        {f === 'hook' ? '🪝 Hook' : f === 'caption' ? '📝 Legenda' : '🎯 CTA'}
                      </Button>
                    ))}
                  </div>
                  {posts.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {posts.slice(0, 6).map((p, i) => (
                        <Button key={p.id} size="sm" variant={abPostIndex === i ? 'default' : 'outline'} onClick={() => setAbPostIndex(i)} className="text-[10px] max-w-[140px] truncate">
                          {p.title}
                        </Button>
                      ))}
                    </div>
                  )}
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={ai.isPending || posts.length === 0}
                    onClick={() => {
                      const p = posts[abPostIndex];
                      runTool('ab_testing', {
                        field: abField,
                        post_title: p?.title,
                        post_hook: p?.hook,
                        post_caption: p?.caption_short || p?.caption_medium,
                        post_cta: p?.cta,
                        post_format: p?.format,
                        post_pillar: p?.pillar,
                      });
                    }}
                  >
                    {ai.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Gerar 3 Variações
                  </Button>
                  {results.ab_testing && <ResultDisplay data={results.ab_testing.data} onCopy={copyToClipboard} />}
                </ToolPanel>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ToolPanel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  );
}

function ResultDisplay({ data, onCopy }: { data: any; onCopy: (text: string) => void }) {
  if (!data) return null;

  // If data is a string (markdown-like), render it
  if (typeof data === 'string') {
    return (
      <Card className="glass-card p-4 mt-3">
        <div className="flex justify-end mb-2">
          <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1" onClick={() => onCopy(data)}>
            <Copy className="w-3 h-3" /> Copiar
          </Button>
        </div>
        <div className="text-[12px] text-foreground whitespace-pre-wrap leading-relaxed">{data}</div>
      </Card>
    );
  }

  // If data is an object with sections
  const text = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
  const sections = typeof data === 'object' && !Array.isArray(data) ? Object.entries(data) : null;

  if (sections) {
    return (
      <div className="space-y-3 mt-3">
        {sections.map(([key, value]) => (
          <Card key={key} className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-[11px] font-semibold text-foreground uppercase tracking-wide">
                {key.replace(/_/g, ' ')}
              </h5>
              <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1" onClick={() => onCopy(typeof value === 'string' ? value : JSON.stringify(value, null, 2))}>
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            <div className="text-[12px] text-foreground/80 whitespace-pre-wrap leading-relaxed">
              {typeof value === 'string' ? value : Array.isArray(value) ? (
                <ul className="space-y-1.5">
                  {value.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{typeof item === 'string' ? item : JSON.stringify(item)}</span>
                    </li>
                  ))}
                </ul>
              ) : JSON.stringify(value, null, 2)}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card className="glass-card p-4 mt-3">
      <div className="flex justify-end mb-2">
        <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1" onClick={() => onCopy(text)}>
          <Copy className="w-3 h-3" /> Copiar
        </Button>
      </div>
      <pre className="text-[11px] text-foreground/80 whitespace-pre-wrap">{text}</pre>
    </Card>
  );
}
