import { ProjectWithStages } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { PROJECT_STAGES } from '@/data/projectTemplates';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useClientMessages } from '@/hooks/useClientMessages';

interface ContextSidebarProps {
  project: ProjectWithStages;
}

export function ContextSidebar({ project }: ContextSidebarProps) {
  const stageInfo = PROJECT_STAGES.find(s => s.type === project.stage_current);
  const currentIdx = PROJECT_STAGES.findIndex(s => s.type === project.stage_current);
  const { logQuickCopy } = useClientMessages(project.id);

  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    logQuickCopy.mutate({ content: text, channel: 'copy', ai_goal: label });
    toast.success(`${label} copiado!`);
  };

  const summaryText = `Projeto: ${project.name}\nCliente: ${project.client_name}\nStatus: ${project.status}\nEtapa: ${stageInfo?.name || project.stage_current}${project.due_date ? `\nPrazo: ${format(new Date(project.due_date), 'dd/MM/yyyy', { locale: ptBR })}` : ''}`;

  const stagesText = PROJECT_STAGES.map((s, i) => {
    const marker = i < currentIdx ? '✅' : i === currentIdx ? '🔵' : '⬜';
    return `${marker} ${s.name}`;
  }).join('\n');

  const deadlineText = project.due_date
    ? `Prazo: ${format(new Date(project.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
    : 'Prazo não definido';

  const fullPanorama = `${summaryText}\n\n--- Etapas ---\n${stagesText}\n\n${deadlineText}\n\nSaúde: ${project.health_score || 0}%`;

  const items = [
    { label: 'Resumo do projeto', text: summaryText },
    { label: 'Status das etapas', text: stagesText },
    { label: 'Entregas e prazos', text: deadlineText },
    { label: 'Panorama completo', text: fullPanorama },
  ];

  return (
    <div className="p-3 space-y-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Contexto rápido</p>
      {items.map(item => (
        <Button
          key={item.label}
          variant="ghost"
          size="sm"
          onClick={() => copyText(item.text, item.label)}
          className="w-full justify-start gap-2 h-auto py-2 text-xs text-left"
        >
          <Copy className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{item.label}</span>
        </Button>
      ))}
    </div>
  );
}
