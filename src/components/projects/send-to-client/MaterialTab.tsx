import { useState } from 'react';
import { ProjectWithStages } from '@/hooks/useProjects';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Copy, Sparkles, ExternalLink, Loader2, Video, Image, FileText } from 'lucide-react';
import { useClientMessages } from '@/hooks/useClientMessages';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MaterialTabProps {
  project: ProjectWithStages;
}

export function MaterialTab({ project }: MaterialTabProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [checklist, setChecklist] = useState({
    approval: true,
    feedback: false,
    observations: false,
    references: false,
    nextStep: true,
  });
  const { logQuickCopy } = useClientMessages(project.id);

  // Fetch materials from portal_deliverables
  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['project-materials', project.id],
    queryFn: async () => {
      // Get portal link first
      const { data: links } = await supabase
        .from('portal_links')
        .select('id')
        .eq('project_id', project.id);

      if (!links?.length) return [];

      const { data } = await supabase
        .from('portal_deliverables')
        .select('*')
        .in('portal_link_id', links.map(l => l.id))
        .order('created_at', { ascending: false });

      return data || [];
    },
  });

  const getTypeIcon = (type: string | null) => {
    if (type?.includes('video') || type?.includes('youtube')) return Video;
    if (type?.includes('image') || type?.includes('photo')) return Image;
    return FileText;
  };

  const getMaterialLink = (material: any) => {
    if (material.youtube_url) return material.youtube_url;
    if (material.external_url) return material.external_url;
    if (material.file_url) return material.file_url;
    return null;
  };

  const generateMaterialMessage = async () => {
    if (!selectedMaterial) return;
    setIsGenerating(true);
    try {
      const asks: string[] = [];
      if (checklist.approval) asks.push('aprovação');
      if (checklist.feedback) asks.push('feedback');
      if (checklist.observations) asks.push('observações específicas');
      if (checklist.references) asks.push('referências');
      if (checklist.nextStep) asks.push('ok para próxima etapa');

      const { data, error } = await supabase.functions.invoke('generate-client-message', {
        body: {
          goal: 'Enviar material para aprovação/feedback do cliente',
          useEmoji: true,
          length: 'normal',
          projectContext: {
            projectName: project.name,
            clientName: project.client_name,
            dueDate: project.due_date,
          },
          materialContext: {
            title: selectedMaterial.title,
            type: selectedMaterial.type,
            version: selectedMaterial.current_version || 1,
            link: getMaterialLink(selectedMaterial),
            status: selectedMaterial.status,
            whatToAsk: asks,
          },
        },
      });

      if (error) throw error;
      setMessage(data?.variants?.normal || data?.variants?.short || '');
    } catch {
      toast.error('Erro ao gerar mensagem');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!message.trim()) return;
    await navigator.clipboard.writeText(message);
    logQuickCopy.mutate({
      content: message,
      channel: 'copy',
      ai_goal: 'send_material',
    });
    toast.success('Texto copiado! ✅');
  };

  return (
    <div className="space-y-4">
      {/* Material list */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Materiais do projeto</Label>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : materials.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">Nenhum material encontrado</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {materials.map((m: any) => {
              const Icon = getTypeIcon(m.type);
              const link = getMaterialLink(m);
              const isSelected = selectedMaterial?.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMaterial(m)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-colors",
                    isSelected ? "border-primary bg-primary/5" : "border-border/50 hover:bg-muted/30"
                  )}
                >
                  {m.thumbnail_url ? (
                    <img src={m.thumbnail_url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted/50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{m.type || 'arquivo'}</span>
                      {m.current_version && <span>v{m.current_version}</span>}
                      <span className={cn(
                        m.status === 'approved' ? 'text-emerald-400' : 'text-amber-400'
                      )}>{m.status || 'pronto'}</span>
                    </div>
                  </div>
                  {link && <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected material actions */}
      {selectedMaterial && (
        <>
          {/* Link */}
          {getMaterialLink(selectedMaterial) && (
            <div className="p-2 bg-muted/30 rounded-lg">
              <Label className="text-[10px] text-muted-foreground">Link do material</Label>
              <p className="text-xs text-primary break-all mt-0.5">{getMaterialLink(selectedMaterial)}</p>
            </div>
          )}

          {/* Checklist */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">O que pedir ao cliente</Label>
            <div className="space-y-2">
              {[
                { key: 'approval', label: 'Aprovação' },
                { key: 'feedback', label: 'Feedback até uma data' },
                { key: 'observations', label: 'Observações específicas' },
                { key: 'references', label: 'Referências' },
                { key: 'nextStep', label: 'Ok para próxima etapa' },
              ].map(item => (
                <div key={item.key} className="flex items-center gap-2">
                  <Checkbox
                    id={item.key}
                    checked={checklist[item.key as keyof typeof checklist]}
                    onCheckedChange={(v) => setChecklist(prev => ({ ...prev, [item.key]: !!v }))}
                  />
                  <Label htmlFor={item.key} className="text-xs">{item.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Generate */}
          <Button onClick={generateMaterialMessage} disabled={isGenerating} className="w-full gap-2">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Gerar texto de envio
          </Button>

          {/* Editor */}
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Mensagem de envio do material..."
            rows={6}
          />

          {/* Actions */}
          <Button onClick={handleCopy} disabled={!message.trim()} className="w-full gap-2">
            <Copy className="w-4 h-4" /> Copiar
          </Button>
        </>
      )}
    </div>
  );
}
