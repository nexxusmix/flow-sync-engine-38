import { useEffect, useState } from "react";
import { MkAppShell } from "@/components/marketing-hub/MkAppShell";
import { MkCard, MkStatusBadge, MkEmptyState, MkSectionHeader } from "@/components/marketing-hub/mk-ui";
import { useMarketingStore } from "@/stores/marketingStore";
import { ContentItem, CONTENT_ITEM_STAGES } from "@/types/marketing";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, MessageSquare, ChevronDown, Send, Clock, AlertTriangle, FileText, Sparkles, Eye, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SendToClientApproval } from "@/components/marketing-hub/pipeline/SendToClientApproval";
import { ContentStatusTimeline } from "@/components/marketing-hub/pipeline/ContentStatusTimeline";

const DEFAULT_WORKSPACE = "00000000-0000-0000-0000-000000000000";

// Fetch comments for a specific content item
function useItemComments(itemId: string | null) {
  return useQuery({
    queryKey: ['content-comments', itemId],
    queryFn: async () => {
      if (!itemId) return [];
      const { data, error } = await supabase
        .from('content_comments')
        .select('*')
        .eq('content_item_id', itemId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!itemId,
  });
}

export default function MkApprovalsPage() {
  const { contentItems, fetchContentItems, updateContentStatus } = useMarketingStore();
  const [filter, setFilter] = useState<"review" | "approved" | "all">("review");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => { fetchContentItems(); }, []);

  const items = contentItems.filter(i => {
    if (filter === "all") return ["review", "approved", "editing", "writing"].includes(i.status);
    return i.status === filter;
  });

  const reviewCount = contentItems.filter(i => i.status === "review").length;
  const approvedCount = contentItems.filter(i => i.status === "approved").length;

  const approve = async (id: string) => {
    await updateContentStatus(id, "approved");
    // Add system comment
    await supabase.from('content_comments').insert({
      content_item_id: id,
      text: '✅ Conteúdo aprovado',
      author_name: 'Sistema',
    });
    queryClient.invalidateQueries({ queryKey: ['content-comments', id] });
    toast.success("Conteúdo aprovado!");
  };

  const handleRejectClick = (id: string) => {
    setRejectTargetId(id);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectTargetId) return;
    await updateContentStatus(rejectTargetId, "editing");
    // Add rejection comment with reason
    const text = rejectReason.trim()
      ? `🔄 Devolvido para edição: ${rejectReason}`
      : '🔄 Devolvido para edição';
    await supabase.from('content_comments').insert({
      content_item_id: rejectTargetId,
      text,
      author_name: 'Revisor',
    });
    queryClient.invalidateQueries({ queryKey: ['content-comments', rejectTargetId] });
    toast.info("Devolvido para edição com feedback");
    setRejectDialogOpen(false);
    setRejectTargetId(null);
    setRejectReason("");
  };

  const sendComment = async (itemId: string) => {
    if (!commentText.trim()) return;
    setSendingComment(true);
    try {
      await supabase.from('content_comments').insert({
        content_item_id: itemId,
        text: commentText.trim(),
        author_name: 'Revisor',
      });
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ['content-comments', itemId] });
      toast.success("Comentário adicionado");
    } catch {
      toast.error("Erro ao enviar comentário");
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <MkAppShell title="Fluxo Aprovação" sectionCode="08" sectionLabel="Approval_Flow">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-white/30">
            {reviewCount} em revisão · {approvedCount} aprovados
          </p>
        </div>
        <div className="flex rounded-xl border border-white/[0.06] overflow-hidden">
          {([
            { key: "review" as const, label: "Em Revisão", count: reviewCount },
            { key: "approved" as const, label: "Aprovados", count: approvedCount },
            { key: "all" as const, label: "Todos", count: items.length },
          ]).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={cn(
                "px-4 py-2 text-xs font-medium transition-colors flex items-center gap-1.5",
                filter === f.key
                  ? "bg-[hsl(210,100%,55%)]/20 text-[hsl(210,100%,65%)]"
                  : "text-white/30 hover:text-white/60"
              )}>
              {f.label}
              <span className={cn(
                "text-[9px] px-1.5 py-0.5 rounded-full",
                filter === f.key ? "bg-[hsl(210,100%,55%)]/30" : "bg-white/[0.06]"
              )}>{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Status Pipeline Visual */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {["writing", "review", "approved", "scheduled", "published"].map((s, i) => {
          const stage = CONTENT_ITEM_STAGES.find(st => st.type === s);
          const count = contentItems.filter(c => c.status === s).length;
          return (
            <div key={s} className="flex items-center gap-2 shrink-0">
              {i > 0 && <div className="w-8 h-px bg-white/[0.08]" />}
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-[0.1em]",
                s === "review" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : s === "approved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-white/[0.03] text-white/30 border border-white/[0.06]"
              )}>
                <span>{stage?.name || s}</span>
                <span className="font-mono">{count}</span>
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 ? (
        <MkEmptyState icon="check_circle" title="Nada para aprovar" description="Conteúdos em revisão aparecerão aqui quando enviados para aprovação." />
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <ApprovalCard
              key={item.id}
              item={item}
              index={i}
              expanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
              onApprove={() => approve(item.id)}
              onReject={() => handleRejectClick(item.id)}
              commentText={expandedId === item.id ? commentText : ""}
              onCommentChange={setCommentText}
              onSendComment={() => sendComment(item.id)}
              sendingComment={sendingComment}
            />
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-[#111114] border-white/[0.08] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-white/90 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-amber-400" />
              Solicitar Alteração
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-white/50 text-xs block mb-1.5">Motivo / Feedback</label>
              <Textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="bg-white/[0.04] border-white/[0.08] text-white min-h-[100px]"
                placeholder="Descreva o que precisa ser ajustado..."
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setRejectDialogOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-white/50 text-sm hover:bg-white/[0.04] transition-colors">
                Cancelar
              </button>
              <button onClick={confirmReject}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors">
                Devolver para Edição
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MkAppShell>
  );
}

// --- Approval Card with expandable detail ---
function ApprovalCard({ item, index, expanded, onToggle, onApprove, onReject, commentText, onCommentChange, onSendComment, sendingComment, onRefresh }: {
  item: ContentItem;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
  commentText: string;
  onCommentChange: (v: string) => void;
  onSendComment: () => void;
  sendingComment: boolean;
  onRefresh: () => void;
}) {
  const { data: comments } = useItemComments(expanded ? item.id : null);
  const stage = CONTENT_ITEM_STAGES.find(s => s.type === item.status);

  const statusVariant = item.status === "approved" ? "emerald"
    : item.status === "review" ? "amber"
    : item.status === "editing" ? "blue"
    : "slate";

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.04 }}
    >
      <MkCard className="overflow-hidden">
        {/* Header row */}
        <div className="flex items-center gap-4 cursor-pointer" onClick={onToggle}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <MkStatusBadge
                label={stage?.name || item.status}
                variant={statusVariant}
              />
              {item.channel && <span className="text-[10px] text-white/25 uppercase">{item.channel}</span>}
              {item.format && <span className="text-[10px] text-white/20">{item.format}</span>}
            </div>
            <h4 className="text-sm font-medium text-white/80 truncate">{item.title}</h4>
            {item.due_at && (
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3 text-white/20" />
                <span className={cn(
                  "text-[10px]",
                  new Date(item.due_at) < new Date() ? "text-red-400" : "text-white/25"
                )}>
                  {format(parseISO(item.due_at), "dd MMM yyyy", { locale: ptBR })}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {item.status === "review" && (
              <>
                <button onClick={e => { e.stopPropagation(); onApprove(); }}
                  className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  title="Aprovar">
                  <CheckCircle className="w-5 h-5" />
                </button>
                <button onClick={e => { e.stopPropagation(); onReject(); }}
                  className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                  title="Solicitar alteração">
                  <XCircle className="w-5 h-5" />
                </button>
              </>
            )}
            <ChevronDown className={cn(
              "w-4 h-4 text-white/20 transition-transform duration-200",
              expanded && "rotate-180"
            )} />
          </div>
        </div>

        {/* Expanded Detail */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-border/30 space-y-4">
                {/* Client Approval Bridge */}
                <div className="rounded-lg bg-muted/10 border border-border/20 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-[0.1em]">Aprovação do Cliente</span>
                  </div>
                  <SendToClientApproval item={item} onSent={() => { fetchContentItems(); }} />
                </div>

                {/* Content Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Script / Caption */}
                  <div className="space-y-3">
                    {item.hook && (
                      <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                        <span className="text-[9px] text-white/25 uppercase tracking-[0.12em] block mb-1">Hook</span>
                        <p className="text-sm text-white/60">{item.hook}</p>
                      </div>
                    )}
                    {item.script && (
                      <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                        <span className="text-[9px] text-white/25 uppercase tracking-[0.12em] flex items-center gap-1 mb-1">
                          <FileText className="w-3 h-3" /> Roteiro
                        </span>
                        <p className="text-xs text-white/50 whitespace-pre-wrap max-h-[200px] overflow-y-auto leading-relaxed">{item.script}</p>
                      </div>
                    )}
                    {item.caption_short && (
                      <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                        <span className="text-[9px] text-white/25 uppercase tracking-[0.12em] block mb-1">Legenda</span>
                        <p className="text-xs text-white/50">{item.caption_short}</p>
                      </div>
                    )}
                    {item.hashtags && (
                      <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                        <span className="text-[9px] text-white/25 uppercase tracking-[0.12em] block mb-1">Hashtags</span>
                        <p className="text-xs text-[hsl(210,100%,55%)]/60">{item.hashtags}</p>
                      </div>
                    )}
                    {item.cta && (
                      <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                        <span className="text-[9px] text-white/25 uppercase tracking-[0.12em] block mb-1">CTA</span>
                        <p className="text-xs text-white/50">{item.cta}</p>
                      </div>
                    )}
                    {!item.hook && !item.script && !item.caption_short && (
                      <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-6 text-center">
                        <Eye className="w-6 h-6 text-white/10 mx-auto mb-2" />
                        <p className="text-xs text-white/20">Sem conteúdo para pré-visualizar</p>
                        <p className="text-[10px] text-white/10">Use "Gerar com IA" no Pipeline</p>
                      </div>
                    )}
                  </div>

                  {/* Comments Thread */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-4 h-4 text-white/30" />
                      <span className="text-[10px] text-white/30 uppercase tracking-[0.12em]">
                        Comentários ({comments?.length || 0})
                      </span>
                    </div>

                    <div className="flex-1 space-y-2 max-h-[250px] overflow-y-auto mb-3 pr-1">
                      {comments && comments.length > 0 ? (
                        comments.map((c: any) => (
                          <div key={c.id} className={cn(
                            "rounded-lg p-3 text-xs",
                            c.text.startsWith('✅') ? "bg-emerald-500/10 border border-emerald-500/10"
                              : c.text.startsWith('🔄') ? "bg-amber-500/10 border border-amber-500/10"
                              : "bg-white/[0.03] border border-white/[0.06]"
                          )}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-white/50 font-medium text-[10px]">{c.author_name || 'Anônimo'}</span>
                              <span className="text-white/15 text-[9px]">
                                {formatDistanceToNow(parseISO(c.created_at), { addSuffix: true, locale: ptBR })}
                              </span>
                            </div>
                            <p className="text-white/60 leading-relaxed">{c.text}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-white/15 text-center py-4">Nenhum comentário ainda</p>
                      )}
                    </div>

                    {/* Comment Input */}
                    <div className="flex gap-2">
                      <input
                        value={commentText}
                        onChange={e => onCommentChange(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && onSendComment()}
                        placeholder="Adicionar feedback..."
                        className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white/70 placeholder:text-white/15 focus:outline-none focus:border-[hsl(210,100%,55%)]/30"
                      />
                      <button
                        onClick={onSendComment}
                        disabled={sendingComment || !commentText.trim()}
                        className="p-2 rounded-lg bg-[hsl(210,100%,55%)]/20 text-[hsl(210,100%,65%)] hover:bg-[hsl(210,100%,55%)]/30 transition-colors disabled:opacity-30"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </MkCard>
    </motion.div>
  );
}
