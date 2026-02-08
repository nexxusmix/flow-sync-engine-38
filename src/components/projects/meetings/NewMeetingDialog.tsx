/**
 * NewMeetingDialog - Create new interaction/meeting dialog
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateInteraction } from "@/hooks/useProjectInteractions";
import type { InteractionType, InteractionSource } from "@/types/meetings";
import { Loader2, Video, FileText, MessageSquare, Users } from "lucide-react";

interface NewMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

const typeOptions: { value: InteractionType; label: string; icon: React.ElementType }[] = [
  { value: 'reuniao', label: 'Reunião', icon: Video },
  { value: 'pedido_cliente', label: 'Pedido do Cliente', icon: FileText },
  { value: 'mensagem_cliente', label: 'Mensagem do Cliente', icon: MessageSquare },
  { value: 'alinhamento_interno', label: 'Alinhamento Interno', icon: Users },
];

const sourceOptions: { value: InteractionSource; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'meet', label: 'Google Meet' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'email', label: 'Email' },
  { value: 'outro', label: 'Outro' },
];

export function NewMeetingDialog({ open, onOpenChange, projectId }: NewMeetingDialogProps) {
  const [type, setType] = useState<InteractionType>('reuniao');
  const [title, setTitle] = useState('');
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 16));
  const [source, setSource] = useState<InteractionSource | ''>('');
  const [participants, setParticipants] = useState('');
  const [transcript, setTranscript] = useState('');
  const [notesInternal, setNotesInternal] = useState('');

  const createInteraction = useCreateInteraction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createInteraction.mutateAsync({
      project_id: projectId,
      type,
      title,
      occurred_at: new Date(occurredAt).toISOString(),
      source: source || undefined,
      participants: participants || undefined,
      transcript: transcript || undefined,
      notes_internal: notesInternal || undefined,
    });

    // Reset form
    setTitle('');
    setTranscript('');
    setNotesInternal('');
    setParticipants('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Interação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection */}
          <div className="grid grid-cols-4 gap-2">
            {typeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  className={`p-3 border rounded-lg text-center transition-all ${
                    type === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${
                    type === option.value ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <span className="text-xs font-medium">
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Alinhamento de briefing com cliente"
              required
            />
          </div>

          {/* Date/Time and Source */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="occurred_at">Data/Hora *</Label>
              <Input
                id="occurred_at"
                type="datetime-local"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Origem</Label>
              <Select value={source} onValueChange={(v) => setSource(v as InteractionSource)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {sourceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <Label htmlFor="participants">Participantes</Label>
            <Input
              id="participants"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="Ex: João (cliente), Maria (produção)"
            />
          </div>

          {/* Transcript */}
          <div className="space-y-2">
            <Label htmlFor="transcript">Transcrição / Conteúdo da Mensagem</Label>
            <Textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Cole aqui a transcrição da reunião, mensagem do WhatsApp, email, etc."
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              Adicione o conteúdo para depois gerar um resumo automático com IA.
            </p>
          </div>

          {/* Internal Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes_internal">Notas Internas (apenas equipe)</Label>
            <Textarea
              id="notes_internal"
              value={notesInternal}
              onChange={(e) => setNotesInternal(e.target.value)}
              placeholder="Observações que não aparecerão para o cliente..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createInteraction.isPending || !title}>
              {createInteraction.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Salvar Interação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
