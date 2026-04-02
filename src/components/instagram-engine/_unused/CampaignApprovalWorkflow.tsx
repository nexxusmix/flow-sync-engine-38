import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { InstagramPost, FORMATS, useUpdatePost } from '@/hooks/useInstagramEngine';
import { CheckCircle2, XCircle, Clock, MessageSquare, Eye, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  posts: InstagramPost[];
}

const REVIEW_STATUSES = [
  { key: 'draft', label: 'Rascunho', color: 'bg-muted text-muted-foreground', icon: Clock },
  { key: 'in_review', label: 'Em Revisão', color: 'bg-muted text-muted-foreground', icon: Eye },
  { key: 'approved', label: 'Aprovado', color: 'bg-primary/15 text-primary', icon: CheckCircle2 },
  { key: 'rejected', label: 'Rejeitado', color: 'bg-destructive/15 text-destructive', icon: XCircle },
];

export function CampaignApprovalWorkflow({ posts }: Props) {
  const updatePost = useUpdatePost();
  const [reviewPost, setReviewPost] = useState<InstagramPost | null>(null);
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState<string | null>(null);

  const getReviewStatus = (post: InstagramPost) => {
    return (post as any).review_status || 'draft';
  };

  const counts = {
    draft: posts.filter(p => getReviewStatus(p) === 'draft').length,
    in_review: posts.filter(p => getReviewStatus(p) === 'in_review').length,
    approved: posts.filter(p => getReviewStatus(p) === 'approved').length,
    rejected: posts.filter(p => getReviewStatus(p) === 'rejected').length,
  };

  const filteredPosts = filter ? posts.filter(p => getReviewStatus(p) === filter) : posts;

  const handleApprove = (post: InstagramPost) => {
    updatePost.mutate({
      id: post.id,
      review_status: 'approved',
      reviewer_notes: notes || null,
      reviewed_at: new Date().toISOString(),
      status: 'ready',
    } as any);
    toast.success(`"${post.title}" aprovado!`);
    setReviewPost(null);
    setNotes('');
  };

  const handleReject = (post: InstagramPost) => {
    if (!notes.trim()) {
      toast.error('Adicione um motivo para a rejeição');
      return;
    }
    updatePost.mutate({
      id: post.id,
      review_status: 'rejected',
      reviewer_notes: notes,
      reviewed_at: new Date().toISOString(),
      status: 'in_production',
    } as any);
    toast.info(`"${post.title}" rejeitado — voltou para produção`);
    setReviewPost(null);
    setNotes('');
  };

  const handleSendToReview = (post: InstagramPost) => {
    updatePost.mutate({
      id: post.id,
      review_status: 'in_review',
    } as any);
    toast.success(`"${post.title}" enviado para revisão`);
  };

  return (
    <div className="space-y-4">
      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filter === null ? 'default' : 'outline'}
          className="text-[10px] h-7"
          onClick={() => setFilter(null)}
        >
          Todos ({posts.length})
        </Button>
        {REVIEW_STATUSES.map(s => (
          <Button
            key={s.key}
            size="sm"
            variant={filter === s.key ? 'default' : 'outline'}
            className="text-[10px] h-7 gap-1"
            onClick={() => setFilter(s.key)}
          >
            <s.icon className="w-3 h-3" />
            {s.label} ({counts[s.key as keyof typeof counts]})
          </Button>
        ))}
      </div>

      {/* Pending review banner */}
      {counts.in_review > 0 && (
        <div className="flex items-center gap-2 bg-muted border border-border rounded-lg px-3 py-2 text-[11px] text-muted-foreground">
          <Eye className="w-3.5 h-3.5 shrink-0" />
          <span><strong>{counts.in_review}</strong> post(s) aguardando revisão</span>
        </div>
      )}

      {/* Posts list */}
      <div className="space-y-2">
        {filteredPosts.map(post => {
          const reviewStatus = getReviewStatus(post);
          const rs = REVIEW_STATUSES.find(s => s.key === reviewStatus) || REVIEW_STATUSES[0];
          const fmt = FORMATS.find(f => f.key === post.format);
          const StatusIcon = rs.icon;

          return (
            <Card key={post.id} className="glass-card p-3">
              <div className="flex items-center gap-3">
                <StatusIcon className={`w-4 h-4 shrink-0 ${
                  reviewStatus === 'approved' ? 'text-primary' :
                  reviewStatus === 'rejected' ? 'text-destructive' :
                  reviewStatus === 'in_review' ? 'text-muted-foreground' :
                  'text-muted-foreground'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-medium text-foreground truncate">{post.title}</p>
                    {fmt && <Badge variant="outline" className="text-[8px] h-4 px-1">{fmt.label}</Badge>}
                    <Badge className={`${rs.color} text-[8px]`}>{rs.label}</Badge>
                  </div>
                  {(post as any).reviewer_notes && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {(post as any).reviewer_notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {reviewStatus === 'draft' && (
                    <Button size="sm" variant="outline" className="text-[10px] h-7 gap-1" onClick={() => handleSendToReview(post)}>
                      <Eye className="w-3 h-3" /> Enviar p/ Revisão
                    </Button>
                  )}
                  {reviewStatus === 'in_review' && (
                    <Button size="sm" variant="outline" className="text-[10px] h-7 gap-1" onClick={() => { setReviewPost(post); setNotes(''); }}>
                      <CheckCircle2 className="w-3 h-3" /> Revisar
                    </Button>
                  )}
                  {reviewStatus === 'rejected' && (
                    <Button size="sm" variant="outline" className="text-[10px] h-7 gap-1" onClick={() => handleSendToReview(post)}>
                      Reenviar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-8 text-xs text-muted-foreground">
          Nenhum post neste filtro
        </div>
      )}

      {/* Review dialog */}
      <Dialog open={!!reviewPost} onOpenChange={o => !o && setReviewPost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm">Revisar: {reviewPost?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {reviewPost?.hook && (
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Hook</label>
                <p className="text-xs text-foreground bg-muted/20 rounded p-2 mt-0.5">{reviewPost.hook}</p>
              </div>
            )}
            {reviewPost?.script && (
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Roteiro</label>
                <p className="text-xs text-foreground bg-muted/20 rounded p-2 mt-0.5 max-h-32 overflow-y-auto whitespace-pre-wrap">{reviewPost.script}</p>
              </div>
            )}
            {(reviewPost?.caption_short || reviewPost?.caption_long) && (
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Legenda</label>
                <p className="text-xs text-foreground bg-muted/20 rounded p-2 mt-0.5 max-h-24 overflow-y-auto whitespace-pre-wrap">
                  {reviewPost?.caption_long || reviewPost?.caption_short}
                </p>
              </div>
            )}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase">Notas / Feedback</label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Adicione feedback (obrigatório para rejeição)..."
                rows={3}
                className="mt-0.5 text-xs"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="destructive" size="sm" className="gap-1" onClick={() => reviewPost && handleReject(reviewPost)}>
              <XCircle className="w-3.5 h-3.5" /> Rejeitar
            </Button>
            <Button size="sm" className="gap-1" onClick={() => reviewPost && handleApprove(reviewPost)}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
