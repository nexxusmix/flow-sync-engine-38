/**
 * PortalInlineComment - Comentário inline expandível abaixo do material
 */

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PortalComment, PortalApproval } from "@/hooks/useClientPortalEnhanced";

interface PortalInlineCommentProps {
  materialId: string;
  materialTitle: string;
  comments: PortalComment[];
  approval?: PortalApproval;
  onAddComment: (data: { authorName: string; authorEmail?: string; content: string }) => void;
  onApprove: (data: { approvedByName: string; approvedByEmail?: string; notes?: string }) => void;
  onRequestRevision: (data: { authorName: string; authorEmail?: string; content: string }) => void;
  isAddingComment: boolean;
  isApproving: boolean;
  isRequestingRevision: boolean;
  hasPaymentBlock?: boolean;
}

function PortalInlineCommentComponent({
  materialId,
  materialTitle,
  comments,
  approval,
  onAddComment,
  onApprove,
  onRequestRevision,
  isAddingComment,
  isApproving,
  isRequestingRevision,
  hasPaymentBlock,
}: PortalInlineCommentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [comment, setComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [mode, setMode] = useState<'comment' | 'approve' | 'revision'>('comment');

  const isApproved = !!approval;
  const isPending = isAddingComment || isApproving || isRequestingRevision;

  const handleSubmit = () => {
    if (!comment.trim() || !authorName.trim()) return;

    if (mode === 'approve') {
      onApprove({
        approvedByName: authorName,
        approvedByEmail: authorEmail || undefined,
        notes: comment,
      });
    } else if (mode === 'revision') {
      onRequestRevision({
        authorName,
        authorEmail: authorEmail || undefined,
        content: comment,
      });
    } else {
      onAddComment({
        authorName,
        authorEmail: authorEmail || undefined,
        content: comment,
      });
    }

    setComment("");
    setIsExpanded(false);
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg overflow-hidden">
      {/* Collapsed State - Input Trigger */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#111] transition-colors"
        >
          <MessageSquare className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-500">Adicionar comentário de revisão...</span>
          {comments.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-[10px]">
              {comments.length}
            </Badge>
          )}
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 space-y-4"
        >
          {/* Author Info */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Seu nome *"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="bg-[#111] border-[#2a2a2a] text-sm"
            />
            <Input
              placeholder="E-mail (opcional)"
              type="email"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              className="bg-[#111] border-[#2a2a2a] text-sm"
            />
          </div>

          {/* Comment Textarea */}
          <Textarea
            placeholder={
              mode === 'approve'
                ? "Notas de aprovação (opcional)..."
                : mode === 'revision'
                  ? "Descreva os ajustes necessários..."
                  : "Seu comentário..."
            }
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="bg-[#111] border-[#2a2a2a] text-sm resize-none"
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Mode Toggle Buttons */}
            <div className="flex gap-1 mr-auto">
              <Button
                variant={mode === 'comment' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setMode('comment')}
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                Comentar
              </Button>
              {!isApproved && !hasPaymentBlock && (
                <>
                  <Button
                    variant={mode === 'approve' ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      "h-8 text-xs",
                      mode === 'approve' && "bg-emerald-500/20 text-emerald-400"
                    )}
                    onClick={() => setMode('approve')}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Aprovar
                  </Button>
                  <Button
                    variant={mode === 'revision' ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      "h-8 text-xs",
                      mode === 'revision' && "bg-amber-500/20 text-amber-400"
                    )}
                    onClick={() => setMode('revision')}
                  >
                    <AlertCircle className="w-3.5 h-3.5 mr-1" />
                    Solicitar Ajuste
                  </Button>
                </>
              )}
            </div>

            {/* Cancel/Submit */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-gray-500"
              onClick={() => {
                setIsExpanded(false);
                setComment("");
                setMode('comment');
              }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className={cn(
                "h-8 text-xs",
                mode === 'approve' && "bg-emerald-500 hover:bg-emerald-600",
                mode === 'revision' && "bg-amber-500 hover:bg-amber-600"
              )}
              onClick={handleSubmit}
              disabled={isPending || !authorName.trim() || (mode !== 'approve' && !comment.trim())}
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-1" />
                  {mode === 'approve' ? 'Aprovar' : mode === 'revision' ? 'Enviar' : 'Enviar'}
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Comments History */}
      {comments.length > 0 && (
        <div className="border-t border-[#1a1a1a]">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-[#111] transition-colors"
          >
            <span className="text-xs text-gray-500">
              {comments.length} comentário{comments.length > 1 ? 's' : ''}
            </span>
            {showHistory ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-[#1a1a1a]"
              >
                <div className="p-3 space-y-3 max-h-60 overflow-y-auto">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-300">{c.author_name}</span>
                          <span className="text-[10px] text-gray-600">
                            {format(new Date(c.created_at), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                          {c.status === 'revision_requested' && (
                            <Badge className="bg-amber-500/20 text-amber-400 text-[10px]">
                              Ajuste
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Approved Badge */}
      {isApproved && (
        <div className="border-t border-[#1a1a1a] p-3 bg-emerald-500/5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-emerald-400">
              Aprovado por {approval.approved_by_name}
            </span>
            <span className="text-[10px] text-gray-600 ml-auto">
              {format(new Date(approval.approved_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </span>
          </div>
          {approval.notes && (
            <p className="text-xs text-gray-500 mt-1 ml-6">{approval.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

export const PortalInlineComment = memo(PortalInlineCommentComponent);
