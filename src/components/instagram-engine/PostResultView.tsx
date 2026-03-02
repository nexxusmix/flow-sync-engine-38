import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { InstagramPost, useUpdatePost, useInstagramAI, PILLARS, FORMATS, POST_STATUSES } from '@/hooks/useInstagramEngine';
import { Copy, Check, Download, CalendarPlus, ArrowLeft, Sparkles, Hash, Play, Layers, Image, BookOpen, FileText, Eye, Clock, ExternalLink, Package, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { LayoutPicker, LAYOUT_OPTIONS, type LayoutOption, type ReferenceItem } from './LayoutPicker';

interface PostResultViewProps {
  post: InstagramPost;
  onBack: () => void;
  onSchedule?: (postId: string) => void;
  onPostUpdated?: (post: InstagramPost) => void;
}

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  reel: <Play className="w-4 h-4" />,
  carousel: <Layers className="w-4 h-4" />,
  single: <Image className="w-4 h-4" />,
  story: <BookOpen className="w-4 h-4" />,
  story_sequence: <BookOpen className="w-4 h-4" />,
};

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(label ? `${label} copiado!` : 'Copiado!');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1 text-[10px] h-6 px-2 shrink-0">
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copiado' : 'Copiar'}
    </Button>
  );
}

function ContentSection({ title, icon, content, badge }: { title: string; icon: React.ReactNode; content: string | null; badge?: string }) {
  if (!content) return null;
  return (
    <Card className="glass-card border border-border/50 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="text-xs font-medium text-foreground">{title}</h4>
          {badge && <Badge variant="secondary" className="text-[8px]">{badge}</Badge>}
        </div>
        <CopyButton text={content} label={title} />
      </div>
      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{content}</p>
    </Card>
  );
}

