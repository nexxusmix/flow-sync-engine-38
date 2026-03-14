/**
 * PortalInlineComment - Comentário inline expandível abaixo do material
 * 
 * Atualizado com campos de timecode, screenshot e prioridade
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
  Clock,
  Play,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PortalComment, PortalApproval } from "@/hooks/useClientPortalEnhanced";

type Priority = 'normal' | 'high' | 'urgent';

interface PortalInlineCommentProps {
  materialId: string;
  materialTitle: string;
  comments: PortalComment[];
  approval?: PortalApproval;
  currentTimecode?: string;
  screenshotUrl?: string;
  frameTimestampMs?: number;
  onAddComment: (data: { 
    authorName: string; 
    authorEmail?: string; 
    content: string;
    timecode?: string;
    priority?: Priority;
    frameTimestampMs?: number;
    screenshotUrl?: string;
  }) => void;
  onApprove: (data: { approvedByName: string; approvedByEmail?: string; notes?: string }) => void;
  onRequestRevision: (data: { 
    authorName: string; 
    authorEmail?: string; 
    content: string;
    timecode?: string;
    priority?: Priority;
    frameTimestampMs?: number;
    screenshotUrl?: string;
  }) => void;
  isAddingComment: boolean;
  isApproving: boolean;
  isRequestingRevision: boolean;
  onClearTimecode?: () => void;
}

const PRIORITIES: { id: Priority; label: string; color: string }[] = [
  { id: 'normal', label: 'Normal', color: 'bg-muted-foreground' },
  { id: 'high', label: 'Alta', color: 'bg-muted-foreground' },
  { id: 'urgent', label: 'Urgente', color: 'bg-destructive' },
];

function PortalInlineCommentComponent({
  materialId,
  materialTitle,
  comments,
  approval,
  currentTimecode,
  screenshotUrl,
  frameTimestampMs,
  onAddComment,
  onApprove,
  onRequestRevision,
  isAddingComment,
  isApproving,
  isRequestingRevision,
  onClearTimecode,
}: PortalInlineCommentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [comment, setComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [mode, setMode] = useState<'comment' | 'approve' | 'revision'>('comment');
  const [priority, setPriority] = useState<Priority>('normal');

  const isApproved = !!approval;
  const isPending = isAddingComment || isApproving || isRequestingRevision;
  const hasTimecode = !!currentTimecode;
  const hasScreenshot = !!screenshotUrl;

  const handleSubmit = () => {
    if (!comment.trim() || !authorName.trim()) return;

    const baseData = {
      authorName,
      authorEmail: authorEmail || undefined,
      content: comment,
      timecode: currentTimecode,
      priority: mode === 'revision' ? priority : undefined,
      frameTimestampMs,
      screenshotUrl,
    };

    if (mode === 'approve') {
      onApprove({
        approvedByName: authorName,
        approvedByEmail: authorEmail || undefined,
        notes: comment,
      });
    } else if (mode === 'revision') {
      onRequestRevision(baseData);
    } else {
      onAddComment(baseData);
    }

    setComment("");
    setIsExpanded(false);
    setPriority('normal');
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
          {/* Timecode & Screenshot Indicator */}
          {(hasTimecode || hasScreenshot) && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#111] border border-[#1a1a1a]">
              {hasScreenshot && (
                <div className="w-16 h-10 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={screenshotUrl}
                    alt="Frame marcado"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                {hasTimecode && (
                  <div className="flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm text-white font-mono">{currentTimecode}</span>
                  </div>
                )}
                {hasScreenshot && (
                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <Image className="w-3 h-3" />
                    Anotação visual anexada
                  </div>
                )}
              </div>
              {onClearTimecode && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-gray-500"
                  onClick={onClearTimecode}
                >
                  Limpar
                </Button>
              )}
            </div>
          )}

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

          {/* Priority Selector (only for revision mode) */}
          {mode === 'revision' && (
            <div className="space-y-2">
              <label className="text-xs text-gray-500">Prioridade</label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPriority(p.id)}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all",
                      priority === p.id
                        ? `${p.color} text-white`
                        : "bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a]"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

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
              {!isApproved && (
                <>
                  <Button
                    variant={mode === 'approve' ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      "h-8 text-xs",
                      mode === 'approve' && "bg-primary/20 text-primary"
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
                      mode === 'revision' && "bg-muted text-muted-foreground"
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
                setPriority('normal');
              }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className={cn(
                "h-8 text-xs",
                mode === 'approve' && "bg-emerald-500 hover:bg-emerald-600",
                mode === 'revision' && priority === 'urgent' 
                  ? "bg-red-500 hover:bg-red-600"
                  : mode === 'revision' && priority === 'high'
                    ? "bg-amber-500 hover:bg-amber-600"
                    : mode === 'revision' && "bg-cyan-500 hover:bg-cyan-600"
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
                          {c.timecode && (
                            <Badge variant="outline" className="text-[10px] font-mono">
                              <Play className="w-2.5 h-2.5 mr-0.5" />
                              {c.timecode}
                            </Badge>
                          )}
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
