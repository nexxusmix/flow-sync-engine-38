import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InstagramPost, POST_STATUSES, FORMATS, PILLARS, InstagramCampaign } from '@/hooks/useInstagramEngine';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Send, Calendar, CheckCircle2, AlertTriangle, Zap, Eye, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { format, addDays, setHours, setMinutes, isAfter, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

// Optimal posting times based on general Instagram best practices
const OPTIMAL_TIMES = [
  { hour: 7, minute: 0, label: '7:00', score: 70 },
  { hour: 9, minute: 0, label: '9:00', score: 85 },
  { hour: 11, minute: 30, label: '11:30', score: 90 },
  { hour: 12, minute: 0, label: '12:00', score: 80 },
  { hour: 14, minute: 0, label: '14:00', score: 75 },
  { hour: 17, minute: 0, label: '17:00', score: 88 },
  { hour: 19, minute: 0, label: '19:00', score: 95 },
  { hour: 20, minute: 30, label: '20:30', score: 92 },
  { hour: 21, minute: 0, label: '21:00', score: 85 },
];

function getOptimalSlot(date: Date) {
  // Pick highest-scored time for the given day, preferring evening
  const dayOfWeek = date.getDay();
  // Weekend prefer morning/afternoon, weekdays prefer evening
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return OPTIMAL_TIMES[2]; // 11:30
  }
  return OPTIMAL_TIMES[6]; // 19:00
}

