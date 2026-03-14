import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InstagramCampaign, InstagramPost } from '@/hooks/useInstagramEngine';
import { ShieldAlert, AlertTriangle, CheckCircle, XCircle, Clock, Hash, FileText } from 'lucide-react';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

interface RiskItem {
  postId: string;
  postTitle: string;
  score: number; // 0-100, higher = riskier
  risks: { label: string; severity: 'low' | 'medium' | 'high'; detail: string }[];
}

const BANNED_HASHTAGS = ['followforfollow', 'f4f', 'like4like', 'l4l', 'followback', 'follow4follow', 'instagramhub', 'tagsforlikes', 'likeforlike', 'instalike'];

export function CampaignRiskScore({ campaign, posts }: Props) {
  const riskItems = useMemo(() => {
    return posts.map(post => {
      const risks: RiskItem['risks'] = [];
      let score = 0;

      // 1. Missing content checks
      if (!post.hook) {
        risks.push({ label: 'Sem hook', severity: 'medium', detail: 'Posts sem hook tendem a ter menor retenção' });
        score += 15;
      }
      if (!post.caption_short && !post.caption_long) {
        risks.push({ label: 'Sem legenda', severity: 'high', detail: 'Post sem legenda = engajamento mínimo' });
        score += 25;
      }
      if (!post.cta) {
        risks.push({ label: 'Sem CTA', severity: 'low', detail: 'CTAs aumentam conversão em 20-30%' });
        score += 10;
      }

      // 2. Hashtag risks
      const hashtags = post.hashtags || [];
      const bannedFound = hashtags.filter(h => BANNED_HASHTAGS.includes(h.replace('#', '').toLowerCase()));
      if (bannedFound.length > 0) {
        risks.push({ label: 'Hashtags banidas', severity: 'high', detail: `${bannedFound.map(h => `#${h}`).join(', ')} podem causar shadowban` });
        score += 30;
      }
      if (hashtags.length > 25) {
        risks.push({ label: 'Excesso de hashtags', severity: 'medium', detail: `${hashtags.length} hashtags — máximo recomendado: 25` });
        score += 15;
      }
      if (hashtags.length === 0 && post.status !== 'idea') {
        risks.push({ label: 'Sem hashtags', severity: 'low', detail: 'Hashtags aumentam descoberta de conteúdo' });
        score += 5;
      }

      // 3. Scheduling risks
      if (post.scheduled_at) {
        const scheduled = new Date(post.scheduled_at);
        const hour = scheduled.getHours();
        if (hour < 7 || hour > 22) {
          risks.push({ label: 'Horário ruim', severity: 'medium', detail: `Agendado para ${hour}h — fora do horário de pico (7h-22h)` });
          score += 15;
        }
        if (scheduled < new Date() && post.status !== 'published') {
          risks.push({ label: 'Data passada', severity: 'high', detail: 'Agendamento já expirou' });
          score += 20;
        }
      }

      // 4. Content length checks
      if (post.caption_long && post.caption_long.length > 2200) {
        risks.push({ label: 'Legenda longa demais', severity: 'medium', detail: `${post.caption_long.length} caracteres — limite do Instagram: 2.200` });
        score += 15;
      }

      // 5. Missing cover for carousel
      if (post.format === 'carousel' && (!post.carousel_slides || post.carousel_slides.length === 0)) {
        risks.push({ label: 'Carrossel vazio', severity: 'high', detail: 'Nenhum slide definido para o carrossel' });
        score += 20;
      }

      // 6. Story sequence check
      if (post.format === 'story_sequence' && (!post.story_sequence || post.story_sequence.length === 0)) {
        risks.push({ label: 'Sequência vazia', severity: 'high', detail: 'Nenhum story na sequência' });
        score += 20;
      }

      return {
        postId: post.id,
        postTitle: post.title,
        score: Math.min(score, 100),
        risks,
      } as RiskItem;
    }).sort((a, b) => b.score - a.score);
  }, [posts]);

  const avgScore = riskItems.length ? Math.round(riskItems.reduce((s, r) => s + r.score, 0) / riskItems.length) : 0;
  const highRiskCount = riskItems.filter(r => r.score >= 50).length;
  const cleanCount = riskItems.filter(r => r.score === 0).length;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-destructive bg-destructive/10';
      case 'medium': return 'text-muted-foreground bg-muted/20';
      default: return 'text-muted-foreground bg-muted/20';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 50) return 'text-destructive';
    if (score >= 20) return 'text-muted-foreground';
    return 'text-primary';
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Risk Score & Compliance Check</h3>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 bg-card/50 border-border/30 text-center">
          <div className={`text-lg font-bold ${getScoreColor(avgScore)}`}>{avgScore}</div>
          <div className="text-[10px] text-muted-foreground">Risco Médio</div>
        </Card>
        <Card className="p-3 bg-card/50 border-border/30 text-center">
          <div className="text-lg font-bold text-destructive">{highRiskCount}</div>
          <div className="text-[10px] text-muted-foreground">Alto Risco</div>
        </Card>
        <Card className="p-3 bg-card/50 border-border/30 text-center">
          <div className="text-lg font-bold text-primary">{cleanCount}</div>
          <div className="text-[10px] text-muted-foreground">Sem Risco</div>
        </Card>
      </div>

      {/* Risk items */}
      <div className="space-y-2">
        {riskItems.map(item => (
          <Card key={item.postId} className="p-3 bg-card/50 border-border/30">
            <div className="flex items-center gap-3">
              <div className={`text-sm font-bold min-w-[32px] text-center ${getScoreColor(item.score)}`}>
                {item.score}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {item.score === 0 ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : item.score >= 50 ? (
                    <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                  <span className="text-xs font-medium text-foreground truncate">{item.postTitle}</span>
                </div>
                {item.risks.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5 pl-5">
                    {item.risks.map((r, i) => (
                      <Badge key={i} variant="outline" className={`text-[9px] ${getSeverityColor(r.severity)}`} title={r.detail}>
                        {r.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}

        {riskItems.length === 0 && (
          <Card className="p-8 bg-card/30 border-border/20 text-center">
            <ShieldAlert className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Nenhum post para analisar</p>
          </Card>
        )}
      </div>
    </div>
  );
}
