/**
 * MeetingDetail - Full detail view of a single interaction
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  useUpdateInteraction,
  useDeleteInteraction,
  useGenerateInteractionSummary,
  useAddInteractionAsset,
} from "@/hooks/useProjectInteractions";
import type { ProjectInteraction } from "@/types/meetings";
import {
  X,
  Calendar,
  Users,
  Video,
  MessageSquare,
  FileText,
  Sparkles,
  Loader2,
  Trash2,
  Paperclip,
  Link,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

interface MeetingDetailProps {
  interaction: ProjectInteraction;
  projectId: string;
  onClose: () => void;
}

const typeConfig = {
  reuniao: { icon: Video, label: 'Reunião', color: 'text-primary' },
  pedido_cliente: { icon: FileText, label: 'Pedido do Cliente', color: 'text-muted-foreground' },
  mensagem_cliente: { icon: MessageSquare, label: 'Mensagem do Cliente', color: 'text-primary' },
  alinhamento_interno: { icon: Users, label: 'Alinhamento Interno', color: 'text-primary/70' },
};

export function MeetingDetail({ interaction, projectId, onClose }: MeetingDetailProps) {
  const [createTasks, setCreateTasks] = useState(true);
  
  const updateInteraction = useUpdateInteraction();
  const deleteInteraction = useDeleteInteraction();
  const generateSummary = useGenerateInteractionSummary();
  const addAsset = useAddInteractionAsset();

  const typeInfo = typeConfig[interaction.type];
  const TypeIcon = typeInfo.icon;
  const summary = interaction.summary;

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir esta interação?')) {
      deleteInteraction.mutate({ id: interaction.id, projectId });
      onClose();
    }
  };

  const handleGenerateSummary = () => {
    generateSummary.mutate({
      interactionId: interaction.id,
      projectId,
      createTasks,
    });
  };

  const handleAddLink = () => {
    const url = prompt('Cole o link:');
    if (url) {
      addAsset.mutate({
        interactionId: interaction.id,
        projectId,
        type: 'link',
        url,
        filename: new URL(url).hostname,
      });
    }
  };

  return (
    <div className="bg-card border border-border">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={cn("p-2.5 rounded-lg bg-muted/50", typeInfo.color)}>
              <TypeIcon className="w-5 h-5" />
            </div>
            <div>
              <Badge variant="outline" className={cn("text-[9px] mb-2", typeInfo.color)}>
                {typeInfo.label}
              </Badge>
              <h2 className="text-lg font-semibold text-foreground">
                {interaction.title}
              </h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(interaction.occurred_at), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                </span>
                {interaction.participants && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {interaction.participants}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Transcript */}
        {interaction.transcript && (
          <div>
            <span className="text-primary text-[10px] uppercase tracking-[0.3em] font-bold mb-3 block">
              Transcrição / Conteúdo
            </span>
            <div className="bg-muted/30 border border-border p-4 rounded-lg max-h-[200px] overflow-y-auto">
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {interaction.transcript}
              </p>
            </div>
          </div>
        )}

        {/* Internal Notes */}
        {interaction.notes_internal && (
          <div>
            <span className="text-muted-foreground text-[10px] uppercase tracking-[0.3em] font-bold mb-3 block">
              Notas Internas
            </span>
            <div className="bg-muted/20 border border-dashed border-border p-4 rounded-lg">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {interaction.notes_internal}
              </p>
            </div>
          </div>
        )}

        {/* Assets */}
        {(interaction.assets?.length || 0) > 0 && (
          <div>
            <span className="text-muted-foreground text-[10px] uppercase tracking-[0.3em] font-bold mb-3 block">
              Anexos
            </span>
            <div className="flex flex-wrap gap-2">
              {interaction.assets?.map((asset) => (
                <a
                  key={asset.id}
                  href={asset.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-muted/30 border border-border rounded-lg hover:border-primary/50 transition-colors"
                >
                  {asset.type === 'link' ? (
                    <Link className="w-4 h-4 text-primary" />
                  ) : (
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm text-foreground truncate max-w-[150px]">
                    {asset.filename || 'Anexo'}
                  </span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Add Asset Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAddLink} className="gap-2">
            <Link className="w-4 h-4" />
            Adicionar Link
          </Button>
        </div>

        <Separator />

        {/* AI Summary Section */}
        {summary ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-primary text-[10px] uppercase tracking-[0.3em] font-bold">
                Resumo IA
              </span>
              <span className="text-[9px] text-muted-foreground">
                Gerado em {format(new Date(summary.generated_at), "dd/MM/yyyy HH:mm")}
              </span>
            </div>

            {/* Summary Bullets */}
            {summary.summary_bullets.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-foreground mb-2">Principais Pontos</h4>
                <ul className="space-y-1">
                  {summary.summary_bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary">•</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Decisions */}
            {summary.decisions.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-foreground mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  Decisões
                </h4>
                <ul className="space-y-1">
                  {summary.decisions.map((decision, i) => (
                    <li key={i} className="text-sm text-muted-foreground pl-5">
                      {decision}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {summary.action_items.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-foreground mb-2 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Ações / Próximos Passos
                </h4>
                <ul className="space-y-1">
                  {summary.action_items.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground pl-5">
                      {item.title}
                      {item.assignee && <span className="text-primary"> → {item.assignee}</span>}
                      {item.due_date && <span className="text-amber-500"> (até {item.due_date})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risks */}
            {summary.risks.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-foreground mb-2 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                  Riscos / Pendências
                </h4>
                <ul className="space-y-1">
                  {summary.risks.map((risk, i) => (
                    <li key={i} className="text-sm text-muted-foreground pl-5">
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="bg-muted/20 border border-dashed border-border p-6 text-center">
            <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <h4 className="font-medium text-foreground mb-1">Gerar Resumo com IA</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Extraia automaticamente decisões, ações e prazos desta interação.
            </p>

            <div className="flex items-center justify-center gap-2 mb-4">
              <Switch
                id="create-tasks"
                checked={createTasks}
                onCheckedChange={setCreateTasks}
              />
              <Label htmlFor="create-tasks" className="text-sm text-muted-foreground">
                Criar tarefas a partir do resumo
              </Label>
            </div>

            <Button
              onClick={handleGenerateSummary}
              disabled={generateSummary.isPending || !interaction.transcript}
              className="gap-2"
            >
              {generateSummary.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Gerar Resumo
            </Button>

            {!interaction.transcript && (
              <p className="text-xs text-muted-foreground mt-2">
                Adicione uma transcrição para gerar o resumo.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
