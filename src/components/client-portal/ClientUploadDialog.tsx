/**
 * ClientUploadDialog - Dialog para cliente enviar materiais
 * Upload resiliente com progresso, retry, status por item
 */

import { memo, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  Youtube, 
  Link2, 
  FileUp, 
  X, 
  Loader2,
  CheckCircle2,
  Sparkles,
  Trash2,
  Image,
  Film,
  FileText,
  File as FileIcon,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type UploadType = 'youtube' | 'link' | 'file';
type ItemStatus = 'queued' | 'uploading' | 'success' | 'error';

export interface QueuedItem {
  id: string;
  type: UploadType;
  title: string;
  description: string;
  url: string;
  file?: File;
  preview?: string;
  status: ItemStatus;
  error?: string;
}

interface ClientUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (data: {
    type: UploadType;
    title: string;
    description?: string;
    url?: string;
    file?: File;
  }) => Promise<void>;
  isUploading?: boolean;
}

function guessTitle(file: File): string {
  const name = file.name.replace(/\.[^.]+$/, '');
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

function guessDescription(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
  
  if (file.type.startsWith('image/')) return `Imagem ${ext.toUpperCase()} • ${sizeMB} MB`;
  if (file.type.startsWith('video/')) return `Vídeo ${ext.toUpperCase()} • ${sizeMB} MB`;
  if (file.type === 'application/pdf') return `Documento PDF • ${sizeMB} MB`;
  if (ext === 'doc' || ext === 'docx') return `Documento Word • ${sizeMB} MB`;
  if (ext === 'zip' || ext === 'rar') return `Arquivo compactado • ${sizeMB} MB`;
  return `Arquivo ${ext.toUpperCase()} • ${sizeMB} MB`;
}

function getFileIcon(file?: File) {
  if (!file) return FileIcon;
  if (file.type.startsWith('image/')) return Image;
  if (file.type.startsWith('video/')) return Film;
  if (file.type === 'application/pdf' || file.name.endsWith('.doc') || file.name.endsWith('.docx')) return FileText;
  return FileIcon;
}

const MAX_RETRIES = 2;

function ClientUploadDialogComponent({
  open,
  onOpenChange,
  onUpload,
  isUploading = false,
}: ClientUploadDialogProps) {
  const [queue, setQueue] = useState<QueuedItem[]>([]);
  const [linkMode, setLinkMode] = useState<'youtube' | 'link' | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDesc, setLinkDesc] = useState('');
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isFillingAI, setIsFillingAI] = useState(false);
  const [aiContext, setAiContext] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false); // idempotency guard

  const resetForm = () => {
    setQueue([]);
    setLinkMode(null);
    setLinkUrl('');
    setLinkTitle('');
    setLinkDesc('');
    setSending(false);
    setSentCount(0);
    setError(null);
    submittingRef.current = false;
  };

  const handleClose = () => {
    if (!sending) {
      resetForm();
      onOpenChange(false);
    }
  };

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newItems: QueuedItem[] = Array.from(files).map(file => {
      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: 'file' as UploadType,
        title: guessTitle(file),
        description: guessDescription(file),
        url: '',
        file,
        preview,
        status: 'queued' as ItemStatus,
      };
    });
    setQueue(prev => [...prev, ...newItems]);
    setLinkMode(null);
  }, []);

  const addLink = () => {
    if (!linkMode || !linkUrl.trim()) { setError('Preencha o link'); return; }
    const title = linkTitle.trim() || (linkMode === 'youtube' ? 'Vídeo YouTube' : 'Link externo');
    setQueue(prev => [...prev, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: linkMode,
      title,
      description: linkDesc,
      url: linkUrl.trim(),
      status: 'queued' as ItemStatus,
    }]);
    setLinkUrl('');
    setLinkTitle('');
    setLinkDesc('');
    setLinkMode(null);
    setError(null);
  };

  const removeItem = (id: string) => {
    setQueue(prev => {
      const item = prev.find(i => i.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter(i => i.id !== id);
    });
  };

  const updateItem = (id: string, field: keyof QueuedItem, value: string) => {
    setQueue(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const setItemStatus = (id: string, status: ItemStatus, errorMsg?: string) => {
    setQueue(prev => prev.map(i => i.id === id ? { ...i, status, error: errorMsg } : i));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:mime;base64, prefix
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const fillAllWithAI = async () => {
    const fileItems = queue.filter(i => i.file);
    if (fileItems.length === 0) {
      // Fallback for links
      setQueue(prev => prev.map(item => {
        if (item.type === 'youtube') {
          return { ...item, title: item.title || 'Referência YouTube', description: item.description || 'Vídeo de referência para a equipe de produção' };
        }
        return { ...item, title: item.title || 'Link de referência', description: item.description || 'Material externo compartilhado pelo cliente' };
      }));
      return;
    }

    setIsFillingAI(true);
    try {
      // Build payload with base64 for images under 2MB
      const filesPayload = await Promise.all(fileItems.map(async (i) => {
        const payload: any = {
          fileName: i.file!.name,
          mimeType: i.file!.type,
          fileSize: `${(i.file!.size / (1024 * 1024)).toFixed(1)} MB`,
        };
        // Convert images under 2MB to base64 for AI vision
        if (i.file!.type.startsWith('image/') && i.file!.size <= 2 * 1024 * 1024) {
          try {
            payload.imageBase64 = await fileToBase64(i.file!);
          } catch (e) {
            console.warn('[AI Fill] Failed to convert image to base64:', e);
          }
        }
        return payload;
      }));

      const { data, error: fnError } = await supabase.functions.invoke('ai-fill-materials', {
        body: { 
          files: filesPayload,
          projectContext: aiContext.trim() || undefined,
        },
      });

      if (fnError || !data?.results) {
        console.warn('[AI Fill] Failed:', fnError || data?.error);
        setQueue(prev => prev.map(item => ({
          ...item,
          title: item.title || (item.file ? guessTitle(item.file) : item.title),
          description: item.description || (item.file ? guessDescription(item.file) : item.description),
        })));
        return;
      }

      const results = data.results as { title: string; description: string }[];
      setQueue(prev => {
        const updated = [...prev];
        let aiIdx = 0;
        for (let i = 0; i < updated.length; i++) {
          if (updated[i].file && results[aiIdx]) {
            updated[i] = {
              ...updated[i],
              title: results[aiIdx].title || updated[i].title,
              description: results[aiIdx].description || updated[i].description,
            };
            aiIdx++;
          }
        }
        return updated;
      });

      toast.success('Títulos e descrições preenchidos com IA!');
    } catch (err) {
      console.error('[AI Fill] Error:', err);
      toast.error('Erro ao preencher com IA');
    } finally {
      setIsFillingAI(false);
    }
  };

  const uploadSingleItem = async (item: QueuedItem, retryCount = 0): Promise<boolean> => {
    setItemStatus(item.id, 'uploading');
    try {
      console.log(`[Upload] Sending item: "${item.title}" (type=${item.type}, retry=${retryCount})`);
      await onUpload({
        type: item.type,
        title: item.title.trim(),
        description: item.description.trim() || undefined,
        url: item.url.trim() || undefined,
        file: item.file,
      });
      setItemStatus(item.id, 'success');
      console.log(`[Upload] Success: "${item.title}"`);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error(`[Upload] Failed: "${item.title}" (retry=${retryCount}):`, errorMsg);
      
      // Auto-retry for transient errors
      if (retryCount < MAX_RETRIES) {
        console.log(`[Upload] Retrying "${item.title}" (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
        return uploadSingleItem(item, retryCount + 1);
      }
      
      setItemStatus(item.id, 'error', errorMsg);
      return false;
    }
  };

  const handleSubmitAll = async () => {
    const pendingItems = queue.filter(i => i.status === 'queued' || i.status === 'error');
    if (pendingItems.length === 0) { setError('Adicione pelo menos um material'); return; }
    const missing = pendingItems.find(i => !i.title.trim());
    if (missing) { setError('Todos os itens precisam de título'); return; }
    
    // Idempotency guard
    if (submittingRef.current) {
      console.log('[Upload] Double-click blocked');
      return;
    }
    submittingRef.current = true;

    setError(null);
    setSending(true);
    setSentCount(0);

    console.log(`[Upload] Starting batch upload: ${pendingItems.length} items`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < pendingItems.length; i++) {
      const success = await uploadSingleItem(pendingItems[i]);
      if (success) successCount++;
      else failCount++;
      setSentCount(i + 1);
    }

    console.log(`[Upload] Batch complete: ${successCount} success, ${failCount} failed`);

    setSending(false);
    submittingRef.current = false;

    if (failCount === 0) {
      toast.success(`${successCount} ${successCount === 1 ? 'material enviado' : 'materiais enviados'} com sucesso!`);
      handleClose();
    } else {
      setError(`${failCount} ${failCount === 1 ? 'item falhou' : 'itens falharam'} — clique para reenviar`);
      toast.error(`${failCount} ${failCount === 1 ? 'item falhou' : 'itens falharam'}. Tente novamente.`);
    }
  };

  const retryFailedItem = async (itemId: string) => {
    const item = queue.find(i => i.id === itemId);
    if (!item) return;
    setSending(true);
    await uploadSingleItem(item);
    setSending(false);
    
    // Check if all done
    const remaining = queue.filter(i => i.status === 'error');
    if (remaining.length === 0) {
      toast.success('Todos os materiais enviados com sucesso!');
      handleClose();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  const pendingCount = queue.filter(i => i.status === 'queued' || i.status === 'error').length;
  const successCount = queue.filter(i => i.status === 'success').length;
  const failedCount = queue.filter(i => i.status === 'error').length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white max-w-lg p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b border-[#1a1a1a] shrink-0">
          <DialogTitle className="text-lg font-medium uppercase tracking-wider">
            Enviar Materiais
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Arraste ou selecione vários arquivos de uma vez
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* Drop zone - hide during upload */}
          {!sending && (
            <>
              <div
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-cyan-500'); }}
                onDragLeave={e => e.currentTarget.classList.remove('border-cyan-500')}
                onDrop={e => { e.currentTarget.classList.remove('border-cyan-500'); handleDrop(e); }}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-[#1a1a1a] hover:border-gray-600 rounded-lg p-6 text-center cursor-pointer transition-colors"
              >
                <Upload className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Arraste arquivos aqui ou clique para selecionar</p>
                <p className="text-[10px] text-gray-600 mt-1">Imagens, vídeos, PDFs, documentos, ZIPs...</p>
              </div>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} accept="*/*" />

              {/* Add link buttons */}
              <div className="flex gap-2">
                <button onClick={() => setLinkMode('youtube')}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 border text-xs uppercase tracking-wider transition-colors",
                    linkMode === 'youtube' ? "border-red-500/40 bg-red-500/10 text-red-400" : "border-[#1a1a1a] text-gray-500 hover:border-gray-600")}>
                  <Youtube className="w-3.5 h-3.5" /> YouTube
                </button>
                <button onClick={() => setLinkMode('link')}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 border text-xs uppercase tracking-wider transition-colors",
                    linkMode === 'link' ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400" : "border-[#1a1a1a] text-gray-500 hover:border-gray-600")}>
                  <Link2 className="w-3.5 h-3.5" /> Link
                </button>
              </div>

              {/* Link form */}
              <AnimatePresence>
                {linkMode && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                    <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder={linkMode === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://drive.google.com/...'} className="bg-[#0a0a0a] border-[#1a1a1a] rounded-none focus:border-cyan-500" />
                    <div className="flex gap-2">
                      <Input value={linkTitle} onChange={e => setLinkTitle(e.target.value)} placeholder="Título (opcional)" className="bg-[#0a0a0a] border-[#1a1a1a] rounded-none focus:border-cyan-500 flex-1" />
                      <Button size="sm" onClick={addLink} className="bg-cyan-500 hover:bg-cyan-600 text-black rounded-none shrink-0">
                        Adicionar
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* Queue items */}
          {queue.length > 0 && (
            <div className="space-y-3">
              {/* Contexto rápido para IA */}
              {!sending && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-gray-500">Contexto para IA (opcional)</Label>
                  <textarea
                    value={aiContext}
                    onChange={(e) => setAiContext(e.target.value)}
                    placeholder="Ex: Materiais da campanha de lançamento do produto X para Instagram..."
                    rows={2}
                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-md px-3 py-2 text-sm text-white/70 placeholder:text-gray-600 resize-none focus:outline-none focus:border-purple-500/40 transition-colors"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                  {queue.length} {queue.length === 1 ? 'item' : 'itens'} na fila
                  {successCount > 0 && <span className="text-primary ml-1">• {successCount} enviados</span>}
                  {failedCount > 0 && <span className="text-red-500 ml-1">• {failedCount} falharam</span>}
                </span>
                {!sending && (
                  <button 
                    onClick={fillAllWithAI} 
                    disabled={isFillingAI}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[10px] uppercase tracking-wider font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                    {isFillingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {isFillingAI ? 'Preenchendo...' : 'Preencher com IA'}
                  </button>
                )}
              </div>

              {queue.map((item, i) => {
                const Icon = item.file ? getFileIcon(item.file) : item.type === 'youtube' ? Youtube : Link2;
                const isItemSending = item.status === 'uploading';
                const isItemDone = item.status === 'success';
                const isItemFailed = item.status === 'error';

                return (
                  <motion.div 
                    key={item.id} 
                    initial={{ opacity: 0, y: 8 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.03 }} 
                    className={cn(
                      "border p-3 space-y-2 transition-colors",
                      isItemDone ? "border-primary/20 bg-primary/[0.03]" :
                      isItemFailed ? "border-destructive/20 bg-destructive/[0.03]" :
                      isItemSending ? "border-primary/20 bg-primary/[0.03]" :
                      "border-[#1a1a1a]"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Preview or icon */}
                      <div className="w-12 h-12 rounded bg-white/5 flex items-center justify-center shrink-0 overflow-hidden relative">
                        {item.preview ? (
                          <img src={item.preview} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Icon className={cn("w-5 h-5", item.type === 'youtube' ? 'text-destructive' : 'text-primary')} />
                        )}
                        {/* Status overlay */}
                        {isItemSending && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          </div>
                        )}
                        {isItemDone && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        {isItemFailed && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        {!sending ? (
                          <>
                            <Input value={item.title} onChange={e => updateItem(item.id, 'title', e.target.value)} placeholder="Título *" className="bg-transparent border-[#1a1a1a] rounded-none focus:border-cyan-500 h-8 text-sm px-2" />
                            <Input value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Descrição (opcional)" className="bg-transparent border-[#1a1a1a] rounded-none focus:border-cyan-500 h-8 text-xs text-gray-400 px-2" />
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-white truncate">{item.title}</p>
                            <p className="text-xs text-gray-500 truncate">{item.description}</p>
                          </>
                        )}
                      </div>
                      <div className="shrink-0 mt-1 flex items-center gap-1">
                        {isItemFailed && (
                          <button 
                            onClick={() => retryFailedItem(item.id)} 
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Tentar novamente"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        {!sending && !isItemDone && (
                          <button onClick={() => removeItem(item.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {item.file && (
                      <div className="flex items-center gap-2 pl-[60px]">
                        <p className="text-[10px] text-gray-600">{item.file.name} • {(item.file.size / (1024 * 1024)).toFixed(1)} MB</p>
                        {isItemFailed && item.error && (
                          <p className="text-[10px] text-red-500">— {item.error}</p>
                        )}
                      </div>
                    )}
                    {!item.file && isItemFailed && item.error && (
                      <p className="text-[10px] text-red-500 pl-[60px]">{item.error}</p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Error */}
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-500">
              {error}
            </motion.p>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-[#1a1a1a] flex items-center justify-between shrink-0">
          <span className="text-[10px] text-gray-600">
            {sending 
              ? `Enviando ${sentCount} de ${queue.filter(i => i.status !== 'success').length}...` 
              : `${queue.length} ${queue.length === 1 ? 'material' : 'materiais'}`
            }
          </span>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={handleClose} disabled={sending} className="text-gray-400 hover:text-white">
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmitAll} 
              disabled={sending || pendingCount === 0} 
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-none"
            >
              {sending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando {sentCount}/{queue.filter(i => i.status !== 'success').length}</>
              ) : failedCount > 0 ? (
                <><RotateCcw className="w-4 h-4 mr-2" /> Reenviar ({failedCount})</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" /> Enviar {pendingCount > 0 ? `(${pendingCount})` : ''}</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const ClientUploadDialog = memo(ClientUploadDialogComponent);
