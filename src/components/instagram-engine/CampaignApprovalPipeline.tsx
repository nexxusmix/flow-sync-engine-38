import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { InstagramPost, POST_STATUSES, FORMATS, InstagramCampaign } from '@/hooks/useInstagramEngine';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle2, XCircle, Clock, ArrowRight, Lock, Unlock, MessageSquare, Loader2, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

type ApprovalStage = 'draft' | 'review' | 'approved' | 'rejected';

const STAGES: { key: ApprovalStage; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'draft', label: 'Rascunho', icon: <Clock className="w-3.5 h-3.5" />, color: 'bg-muted/20 text-muted-foreground' },
  { key: 'review', label: 'Em Revisão', icon: <Shield className="w-3.5 h-3.5" />, color: 'bg-muted text-muted-foreground' },
  { key: 'approved', label: 'Aprovado', icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'bg-primary/15 text-primary' },
  { key: 'rejected', label: 'Rejeitado', icon: <XCircle className="w-3.5 h-3.5" />, color: 'bg-destructive/15 text-destructive' },
];

function getApprovalStage(post: InstagramPost): ApprovalStage {
  if (post.status === 'ready' || post.status === 'scheduled' || post.status === 'published') return 'approved';
  if (post.status === 'in_production') return 'review';
  return 'draft';
}

