import { useState } from 'react';
import { ProjectWithStages } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useClientMessages } from '@/hooks/useClientMessages';
import { PROJECT_STAGES } from '@/data/projectTemplates';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PanoramaTabProps {
  project: ProjectWithStages;
}

export function PanoramaTab({ project }: PanoramaTabProps) {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [variants, setVariants] = useState<{ short: string; normal: string; long: string } | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<'short' | 'normal' | 'long'>('normal');
  const { logQuickCopy } = useClientMessages(project.id);

  const stageInfo = PROJECT_STAGES.find(s => s.type === project.stage_current);
  const currentStageIdx = PROJECT_STAGES.findIndex(s => s.type === project.stage_current);
  const nextStages = PROJECT_STAGES.slice(currentStageIdx + 1, currentStageIdx + 3);

  const generatePanorama = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-client-message', {
        body: {
          goal: 'Gerar panorama completo do projeto para enviar ao cliente via WhatsApp. Inclua: panorama geral (2-4 linhas), etapa atual e próximas 2 etapas, entregas, prazos, pendências do cliente e próximos passos.',
          useEmoji: true,
          length: 'completa',
          projectContext: {
            projectName: project.name,
            clientName: project.client_name,
            currentStage: stageInfo?.name || project.stage_current,
            nextStages: nextStages.map(s => s.name),
            dueDate: project.due_date,
            healthScore: project.health_score,
            status: project.status,
            contractValue: project.contract_value,
            hasPaymentBlock: (project as any).has_payment_block,
          },
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setVariants(data.variants);
      setContent(data.variants.normal || '');
      setSelectedVariant('normal');
    } catch {
      toast.error('Erro ao gerar panorama');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectVariant = (v: 'short' | 'normal' | 'long') => {
    if (variants) {
      setSelectedVariant(v);
      setContent(variants[v] || '');
    }
  };

  const handleCopy = async () => {
    if (!content.trim()) return;
    await navigator.clipboard.writeText(content);
    logQuickCopy.mutate({
      content,
      channel: 'copy',
      ai_goal: 'overview',
    });
    toast.success('Panorama copiado! ✅');
  };

  // Static panorama for quick copy
  const staticPanorama = [
    `Resumo do projeto: ${project.name}`,
    `Cliente: ${project.client_name}`,
    `Etapa atual: ${stageInfo?.name || project.stage_current}`,
    nextStages.length > 0 ? `Próximas: ${nextStages.map(s => s.name).join(', ')}` : null,
    project.due_date ? `Prazo: ${format(new Date(project.due_date), 'dd/MM/yyyy', { locale: ptBR })}` : null,
    `Saúde: ${project.health_score || 0}%`,
    `Status: ${project.status}`,
  ].filter(Boolean).join('\n');

  return (
    <div className="space-y-4">
      {/* Quick info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-[10px] text-muted-foreground uppercase">Etapa atual</p>
          <p className="text-sm font-medium mt-0.5">{stageInfo?.name || project.stage_current}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-[10px] text-muted-foreground uppercase">Prazo</p>
          <p className="text-sm font-medium mt-0.5">
            {project.due_date ? format(new Date(project.due_date), 'dd MMM yyyy', { locale: ptBR }) : 'Não definido'}
          </p>
        </div>
      </div>

      {/* Generate panorama */}
      <Button onClick={generatePanorama} disabled={isGenerating} className="w-full gap-2">
        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {isGenerating ? 'Gerando...' : 'Gerar panorama no estilo WhatsApp'}
      </Button>

      {/* Variant selector */}
      {variants && (
        <div className="flex gap-2">
          {(['short', 'normal', 'long'] as const).map(v => (
            <Button
              key={v}
              size="sm"
              variant={selectedVariant === v ? 'default' : 'outline'}
              onClick={() => selectVariant(v)}
              className="text-xs flex-1"
            >
              {v === 'short' ? 'Curta' : v === 'normal' ? 'Normal' : 'Completa'}
            </Button>
          ))}
        </div>
      )}

      {/* Editor */}
      <Textarea
        value={content || staticPanorama}
        onChange={e => setContent(e.target.value)}
        rows={10}
        className="font-sans text-sm"
      />

      {/* Copy */}
      <Button onClick={handleCopy} className="w-full gap-2">
        <Copy className="w-4 h-4" /> Copiar Panorama
      </Button>
    </div>
  );
}
