import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InstagramPost, InstagramCampaign, POST_STATUSES } from '@/hooks/useInstagramEngine';
import { motion } from 'framer-motion';
import { HeartPulse, CheckCircle, AlertTriangle, XCircle, Flame, CalendarCheck, BarChart3, Zap } from 'lucide-react';
import { differenceInDays, parseISO, isAfter, isBefore, subDays } from 'date-fns';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

interface HealthMetric {
  label: string;
  score: number;
  maxScore: number;
  detail: string;
  icon: React.ReactNode;
}

export function CampaignHealthScore({ campaign, posts }: Props) {
  const health = useMemo(() => {
    const metrics: HealthMetric[] = [];
    const now = new Date();

    // 1. Completion rate
    const published = posts.filter(p => p.status === 'published').length;
    const ready = posts.filter(p => p.status === 'ready').length;
    const total = posts.length || 1;
    const completionPct = Math.round(((published + ready) / total) * 100);
    const completionScore = Math.min(Math.round(completionPct / 4), 25);
    metrics.push({
      label: 'Conclusão',
      score: completionScore,
      maxScore: 25,
      detail: `${published + ready}/${total} posts prontos/publicados (${completionPct}%)`,
      icon: <CheckCircle className="w-4 h-4" />,
    });

    // 2. Consistency / frequency
    const scheduledPosts = posts.filter(p => p.scheduled_at || p.published_at).sort((a, b) => {
      const da = a.scheduled_at || a.published_at || '';
      const db = b.scheduled_at || b.published_at || '';
      return da.localeCompare(db);
    });
    let gapScore = 25;
    let maxGap = 0;
    let gapDetail = 'Frequência ideal';
    if (scheduledPosts.length >= 2) {
      for (let i = 1; i < scheduledPosts.length; i++) {
        const prev = parseISO(scheduledPosts[i - 1].scheduled_at || scheduledPosts[i - 1].published_at!);
        const curr = parseISO(scheduledPosts[i].scheduled_at || scheduledPosts[i].published_at!);
        const gap = differenceInDays(curr, prev);
        if (gap > maxGap) maxGap = gap;
      }
      if (maxGap > 7) { gapScore = 5; gapDetail = `Gap máx de ${maxGap} dias entre posts`; }
      else if (maxGap > 4) { gapScore = 15; gapDetail = `Gap de ${maxGap} dias — pode melhorar`; }
      else { gapDetail = `Gap máx ${maxGap} dias — excelente`; }
    } else {
      gapScore = 10;
      gapDetail = 'Poucos posts agendados';
    }
    metrics.push({ label: 'Consistência', score: gapScore, maxScore: 25, detail: gapDetail, icon: <Flame className="w-4 h-4" /> });

    // 3. Content diversity (pillar spread)
    const pillars = new Set(posts.map(p => p.pillar).filter(Boolean));
    const formats = new Set(posts.map(p => p.format).filter(Boolean));
    const diversityRaw = pillars.size * 3 + formats.size * 2;
    const diversityScore = Math.min(diversityRaw, 25);
    metrics.push({
      label: 'Diversidade',
      score: diversityScore,
      maxScore: 25,
      detail: `${pillars.size} pilares, ${formats.size} formatos`,
      icon: <BarChart3 className="w-4 h-4" />,
    });

    // 4. Production quality (has hooks, scripts, captions)
    const withHook = posts.filter(p => p.hook).length;
    const withScript = posts.filter(p => p.script).length;
    const withCaption = posts.filter(p => p.caption_short || p.caption_long).length;
    const qualityRaw = Math.round(((withHook + withScript + withCaption) / (total * 3)) * 25);
    const qualityScore = Math.min(qualityRaw, 25);
    metrics.push({
      label: 'Qualidade',
      score: qualityScore,
      maxScore: 25,
      detail: `${withHook} hooks, ${withScript} roteiros, ${withCaption} legendas`,
      icon: <Zap className="w-4 h-4" />,
    });

    const totalScore = metrics.reduce((s, m) => s + m.score, 0);

    // Streak
    const last7 = posts.filter(p => {
      const d = p.published_at || p.scheduled_at;
      if (!d) return false;
      try { return isAfter(parseISO(d), subDays(now, 7)); } catch { return false; }
    }).length;

    // Alerts
    const alerts: string[] = [];
    const ideaPosts = posts.filter(p => p.status === 'idea');
    if (ideaPosts.length > total * 0.5) alerts.push(`${ideaPosts.length} posts ainda como "Ideia"`);
    if (maxGap > 5) alerts.push(`Gap de ${maxGap} dias prejudica o algoritmo`);
    if (pillars.size <= 1 && total > 3) alerts.push('Pouca diversidade de pilares');
    const overdue = posts.filter(p => p.scheduled_at && isBefore(parseISO(p.scheduled_at), now) && p.status !== 'published');
    if (overdue.length > 0) alerts.push(`${overdue.length} posts atrasados`);

    return { totalScore, metrics, last7, alerts, maxGap };
  }, [posts]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-primary';
    if (score >= 60) return 'text-primary/70';
    if (score >= 40) return 'text-muted-foreground';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Atenção';
    return 'Crítico';
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
          <HeartPulse className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Saúde da Campanha</h4>
          <p className="text-[10px] text-muted-foreground">{posts.length} posts analisados</p>
        </div>
      </div>

      {/* Main score */}
      <Card className="glass-card p-6 text-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="relative w-28 h-28 mx-auto mb-3">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/10" />
              <motion.circle
                cx="50" cy="50" r="42" fill="none" strokeWidth="6"
                className={getScoreColor(health.totalScore)}
                stroke="currentColor"
                strokeDasharray={`${(health.totalScore / 100) * 264} 264`}
                strokeLinecap="round"
                initial={{ strokeDasharray: '0 264' }}
                animate={{ strokeDasharray: `${(health.totalScore / 100) * 264} 264` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${getScoreColor(health.totalScore)}`}>{health.totalScore}</span>
              <span className="text-[8px] text-muted-foreground">/100</span>
            </div>
          </div>
          <Badge className={`${health.totalScore >= 60 ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'} text-[9px]`}>
            {getScoreLabel(health.totalScore)}
          </Badge>
          <p className="text-[9px] text-muted-foreground mt-1">{health.last7} posts nos últimos 7 dias</p>
        </motion.div>
      </Card>

      {/* Metrics breakdown */}
      <div className="space-y-2">
        {health.metrics.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="glass-card p-3">
              <div className="flex items-center gap-3">
                <div className="text-muted-foreground">{m.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium text-foreground">{m.label}</span>
                    <span className={`text-[10px] font-bold ${getScoreColor((m.score / m.maxScore) * 100)}`}>{m.score}/{m.maxScore}</span>
                  </div>
                  <div className="h-1.5 bg-muted/10 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${m.score / m.maxScore >= 0.7 ? 'bg-primary' : m.score / m.maxScore >= 0.4 ? 'bg-muted-foreground' : 'bg-destructive'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(m.score / m.maxScore) * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                    />
                  </div>
                  <p className="text-[8px] text-muted-foreground mt-0.5">{m.detail}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Alerts */}
      {health.alerts.length > 0 && (
        <Card className="glass-card p-3 border-border">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground">Alertas</span>
          </div>
          {health.alerts.map((a, i) => (
            <p key={i} className="text-[9px] text-muted-foreground">⚠ {a}</p>
          ))}
        </Card>
      )}
    </div>
  );
}
