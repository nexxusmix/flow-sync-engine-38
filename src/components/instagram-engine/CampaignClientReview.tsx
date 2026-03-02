import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { InstagramCampaign, InstagramPost, useUpdatePost, FORMATS, PILLARS } from '@/hooks/useInstagramEngine';
import { UserCheck, ChevronLeft, ChevronRight, CheckCircle, XCircle, MessageSquare, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

type ReviewStatus = 'pending' | 'approved' | 'rejected';

export function CampaignClientReview({ campaign, posts }: Props) {
  const updatePost = useUpdatePost();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviews, setReviews] = useState<Record<string, { status: ReviewStatus; comment: string }>>({});
  const [comment, setComment] = useState('');

  const reviewablePosts = useMemo(() =>
    posts.filter(p => ['ready', 'in_production', 'planned'].includes(p.status)),
    [posts]
  );

  const currentPost = reviewablePosts[currentIndex];
  const currentReview = currentPost ? reviews[currentPost.id] : undefined;

  const approvedCount = Object.values(reviews).filter(r => r.status === 'approved').length;
  const rejectedCount = Object.values(reviews).filter(r => r.status === 'rejected').length;

  const handleReview = (status: ReviewStatus) => {
    if (!currentPost) return;
    setReviews(prev => ({
      ...prev,
      [currentPost.id]: { status, comment },
    }));
    setComment('');
    toast.success(status === 'approved' ? 'Post aprovado ✅' : 'Post rejeitado — feedback salvo');
    if (currentIndex < reviewablePosts.length - 1) {
      setCurrentIndex(i => i + 1);
    }
  };

  const handleApplyAll = async () => {
    let updated = 0;
    for (const [postId, review] of Object.entries(reviews)) {
      if (review.status === 'approved') {
        try {
          await updatePost.mutateAsync({ id: postId, status: 'ready' });
          updated++;
        } catch { /* continue */ }
      }
    }
    toast.success(`${updated} posts atualizados!`);
  };

  if (reviewablePosts.length === 0) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Client Review Portal</h3>
        </div>
        <Card className="p-8 bg-card/30 border-border/20 text-center">
          <Eye className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Nenhum post pronto para revisão</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">Posts com status "Planejado", "Em Produção" ou "Pronto" aparecerão aqui</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Client Review Portal</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-400/10 text-emerald-400 text-[9px]">✅ {approvedCount}</Badge>
          <Badge className="bg-red-400/10 text-red-400 text-[9px]">❌ {rejectedCount}</Badge>
          <Badge variant="outline" className="text-[9px]">{reviewablePosts.length - approvedCount - rejectedCount} pendentes</Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${((approvedCount + rejectedCount) / reviewablePosts.length) * 100}%` }}
        />
      </div>

      {/* Review card */}
      {currentPost && (
        <Card className="p-5 bg-card/50 border-border/30">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} disabled={currentIndex === 0}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground">{currentIndex + 1} / {reviewablePosts.length}</span>
            <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => setCurrentIndex(i => Math.min(reviewablePosts.length - 1, i + 1))} disabled={currentIndex === reviewablePosts.length - 1}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Post content */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-foreground">{currentPost.title}</h4>
              <Badge variant="outline" className="text-[9px]">{FORMATS.find(f => f.key === currentPost.format)?.label || currentPost.format}</Badge>
              {currentPost.pillar && <Badge variant="outline" className="text-[9px]">{PILLARS.find(p => p.key === currentPost.pillar)?.label || currentPost.pillar}</Badge>}
              {currentReview && (
                <Badge className={currentReview.status === 'approved' ? 'bg-emerald-400/10 text-emerald-400 text-[9px]' : 'bg-red-400/10 text-red-400 text-[9px]'}>
                  {currentReview.status === 'approved' ? '✅ Aprovado' : '❌ Rejeitado'}
                </Badge>
              )}
            </div>

            {currentPost.hook && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                <span className="text-[10px] text-primary font-medium">🎯 Hook</span>
                <p className="text-xs text-foreground mt-1">{currentPost.hook}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-3">
              {currentPost.caption_short && (
                <div className="p-3 bg-background/40 rounded-lg">
                  <span className="text-[10px] text-muted-foreground font-medium">Legenda Curta</span>
                  <p className="text-xs text-foreground mt-1">{currentPost.caption_short}</p>
                </div>
              )}
              {currentPost.caption_long && (
                <div className="p-3 bg-background/40 rounded-lg">
                  <span className="text-[10px] text-muted-foreground font-medium">Legenda Longa</span>
                  <p className="text-xs text-foreground mt-1 line-clamp-4">{currentPost.caption_long}</p>
                </div>
              )}
            </div>

            {currentPost.script && (
              <div className="p-3 bg-background/40 rounded-lg">
                <span className="text-[10px] text-muted-foreground font-medium">📝 Roteiro</span>
                <p className="text-xs text-foreground mt-1 whitespace-pre-line line-clamp-6">{currentPost.script}</p>
              </div>
            )}

            {currentPost.cta && (
              <div className="p-2 bg-amber-400/5 rounded-lg border border-amber-400/10">
                <span className="text-[10px] text-amber-400">📣 CTA: {currentPost.cta}</span>
              </div>
            )}

            {currentPost.hashtags && currentPost.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {currentPost.hashtags.map(h => (
                  <span key={h} className="text-[9px] text-primary/60">#{h}</span>
                ))}
              </div>
            )}
          </div>

          {/* Review actions */}
          <div className="mt-4 pt-4 border-t border-border/20 space-y-3">
            <Textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Comentário / feedback (opcional)..."
              className="text-xs min-h-[60px]"
            />
            <div className="flex gap-2">
              <Button className="flex-1 gap-1.5 text-xs h-9 bg-emerald-500 hover:bg-emerald-600" onClick={() => handleReview('approved')}>
                <CheckCircle className="w-4 h-4" /> Aprovar
              </Button>
              <Button variant="destructive" className="flex-1 gap-1.5 text-xs h-9" onClick={() => handleReview('rejected')}>
                <XCircle className="w-4 h-4" /> Rejeitar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Review summary */}
      {Object.keys(reviews).length > 0 && (
        <Card className="p-4 bg-card/50 border-border/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-foreground">📋 Resumo da Revisão</h4>
            <Button size="sm" className="gap-1.5 text-xs h-8" onClick={handleApplyAll} disabled={updatePost.isPending}>
              Aplicar Aprovações
            </Button>
          </div>
          <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
            {Object.entries(reviews).map(([postId, review]) => {
              const post = reviewablePosts.find(p => p.id === postId);
              return (
                <div key={postId} className="flex items-center gap-2">
                  {review.status === 'approved' ? (
                    <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                  )}
                  <span className="text-xs text-foreground truncate flex-1">{post?.title || postId}</span>
                  {review.comment && (
                    <MessageSquare className="w-3 h-3 text-muted-foreground shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
