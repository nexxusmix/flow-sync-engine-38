/**
 * PipelineContentCard — Card holográfico para item de conteúdo no pipeline
 */
import { useState } from "react";
import { MkCard, MkStatusBadge } from "@/components/marketing-hub/mk-ui";
import { ContentItem, CONTENT_ITEM_STAGES, ContentItemStatus, CONTENT_CHANNELS } from "@/types/marketing";
import { MoreVertical, Trash2, Sparkles, Loader2, Calendar, Film, Image as ImageIcon, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { PipelineAIResultDialog, type AIGeneratedContent } from "./PipelineAIResultDialog";

const stageVariant: Record<string, "blue" | "amber" | "emerald" | "purple" | "red" | "slate" | "cyan"> = {
  briefing: "slate",
  writing: "blue",
  recording: "purple",
  editing: "amber",
  review: "amber",
  approved: "emerald",
  scheduled: "cyan",
  published: "blue",
  archived: "slate",
};

const FORMAT_ICONS: Record<string, typeof Film> = {
  reel: Film,
  post: ImageIcon,
  carousel: FileText,
  story: ImageIcon,
};

interface PipelineContentCardProps {
  item: ContentItem;
  onStatusChange: (id: string, status: ContentItemStatus) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export function PipelineContentCard({ item, onStatusChange, onDelete, onRefresh, onClick, draggable, onDragStart, onDragEnd }: PipelineContentCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<AIGeneratedContent | null>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

  const stage = CONTENT_ITEM_STAGES.find(s => s.type === item.status);
  const channel = CONTENT_CHANNELS.find(c => c.type === item.channel);
  const FormatIcon = FORMAT_ICONS[item.format || ""] || FileText;

  const handleGenerateAI = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content-ai", {
        body: {
          contentItemId: item.id,
          title: item.title,
          hook: item.hook,
          channel: item.channel,
          format: item.format,
          pillar: item.pillar,
          notes: item.notes,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiResult(data.generated);
      setAiDialogOpen(true);
      toast.success("Conteúdo gerado e salvo!");
      onRefresh();
    } catch (err: any) {
      console.error("AI generation error:", err);
      toast.error(err.message || "Erro ao gerar conteúdo com IA");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <MkCard hover className="flex flex-col gap-3 group cursor-pointer" onClick={onClick} draggable={draggable} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        {/* Header: badge + actions */}
        <div className="flex items-center justify-between">
          <MkStatusBadge label={stage?.name || item.status} variant={stageVariant[item.status] || "slate"} />
          <div className="flex items-center gap-1.5">
            {channel && (
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{channel.name}</span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 text-muted-foreground/40 hover:text-foreground/70 transition-colors rounded opacity-0 group-hover:opacity-100">
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                {CONTENT_ITEM_STAGES.map(s => (
                  <DropdownMenuItem key={s.type} onClick={() => { onStatusChange(item.id, s.type); toast.success(`Movido para ${s.name}`); }}
                    className="text-xs text-muted-foreground hover:text-foreground">
                    {s.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={handleGenerateAI} disabled={generating} className="text-xs">
                  {generating ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Sparkles className="w-3 h-3 mr-2 text-primary" />}
                  {generating ? "Gerando..." : "Gerar com IA"}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive text-xs" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="w-3 h-3 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-md bg-muted/30 border border-border/30 flex items-center justify-center shrink-0 mt-0.5">
            <FormatIcon className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[13px] font-medium text-foreground/80 leading-snug line-clamp-2 group-hover:text-foreground transition-colors">
              {item.title}
            </h4>
            {item.hook && (
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 italic">"{item.hook}"</p>
            )}
          </div>
        </div>

        {/* AI tag */}
        {item.script && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary/5 border border-primary/10 w-fit">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[9px] text-primary uppercase tracking-wider">Script gerado</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-auto pt-2.5 border-t border-border/30">
          {item.due_at && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(item.due_at), "dd MMM", { locale: ptBR })}
            </span>
          )}
          {item.pillar && (
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60">{item.pillar}</span>
          )}
          {item.owner_initials && (
            <span className="ml-auto w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-[8px] font-medium">
              {item.owner_initials}
            </span>
          )}
        </div>
      </MkCard>

      <PipelineAIResultDialog open={aiDialogOpen} onOpenChange={setAiDialogOpen} data={aiResult} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir Conteúdo</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tem certeza que deseja excluir "{item.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted/30 border-border text-muted-foreground">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive/20 border border-destructive/30 text-destructive hover:bg-destructive/30"
              onClick={() => { onDelete(item.id); toast.success("Conteúdo excluído"); }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
