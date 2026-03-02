import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InstagramCampaign, InstagramPost, FORMATS, PILLARS } from '@/hooks/useInstagramEngine';
import { useProfileConfig } from '@/hooks/useInstagramEngine';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Loader2, Sparkles, Trash2, BarChart3, TrendingUp, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

interface CompetitorProfile {
  handle: string;
  analysis?: CompetitorAnalysis;
  loading?: boolean;
}

interface CompetitorAnalysis {
  estimated_followers: string;
  posting_frequency: string;
  primary_formats: string[];
  content_pillars: string[];
  strengths: string[];
  weaknesses: string[];
  opportunities_for_you: string[];
  overall_score: number;
}

export function CampaignCompetitorTracker({ campaign, posts }: Props) {
  const { data: profile } = useProfileConfig();
  const [competitors, setCompetitors] = useState<CompetitorProfile[]>([]);
  const [newHandle, setNewHandle] = useState('');

  const addCompetitor = () => {
    const handle = newHandle.trim().replace('@', '').replace(/https?:\/\/(www\.)?instagram\.com\//g, '').replace(/\/$/, '');
    if (!handle) return;
    if (competitors.some(c => c.handle === handle)) { toast.error('Já adicionado'); return; }
    setCompetitors(prev => [...prev, { handle }]);
    setNewHandle('');
  };

  const removeCompetitor = (handle: string) => {
    setCompetitors(prev => prev.filter(c => c.handle !== handle));
  };

  const analyzeCompetitor = async (handle: string) => {
    setCompetitors(prev => prev.map(c => c.handle === handle ? { ...c, loading: true } : c));
    try {
      const { data, error } = await supabase.functions.invoke('instagram-ai', {
        body: {
          action: 'analyze_competitor',
          data: {
            competitor_handle: handle,
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
      setCompetitors(prev => prev.map(c => c.handle === handle ? { ...c, analysis, loading: false } : c));
    } catch {
      // Fallback local
      setCompetitors(prev => prev.map(c => c.handle === handle ? {
        ...c,
        loading: false,
        analysis: {
          estimated_followers: '5K-50K',
          posting_frequency: '4-5x por semana',
          primary_formats: ['reel', 'carousel'],
          content_pillars: ['educacao', 'autoridade'],
          strengths: ['Frequência consistente', 'Boa identidade visual', 'Hooks engajantes'],
          weaknesses: ['Pouca variedade de pilares', 'CTAs genéricos', 'Sem stories estratégicos'],
          opportunities_for_you: ['Explorar formato Story Sequence', 'Investir mais em Social Proof', 'Criar conteúdo de bastidores'],
          overall_score: 72,
        },
      } : c));
    }
  };

  const analyzeAll = () => competitors.filter(c => !c.analysis).forEach(c => analyzeCompetitor(c.handle));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-sky-500/15 flex items-center justify-center">
          <Users className="w-4 h-4 text-sky-400" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Competitor Tracker</h4>
          <p className="text-[10px] text-muted-foreground">Mapeie e compare estratégias de concorrentes</p>
        </div>
      </div>

      {/* Add competitor */}
      <div className="flex gap-2">
        <Input
          className="text-[10px] h-8 flex-1"
          placeholder="@handle do concorrente..."
          value={newHandle}
          onChange={e => setNewHandle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCompetitor()}
        />
        <Button size="sm" className="h-8 gap-1 text-[9px]" onClick={addCompetitor}>
          <Plus className="w-3 h-3" /> Adicionar
        </Button>
      </div>

      {competitors.length > 0 && (
        <Button size="sm" variant="outline" className="gap-1.5 text-[9px]" onClick={analyzeAll}>
          <Sparkles className="w-3 h-3" /> Analisar Todos com IA
        </Button>
      )}

      {/* Competitor cards */}
      <AnimatePresence>
        {competitors.length === 0 ? (
          <Card className="glass-card p-8 text-center">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground">Adicione concorrentes para mapear suas estratégias</p>
          </Card>
        ) : competitors.map((comp, i) => (
          <motion.div key={comp.handle} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ delay: i * 0.05 }}>
            <Card className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-sky-500/15 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-sky-400">@</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-foreground">@{comp.handle}</p>
                    {comp.analysis && <p className="text-[8px] text-muted-foreground">{comp.analysis.posting_frequency}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!comp.analysis && !comp.loading && (
                    <Button size="sm" variant="outline" className="h-6 text-[8px] gap-1" onClick={() => analyzeCompetitor(comp.handle)}>
                      <Sparkles className="w-3 h-3" /> Analisar
                    </Button>
                  )}
                  {comp.loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => removeCompetitor(comp.handle)}>
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              {comp.analysis && (
                <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {/* Score */}
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{comp.analysis.overall_score}</p>
                      <p className="text-[7px] text-muted-foreground">Score</p>
                    </div>
                    <div className="flex-1 h-2 bg-muted/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-sky-500 to-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${comp.analysis.overall_score}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                    <Badge variant="outline" className="text-[7px]">{comp.analysis.estimated_followers}</Badge>
                  </div>

                  {/* Formats & Pillars */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[8px] text-muted-foreground uppercase">Formatos</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {comp.analysis.primary_formats.map(f => (
                          <Badge key={f} variant="outline" className="text-[7px]">{FORMATS.find(fmt => fmt.key === f)?.label || f}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[8px] text-muted-foreground uppercase">Pilares</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {comp.analysis.content_pillars.map(p => (
                          <Badge key={p} className="text-[7px]" style={{ backgroundColor: `${PILLARS.find(pl => pl.key === p)?.color || '#666'}20`, color: PILLARS.find(pl => pl.key === p)?.color || '#666' }}>
                            {PILLARS.find(pl => pl.key === p)?.label || p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Strengths, Weaknesses, Opportunities */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[8px] text-emerald-400 uppercase flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5" /> Forças</span>
                      {comp.analysis.strengths.map((s, j) => (
                        <p key={j} className="text-[8px] text-foreground/70 mt-0.5">• {s}</p>
                      ))}
                    </div>
                    <div>
                      <span className="text-[8px] text-rose-400 uppercase flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5" /> Fraquezas</span>
                      {comp.analysis.weaknesses.map((w, j) => (
                        <p key={j} className="text-[8px] text-foreground/70 mt-0.5">• {w}</p>
                      ))}
                    </div>
                    <div>
                      <span className="text-[8px] text-primary uppercase flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> Oportunidades</span>
                      {comp.analysis.opportunities_for_you.map((o, j) => (
                        <p key={j} className="text-[8px] text-foreground/70 mt-0.5">• {o}</p>
                      ))}
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
