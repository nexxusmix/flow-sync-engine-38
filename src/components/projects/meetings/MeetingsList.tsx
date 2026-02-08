/**
 * MeetingsList - Timeline list of interactions
 */

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ProjectInteraction } from "@/types/meetings";
import {
  Users,
  MessageSquare,
  Phone,
  FileText,
  Video,
  Mail,
  Globe,
  Sparkles,
} from "lucide-react";

interface MeetingsListProps {
  interactions: ProjectInteraction[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const typeConfig = {
  reuniao: { icon: Video, label: 'Reunião', color: 'text-primary' },
  pedido_cliente: { icon: FileText, label: 'Pedido', color: 'text-amber-500' },
  mensagem_cliente: { icon: MessageSquare, label: 'Mensagem', color: 'text-emerald-500' },
  alinhamento_interno: { icon: Users, label: 'Alinhamento', color: 'text-violet-500' },
};

const sourceConfig: Record<string, { icon: React.ElementType; label: string }> = {
  whatsapp: { icon: MessageSquare, label: 'WhatsApp' },
  meet: { icon: Video, label: 'Meet' },
  zoom: { icon: Video, label: 'Zoom' },
  presencial: { icon: Users, label: 'Presencial' },
  email: { icon: Mail, label: 'Email' },
  outro: { icon: Globe, label: 'Outro' },
};

export function MeetingsList({ interactions, selectedId, onSelect }: MeetingsListProps) {
  if (interactions.length === 0) {
    return (
      <div className="bg-card border border-border p-8 text-center">
        <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Nenhuma interação registrada
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {interactions.map((interaction) => {
        const typeInfo = typeConfig[interaction.type];
        const TypeIcon = typeInfo.icon;
        const sourceInfo = interaction.source ? sourceConfig[interaction.source] : null;
        const hasSummary = !!interaction.summary;

        return (
          <button
            key={interaction.id}
            onClick={() => onSelect(interaction.id)}
            className={cn(
              "w-full text-left bg-card border p-4 transition-all hover:border-primary/50",
              selectedId === interaction.id
                ? "border-primary bg-primary/5"
                : "border-border"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn("p-2 rounded-lg bg-muted/50", typeInfo.color)}>
                <TypeIcon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded",
                    typeInfo.color,
                    "bg-current/10"
                  )}>
                    {typeInfo.label}
                  </span>
                  {hasSummary && (
                    <Sparkles className="w-3 h-3 text-primary" />
                  )}
                </div>

                <h3 className="font-medium text-sm text-foreground truncate">
                  {interaction.title}
                </h3>

                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>
                    {format(new Date(interaction.occurred_at), "dd MMM, HH:mm", { locale: ptBR })}
                  </span>
                  {sourceInfo && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <sourceInfo.icon className="w-3 h-3" />
                        {sourceInfo.label}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
