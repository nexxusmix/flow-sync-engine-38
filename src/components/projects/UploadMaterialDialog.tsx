import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Upload, Link2, X, FileIcon, Image, Film, Music, FileText, Archive, CheckCircle2, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjectAssets, type ProjectAsset } from "@/hooks/useProjectAssets";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AiProcessingOverlay } from "./AiProcessingOverlay";
import { useBackgroundUploadStore } from "@/stores/useBackgroundUploadStore";

interface UploadMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

interface QueuedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  aiTitle: string;
  aiDescription: string;
}

export function UploadMaterialDialog({ open, onOpenChange, projectId }: UploadMaterialDialogProps) {
  const { uploadAsset, addLink } = useProjectAssets(projectId);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [category, setCategory] = useState<ProjectAsset['category']>('other');
  const [visibility, setVisibility] = useState<ProjectAsset['visibility']>('internal');
  const [aiProcess, setAiProcess] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'file' | 'youtube' | 'link'>('file');
  const [aiContext, setAiContext] = useState('');

  // AI fill state
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiPhase, setAiPhase] = useState<'idle' | 'analyzing' | 'generating' | 'done'>('idle');

  // Link tab
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newItems: QueuedFile[] = Array.from(files).map(f => ({
      file: f,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      status: 'pending' as const,
      progress: 0,
      aiTitle: f.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      aiDescription: '',
    }));
    setQueue(prev => [...prev, ...newItems]);
  }, []);

  const removeFromQueue = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id));
  };

  const updateQueueItem = (id: string, updates: Partial<QueuedFile>) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAiFill = async () => {
    if (queue.length === 0) return;
    setAiProcessing(true);
    setAiPhase('analyzing');
    setAiProgress(10);

    try {
      await new Promise(r => setTimeout(r, 600));
      setAiProgress(30);
      setAiPhase('generating');

      const filesPayload = await Promise.all(queue.map(async (q) => {
        const payload: any = {
          fileName: q.file.name,
          mimeType: q.file.type,
          fileSize: formatSize(q.file.size),
        };
        if (q.file.type.startsWith('image/') && q.file.size <= 2 * 1024 * 1024) {
          try {
            payload.imageBase64 = await fileToBase64(q.file);
          } catch (e) {
            console.warn('Failed to convert image to base64:', e);
          }
        }
        return payload;
      }));

      const { data, error } = await supabase.functions.invoke('ai-fill-materials', {
        body: {
          files: filesPayload,
          projectContext: aiContext.trim() || undefined,
        },
      });

      setAiProgress(80);

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const results = data?.results || [];
      setQueue(prev => prev.map((q, i) => ({
        ...q,
        aiTitle: results[i]?.title || q.aiTitle,
        aiDescription: results[i]?.description || '',
      })));

      setAiProgress(100);
      setAiPhase('done');
      await new Promise(r => setTimeout(r, 1200));
    } catch (err) {
      console.error('AI fill error:', err);
      toast.error('Erro ao preencher com IA');
    } finally {
      setAiProcessing(false);
      setAiPhase('idle');
      setAiProgress(0);
    }
  };

  const handleUploadAll = async () => {
    if (queue.length === 0) return;
    
    // Hand off to background upload store
    const bgItems = queue.filter(q => q.status !== 'done').map(item => ({
      id: item.id,
      fileName: item.file.name,
      file: item.file,
      projectId,
      category,
      visibility,
      aiProcess,
    }));

    useBackgroundUploadStore.getState().addItems(bgItems);

    // Close dialog immediately
    toast.success(`${bgItems.length} material(is) sendo enviado(s) em segundo plano`);
    setQueue([]);
    onOpenChange(false);
  };

  const handleAddLink = async () => {
    if (!linkUrl.trim()) { toast.error('URL é obrigatória'); return; }
    try {
      await addLink.mutateAsync({
        url: linkUrl.trim(),
        projectId,
        title: linkTitle.trim() || undefined,
        category,
        visibility,
        aiProcess,
      });
      setLinkUrl('');
      setLinkTitle('');
      onOpenChange(false);
    } catch { /* handled in hook */ }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const getFileTypeLabel = (file: File) => {
    const t = file.type;
    if (t.startsWith('image/')) return `Imagem ${t.split('/')[1]?.toUpperCase()}`;
    if (t.startsWith('video/')) return `Vídeo ${t.split('/')[1]?.toUpperCase()}`;
    if (t.startsWith('audio/')) return `Áudio ${t.split('/')[1]?.toUpperCase()}`;
    if (t === 'application/pdf') return 'Documento PDF';
    if (t.includes('zip')) return 'Arquivo ZIP';
    return 'Arquivo';
  };

  const getFileThumb = (file: File): string | null => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl bg-[#0a0a0f] border-[rgba(0,156,202,0.15)] text-white p-0 overflow-hidden">
        {/* AI Processing Overlay */}
        <AiProcessingOverlay
          isVisible={aiProcessing}
          phase={aiPhase}
          progress={aiProgress}
          fileCount={queue.length}
        />

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight text-white/90" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              ENVIAR MATERIAIS
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-white/40 mt-1">Arraste ou selecione vários arquivos de uma vez</p>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Dropzone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="border-2 border-dashed border-[rgba(0,156,202,0.2)] hover:border-[rgba(0,156,202,0.4)] rounded-xl p-8 text-center cursor-pointer transition-colors bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(255,255,255,0.02)]"
          >
            <Upload className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/40">Arraste arquivos aqui ou <span className="text-[hsl(195,100%,50%)]">clique para selecionar</span></p>
            <p className="text-[10px] text-white/20 mt-1">Imagens, vídeos, PDFs, documentos, ZIPs...</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {/* Tab buttons for YouTube / Link */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('youtube')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg border text-xs transition-colors",
                activeTab === 'youtube'
                  ? "border-[rgba(0,156,202,0.3)] bg-[rgba(0,156,202,0.08)] text-white/70"
                  : "border-white/10 text-white/30 hover:text-white/50"
              )}
            >
              <Film className="w-3.5 h-3.5" /> YOUTUBE
            </button>
            <button
              onClick={() => setActiveTab('link')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg border text-xs transition-colors",
                activeTab === 'link'
                  ? "border-[rgba(0,156,202,0.3)] bg-[rgba(0,156,202,0.08)] text-white/70"
                  : "border-white/10 text-white/30 hover:text-white/50"
              )}
            >
              <Link2 className="w-3.5 h-3.5" /> LINK
            </button>
          </div>

          {/* Link input (shown when tab is youtube or link) */}
          {(activeTab === 'youtube' || activeTab === 'link') && (
            <div className="space-y-2 p-4 rounded-lg border border-white/10 bg-[rgba(255,255,255,0.02)]">
              <Input
                placeholder={activeTab === 'youtube' ? "https://youtube.com/watch?v=..." : "https://..."}
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="bg-transparent border-white/10 text-white/70 placeholder:text-white/20"
              />
              <Input
                placeholder="Título (opcional)"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                className="bg-transparent border-white/10 text-white/70 placeholder:text-white/20"
              />
            </div>
          )}

          {queue.length > 0 && (
            <>
              {/* Contexto rápido para IA */}
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-white/25">Contexto para IA (opcional)</Label>
                <textarea
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  placeholder="Ex: Materiais da campanha de lançamento do produto X para Instagram..."
                  rows={2}
                  className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white/60 placeholder:text-white/15 resize-none focus:outline-none focus:border-[rgba(0,156,202,0.3)] transition-colors"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/30 uppercase tracking-wider">{queue.length} ITENS NA FILA</span>
                <button
                  onClick={handleAiFill}
                  disabled={aiProcessing || isUploading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(280,80%,50%)] hover:bg-[hsl(280,80%,55%)] text-white text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  PREENCHER COM IA
                </button>
              </div>
            </>
          )}

          {/* Queue Items */}
          {queue.length > 0 && (
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {queue.map(item => {
                const thumb = getFileThumb(item.file);
                return (
                  <div key={item.id} className="flex gap-3 p-3 rounded-lg border border-white/[0.06] bg-[rgba(255,255,255,0.02)]">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-[rgba(255,255,255,0.03)] flex-shrink-0 flex items-center justify-center">
                      {thumb ? (
                        <img src={thumb} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FileIcon className="w-6 h-6 text-white/15" />
                      )}
                    </div>

                    {/* Editable fields */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <input
                        value={item.aiTitle}
                        onChange={(e) => updateQueueItem(item.id, { aiTitle: e.target.value })}
                        className="w-full bg-transparent text-sm text-white/80 border-none outline-none font-medium placeholder:text-white/20"
                        placeholder="Título do material"
                      />
                      <input
                        value={item.aiDescription}
                        onChange={(e) => updateQueueItem(item.id, { aiDescription: e.target.value })}
                        className="w-full bg-transparent text-xs text-white/40 border-none outline-none placeholder:text-white/15"
                        placeholder="Descrição (opcional)"
                      />
                      <p className="text-[10px] text-white/20">
                        {getFileTypeLabel(item.file)} • {formatSize(item.file.size)}
                      </p>
                      {item.status === 'uploading' && <Progress value={item.progress} className="h-1 mt-1" />}
                    </div>

                    {/* Status / Remove */}
                    <div className="flex-shrink-0 flex items-start pt-1">
                      {item.status === 'done' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : item.status === 'uploading' ? (
                        <Loader2 className="w-5 h-5 text-[hsl(195,100%,50%)] animate-spin" />
                      ) : (
                        <button onClick={() => removeFromQueue(item.id)} className="text-white/20 hover:text-white/50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Shared options */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-white/25">Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                <SelectTrigger className="h-9 text-xs bg-transparent border-white/10 text-white/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deliverable">Entrega</SelectItem>
                  <SelectItem value="reference">Referência</SelectItem>
                  <SelectItem value="raw">Bruto</SelectItem>
                  <SelectItem value="contract">Contrato</SelectItem>
                  <SelectItem value="finance">Financeiro</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-white/25">Visibilidade</Label>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as any)}>
                <SelectTrigger className="h-9 text-xs bg-transparent border-white/10 text-white/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Interno</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-white/20">{queue.length} materiais</span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-white/40 hover:text-white/60">
                Cancelar
              </Button>
              <Button
                onClick={queue.length > 0 ? handleUploadAll : handleAddLink}
                disabled={isUploading || addLink.isPending || (queue.length === 0 && !linkUrl.trim())}
                className="gap-2 bg-[hsl(195,100%,40%)] hover:bg-[hsl(195,100%,45%)] text-white border-none"
              >
                {(isUploading || addLink.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {queue.length > 0 ? `Enviar (${queue.length})` : 'Adicionar Link'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
