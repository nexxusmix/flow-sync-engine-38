import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { InstagramPost, InstagramCampaign, PILLARS } from '@/hooks/useInstagramEngine';
import { useProfileSnapshots, useProfileConfig } from '@/hooks/useInstagramEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, TrendingUp, Users, Eye, Heart, MessageSquare, Share2, Target, Sparkles, BarChart3 } from 'lucide-react';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

export function CampaignResultsSimulator({ campaign, posts }: Props) {
  const { data: snapshots } = useProfileSnapshots();
  const { data: profile } = useProfileConfig();

  const [postsPerWeek, setPostsPerWeek] = useState([posts.length > 0 ? Math.min(posts.length, 7) : 3]);
  const [weeks, setWeeks] = useState([4]);
  const [boostBudget, setBoostBudget] = useState([0]);

  const latestSnapshot = snapshots?.[0];
  const followers = latestSnapshot?.followers || 5000;
  const avgEngagement = latestSnapshot?.avg_engagement || 3.5;
  const avgReach = latestSnapshot?.avg_reach || 15;

  const projections = useMemo(() => {
    const totalPosts = postsPerWeek[0] * weeks[0];
    const reachPerPost = Math.round(followers * (avgReach / 100));
    const engagementsPerPost = Math.round(reachPerPost * (avgEngagement / 100));
    const likesPerPost = Math.round(engagementsPerPost * 0.7);
    const commentsPerPost = Math.round(engagementsPerPost * 0.15);
    const sharesPerPost = Math.round(engagementsPerPost * 0.1);
    const savesPerPost = Math.round(engagementsPerPost * 0.05);

    // Boost multiplier
    const boostMultiplier = 1 + (boostBudget[0] / 500);

    // AI content quality bonus (posts with hooks/scripts get more engagement)
    const aiPosts = posts.filter(p => p.ai_generated).length;
    const aiBonus = 1 + (aiPosts / Math.max(totalPosts, 1)) * 0.15;

    // Pillar diversity bonus
    const uniquePillars = new Set(posts.map(p => p.pillar).filter(Boolean)).size;
    const diversityBonus = 1 + (uniquePillars / 6) * 0.1;

    const multiplier = boostMultiplier * aiBonus * diversityBonus;

    const totalReach = Math.round(reachPerPost * totalPosts * multiplier);
    const totalLikes = Math.round(likesPerPost * totalPosts * multiplier);
    const totalComments = Math.round(commentsPerPost * totalPosts * multiplier);
    const totalShares = Math.round(sharesPerPost * totalPosts * multiplier);
    const totalSaves = Math.round(savesPerPost * totalPosts * multiplier);
    const estimatedNewFollowers = Math.round(totalReach * 0.02 * multiplier);
    const estimatedLeads = Math.round(totalReach * 0.005 * multiplier);
    const projectedEngagementRate = ((totalLikes + totalComments + totalShares + totalSaves) / Math.max(totalReach, 1) * 100).toFixed(2);

    return {
      totalPosts,
      totalReach,
      totalLikes,
      totalComments,
      totalShares,
      totalSaves,
      estimatedNewFollowers,
      estimatedLeads,
      projectedEngagementRate,
      reachPerPost: Math.round(reachPerPost * multiplier),
      multiplier,
      aiBonus: Math.round((aiBonus - 1) * 100),
      diversityBonus: Math.round((diversityBonus - 1) * 100),
    };
  }, [postsPerWeek, weeks, boostBudget, followers, avgEngagement, avgReach, posts]);

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const metricCards = [
    { label: 'Alcance Total', value: formatNumber(projections.totalReach), icon: <Eye className="w-4 h-4" />, color: 'text-blue-400' },
    { label: 'Likes', value: formatNumber(projections.totalLikes), icon: <Heart className="w-4 h-4" />, color: 'text-rose-400' },
    { label: 'Comentários', value: formatNumber(projections.totalComments), icon: <MessageSquare className="w-4 h-4" />, color: 'text-amber-400' },
    { label: 'Compartilhamentos', value: formatNumber(projections.totalShares), icon: <Share2 className="w-4 h-4" />, color: 'text-emerald-400' },
    { label: 'Novos Seguidores', value: `+${formatNumber(projections.estimatedNewFollowers)}`, icon: <Users className="w-4 h-4" />, color: 'text-cyan-400' },
    { label: 'Leads Estimados', value: formatNumber(projections.estimatedLeads), icon: <Target className="w-4 h-4" />, color: 'text-primary' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center">
          <Calculator className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Simulador de Resultados</h4>
          <p className="text-[10px] text-muted-foreground">
            Projeção baseada em {followers.toLocaleString()} seguidores · {avgEngagement}% engajamento
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground">Posts por semana</span>
            <Badge variant="outline" className="text-[9px]">{postsPerWeek[0]}</Badge>
          </div>
          <Slider value={postsPerWeek} onValueChange={setPostsPerWeek} min={1} max={14} step={1} />
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground">Duração (semanas)</span>
            <Badge variant="outline" className="text-[9px]">{weeks[0]}</Badge>
          </div>
          <Slider value={weeks} onValueChange={setWeeks} min={1} max={12} step={1} />
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground">Budget Boost (R$)</span>
            <Badge variant="outline" className="text-[9px]">R$ {boostBudget[0]}</Badge>
          </div>
          <Slider value={boostBudget} onValueChange={setBoostBudget} min={0} max={5000} step={100} />
        </Card>
      </div>

      {/* Bonuses */}
      <div className="flex gap-2 flex-wrap">
        {projections.aiBonus > 0 && (
          <Badge className="bg-primary/15 text-primary text-[8px] gap-1"><Sparkles className="w-3 h-3" /> +{projections.aiBonus}% bônus IA</Badge>
        )}
        {projections.diversityBonus > 0 && (
          <Badge className="bg-emerald-500/15 text-emerald-400 text-[8px] gap-1"><BarChart3 className="w-3 h-3" /> +{projections.diversityBonus}% diversidade pilares</Badge>
        )}
        {boostBudget[0] > 0 && (
          <Badge className="bg-amber-500/15 text-amber-400 text-[8px] gap-1"><TrendingUp className="w-3 h-3" /> {((projections.multiplier - 1) * 100).toFixed(0)}% boost total</Badge>
        )}
      </div>

      {/* Main metric */}
      <Card className="glass-card p-6 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Projeção de Engajamento</p>
          <p className="text-4xl font-bold text-foreground mt-1">{projections.projectedEngagementRate}%</p>
          <p className="text-[10px] text-muted-foreground mt-1">{projections.totalPosts} posts em {weeks[0]} semanas · ~{projections.reachPerPost.toLocaleString()} alcance/post</p>
        </motion.div>
      </Card>

      {/* Metric grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {metricCards.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="glass-card p-3 text-center">
              <div className={`${m.color} mx-auto mb-1`}>{m.icon}</div>
              <p className="text-lg font-bold text-foreground">{m.value}</p>
              <p className="text-[8px] text-muted-foreground">{m.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Weekly breakdown bar */}
      <Card className="glass-card p-4">
        <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">Projeção Semanal de Alcance</h5>
        <div className="space-y-2">
          {Array.from({ length: weeks[0] }, (_, i) => {
            const weekReach = projections.totalReach / weeks[0];
            const growth = 1 + (i * 0.05); // compound growth each week
            const adjusted = Math.round(weekReach * growth);
            const maxReach = Math.round(weekReach * (1 + (weeks[0] - 1) * 0.05));
            return (
              <motion.div key={i} initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ delay: i * 0.08 }}>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] text-muted-foreground w-16 shrink-0">Sem. {i + 1}</span>
                  <div className="flex-1 h-4 bg-muted/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(adjusted / maxReach) * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                    />
                  </div>
                  <span className="text-[8px] font-semibold text-foreground w-12 text-right">{formatNumber(adjusted)}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
