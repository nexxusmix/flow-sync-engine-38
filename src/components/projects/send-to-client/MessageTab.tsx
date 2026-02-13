import { useState } from 'react';
import { ProjectWithStages } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Sparkles, Copy, Wand2, MinusCircle, Heart, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useClientMessages } from '@/hooks/useClientMessages';
import { toast } from 'sonner';
import { PROJECT_STAGES } from '@/data/projectTemplates';

const goals = [
  { value: 'update', label: 'Atualizar andamento' },
  { value: 'send_material', label: 'Enviar material' },
  { value: 'request_material', label: 'Cobrar material' },
  { value: 'confirm_deadline', label: 'Confirmar prazo' },
  { value: 'overview', label: 'Panorama geral' },
  { value: 'schedule', label: 'Agendar' },
  { value: 'reply', label: 'Responder cliente' },
];

interface MessageTabProps {
  project: ProjectWithStages;
}

export function MessageTab({ project }: MessageTabProps) {
  const [goal, setGoal] = useState('update');
  const [useEmoji, setUseEmoji] = useState(true);
  const [lengthValue, setLengthValue] = useState([50]);
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [variants, setVariants] = useState<{ short: string; normal: string; long: string } | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<'short' | 'normal' | 'long'>('normal');
  const { logQuickCopy } = useClientMessages(project.id);

  const stageInfo = PROJECT_STAGES.find(s => s.type === project.stage_current);

  const generateMessage = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-client-message', {
        body: {
          goal: goals.find(g => g.value === goal)?.label || goal,
          useEmoji,
          length: lengthValue[0] < 33 ? 'curta' : lengthValue[0] < 66 ? 'normal' : 'completa',
          projectContext: {
            projectName: project.name,
            clientName: project.client_name,
            currentStage: stageInfo?.name || project.stage_current,
            dueDate: project.due_date,
            healthScore: project.health_score,
            status: project.status,
            contractValue: project.contract_value,
          },
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setVariants(data.variants);
      setContent(data.variants.normal || data.variants.short || '');
      setSelectedVariant('normal');
    } catch (err) {
      toast.error('Erro ao gerar mensagem');
      console.error(err);
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
    if (!content.trim()) {
      toast.error('Nenhum texto para copiar');
      return;
    }
    await navigator.clipboard.writeText(content);
    logQuickCopy.mutate({
      content,
      channel: 'copy',
      ai_goal: goal,
    });
    toast.success('Texto copiado! ✅');
  };

  const refineMessage = async (instruction: string) => {
    if (!content.trim()) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-client-message', {
        body: {
          goal: instruction,
          useEmoji,
          length: 'normal',
          projectContext: {
            projectName: project.name,
            clientName: project.client_name,
            currentStage: stageInfo?.name || project.stage_current,
            dueDate: project.due_date,
            existingMessage: content,
          },
        },
      });
      if (error) throw error;
      if (data?.variants?.normal) {
        setContent(data.variants.normal);
      }
    } catch {
      toast.error('Erro ao refinar');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Objetivo</Label>
          <Select value={goal} onValueChange={setGoal}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {goals.map(g => (
                <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Switch id="emoji" checked={useEmoji} onCheckedChange={setUseEmoji} />
            <Label htmlFor="emoji" className="text-xs">Emojis</Label>
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Curto ↔ Completo</Label>
            <Slider value={lengthValue} onValueChange={setLengthValue} max={100} step={1} className="mt-1" />
          </div>
        </div>
      </div>

      {/* Generate button */}
      <Button onClick={generateMessage} disabled={isGenerating} className="w-full gap-2">
        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {isGenerating ? 'Gerando...' : 'Gerar com IA'}
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
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Sua mensagem aparecerá aqui... Ou digite direto."
        rows={8}
        className="font-sans text-sm"
      />

      {/* Refine buttons */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => refineMessage('Reescreva mais curto e direto, estilo WhatsApp')} disabled={isGenerating || !content} className="text-xs gap-1">
          <MinusCircle className="w-3 h-3" /> Mais curto
        </Button>
        <Button size="sm" variant="outline" onClick={() => refineMessage('Reescreva mais humano e natural, como se estivesse falando pessoalmente')} disabled={isGenerating || !content} className="text-xs gap-1">
          <Heart className="w-3 h-3" /> Mais humano
        </Button>
        <Button size="sm" variant="outline" onClick={() => refineMessage('Reescreva no formato típico de WhatsApp: frases curtas, quebras de linha, informal profissional')} disabled={isGenerating || !content} className="text-xs gap-1">
          <Wand2 className="w-3 h-3" /> WhatsApp style
        </Button>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-border/50">
        <Button onClick={handleCopy} className="flex-1 gap-2">
          <Copy className="w-4 h-4" /> Copiar Texto
        </Button>
      </div>
    </div>
  );
}
