import { useState, useRef, useEffect } from "react";
import { useTaskComments } from "@/hooks/useTaskComments";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Send, Trash2, MessageCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TaskCommentsPanelProps {
  taskId: string;
}

export function TaskCommentsPanel({ taskId }: TaskCommentsPanelProps) {
  const { comments, isLoading, addComment, deleteComment, isAdding } = useTaskComments(taskId);
  const [isOpen, setIsOpen] = useState(true);
  const [newComment, setNewComment] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments.length, isOpen]);

  const handleSend = () => {
    if (!newComment.trim()) return;
    addComment(newComment.trim());
    setNewComment('');
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-1.5 group">
        <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground">
          Comentários
          {comments.length > 0 && (
            <span className="text-muted-foreground font-normal ml-1">({comments.length})</span>
          )}
        </span>
        <div className="flex-1" />
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-2 mt-2">
        {/* Comments list */}
        <div
          ref={scrollRef}
          className={cn(
            "space-y-3 overflow-y-auto",
            comments.length > 3 && "max-h-[240px]"
          )}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 font-light text-center py-3">
              Nenhum comentário ainda
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-2 group/comment">
                <Avatar className="w-6 h-6 flex-shrink-0 mt-0.5">
                  <AvatarImage src={comment.author_avatar || undefined} />
                  <AvatarFallback className="text-[9px] bg-muted">
                    {getInitials(comment.author_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-foreground">
                      {comment.author_name || 'Usuário'}
                    </span>
                    <span className="text-[9px] text-muted-foreground/50 font-light">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 opacity-0 group-hover/comment:opacity-100 transition-opacity ml-auto text-destructive"
                      onClick={() => deleteComment(comment.id)}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </Button>
                  </div>
                  <p className="text-xs text-foreground/80 font-light mt-0.5 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="flex items-center gap-1.5 pt-1">
          <Input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Escrever comentário..."
            className="h-8 text-xs flex-1"
            disabled={isAdding}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 flex-shrink-0"
            onClick={handleSend}
            disabled={!newComment.trim() || isAdding}
          >
            {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