export function CampaignPublishQueue({ campaign, posts }: Props) {
  const qc = useQueryClient();
  const [autoScheduling, setAutoScheduling] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Queue = posts that are 'ready' or 'scheduled'
  const queuePosts = useMemo(() => {
    return posts
      .filter(p => p.status === 'ready' || p.status === 'scheduled')
      .sort((a, b) => {
        if (a.status === 'scheduled' && b.status === 'ready') return -1;
        if (a.status === 'ready' && b.status === 'scheduled') return 1;
        const da = a.scheduled_at || a.created_at;
        const db = b.scheduled_at || b.created_at;
        return new Date(da).getTime() - new Date(db).getTime();
      });
  }, [posts]);

  const readyPosts = queuePosts.filter(p => p.status === 'ready');
  const scheduledPosts = queuePosts.filter(p => p.status === 'scheduled');

  // Story sequence preview
  const storyPosts = useMemo(() => {
    return posts.filter(p => p.format === 'story' || p.format === 'story_sequence');
  }, [posts]);

  // Auto-schedule ready posts to optimal times
  const handleAutoSchedule = async () => {
    if (readyPosts.length === 0) {
      toast.info('Nenhum post pronto para agendar');
      return;
    }
    setAutoScheduling(true);
    try {
      const startDate = campaign.start_date ? new Date(campaign.start_date) : new Date();
      const today = startOfDay(new Date());
      let currentDate = isAfter(today, startDate) ? today : startDate;

      const updates = readyPosts.map((post, i) => {
        const targetDate = addDays(currentDate, Math.floor(i / 2)); // 2 posts per day max
        const slot = i % 2 === 0 ? OPTIMAL_TIMES[6] : OPTIMAL_TIMES[2]; // alternate evening/morning
        const scheduledAt = setMinutes(setHours(targetDate, slot.hour), slot.minute);
        return {
          id: post.id,
          scheduled_at: scheduledAt.toISOString(),
          status: 'scheduled',
        };
      });

      for (const u of updates) {
        await supabase
          .from('instagram_posts')
          .update({ scheduled_at: u.scheduled_at, status: u.status })
          .eq('id', u.id);
      }

      qc.invalidateQueries({ queryKey: ['instagram-posts'] });
      toast.success(`${updates.length} posts agendados nos melhores horários!`);
    } catch (e) {
      toast.error('Erro ao agendar posts');
    } finally {
      setAutoScheduling(false);
    }
  };

  // Mark as published
  const handlePublish = async (postId: string) => {
    await supabase
      .from('instagram_posts')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', postId);
    qc.invalidateQueries({ queryKey: ['instagram-posts'] });
    toast.success('Post marcado como publicado!');
  };

  const completionCheck = (post: InstagramPost) => {
    const checks = [
      { label: 'Hook', ok: !!post.hook },
      { label: 'Legenda', ok: !!(post.caption_short || post.caption_long) },
      { label: 'CTA', ok: !!post.cta },
      { label: 'Hashtags', ok: !!(post.hashtags?.length) },
    ];
    return checks;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Send className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Fila de Publicação</h4>
            <p className="text-[10px] text-muted-foreground">{readyPosts.length} prontos · {scheduledPosts.length} agendados</p>
          </div>
        </div>
        {readyPosts.length > 0 && (
          <Button size="sm" className="gap-1.5 text-[11px]" onClick={handleAutoSchedule} disabled={autoScheduling}>
            {autoScheduling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Auto-agendar ({readyPosts.length})
          </Button>
        )}
      </div>

      {/* Optimal times guide */}
      <Card className="glass-card p-4">
        <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Melhores Horários</h5>
        <div className="flex gap-2 flex-wrap">
          {OPTIMAL_TIMES.map((t) => (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              className={`px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                selectedSlot === t.label
                  ? 'border-primary/50 bg-primary/10'
                  : 'border-border/30 bg-muted/10 hover:border-primary/25'
              }`}
              onClick={() => setSelectedSlot(selectedSlot === t.label ? null : t.label)}
            >
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-[11px] font-semibold text-foreground">{t.label}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${t.score}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <span className="text-[8px] text-muted-foreground">{t.score}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Queue list */}
      <div className="space-y-3">
        {queuePosts.length === 0 ? (
          <Card className="glass-card p-8 text-center">
            <Send className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Nenhum post na fila. Mova posts para "Pronto" para aparecerem aqui.</p>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            {queuePosts.map((post, i) => {
              const fmt = FORMATS.find(f => f.key === post.format);
              const pillar = PILLARS.find(p => p.key === post.pillar);
              const status = POST_STATUSES.find(s => s.key === post.status);
              const checks = completionCheck(post);
              const allChecked = checks.every(c => c.ok);
              const isScheduled = post.status === 'scheduled';

              return (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`glass-card p-4 transition-all hover:border-primary/20 ${isScheduled ? 'border-l-2 border-l-cyan-500' : ''}`}>
                    <div className="flex items-start gap-3">
                      {/* Position indicator */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isScheduled ? 'bg-cyan-500/15 text-cyan-400' : 'bg-primary/15 text-primary'
                      }`}>
                        <span className="text-[11px] font-bold">{i + 1}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-semibold text-foreground truncate">{post.title}</span>
                          <Badge className={`${status?.color} text-[8px]`}>{status?.label}</Badge>
                          {post.ai_generated && <Zap className="w-3 h-3 text-primary" />}
                        </div>

                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {fmt && <Badge variant="outline" className="text-[8px]">{fmt.label}</Badge>}
                          {pillar && (
                            <span className="flex items-center gap-1 text-[8px] text-muted-foreground">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pillar.color }} />
                              {pillar.label}
                            </span>
                          )}
                          {post.scheduled_at && (
                            <span className="flex items-center gap-1 text-[9px] text-cyan-400 font-medium">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(post.scheduled_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                            </span>
                          )}
                        </div>

                        {/* Completion checks */}
                        <div className="flex items-center gap-2">
                          {checks.map(c => (
                            <span key={c.label} className={`flex items-center gap-0.5 text-[8px] ${c.ok ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                              {c.ok ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}
                              {c.label}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isScheduled && (
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => handlePublish(post.id)}>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="text-[10px]">Marcar como publicado</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Story Sequence Preview */}
      {storyPosts.length > 0 && (
        <Card className="glass-card p-4">
          <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">Preview Sequência de Stories</h5>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {storyPosts.map((sp, i) => (
              <motion.div
                key={sp.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className="w-20 shrink-0"
              >
                <div className="aspect-[9/16] rounded-xl border border-border/30 bg-gradient-to-b from-primary/10 to-muted/10 flex flex-col items-center justify-center p-1.5 mb-1 overflow-hidden">
                  {sp.thumbnail_url ? (
                    <img src={sp.thumbnail_url} alt="" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <>
                      <span className="text-[6px] font-semibold text-foreground text-center line-clamp-3">{sp.title}</span>
                      {sp.hook && <span className="text-[5px] text-muted-foreground text-center mt-0.5 line-clamp-2">🪝 {sp.hook}</span>}
                    </>
                  )}
                </div>
                <p className="text-[7px] text-muted-foreground text-center truncate">{sp.title}</p>
                <Badge className={`${POST_STATUSES.find(s => s.key === sp.status)?.color} text-[6px] w-full justify-center mt-0.5`}>
                  {POST_STATUSES.find(s => s.key === sp.status)?.label}
                </Badge>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
