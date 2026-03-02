import { useState, useMemo, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InstagramPost, POST_STATUSES, FORMATS, InstagramCampaign } from '@/hooks/useInstagramEngine';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, CheckCircle2, Clock, FileText, User, History, ThumbsUp, ThumbsDown, Loader2, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

interface PostComment {
  id: string;
  post_id: string;
  author_name: string;
  content: string;
  type: 'comment' | 'approval' | 'revision' | 'note';
  created_at: string;
}

export function CampaignCollaboration({ campaign, posts }: Props) {
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('comments');
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  // Local comments storage (using action_log for persistence)
  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['campaign-comments', campaign.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('action_log')
        .select('*')
        .eq('entity_type', 'instagram_campaign_comment')
        .eq('workspace_id', '00000000-0000-0000-0000-000000000000')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(d => ({
        id: d.id,
        post_id: d.entity_id,
        author_name: (d.after_snapshot as any)?.author_name || 'Usuário',
        content: (d.after_snapshot as any)?.content || '',
        type: (d.after_snapshot as any)?.type || 'comment',
        created_at: d.created_at,
      })) as PostComment[];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('campaign-comments-rt')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'action_log',
        filter: `entity_type=eq.instagram_campaign_comment`,
      }, () => {
        refetchComments();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetchComments]);

  const postComments = useMemo(() => {
    if (!selectedPost) return [];
    return comments.filter(c => c.post_id === selectedPost.id);
  }, [comments, selectedPost]);

  // Auto-scroll to bottom on new comments
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [postComments.length]);

  const handleSendComment = async (type: PostComment['type'] = 'comment') => {
    if (!commentText.trim() || !selectedPost) return;
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('action_log').insert({
        action_type: 'comment',
        entity_type: 'instagram_campaign_comment',
        entity_id: selectedPost.id,
        user_id: user?.id || '00000000-0000-0000-0000-000000000000',
        after_snapshot: {
          content: commentText,
          author_name: user?.email?.split('@')[0] || 'Usuário',
          type,
          campaign_id: campaign.id,
        },
      });
      if (error) throw error;
      setCommentText('');
      refetchComments();
      toast.success(type === 'approval' ? 'Aprovação registrada!' : type === 'revision' ? 'Revisão solicitada!' : 'Comentário adicionado!');
    } catch (e) {
      toast.error('Erro ao enviar comentário');
    } finally {
      setSending(false);
    }
  };

  // Revision history for selected post
  const revisionHistory = useMemo(() => {
    if (!selectedPost) return [];
    return postComments.filter(c => c.type === 'revision' || c.type === 'approval');
  }, [postComments, selectedPost]);

  // Posts with most comments
  const postActivity = useMemo(() => {
    const map: Record<string, number> = {};
    comments.forEach(c => {
      map[c.post_id] = (map[c.post_id] || 0) + 1;
    });
    return posts.map(p => ({
      ...p,
      commentCount: map[p.id] || 0,
      hasApproval: comments.some(c => c.post_id === p.id && c.type === 'approval'),
      hasRevision: comments.some(c => c.post_id === p.id && c.type === 'revision'),
    })).sort((a, b) => b.commentCount - a.commentCount);
  }, [posts, comments]);

  const TYPE_ICONS = {
    comment: <MessageSquare className="w-3 h-3" />,
    approval: <ThumbsUp className="w-3 h-3 text-emerald-400" />,
    revision: <ThumbsDown className="w-3 h-3 text-amber-400" />,
    note: <FileText className="w-3 h-3 text-primary" />,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Colaboração</h4>
          <p className="text-[10px] text-muted-foreground">{comments.length} comentários · {posts.length} posts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Post list */}
        <Card className="glass-card p-3 md:col-span-1 max-h-[500px] overflow-y-auto">
          <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Posts</h5>
          <div className="space-y-1.5">
            {postActivity.map(p => {
              const status = POST_STATUSES.find(s => s.key === p.status);
              const isSelected = selectedPost?.id === p.id;
              return (
                <motion.div
                  key={p.id}
                  layout
                  whileHover={{ scale: 1.01 }}
                  className={`p-2.5 rounded-lg cursor-pointer transition-all border ${
                    isSelected ? 'border-primary/40 bg-primary/5' : 'border-transparent hover:bg-muted/10'
                  }`}
                  onClick={() => setSelectedPost(p)}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-semibold text-foreground truncate flex-1">{p.title}</span>
                    {p.commentCount > 0 && (
                      <Badge variant="outline" className="text-[7px] ml-1 shrink-0">{p.commentCount}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge className={`${status?.color} text-[7px]`}>{status?.label}</Badge>
                    {p.hasApproval && <ThumbsUp className="w-2.5 h-2.5 text-emerald-400" />}
                    {p.hasRevision && <AlertCircle className="w-2.5 h-2.5 text-amber-400" />}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>

        {/* Comment area */}
        <Card className="glass-card p-4 md:col-span-2">
          {selectedPost ? (
            <div className="flex flex-col h-full max-h-[500px]">
              {/* Post header */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/20">
                <div>
                  <h5 className="text-[11px] font-semibold text-foreground">{selectedPost.title}</h5>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge className={`${POST_STATUSES.find(s => s.key === selectedPost.status)?.color} text-[7px]`}>
                      {POST_STATUSES.find(s => s.key === selectedPost.status)?.label}
                    </Badge>
                    <span className="text-[8px] text-muted-foreground">
                      {FORMATS.find(f => f.key === selectedPost.format)?.label}
                    </span>
                  </div>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-muted/20 h-7">
                    <TabsTrigger value="comments" className="text-[9px] h-5 gap-1">
                      <MessageSquare className="w-2.5 h-2.5" /> Chat
                    </TabsTrigger>
                    <TabsTrigger value="history" className="text-[9px] h-5 gap-1">
                      <History className="w-2.5 h-2.5" /> Revisões
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-[200px]">
                <AnimatePresence mode="popLayout">
                  {(activeTab === 'comments' ? postComments : revisionHistory).map((c, i) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`flex gap-2 ${c.type === 'approval' || c.type === 'revision' ? 'bg-muted/10 rounded-lg p-2' : ''}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-3 h-3 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-semibold text-foreground">{c.author_name}</span>
                          {TYPE_ICONS[c.type]}
                          <span className="text-[8px] text-muted-foreground">
                            {formatDistanceToNow(new Date(c.created_at), { locale: ptBR, addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-[10px] text-foreground/80 whitespace-pre-wrap">{c.content}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={commentsEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-border/20 pt-3">
                <div className="flex gap-2">
                  <Textarea
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Escreva um comentário..."
                    className="text-[11px] min-h-[60px] resize-none"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendComment();
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" className="text-[9px] h-6 gap-1"
                      onClick={() => handleSendComment('approval')} disabled={sending}>
                      <ThumbsUp className="w-3 h-3 text-emerald-400" /> Aprovar
                    </Button>
                    <Button size="sm" variant="outline" className="text-[9px] h-6 gap-1"
                      onClick={() => handleSendComment('revision')} disabled={sending}>
                      <ThumbsDown className="w-3 h-3 text-amber-400" /> Revisão
                    </Button>
                  </div>
                  <Button size="sm" className="text-[9px] h-6 gap-1" onClick={() => handleSendComment()} disabled={!commentText.trim() || sending}>
                    {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    Enviar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">Selecione um post para ver e adicionar comentários</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