export function CampaignApprovalPipeline({ campaign, posts }: Props) {
  const qc = useQueryClient();
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);
  const [feedback, setFeedback] = useState('');
  const [processing, setProcessing] = useState(false);

  const stageGroups = useMemo(() => {
    const groups: Record<ApprovalStage, InstagramPost[]> = { draft: [], review: [], approved: [], rejected: [] };
    posts.forEach(p => {
      groups[getApprovalStage(p)].push(p);
    });
    return groups;
  }, [posts]);

  const stageCounts = STAGES.map(s => ({ ...s, count: stageGroups[s.key].length }));

  const handleAction = async (action: 'approve' | 'reject' | 'send_review') => {
    if (!selectedPost) return;
    if (action === 'reject' && !feedback.trim()) {
      toast.error('Motivo da rejeição obrigatório');
      return;
    }
    setProcessing(true);
    try {
      let newStatus = selectedPost.status;
      if (action === 'approve') newStatus = 'ready';
      else if (action === 'reject') newStatus = 'idea';
      else if (action === 'send_review') newStatus = 'in_production';

      await supabase.from('instagram_posts').update({ status: newStatus }).eq('id', selectedPost.id);

      // Log action
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('action_log').insert({
        action_type: action,
        entity_type: 'instagram_post_approval',
        entity_id: selectedPost.id,
        user_id: user?.id || '00000000-0000-0000-0000-000000000000',
        after_snapshot: {
          action,
          feedback: feedback || null,
          post_title: selectedPost.title,
          campaign_id: campaign.id,
          author: user?.email?.split('@')[0] || 'Sistema',
          previous_status: selectedPost.status,
          new_status: newStatus,
        },
      });

      qc.invalidateQueries({ queryKey: ['instagram-posts'] });
      setSelectedPost(null);
      setFeedback('');
      toast.success(
        action === 'approve' ? 'Post aprovado!' :
        action === 'reject' ? 'Post rejeitado com feedback' :
        'Enviado para revisão!'
      );
    } catch { toast.error('Erro ao processar'); }
    finally { setProcessing(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Workflow de Aprovação</h4>
          <p className="text-[10px] text-muted-foreground">Rascunho → Revisão → Aprovação com feedback obrigatório</p>
        </div>
      </div>

      {/* Pipeline bar */}
      <div className="flex items-center gap-1 p-2 bg-muted/10 rounded-xl">
        {stageCounts.map((s, i) => (
          <div key={s.key} className="flex items-center flex-1">
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg ${s.color} flex-1`}>
              {s.icon}
              <span className="text-[9px] font-medium">{s.label}</span>
              <Badge variant="outline" className="text-[7px] ml-auto">{s.count}</Badge>
            </div>
            {i < stageCounts.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground mx-1 shrink-0" />}
          </div>
        ))}
      </div>

      {/* Stage cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Posts needing action */}
        <Card className="glass-card p-4 max-h-[450px] overflow-y-auto">
          <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Aguardando Ação</h5>
          <div className="space-y-2">
            {[...stageGroups.draft, ...stageGroups.review].length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-[10px] text-muted-foreground">Todos os posts estão aprovados!</p>
              </div>
            ) : (
              [...stageGroups.review, ...stageGroups.draft].map((post, i) => {
                const stage = getApprovalStage(post);
                const stageInfo = STAGES.find(s => s.key === stage)!;
                const isSelected = selectedPost?.id === post.id;
                return (
                  <motion.div
                    key={post.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected ? 'border-primary/40 bg-primary/5' : 'border-border/20 hover:bg-muted/10'
                    }`}
                    onClick={() => setSelectedPost(post)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-foreground truncate">{post.title}</span>
                      <Badge className={`${stageInfo.color} text-[7px]`}>{stageInfo.label}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[8px] text-muted-foreground">
                      {FORMATS.find(f => f.key === post.format) && (
                        <span>{FORMATS.find(f => f.key === post.format)?.label}</span>
                      )}
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(post.updated_at), { locale: ptBR, addSuffix: true })}</span>
                      {post.hook && <span className="text-primary">🪝</span>}
                      {post.ai_generated && <span className="text-primary">⚡</span>}
                    </div>
                    {/* Completion indicators */}
                    <div className="flex gap-1 mt-1.5">
                      {[
                        { label: 'Hook', ok: !!post.hook },
                        { label: 'Legenda', ok: !!(post.caption_short || post.caption_long) },
                        { label: 'CTA', ok: !!post.cta },
                        { label: 'Script', ok: !!post.script },
                      ].map(c => (
                        <span key={c.label} className={`text-[7px] px-1.5 py-0.5 rounded ${c.ok ? 'bg-primary/15 text-primary' : 'bg-muted/20 text-muted-foreground'}`}>
                          {c.label}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </Card>

        {/* Action panel */}
        <Card className="glass-card p-4">
          {selectedPost ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="text-[11px] font-semibold text-foreground">{selectedPost.title}</h5>
                <Badge className={`${STAGES.find(s => s.key === getApprovalStage(selectedPost))?.color} text-[8px]`}>
                  {STAGES.find(s => s.key === getApprovalStage(selectedPost))?.label}
                </Badge>
              </div>

              {/* Content preview */}
              <div className="space-y-2">
                {selectedPost.hook && (
                  <div className="p-2 bg-muted/10 rounded-lg">
                    <span className="text-[8px] text-muted-foreground uppercase">Hook</span>
                    <p className="text-[10px] text-foreground/80">{selectedPost.hook}</p>
                  </div>
                )}
                {(selectedPost.caption_short || selectedPost.caption_long) && (
                  <div className="p-2 bg-muted/10 rounded-lg">
                    <span className="text-[8px] text-muted-foreground uppercase">Legenda</span>
                    <p className="text-[10px] text-foreground/80 line-clamp-4">{selectedPost.caption_short || selectedPost.caption_long}</p>
                  </div>
                )}
              </div>

              {/* Feedback */}
              <div>
                <span className="text-[9px] text-muted-foreground">Feedback / Notas {getApprovalStage(selectedPost) !== 'approved' && '(obrigatório para rejeição)'}</span>
                <Textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Ex: Ajustar o tom para mais casual..."
                  className="text-[10px] min-h-[60px] mt-1"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {getApprovalStage(selectedPost) === 'draft' && (
                  <Button size="sm" variant="outline" className="flex-1 gap-1 text-[9px]" onClick={() => handleAction('send_review')} disabled={processing}>
                    {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                    Enviar p/ Revisão
                  </Button>
                )}
                <Button size="sm" variant="outline" className="flex-1 gap-1 text-[9px] text-destructive hover:text-destructive" onClick={() => handleAction('reject')} disabled={processing}>
                  <XCircle className="w-3 h-3" /> Rejeitar
                </Button>
                <Button size="sm" className="flex-1 gap-1 text-[9px]" onClick={() => handleAction('approve')} disabled={processing}>
                  {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                  Aprovar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px]">
              <Shield className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-[10px] text-muted-foreground">Selecione um post para revisar</p>
            </div>
          )}
        </Card>
      </div>

      {/* Approved list */}
      {stageGroups.approved.length > 0 && (
        <Card className="glass-card p-4">
          <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
            <CheckCircle2 className="w-3 h-3 inline mr-1 text-primary" />
            Aprovados ({stageGroups.approved.length})
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {stageGroups.approved.map(p => (
              <Badge key={p.id} variant="outline" className="text-[8px] gap-1">
                <Lock className="w-2 h-2 text-primary" />
                {p.title.slice(0, 25)}{p.title.length > 25 ? '...' : ''}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