export function PostResultView({ post, onBack, onSchedule, onPostUpdated }: PostResultViewProps) {
  const updatePost = useUpdatePost();
  const aiMutation = useInstagramAI();
  const [showSchedule, setShowSchedule] = useState(false);
  const [showRegenerate, setShowRegenerate] = useState(false);
  const [regenLayout, setRegenLayout] = useState<string | null>(null);
  const [regenRef, setRegenRef] = useState<ReferenceItem | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(
    post.scheduled_at ? format(new Date(post.scheduled_at), "yyyy-MM-dd'T'HH:mm") : ''
  );
  const [exporting, setExporting] = useState(false);

  const pillar = PILLARS.find(p => p.key === post.pillar);
  const formatInfo = FORMATS.find(f => f.key === post.format);
  const status = POST_STATUSES.find(s => s.key === post.status);
  const hashtagsText = (post.hashtags || []).map(h => `#${h}`).join(' ');

  const fullCaption = [
    post.caption_long || post.caption_medium || post.caption_short || '',
    '',
    hashtagsText,
  ].filter(Boolean).join('\n');

  const handleCopyAll = () => {
    navigator.clipboard.writeText(fullCaption);
    toast.success('Legenda completa + hashtags copiada!');
  };

  const handleSchedule = async () => {
    if (!scheduleDate) { toast.error('Selecione data e hora'); return; }
    try {
      await updatePost.mutateAsync({
        id: post.id,
        scheduled_at: new Date(scheduleDate).toISOString(),
        status: 'scheduled',
      } as any);
      toast.success('Post agendado! 📅');
      setShowSchedule(false);
      if (onSchedule) onSchedule(post.id);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao agendar');
    }
  };

  const handleDownloadPNG = () => {
    if (!post.thumbnail_url) {
      toast.error('Nenhuma imagem disponível para download');
      return;
    }
    const a = document.createElement('a');
    a.href = post.thumbnail_url;
    a.download = `${post.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'post'}.png`;
    a.target = '_blank';
    a.click();
    toast.success('Download PNG iniciado! 📥');
  };

  const handleExportZIP = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-instagram-post', {
        body: { post_id: post.id },
      });

      if (error) throw new Error(error.message || 'Erro ao exportar');
      if (!data?.zip_url) throw new Error('URL do ZIP não gerada');

      // Download ZIP
      const a = document.createElement('a');
      a.href = data.zip_url;
      a.download = `${post.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'post'}-export.zip`;
      a.click();
      toast.success('ZIP completo exportado! 📦');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao exportar ZIP');
    } finally {
      setExporting(false);
    }
  };

  const handleExportTxt = () => {
    const sections = [
      `# ${post.title}`,
      `Formato: ${formatInfo?.label || post.format}`,
      `Pilar: ${pillar?.label || post.pillar || '—'}`,
      post.scheduled_at ? `Agendado: ${format(new Date(post.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}` : '',
      '', '## Hook', post.hook || '—',
      '', '## Roteiro', post.script || '—',
      '', '## Legenda Curta', post.caption_short || '—',
      '', '## Legenda Média', post.caption_medium || '—',
      '', '## Legenda Longa', post.caption_long || '—',
      '', '## CTA', post.cta || '—',
      '', '## Comentário Fixado', post.pinned_comment || '—',
      '', '## Hashtags', hashtagsText || '—',
      '', '## Sugestão de Capa', post.cover_suggestion || '—',
    ].filter(l => l !== undefined).join('\n');

    const blob = new Blob([sections], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${post.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Post exportado como TXT!');
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      // Regenerate text content
      const result = await aiMutation.mutateAsync({
        action: 'generate_post_trending',
        data: {
          topic: post.title,
          format: post.format,
          pillar: post.pillar || 'autoridade',
          trend_style: 'cinematic_reel',
          custom_instruction: 'Regenerar conteúdo completo com abordagem diferente, mantendo o mesmo tema.',
        },
      });

      if (!result) throw new Error('IA não retornou resultado');

      // Regenerate image
      let thumbnailUrl: string | null = null;
      const layoutMod = regenLayout ? LAYOUT_OPTIONS.find(l => l.key === regenLayout)?.promptModifier || '' : '';
      const refContext = regenRef ? [regenRef.note, regenRef.tags?.join(', ')].filter(Boolean).join('. ') : '';

      try {
        toast.info('Regenerando imagem... 🎨');
        const imagePrompt = [
          result.title || post.title,
          result.cover_suggestion || '',
          layoutMod,
          refContext ? `Reference style: ${refContext}` : '',
          'Modern social media design, professional Instagram post',
        ].filter(Boolean).join('. ');

        const { data: imgData, error: imgError } = await supabase.functions.invoke('generate-image', {
          body: { prompt: imagePrompt, purpose: 'key_visual', aspectRatio: '1:1' },
        });

        if (!imgError && imgData?.imageUrl) {
          thumbnailUrl = imgData.imageUrl;
        }
      } catch (imgErr) {
        console.warn('Image regen failed:', imgErr);
      }

      // Update existing post
      await updatePost.mutateAsync({
        id: post.id,
        title: result.title || post.title,
        hook: result.hook || null,
        script: result.script || null,
        caption_short: result.caption_short || null,
        caption_medium: result.caption_medium || null,
        caption_long: result.caption_long || null,
        cta: result.cta || null,
        pinned_comment: result.pinned_comment || null,
        hashtags: result.hashtags || [],
        cover_suggestion: result.cover_suggestion || null,
        carousel_slides: result.carousel_slides || post.carousel_slides || [],
        story_sequence: result.story_sequence || post.story_sequence || [],
        ...(thumbnailUrl ? { thumbnail_url: thumbnailUrl } : {}),
        ai_generated: true,
      } as any);

      toast.success('Post regenerado com sucesso! 🔄');
      setShowRegenerate(false);

      // Notify parent to refresh
      if (onPostUpdated) {
        onPostUpdated({
          ...post,
          title: result.title || post.title,
          hook: result.hook || null,
          script: result.script || null,
          caption_short: result.caption_short || null,
          caption_medium: result.caption_medium || null,
          caption_long: result.caption_long || null,
          cta: result.cta || null,
          pinned_comment: result.pinned_comment || null,
          hashtags: result.hashtags || [],
          cover_suggestion: result.cover_suggestion || null,
          ...(thumbnailUrl ? { thumbnail_url: thumbnailUrl } : {}),
          ai_generated: true,
        });
      }
    } catch (e: any) {
      toast.error(e.message || 'Erro ao regenerar');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-xs">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <div className="flex items-center gap-2 flex-wrap">
          {post.thumbnail_url && (
            <Button variant="outline" size="sm" onClick={handleDownloadPNG} className="gap-1.5 text-xs h-8">
              <Image className="w-3.5 h-3.5" /> Download PNG
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExportZIP} disabled={exporting} className="gap-1.5 text-xs h-8">
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5" />}
            Exportar ZIP
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportTxt} className="gap-1.5 text-xs h-8">
            <Download className="w-3.5 h-3.5" /> TXT
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyAll} className="gap-1.5 text-xs h-8">
            <Copy className="w-3.5 h-3.5" /> Legenda + Hashtags
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowRegenerate(true)} disabled={regenerating} className="gap-1.5 text-xs h-8">
            {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Regenerar
          </Button>
          <Button size="sm" onClick={() => setShowSchedule(true)} className="gap-1.5 text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground">
            <CalendarPlus className="w-3.5 h-3.5" /> Agendar
          </Button>
        </div>
      </div>

      {/* Hero Header */}
      <Card className="glass-card border border-border/50 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737]" />
        <div className="p-5 md:p-6">
          <div className="flex items-start gap-4">
            {post.thumbnail_url ? (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden bg-muted shrink-0">
                <img src={post.thumbnail_url} alt={post.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-muted/50 flex items-center justify-center shrink-0"
                style={{ background: pillar ? `linear-gradient(135deg, ${pillar.color}11, ${pillar.color}33)` : undefined }}>
                {FORMAT_ICONS[post.format] || <Image className="w-8 h-8 text-muted-foreground/40" />}
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-2">
              <h2 className="text-lg md:text-xl font-bold text-foreground leading-tight">{post.title}</h2>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-[10px] gap-1">
                  {FORMAT_ICONS[post.format]} {formatInfo?.label || post.format}
                </Badge>
                {pillar && (
                  <Badge className="text-[10px]" style={{ backgroundColor: pillar.color + '22', color: pillar.color }}>
                    {pillar.label}
                  </Badge>
                )}
                {status && <Badge className={`${status.color} text-[10px]`}>{status.label}</Badge>}
                {post.ai_generated && (
                  <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary">
                    <Sparkles className="w-2.5 h-2.5" /> Gerado por IA
                  </Badge>
                )}
              </div>
              {post.scheduled_at && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Agendado: {format(new Date(post.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              )}
              {post.post_url && (
                <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                  <ExternalLink className="w-3 h-3" /> Ver no Instagram
                </a>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Instagram Preview Card */}
      <Card className="glass-card border border-border/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Preview do Post</h3>
        </div>
        <div className="max-w-sm mx-auto">
          <div className="border border-border/50 rounded-xl overflow-hidden bg-background">
            <div className="flex items-center gap-2 p-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] p-[2px]">
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                  <span className="text-[8px] font-bold">SQ</span>
                </div>
              </div>
              <span className="text-xs font-semibold">squadfilme</span>
            </div>
            <div className="aspect-square bg-muted/30 flex items-center justify-center" style={{ background: pillar ? `linear-gradient(135deg, ${pillar.color}11, ${pillar.color}22)` : undefined }}>
              {post.thumbnail_url ? (
                <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6">
                  {FORMAT_ICONS[post.format] || <Image className="w-12 h-12 text-muted-foreground/20 mx-auto" />}
                  <p className="text-[10px] text-muted-foreground/40 mt-2">{formatInfo?.label}</p>
                </div>
              )}
            </div>
            <div className="p-3 space-y-1">
              <p className="text-[11px] text-foreground leading-relaxed">
                <span className="font-semibold">squadfilme </span>
                {(post.caption_short || post.caption_medium || post.caption_long || 'Legenda não gerada')?.substring(0, 150)}
                {(post.caption_short || '').length > 150 && <span className="text-muted-foreground">...mais</span>}
              </p>
              {hashtagsText && (
                <p className="text-[10px] text-primary/70 leading-relaxed">{hashtagsText.substring(0, 120)}...</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ContentSection title="Hook" icon={<Sparkles className="w-4 h-4 text-amber-400" />} content={post.hook} badge="3 primeiros segundos" />
        <ContentSection title="CTA" icon={<FileText className="w-4 h-4 text-emerald-400" />} content={post.cta} />
      </div>

      <ContentSection title="Roteiro Completo" icon={<Play className="w-4 h-4 text-blue-400" />} content={post.script} badge="Script" />

      <div className="space-y-3">
        <ContentSection title="Legenda Curta" icon={<FileText className="w-4 h-4 text-muted-foreground" />} content={post.caption_short} badge="Até 3 linhas" />
        <ContentSection title="Legenda Média" icon={<FileText className="w-4 h-4 text-muted-foreground" />} content={post.caption_medium} badge="1 parágrafo" />
        <ContentSection title="Legenda Longa" icon={<FileText className="w-4 h-4 text-muted-foreground" />} content={post.caption_long} badge="Completa + CTA" />
      </div>

      <ContentSection title="Comentário Fixado" icon={<FileText className="w-4 h-4 text-purple-400" />} content={post.pinned_comment} />
      <ContentSection title="Sugestão de Capa" icon={<Image className="w-4 h-4 text-pink-400" />} content={post.cover_suggestion} />

      {/* Hashtags Card */}
      {hashtagsText && (
        <Card className="glass-card border border-border/50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-medium text-foreground">Hashtags</h4>
              <Badge variant="secondary" className="text-[8px]">{post.hashtags?.length || 0}</Badge>
            </div>
            <CopyButton text={hashtagsText} label="Hashtags" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(post.hashtags || []).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-[10px] cursor-pointer hover:bg-primary/10" onClick={() => { navigator.clipboard.writeText(`#${tag}`); toast.success(`#${tag} copiado`); }}>
                #{tag}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Carousel Slides */}
      {post.carousel_slides?.length > 0 && (
        <Card className="glass-card border border-border/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-medium text-foreground">Slides do Carrossel</h4>
              <Badge variant="secondary" className="text-[8px]">{post.carousel_slides.length} slides</Badge>
            </div>
            {post.carousel_slides.some((s: any) => s.image_url) && (
              <Button variant="outline" size="sm" className="gap-1.5 text-[10px] h-7" onClick={() => {
                post.carousel_slides.forEach((slide: any, i: number) => {
                  if (slide.image_url) {
                    const a = document.createElement('a');
                    a.href = slide.image_url;
                    a.download = `slide-${i + 1}.png`;
                    a.target = '_blank';
                    a.click();
                  }
                });
                toast.success('Download dos slides iniciado! 📥');
              }}>
                <Download className="w-3 h-3" /> Baixar Todos
              </Button>
            )}
          </div>
          {/* Visual carousel preview */}
          {post.carousel_slides.some((s: any) => s.image_url) && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {post.carousel_slides.map((slide: any, i: number) => (
                <div key={i} className="min-w-[200px] max-w-[220px] shrink-0 rounded-xl overflow-hidden border border-border/30 bg-muted/20">
                  {slide.image_url ? (
                    <div className="aspect-square relative group">
                      <img src={slide.image_url} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-white h-8 gap-1"
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = slide.image_url;
                            a.download = `slide-${i + 1}.png`;
                            a.target = '_blank';
                            a.click();
                          }}
                        >
                          <Download className="w-3.5 h-3.5" /> PNG
                        </Button>
                      </div>
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-black/60 text-white text-[9px] border-0">{i + 1}/{post.carousel_slides.length}</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-square flex items-center justify-center bg-muted/30">
                      <Image className="w-8 h-8 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="p-2.5 space-y-0.5">
                    <p className="text-xs font-medium text-foreground leading-tight">{slide.title}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">{slide.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Text-only fallback for slides without images */}
          {!post.carousel_slides.some((s: any) => s.image_url) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {post.carousel_slides.map((slide: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/30 space-y-1">
                  <p className="text-[10px] text-muted-foreground">Slide {i + 1}</p>
                  <p className="text-xs font-medium text-foreground">{slide.title}</p>
                  <p className="text-[11px] text-muted-foreground">{slide.body}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Story Sequence */}
      {post.story_sequence?.length > 0 && (
        <Card className="glass-card border border-border/50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-medium text-foreground">Sequência de Stories</h4>
            <Badge variant="secondary" className="text-[8px]">{post.story_sequence.length} stories</Badge>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {post.story_sequence.map((story: any, i: number) => (
              <div key={i} className="min-w-[140px] max-w-[160px] p-3 rounded-xl bg-muted/30 border border-border/30 space-y-1.5 shrink-0">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-muted-foreground">Story {i + 1}</span>
                  {story.media_type && <Badge variant="outline" className="text-[7px]">{story.media_type}</Badge>}
                </div>
                <p className="text-[10px] text-foreground leading-tight">{story.text}</p>
                {story.interactive && (
                  <Badge variant="secondary" className="text-[8px]">🎯 {story.interactive}</Badge>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Checklist */}
      {post.checklist?.length > 0 && (
        <Card className="glass-card border border-border/50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-medium text-foreground">Checklist de Produção</h4>
          </div>
          <div className="space-y-1.5">
            {post.checklist.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded border border-border/50 shrink-0" />
                <span className="text-foreground">{item.task}</span>
                {item.category && <Badge variant="outline" className="text-[8px] ml-auto">{item.category}</Badge>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Bottom Actions */}
      <div className="flex items-center justify-between gap-3 pt-2 pb-6 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-xs">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <div className="flex gap-2 flex-wrap">
          {post.thumbnail_url && (
            <Button variant="outline" size="sm" onClick={handleDownloadPNG} className="gap-1.5 text-xs">
              <Image className="w-3.5 h-3.5" /> Download PNG
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExportZIP} disabled={exporting} className="gap-1.5 text-xs">
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5" />}
            Exportar ZIP
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyAll} className="gap-1.5 text-xs">
            <Copy className="w-3.5 h-3.5" /> Copiar Tudo
          </Button>
          <Button size="sm" onClick={() => setShowSchedule(true)} className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
            <CalendarPlus className="w-3.5 h-3.5" /> Agendar no Calendário
          </Button>
        </div>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <CalendarPlus className="w-4 h-4 text-primary" /> Agendar Post
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-muted-foreground">Data e Hora</label>
              <Input
                type="datetime-local"
                value={scheduleDate}
                onChange={e => setScheduleDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              {['10:00', '12:00', '18:00', '21:00'].map(time => (
                <Button
                  key={time}
                  variant="outline"
                  size="sm"
                  className="text-[10px] h-7 flex-1"
                  onClick={() => {
                    const d = scheduleDate ? scheduleDate.split('T')[0] : format(new Date(), 'yyyy-MM-dd');
                    setScheduleDate(`${d}T${time}`);
                  }}
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setShowSchedule(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSchedule} className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground">
              <CalendarPlus className="w-3.5 h-3.5" /> Agendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Dialog */}
      <Dialog open={showRegenerate} onOpenChange={setShowRegenerate}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-primary" /> Regenerar Post
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Escolha um layout e/ou referência. O conteúdo será regenerado mantendo o mesmo post.
            </p>
          </DialogHeader>
          <LayoutPicker
            selected={regenLayout}
            onSelect={(l) => setRegenLayout(l?.key || null)}
            selectedReference={regenRef}
            onSelectReference={setRegenRef}
          />
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setShowRegenerate(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleRegenerate} disabled={regenerating} className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground">
              {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {regenerating ? 'Regenerando...' : 'Regenerar Agora'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
