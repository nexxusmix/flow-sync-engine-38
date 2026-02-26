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
}

export function PipelineContentCard({ item, onStatusChange, onDelete, onRefresh }: PipelineContentCardProps) {
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
      <MkCard hover className="flex flex-col gap-3 group">
        {/* Header: badge + actions */}
        <div className="flex items-center justify-between">
          <MkStatusBadge label={stage?.name || item.status} variant={stageVariant[item.status] || "slate"} />
          <div className="flex items-center gap-1.5">
            {channel && (
              <span className="text-[9px] text-white/25 uppercase tracking-wider">{channel.name}</span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 text-white/15 hover:text-white/50 transition-colors rounded opacity-0 group-hover:opacity-100">
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#111114] border-white/10">
                {CONTENT_ITEM_STAGES.map(s => (
                  <DropdownMenuItem key={s.type} onClick={() => { onStatusChange(item.id, s.type); toast.success(`Movido para ${s.name}`); }}
                    className="text-xs text-white/60 hover:text-white">
                    {s.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={handleGenerateAI} disabled={generating} className="text-xs">
                  {generating ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Sparkles className="w-3 h-3 mr-2 text-[hsl(195,100%,50%)]" />}
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
          <div className="w-7 h-7 rounded-md bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
            <FormatIcon className="w-3.5 h-3.5 text-white/25" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[13px] font-medium text-white/80 leading-snug line-clamp-2 group-hover:text-white transition-colors">
              {item.title}
            </h4>
            {item.hook && (
              <p className="text-[10px] text-white/25 mt-0.5 line-clamp-1 italic">"{item.hook}"</p>
            )}
          </div>
        </div>

        {/* AI tag */}
        {item.script && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[rgba(0,156,202,0.06)] border border-[rgba(0,156,202,0.12)] w-fit">
            <Sparkles className="w-3 h-3 text-[hsl(195,100%,50%)]" />
            <span className="text-[9px] text-[hsl(195,100%,55%)] uppercase tracking-wider">Script gerado</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 text-[10px] text-white/20 mt-auto pt-2.5 border-t border-white/[0.04]">
          {item.due_at && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(item.due_at), "dd MMM", { locale: ptBR })}
            </span>
          )}
          {item.pillar && (
            <span className="text-[9px] uppercase tracking-wider text-white/15">{item.pillar}</span>
          )}
          {item.owner_initials && (
            <span className="ml-auto w-5 h-5 rounded-full bg-[rgba(0,156,202,0.1)] border border-[rgba(0,156,202,0.2)] text-[hsl(195,100%,60%)] flex items-center justify-center text-[8px] font-medium">
              {item.owner_initials}
            </span>
          )}
        </div>
      </MkCard>

      <PipelineAIResultDialog open={aiDialogOpen} onOpenChange={setAiDialogOpen} data={aiResult} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-[#0a0a0c] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white/90">Excluir Conteúdo</AlertDialogTitle>
            <AlertDialogDescription className="text-white/40">
              Tem certeza que deseja excluir "{item.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white/60">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
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
