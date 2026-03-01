import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUpdatePost, useUpdatePostWithAI, useSaveAIFeedback, InstagramPost, PILLARS, FORMATS } from '@/hooks/useInstagramEngine';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Sparkles, Link2, Upload, FileText, X } from 'lucide-react';

interface PostEditDialogProps {
  post: InstagramPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FIELDS = [
  { key: 'hook', label: 'Hook', rows: 2 },
  { key: 'script', label: 'Roteiro', rows: 5 },
  { key: 'caption_short', label: 'Legenda Curta', rows: 2 },
  { key: 'caption_medium', label: 'Legenda Média', rows: 3 },
  { key: 'caption_long', label: 'Legenda Longa', rows: 5 },
  { key: 'cta', label: 'CTA', rows: 1 },
  { key: 'pinned_comment', label: 'Comentário Fixado', rows: 2 },
  { key: 'cover_suggestion', label: 'Sugestão de Capa', rows: 2 },
] as const;

export function PostEditDialog({ post, open, onOpenChange }: PostEditDialogProps) {
  const updatePost = useUpdatePost();
  const { generateAndUpdate, isPending: aiPending } = useUpdatePostWithAI();
  const saveFeedback = useSaveAIFeedback();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fields, setFields] = useState<Record<string, string>>({});
  const [hashtags, setHashtags] = useState('');
  const [command, setCommand] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [generatingField, setGeneratingField] = useState<string | null>(null);
  const [aiOriginals, setAiOriginals] = useState<Record<string, string>>({}); // Track AI-generated values for feedback
  const thumbInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (post) {
      const f: Record<string, string> = {};
      FIELDS.forEach(({ key }) => { f[key] = (post as any)[key] || ''; });
      setFields(f);
      setHashtags((post.hashtags || []).join(', '));
      setCommand('');
      setReferenceUrl('');
      setFileContent('');
      setFileName('');
      setThumbnailUrl(post.thumbnail_url || null);
    }
  }, [post]);

  if (!post) return null;

  const handleSave = async () => {
    const updates: any = { id: post.id };
    FIELDS.forEach(({ key }) => { updates[key] = fields[key] || null; });
    updates.hashtags = hashtags.split(',').map(h => h.trim().replace(/^#/, '')).filter(Boolean);
    updates.thumbnail_url = thumbnailUrl;
    await updatePost.mutateAsync(updates);

    // Auto-save feedback for any field the user edited after AI generation
    if (post.ai_generated) {
      FIELDS.forEach(({ key }) => {
        const original = aiOriginals[key] || (post as any)[key] || '';
        const edited = fields[key] || '';
        if (original && edited && original !== edited) {
          saveFeedback.mutate({
            post_id: post.id,
            field_name: key,
            original_text: original,
            edited_text: edited,
            category: post.pillar || undefined,
            format: post.format,
          });
        }
      });
    }

    toast.success('Post atualizado');
    onOpenChange(false);
  };

  const handleGenerateAll = async () => {
    setGeneratingField('all');
    try {
      const result = await generateAndUpdate({
        postId: post.id,
        topic: post.title,
        format: post.format,
        pillar: post.pillar || undefined,
        command: command || undefined,
        reference_url: referenceUrl || undefined,
        file_content: fileContent || undefined,
      });
      if (result) {
        const f = { ...fields };
        FIELDS.forEach(({ key }) => { if (result[key]) f[key] = result[key]; });
        setFields(f);
        if (result.hashtags) setHashtags(result.hashtags.join(', '));
        toast.success('Conteúdo gerado com IA ✨');
      }
    } catch {
      // error handled by hook
    } finally {
      setGeneratingField(null);
    }
  };

  const handleGenerateField = async (field: string) => {
    setGeneratingField(field);
    try {
      const result = await generateAndUpdate({
        postId: post.id,
        topic: post.title,
        format: post.format,
        pillar: post.pillar || undefined,
        command: command || undefined,
        reference_url: referenceUrl || undefined,
        file_content: fileContent || undefined,
        field,
      });
      if (result) {
        if (field === 'hashtags' && result.hashtags) {
          setHashtags(result.hashtags.join(', '));
        } else if (result[field]) {
          setFields(f => ({ ...f, [field]: result[field] }));
        }
        toast.success(`${field} regenerado ✨`);
      }
    } catch {
      // handled
    } finally {
      setGeneratingField(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For text-based files, read content directly
    if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.csv')) {
      const text = await file.text();
      setFileContent(text.substring(0, 4000));
      setFileName(file.name);
      toast.success(`Arquivo "${file.name}" carregado`);
      return;
    }

    // For PDFs and other files, upload to storage
    setUploading(true);
    try {
      const path = `ai-context/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('marketing-assets').upload(path, file);
      if (error) throw error;

      const { data: urlData } = supabase.storage.from('marketing-assets').getPublicUrl(path);
      setFileContent(`[Arquivo enviado: ${file.name}] URL: ${urlData.publicUrl}`);
      setFileName(file.name);
      toast.success(`Arquivo "${file.name}" enviado`);
    } catch (err: any) {
      toast.error(err.message || 'Erro no upload');
    } finally {
      setUploading(false);
    }
  };

  const pillarLabel = PILLARS.find(p => p.key === post.pillar)?.label || post.pillar;
  const formatLabel = FORMATS.find(f => f.key === post.format)?.label || post.format;
  const isGenerating = generatingField !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-primary" />
            {post.title}
          </DialogTitle>
          <div className="flex gap-1.5 mt-1">
            <Badge variant="secondary" className="text-[10px]">{formatLabel}</Badge>
            {pillarLabel && <Badge variant="outline" className="text-[10px]">{pillarLabel}</Badge>}
          </div>
        </DialogHeader>

        <Tabs defaultValue="content" className="flex-1 min-h-0">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="content">Conteúdo</TabsTrigger>
            <TabsTrigger value="ai">IA & Contexto</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-3 flex-1 min-h-0">
            <ScrollArea className="h-[50vh]">
              <div className="space-y-4 pr-3">
                {/* Generate All Button */}
                <Button
                  onClick={handleGenerateAll}
                  disabled={isGenerating}
                  className="w-full gap-2"
                  variant="default"
                >
                  {generatingField === 'all' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Gerando tudo...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> ✨ Gerar Tudo com IA</>
                  )}
                </Button>

                {/* Thumbnail Upload */}
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Capa / Thumbnail</label>
                  <div className="flex items-start gap-3">
                    {thumbnailUrl ? (
                      <div className="relative group w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                        <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setThumbnailUrl(null)}
                          className="absolute inset-0 bg-black/0 group-hover:bg-black/50 flex items-center justify-center transition-all"
                        >
                          <X className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => thumbInputRef.current?.click()}
                        disabled={uploadingThumb}
                        className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-colors shrink-0"
                      >
                        {uploadingThumb ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-muted-foreground" />
                            <span className="text-[8px] text-muted-foreground">Upload</span>
                          </>
                        )}
                      </button>
                    )}
                    <div className="flex-1 text-[10px] text-muted-foreground pt-1">
                      <p>Imagem de capa do post. Aparecerá no grid do perfil.</p>
                      {thumbnailUrl && (
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] mt-1" onClick={() => thumbInputRef.current?.click()}>
                          <Upload className="w-3 h-3 mr-1" /> Trocar imagem
                        </Button>
                      )}
                    </div>
                  </div>
                  <input
                    ref={thumbInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingThumb(true);
                      try {
                        const ext = file.name.split('.').pop();
                        const path = `post-thumbnails/${post.id}-${Date.now()}.${ext}`;
                        const { error } = await supabase.storage.from('marketing-assets').upload(path, file, { upsert: true });
                        if (error) throw error;
                        const { data: urlData } = supabase.storage.from('marketing-assets').getPublicUrl(path);
                        setThumbnailUrl(urlData.publicUrl);
                        toast.success('Thumbnail enviada!');
                      } catch (err: any) {
                        toast.error(err.message || 'Erro no upload');
                      } finally {
                        setUploadingThumb(false);
                      }
                    }}
                  />
                </div>

                {/* Editable Fields */}
                {FIELDS.map(({ key, label, rows }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-foreground">{label}</label>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[10px] text-primary gap-1"
                        disabled={isGenerating}
                        onClick={() => handleGenerateField(key)}
                      >
                        {generatingField === key ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        Gerar
                      </Button>
                    </div>
                    {rows > 1 ? (
                      <Textarea
                        value={fields[key] || ''}
                        onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))}
                        rows={rows}
                        placeholder={`${label}...`}
                        className="text-xs"
                      />
                    ) : (
                      <Input
                        value={fields[key] || ''}
                        onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={`${label}...`}
                        className="text-xs"
                      />
                    )}
                  </div>
                ))}

                {/* Hashtags */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-foreground">Hashtags</label>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[10px] text-primary gap-1"
                      disabled={isGenerating}
                      onClick={() => handleGenerateField('hashtags')}
                    >
                      {generatingField === 'hashtags' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      Gerar
                    </Button>
                  </div>
                  <Textarea
                    value={hashtags}
                    onChange={e => setHashtags(e.target.value)}
                    rows={2}
                    placeholder="hashtag1, hashtag2, hashtag3..."
                    className="text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Separadas por vírgula</p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="ai" className="mt-3">
            <ScrollArea className="h-[50vh]">
              <div className="space-y-4 pr-3">
                {/* Command */}
                <div>
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    Comando para IA
                  </label>
                  <Textarea
                    value={command}
                    onChange={e => setCommand(e.target.value)}
                    placeholder="Ex: Foque em urgência e escassez, tom humorístico, público feminino 25-35..."
                    rows={3}
                    className="text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Instruções específicas que a IA usará como contexto adicional ao gerar conteúdo.
                  </p>
                </div>

                {/* Reference URL */}
                <div>
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1">
                    <Link2 className="w-3 h-3 text-primary" />
                    Link de Referência
                  </label>
                  <Input
                    value={referenceUrl}
                    onChange={e => setReferenceUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... ou artigo, referência..."
                    className="text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Cole um link de YouTube, artigo ou qualquer referência. A IA usará como contexto para gerar o conteúdo.
                  </p>
                </div>

                {/* File Upload */}
                <div>
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1">
                    <Upload className="w-3 h-3 text-primary" />
                    Upload de Arquivo
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.csv,.pdf,image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {fileName ? (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-xs text-foreground flex-1 truncate">{fileName}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => { setFileName(''); setFileContent(''); }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full text-xs gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Enviando...</>
                      ) : (
                        <><Upload className="w-3 h-3" /> Selecionar arquivo</>
                      )}
                    </Button>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Aceita textos, PDFs e imagens. O conteúdo será usado como contexto para a IA.
                  </p>
                </div>

                {/* Quick action */}
                <Button
                  onClick={handleGenerateAll}
                  disabled={isGenerating}
                  className="w-full gap-2"
                >
                  {generatingField === 'all' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Gerar Conteúdo com Contexto</>
                  )}
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={updatePost.isPending}>
            {updatePost.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
