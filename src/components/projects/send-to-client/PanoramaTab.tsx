import { useState, useCallback } from 'react';
import { ProjectWithStages } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Sparkles, Loader2, Link2, FileDown, Send, FileText, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useClientMessages } from '@/hooks/useClientMessages';
import { usePortalLink } from '@/hooks/usePortalLink';
import { PROJECT_STAGES } from '@/data/projectTemplates';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type Tone = 'natural' | 'formal' | 'short' | 'detailed';

interface PanoramaTabProps {
  project: ProjectWithStages;
}

export function PanoramaTab({ project }: PanoramaTabProps) {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [variants, setVariants] = useState<{ short: string; normal: string; long: string } | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<'short' | 'normal' | 'long'>('normal');
  const [tone, setTone] = useState<Tone>('natural');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfShareToken, setPdfShareToken] = useState<string | null>(null);
  const { logQuickCopy } = useClientMessages(project.id);
  const { portalUrl } = usePortalLink(project.id);

  const stageInfo = PROJECT_STAGES.find(s => s.type === project.stage_current);
  const currentStageIdx = PROJECT_STAGES.findIndex(s => s.type === project.stage_current);
  const nextStages = PROJECT_STAGES.slice(currentStageIdx + 1, currentStageIdx + 3);

  const tonePromptMap: Record<Tone, string> = {
    natural: 'Gere no meu jeito: rápido, direto, cara de WhatsApp. Sem floreio, com CTA no final.',
    formal: 'Gere de forma mais formal e profissional, mas sem ser robótico.',
    short: 'Gere extremamente curto — máximo 4 linhas. Só o essencial.',
    detailed: 'Gere bem detalhado com todas as informações disponíveis, entregas, prazos e financeiro resumido.',
  };

  const generatePanorama = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-client-message', {
        body: {
          goal: `${tonePromptMap[tone]} Panorama completo do projeto para WhatsApp. Inclua: panorama geral, etapa atual, próximas etapas, entregas, prazos, pendências e próximos passos. ${portalUrl ? `Link do portal: ${portalUrl}` : ''}`,
          useEmoji: true,
          length: tone === 'short' ? 'curta' : tone === 'detailed' ? 'completa' : 'normal',
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
            portalUrl,
          },
        },
      });

      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

      setVariants(data.variants);
      setContent(data.variants.normal || '');
      setSelectedVariant('normal');
      toast.success('Panorama gerado! ✨');
    } catch {
      toast.error('Erro ao gerar panorama');
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke('export-panorama-pdf', {
        body: { projectId: project.id, userId: user?.id },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

      setPdfUrl(data.public_url);
      setPdfShareToken(data.share_token);
      toast.success(`PDF v${data.version} gerado! 📄`);
    } catch {
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const selectVariant = (v: 'short' | 'normal' | 'long') => {
    if (variants) { setSelectedVariant(v); setContent(variants[v] || ''); }
  };

  const handleCopy = async () => {
    const text = content.trim() || staticPanorama;
    await navigator.clipboard.writeText(text);
    logQuickCopy.mutate({ content: text, channel: 'copy', ai_goal: 'panorama' });
    toast.success('Panorama copiado! ✅');
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `panorama_${project.name?.replace(/\s+/g, '_')}.pdf`;
    a.target = '_blank';
    a.click();
    toast.success('Download iniciado!');
  };

  const handleSendWhatsApp = useCallback(() => {
    const text = content.trim() || staticPanorama;
    const fullText = pdfUrl
      ? `${text}\n\n📄 PDF do Panorama: ${pdfUrl}`
      : text;

    // Try to find client phone from crm_contacts via project.client_name
    const encoded = encodeURIComponent(fullText);
    const phone = (project as any).client_phone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(url, '_blank');
    
    logQuickCopy.mutate({ content: fullText, channel: 'whatsapp', ai_goal: 'panorama_whatsapp' });
    toast.success('WhatsApp aberto! 📱');
  }, [content, pdfUrl, project]);

  const copyPdfLink = async () => {
    if (!pdfUrl) return;
    await navigator.clipboard.writeText(pdfUrl);
    toast.success('Link do PDF copiado!');
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
    portalUrl ? `\nPortal: ${portalUrl}` : null,
  ].filter(Boolean).join('\n');

  const tones: { key: Tone; label: string }[] = [
    { key: 'natural', label: 'Meu jeito' },
    { key: 'formal', label: 'Formal' },
    { key: 'short', label: 'Curto' },
    { key: 'detailed', label: 'Detalhado' },
  ];

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

      {/* Portal Link */}
      {portalUrl && (
        <div className="p-2 bg-muted/30 rounded-lg">
          <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Link2 className="w-3 h-3" /> Link do Portal para o cliente
          </Label>
          <p className="text-xs text-primary break-all mt-0.5">{portalUrl}</p>
          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 mt-1 gap-1"
            onClick={() => { navigator.clipboard.writeText(portalUrl); toast.success('Link copiado!'); }}>
            <Copy className="w-3 h-3" /> Copiar link
          </Button>
        </div>
      )}

      {/* Tone selector */}
      <div>
        <Label className="text-[10px] text-muted-foreground uppercase mb-1.5 block">Tom da mensagem</Label>
        <div className="flex gap-1.5 flex-wrap">
          {tones.map(t => (
            <Badge key={t.key} variant={tone === t.key ? 'default' : 'outline'}
              className={`cursor-pointer text-[10px] px-2.5 py-1 ${tone === t.key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'}`}
              onClick={() => setTone(t.key)}>
              {t.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Generate panorama WhatsApp text */}
      <Button onClick={generatePanorama} disabled={isGenerating} className="w-full gap-2 bg-primary hover:bg-primary/90">
        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {isGenerating ? 'Gerando...' : 'Gerar panorama no estilo WhatsApp'}
      </Button>

      {/* Variant selector */}
      {variants && (
        <div className="flex gap-2">
          {(['short', 'normal', 'long'] as const).map(v => (
            <Button key={v} size="sm" variant={selectedVariant === v ? 'default' : 'outline'}
              onClick={() => selectVariant(v)} className="text-xs flex-1">
              {v === 'short' ? 'Curta' : v === 'normal' ? 'Normal' : 'Completa'}
            </Button>
          ))}
        </div>
      )}

      {/* Editor */}
      <Textarea value={content || staticPanorama} onChange={e => setContent(e.target.value)}
        rows={8} className="font-sans text-sm" />

      {/* Action buttons grid */}
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={handleCopy} variant="outline" className="gap-2 text-xs">
          <Copy className="w-3.5 h-3.5" /> Copiar Panorama
        </Button>
        <Button onClick={generatePdf} disabled={isGeneratingPdf} variant="outline" className="gap-2 text-xs">
          {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
          {isGeneratingPdf ? 'Gerando PDF...' : 'Gerar PDF'}
        </Button>
      </div>

      {/* PDF actions — visible after PDF is generated */}
      {pdfUrl && (
        <>
          <Separator className="opacity-30" />
          <div className="p-3 bg-muted/20 rounded-lg border border-primary/20 space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">PDF pronto</span>
              <Badge variant="outline" className="text-[9px] ml-auto">SQUAD FILM</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleDownloadPdf} size="sm" variant="outline" className="gap-1.5 text-xs h-8">
                <FileDown className="w-3.5 h-3.5" /> Baixar PDF
              </Button>
              <Button onClick={copyPdfLink} size="sm" variant="outline" className="gap-1.5 text-xs h-8">
                <Link2 className="w-3.5 h-3.5" /> Copiar link
              </Button>
            </div>
          </div>
        </>
      )}

      {/* WhatsApp send */}
      <Button onClick={handleSendWhatsApp} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
        <Send className="w-4 h-4" /> Enviar via WhatsApp
      </Button>

      {/* Refine with AI */}
      {content && (
        <Button onClick={generatePanorama} variant="ghost" size="sm" className="w-full gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="w-3 h-3" /> Refinar com IA
        </Button>
      )}
    </div>
  );
}
