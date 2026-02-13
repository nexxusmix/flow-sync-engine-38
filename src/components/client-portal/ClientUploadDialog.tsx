/**
 * ClientUploadDialog - Dialog para cliente enviar materiais
 * Suporta múltiplos arquivos simultâneos com preenchimento IA
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type UploadType = 'youtube' | 'link' | 'file';

export interface QueuedItem {
  id: string;
  type: UploadType;
  title: string;
  description: string;
  url: string;
  file?: File;
  preview?: string;
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
  const fileRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setQueue([]);
    setLinkMode(null);
    setLinkUrl('');
    setLinkTitle('');
    setLinkDesc('');
    setSending(false);
    setSentCount(0);
    setError(null);
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

  const fillAllWithAI = () => {
    setQueue(prev => prev.map(item => {
      if (item.file) {
        return {
          ...item,
          title: item.title || guessTitle(item.file),
          description: item.description || guessDescription(item.file),
        };
      }
      if (item.type === 'youtube') {
        return { ...item, title: item.title || 'Referência YouTube', description: item.description || 'Vídeo de referência para a equipe de produção' };
      }
      return { ...item, title: item.title || 'Link de referência', description: item.description || 'Material externo compartilhado pelo cliente' };
    }));
  };

  const handleSubmitAll = async () => {
    if (queue.length === 0) { setError('Adicione pelo menos um material'); return; }
    const missing = queue.find(i => !i.title.trim());
    if (missing) { setError('Todos os itens precisam de título'); return; }
    setError(null);
    setSending(true);
    setSentCount(0);

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      try {
        await onUpload({
          type: item.type,
          title: item.title.trim(),
          description: item.description.trim() || undefined,
          url: item.url.trim() || undefined,
          file: item.file,
        });
        setSentCount(i + 1);
      } catch {
        setError(`Erro ao enviar "${item.title}"`);
        setSending(false);
        return;
      }
    }

    setSending(false);
    handleClose();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

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
          {/* Drop zone */}
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
          <input ref={fileRef} type="file" multiple className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} accept="image/*,video/*,.pdf,.doc,.docx,.zip,.rar,.psd,.ai,.eps,.svg" />

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

          {/* Queue items */}
          {queue.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">{queue.length} {queue.length === 1 ? 'item' : 'itens'} na fila</span>
                <button onClick={fillAllWithAI} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 text-[10px] uppercase tracking-wider font-medium hover:bg-purple-500/20 transition-colors">
                  <Sparkles className="w-3 h-3" /> Preencher com IA
                </button>
              </div>

              {queue.map((item, i) => {
                const Icon = item.file ? getFileIcon(item.file) : item.type === 'youtube' ? Youtube : Link2;
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="border border-[#1a1a1a] p-3 space-y-2">
                    <div className="flex items-start gap-3">
                      {/* Preview or icon */}
                      <div className="w-12 h-12 rounded bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                        {item.preview ? (
                          <img src={item.preview} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Icon className={cn("w-5 h-5", item.type === 'youtube' ? 'text-red-500' : item.type === 'link' ? 'text-cyan-500' : 'text-purple-500')} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <Input value={item.title} onChange={e => updateItem(item.id, 'title', e.target.value)} placeholder="Título *" className="bg-transparent border-[#1a1a1a] rounded-none focus:border-cyan-500 h-8 text-sm px-2" />
                        <Input value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Descrição (opcional)" className="bg-transparent border-[#1a1a1a] rounded-none focus:border-cyan-500 h-8 text-xs text-gray-400 px-2" />
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-gray-600 hover:text-red-400 transition-colors shrink-0 mt-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {item.file && (
                      <p className="text-[10px] text-gray-600 pl-[60px]">{item.file.name} • {(item.file.size / (1024 * 1024)).toFixed(1)} MB</p>
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
            {sending ? `Enviando ${sentCount + 1} de ${queue.length}...` : `${queue.length} ${queue.length === 1 ? 'material' : 'materiais'}`}
          </span>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={handleClose} disabled={sending} className="text-gray-400 hover:text-white">
              Cancelar
            </Button>
            <Button onClick={handleSubmitAll} disabled={sending || queue.length === 0} className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-none">
              {sending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando {sentCount + 1}/{queue.length}</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" /> Enviar {queue.length > 0 ? `(${queue.length})` : ''}</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const ClientUploadDialog = memo(ClientUploadDialogComponent);
