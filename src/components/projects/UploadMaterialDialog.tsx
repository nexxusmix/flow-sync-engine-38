import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Upload, Link2, X, FileIcon, Image, Film, Music, FileText, Archive, CheckCircle2, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjectAssets, type ProjectAsset } from "@/hooks/useProjectAssets";
import { toast } from "sonner";

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
}

const ASSET_ICON: Record<string, any> = {
  image: Image,
  video: Film,
  audio: Music,
  pdf: FileText,
  zip: Archive,
  other: FileIcon,
};

export function UploadMaterialDialog({ open, onOpenChange, projectId }: UploadMaterialDialogProps) {
  const { uploadAsset, addLink } = useProjectAssets(projectId);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [category, setCategory] = useState<ProjectAsset['category']>('other');
  const [visibility, setVisibility] = useState<ProjectAsset['visibility']>('internal');
  const [aiProcess, setAiProcess] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Link tab
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');

  const dropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newItems: QueuedFile[] = Array.from(files).map(f => ({
      file: f,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      status: 'pending' as const,
      progress: 0,
    }));
    setQueue(prev => [...prev, ...newItems]);
  }, []);

  const removeFromQueue = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleUploadAll = async () => {
    if (queue.length === 0) return;
    setIsUploading(true);

    for (const item of queue) {
      if (item.status === 'done') continue;
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'uploading', progress: 30 } : q));
      try {
        await uploadAsset.mutateAsync({
          file: item.file,
          projectId,
          category,
          visibility,
          aiProcess,
        });
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'done', progress: 100 } : q));
      } catch {
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error', progress: 0 } : q));
      }
    }

    setIsUploading(false);
    const allDone = queue.every(q => q.status === 'done');
    if (allDone) {
      toast.success(`${queue.length} material(is) enviado(s)!`);
      setTimeout(() => {
        setQueue([]);
        onOpenChange(false);
      }, 800);
    }
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

  const getFileIcon = (file: File) => {
    const t = file.type;
    if (t.startsWith('image/')) return Image;
    if (t.startsWith('video/')) return Film;
    if (t.startsWith('audio/')) return Music;
    if (t === 'application/pdf') return FileText;
    if (t.includes('zip')) return Archive;
    return FileIcon;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">Enviar Material</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="file" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file" className="gap-2"><Upload className="w-4 h-4" /> Arquivo</TabsTrigger>
            <TabsTrigger value="link" className="gap-2"><Link2 className="w-4 h-4" /> Link</TabsTrigger>
          </TabsList>

          {/* File Tab */}
          <TabsContent value="file" className="space-y-4 mt-4">
            {/* Dropzone */}
            <div
              ref={dropRef}
              onClick={() => inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="border-2 border-dashed border-border hover:border-primary/40 rounded-xl p-8 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40"
            >
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Arraste arquivos aqui ou <span className="text-primary">clique para selecionar</span></p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Vídeo, imagem, PDF, áudio, ZIP — múltiplos arquivos</p>
              <input
                ref={inputRef}
                type="file"
                multiple
                hidden
                onChange={(e) => e.target.files && addFiles(e.target.files)}
              />
            </div>

            {/* Queue */}
            {queue.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {queue.map(item => {
                  const Icon = getFileIcon(item.file);
                  return (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border/50">
                      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">{item.file.name}</p>
                        <p className="text-[10px] text-muted-foreground">{formatSize(item.file.size)}</p>
                        {item.status === 'uploading' && <Progress value={item.progress} className="h-1 mt-1" />}
                      </div>
                      {item.status === 'done' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : item.status === 'uploading' ? (
                        <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                      ) : (
                        <button onClick={() => removeFromQueue(item.id)} className="text-muted-foreground hover:text-foreground">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Link Tab */}
          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>URL *</Label>
              <Input
                placeholder="https://youtube.com/watch?v=... ou qualquer link"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Título (opcional)</Label>
              <Input
                placeholder="Nome do material"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Shared options */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Categoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as any)}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
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
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Visibilidade</Label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as any)}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Interno</SelectItem>
                <SelectItem value="client">Cliente</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 p-3 rounded-lg bg-muted/30 border border-border/50">
          <div>
            <p className="text-xs font-medium text-foreground">Processar com IA</p>
            <p className="text-[10px] text-muted-foreground">Gerar título, tags e resumo automaticamente</p>
          </div>
          <Switch checked={aiProcess} onCheckedChange={setAiProcess} />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={queue.length > 0 ? handleUploadAll : handleAddLink}
            disabled={isUploading || addLink.isPending || (queue.length === 0 && !linkUrl.trim())}
            className="gap-2"
          >
            {(isUploading || addLink.isPending) ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {queue.length > 0 ? `Enviar ${queue.length} arquivo(s)` : 'Adicionar Link'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
