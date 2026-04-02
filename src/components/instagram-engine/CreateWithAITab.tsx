import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInstagramAI, useCreatePost, PILLARS, FORMATS, type Json } from '@/hooks/useInstagramEngine';
import { Loader2, Sparkles, Copy, Check, Save, Calendar, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export function CreateWithAITab() {
  const aiMutation = useInstagramAI();
  const createPost = useCreatePost();
  const [topic, setTopic] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('reel');
  const [selectedPillar, setSelectedPillar] = useState('autoridade');
  const [duration, setDuration] = useState('30');
  const [result, setResult] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) { toast.error('Digite o tema do post'); return; }
    try {
      const data = await aiMutation.mutateAsync({
        action: 'generate_content',
        data: { topic, format: selectedFormat, pillar: selectedPillar, duration: selectedFormat === 'reel' ? parseInt(duration) : undefined },
      });
      setResult(data);
      toast.success('Conteúdo gerado com sucesso!');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSave = async (status: string) => {
    if (!result) return;
    await createPost.mutateAsync({
      title: topic,
      format: selectedFormat,
      pillar: selectedPillar,
      status,
      hook: result.hook,
      script: result.script,
      caption_short: result.caption_short,
      caption_medium: result.caption_medium,
      caption_long: result.caption_long,
      cta: result.cta,
      pinned_comment: result.pinned_comment,
      hashtags: result.hashtags || [],
      cover_suggestion: result.cover_suggestion,
      carousel_slides: result.carousel_slides || [],
      story_sequence: result.story_sequence || [],
      ai_generated: true,
    } as any);
    setResult(null);
    setTopic('');
  };

  const copyField = (field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <Card className="glass-card p-6 border-primary/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Criar Conteúdo com IA</h3>
            <p className="text-[10px] text-muted-foreground">Gere pacotes completos de conteúdo para o Instagram da SQUAD Film</p>
          </div>
        </div>

        <div className="space-y-3">
          <Input
            placeholder="O que você quer postar? Ex: making of gravação FAAL, case Aurora Oasis, reel autoridade..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="text-sm"
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{FORMATS.map(f => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedPillar} onValueChange={setSelectedPillar}>
              <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{PILLARS.map(p => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
            {selectedFormat === 'reel' && (
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 segundos</SelectItem>
                  <SelectItem value="30">30 segundos</SelectItem>
                  <SelectItem value="60">60 segundos</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button onClick={handleGenerate} disabled={aiMutation.isPending} className="gap-1.5">
              {aiMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Gerar
            </Button>
          </div>
        </div>
      </Card>

      {/* Result */}
      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Hook */}
          {result.hook && (
            <ResultBlock title="🎣 Hook" content={result.hook} field="hook" copiedField={copiedField} onCopy={copyField} />
          )}

          {/* Script */}
          {result.script && (
            <ResultBlock title="🎬 Roteiro" content={result.script} field="script" copiedField={copiedField} onCopy={copyField} multiline />
          )}

          {/* Captions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {result.caption_short && <ResultBlock title="📝 Legenda Curta" content={result.caption_short} field="short" copiedField={copiedField} onCopy={copyField} multiline />}
            {result.caption_medium && <ResultBlock title="📝 Legenda Média" content={result.caption_medium} field="medium" copiedField={copiedField} onCopy={copyField} multiline />}
            {result.caption_long && <ResultBlock title="📝 Legenda Longa" content={result.caption_long} field="long" copiedField={copiedField} onCopy={copyField} multiline />}
          </div>

          {/* CTA + Pinned Comment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.cta && <ResultBlock title="🎯 CTA" content={result.cta} field="cta" copiedField={copiedField} onCopy={copyField} />}
            {result.pinned_comment && <ResultBlock title="📌 Comentário Fixado" content={result.pinned_comment} field="pinned" copiedField={copiedField} onCopy={copyField} />}
          </div>

          {/* Hashtags */}
          {result.hashtags?.length > 0 && (
            <Card className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-foreground"># Hashtags</h4>
                <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => copyField('hashtags', result.hashtags.map((h: string) => `#${h.replace('#', '')}`).join(' '))}>
                  {copiedField === 'hashtags' ? <Check className="w-3 h-3 mr-1 text-emerald-400" /> : <Copy className="w-3 h-3 mr-1" />}
                  Copiar
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.hashtags.map((h: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">#{h.replace('#', '')}</Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Cover + Carousel */}
          {result.cover_suggestion && (
            <ResultBlock title="🖼️ Sugestão de Capa" content={result.cover_suggestion} field="cover" copiedField={copiedField} onCopy={copyField} />
          )}

          {result.carousel_slides?.length > 0 && (
            <Card className="glass-card p-4">
              <h4 className="text-xs font-medium text-foreground mb-3">📑 Slides do Carrossel</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {result.carousel_slides.map((slide: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/40 border border-border/30">
                    <p className="text-[10px] text-muted-foreground mb-1">Slide {i + 1}</p>
                    <p className="text-xs font-medium text-foreground">{slide.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-3">{slide.body}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleSave('planned')} disabled={createPost.isPending}>
              <Save className="w-4 h-4" /> Salvar no Planejamento
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => handleSave('in_production')} disabled={createPost.isPending}>
              <ArrowRight className="w-4 h-4" /> Enviar para Produção
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultBlock({ title, content, field, copiedField, onCopy, multiline }: {
  title: string; content: string; field: string; copiedField: string | null; onCopy: (f: string, t: string) => void; multiline?: boolean;
}) {
  return (
    <Card className="glass-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-foreground">{title}</h4>
        <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => onCopy(field, content)}>
          {copiedField === field ? <Check className="w-3 h-3 mr-1 text-emerald-400" /> : <Copy className="w-3 h-3 mr-1" />}
          Copiar
        </Button>
      </div>
      <p className={`text-sm text-foreground/80 ${multiline ? 'whitespace-pre-wrap' : ''}`}>{content}</p>
    </Card>
  );
}
