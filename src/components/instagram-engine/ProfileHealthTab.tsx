import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useProfileConfig, useSaveProfileConfig, useProfileSnapshots, useSaveSnapshot, useInstagramAI } from '@/hooks/useInstagramEngine';
import { Loader2, Sparkles, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function ProfileHealthTab() {
  const { data: config, isLoading } = useProfileConfig();
  const { data: snapshots } = useProfileSnapshots();
  const saveConfig = useSaveProfileConfig();
  const saveSnapshot = useSaveSnapshot();
  const aiMutation = useInstagramAI();

  // Default from instagram_profile_config table; 'squadfilme' is the last-resort fallback
  const [handle, setHandle] = useState(config?.profile_handle || 'squadfilme');
  const [bio, setBio] = useState(config?.bio_current || 'Ei! Somos a SQUAD Film.\nUma produtora de fotos e vídeos com sede no DF/GO');
  const [followers, setFollowers] = useState(snapshots?.[0]?.followers?.toString() || '70');
  const [postsCount, setPostsCount] = useState(snapshots?.[0]?.posts_count?.toString() || '8');
  const [engagement, setEngagement] = useState(snapshots?.[0]?.avg_engagement?.toString() || '3.2');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(config?.profile_analysis || null);

  const handleSaveProfile = async () => {
    await saveConfig.mutateAsync({
      profile_handle: handle,
      bio_current: bio,
    } as any);
  };

  const handleSaveSnapshot = async () => {
    await saveSnapshot.mutateAsync({
      followers: parseInt(followers),
      posts_count: parseInt(postsCount),
      avg_engagement: parseFloat(engagement),
    } as any);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await aiMutation.mutateAsync({
        action: 'analyze_profile',
        data: {
          handle,
          bio,
          followers: parseInt(followers),
          posts_count: parseInt(postsCount),
          avg_engagement: parseFloat(engagement),
        },
      });
      setAnalysis(result);
      // Save analysis to config
      await saveConfig.mutateAsync({
        profile_handle: handle,
        bio_current: bio,
        profile_score: result?.score || 0,
        profile_analysis: result,
        bio_suggestions: result?.bio_suggestions || [],
      } as any);
      toast.success('Análise completa!');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Saúde do Perfil</h3>
        <p className="text-xs text-muted-foreground">Análise completa e recomendações da IA</p>
      </div>

      {/* Profile Data Input */}
      <Card className="glass-card p-5">
        <h4 className="text-xs font-medium text-foreground mb-3 uppercase tracking-wide">Dados do Perfil</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Handle</label>
              <Input value={handle} onChange={e => setHandle(e.target.value)} placeholder={`@${config?.profile_handle || 'squadfilme'}`} className="text-sm" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Bio Atual</label>
              <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="text-sm" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Seguidores</label>
                <Input type="number" value={followers} onChange={e => setFollowers(e.target.value)} className="text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Posts</label>
                <Input type="number" value={postsCount} onChange={e => setPostsCount(e.target.value)} className="text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Engaj. (%)</label>
                <Input type="number" step="0.1" value={engagement} onChange={e => setEngagement(e.target.value)} className="text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleSaveSnapshot}>
                <Save className="w-3 h-3" /> Salvar Snapshot
              </Button>
              <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleSaveProfile}>
                <Save className="w-3 h-3" /> Salvar Perfil
              </Button>
            </div>
          </div>
        </div>
        <Button className="mt-4 gap-1.5" onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Analisar com IA
        </Button>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Score Ring */}
          <Card className="glass-card p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
                  strokeDasharray={`${(analysis.score / 100) * 327} 327`} strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{analysis.score}</span>
                <span className="text-[9px] text-muted-foreground uppercase">Score</span>
              </div>
            </div>
            <div className="flex-1 space-y-3 w-full">
              {analysis.breakdown && Object.entries(analysis.breakdown).map(([key, val]: any) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-foreground font-medium">{val.score}/100</span>
                  </div>
                  <Progress value={val.score} className="h-1.5" />
                  {val.note && <p className="text-[10px] text-muted-foreground mt-0.5">{val.note}</p>}
                </div>
              ))}
            </div>
          </Card>

          {/* Strengths / Weaknesses / Opportunities */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analysis.strengths?.length > 0 && (
              <Card className="glass-card p-4 border-emerald-500/20">
                <h4 className="text-xs font-medium text-emerald-400 mb-2">💪 Pontos Fortes</h4>
                <ul className="space-y-1">
                  {analysis.strengths.map((s: string, i: number) => (
                    <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5"><span className="text-emerald-400">✓</span>{s}</li>
                  ))}
                </ul>
              </Card>
            )}
            {analysis.weaknesses?.length > 0 && (
              <Card className="glass-card p-4 border-destructive/20">
                <h4 className="text-xs font-medium text-destructive mb-2">⚠️ Pontos Fracos</h4>
                <ul className="space-y-1">
                  {analysis.weaknesses.map((w: string, i: number) => (
                    <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5"><span className="text-destructive">•</span>{w}</li>
                  ))}
                </ul>
              </Card>
            )}
            {analysis.opportunities?.length > 0 && (
              <Card className="glass-card p-4 border-primary/20">
                <h4 className="text-xs font-medium text-primary mb-2">🎯 Oportunidades</h4>
                <ul className="space-y-1">
                  {analysis.opportunities.map((o: string, i: number) => (
                    <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5"><span className="text-primary">→</span>{o}</li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* Bio Suggestions */}
          {analysis.bio_suggestions?.length > 0 && (
            <Card className="glass-card p-5">
              <h4 className="text-xs font-medium text-foreground mb-3">📝 Sugestões de Bio</h4>
              <div className="space-y-3">
                {analysis.bio_suggestions.map((bs: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/30">
                    <Badge variant="secondary" className="text-[9px] mb-2">{bs.focus}</Badge>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{bs.text}</p>
                    <Button variant="ghost" size="sm" className="mt-2 text-[10px] h-6" onClick={() => { setBio(bs.text); toast.success('Bio aplicada — salve para confirmar'); }}>
                      Aplicar esta bio
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recommendations */}
          {analysis.recommendations?.length > 0 && (
            <Card className="glass-card p-5">
              <h4 className="text-xs font-medium text-foreground mb-3">📋 Recomendações</h4>
              <ul className="space-y-2">
                {analysis.recommendations.map((r: string, i: number) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="text-primary font-bold">{i + 1}.</span> {r}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
