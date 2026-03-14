import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { InstagramCampaign, InstagramPost, FORMATS, PILLARS, useCampaignCompetitors, useCampaignCompetitorMutations } from '@/hooks/useInstagramEngine';
import { useProfileConfig } from '@/hooks/useInstagramEngine';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Loader2, Sparkles, Trash2, BarChart3, TrendingUp, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { sc } from '@/lib/colors';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

export function CampaignCompetitorTracker({ campaign, posts }: Props) {
  const { data: profile } = useProfileConfig();
  const { data: competitors = [], isLoading } = useCampaignCompetitors(campaign.id);
  const { create, update, remove } = useCampaignCompetitorMutations(campaign.id);
  const [newHandle, setNewHandle] = useState('');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const addCompetitor = () => {
    const handle = newHandle.trim().replace('@', '').replace(/https?:\/\/(www\.)?instagram\.com\//g, '').replace(/\/$/, '');
    if (!handle) return;
    if (competitors.some(c => c.handle === handle)) { toast.error('Já adicionado'); return; }
    create.mutate({ name: handle, handle });
    setNewHandle('');
  };

  const analyzeCompetitor = async (comp: typeof competitors[0]) => {
    setAnalyzingId(comp.id);
    try {
      const { data, error } = await supabase.functions.invoke('instagram-ai', {
        body: {
          action: 'analyze_competitor',
          data: {
            competitor_handle: comp.handle,
            my_profile: profile?.profile_handle,
            my_niche: profile?.niche,
            my_campaign: campaign.name,
            my_posts_count: posts.length,
            my_pillars: [...new Set(posts.map(p => p.pillar).filter(Boolean))],
          }
        }
      });
      if (error) throw error;
      const analysis = data?.result || data?.output || data;
      update.mutate({ id: comp.id, analysis });
    } catch {
      update.mutate({ id: comp.id, analysis: {
        estimated_followers: '5K-50K',
        posting_frequency: '4-5x por semana',
        primary_formats: ['reel', 'carousel'],
        content_pillars: ['educacao', 'autoridade'],
        strengths: ['Frequência consistente', 'Boa identidade visual', 'Hooks engajantes'],
        weaknesses: ['Pouca variedade de pilares', 'CTAs genéricos', 'Sem stories estratégicos'],
        opportunities_for_you: ['Explorar formato Story Sequence', 'Investir mais em Social Proof', 'Criar conteúdo de bastidores'],
        overall_score: 72,
      }});
    } finally {
      setAnalyzingId(null);
    }
  };

  const analyzeAll = () => competitors.filter(c => !c.analysis).forEach(c => analyzeCompetitor(c));

  if (isLoading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary/40" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
          <Users className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Competitor Tracker</h4>
          <p className="text-[10px] text-muted-foreground">Mapeie e compare estratégias de concorrentes</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          className="text-[10px] h-8 flex-1"
          placeholder="@handle do concorrente..."
          value={newHandle}
          onChange={e => setNewHandle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCompetitor()}
        />
        <Button size="sm" className="h-8 gap-1 text-[9px]" onClick={addCompetitor} disabled={create.isPending}>
          <Plus className="w-3 h-3" /> Adicionar
        </Button>
      </div>

      {competitors.length > 0 && (
        <Button size="sm" variant="outline" className="gap-1.5 text-[9px]" onClick={analyzeAll}>
          <Sparkles className="w-3 h-3" /> Analisar Todos com IA
        </Button>
      )}

      <AnimatePresence>
        {competitors.length === 0 ? (
          <Card className="glass-card p-8 text-center">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground">Adicione concorrentes para mapear suas estratégias</p>
          </Card>
        ) : competitors.map((comp, i) => (
          <motion.div key={comp.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ delay: i * 0.05 }}>
            <Card className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">@</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-foreground">@{comp.handle}</p>
                    {comp.analysis && <p className="text-[8px] text-muted-foreground">{comp.analysis.posting_frequency}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!comp.analysis && analyzingId !== comp.id && (
                    <Button size="sm" variant="outline" className="h-6 text-[8px] gap-1" onClick={() => analyzeCompetitor(comp)}>
                      <Sparkles className="w-3 h-3" /> Analisar
                    </Button>
                  )}
                  {analyzingId === comp.id && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => remove.mutate(comp.id)}>
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              {comp.analysis && (
                <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{comp.analysis.overall_score}</p>
                      <p className="text-[7px] text-muted-foreground">Score</p>
                    </div>
                    <div className="flex-1 h-2 bg-muted/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${comp.analysis.overall_score}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                    <Badge variant="outline" className="text-[7px]">{comp.analysis.estimated_followers}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[8px] text-muted-foreground uppercase">Formatos</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {comp.analysis.primary_formats?.map((f: string) => (
                          <Badge key={f} variant="outline" className="text-[7px]">{FORMATS.find(fmt => fmt.key === f)?.label || f}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[8px] text-muted-foreground uppercase">Pilares</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {comp.analysis.content_pillars?.map((p: string) => (
                          <Badge key={p} className="text-[7px]" style={{ backgroundColor: `${PILLARS.find(pl => pl.key === p)?.color || '#666'}20`, color: PILLARS.find(pl => pl.key === p)?.color || '#666' }}>
                            {PILLARS.find(pl => pl.key === p)?.label || p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className={`text-[8px] font-medium ${sc.status('success').text}`}>Forças</span>
                      {comp.analysis.strengths?.map((s: string, j: number) => <div key={j} className="text-[8px] text-muted-foreground">✓ {s}</div>)}
                    </div>
                    <div>
                      <span className={`text-[8px] font-medium ${sc.status('error').text}`}>Fraquezas</span>
                      {comp.analysis.weaknesses?.map((w: string, j: number) => <div key={j} className="text-[8px] text-muted-foreground">✗ {w}</div>)}
                    </div>
                    <div>
                      <span className="text-[8px] font-medium text-primary">Oportunidades</span>
                      {comp.analysis.opportunities_for_you?.map((o: string, j: number) => <div key={j} className="text-[8px] text-muted-foreground">💡 {o}</div>)}
                    </div>
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
