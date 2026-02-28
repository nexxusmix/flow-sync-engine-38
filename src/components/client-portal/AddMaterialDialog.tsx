/**
 * AddMaterialDialog - Modal para adicionar materiais ao portal do cliente
 * 
 * Permite ao gestor enviar:
 * - Upload de arquivo (vai para storage bucket)
 * - Link do YouTube
 * - Link externo (Drive, Vimeo, etc.)
 */

import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Upload, 
  Youtube, 
  Link as LinkIcon, 
  Loader2, 
  FileVideo, 
  FileText,
  X,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEFAULT_CATEGORIES = [
  { value: 'deliverable', label: 'Entrega' },
  { value: 'moodboard', label: 'Moodboard' },
  { value: 'render', label: 'Render' },
  { value: 'video', label: 'Vídeo' },
  { value: 'photo', label: 'Foto' },
  { value: 'reference', label: 'Referência' },
  { value: 'document', label: 'Documento' },
  { value: 'audio', label: 'Áudio' },
];

type MaterialType = 'file' | 'youtube' | 'link';
const UNIVERSAL_ACCEPT = "*/*";

interface AddMaterialDialogProps {
  portalLinkId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddMaterialDialog({
  portalLinkId,
  open,
  onOpenChange,
  onSuccess,
}: AddMaterialDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [materialType, setMaterialType] = useState<MaterialType>('file');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState('deliverable');
  const [customCategory, setCustomCategory] = useState('');

  const resetForm = () => {
    setMaterialType('file');
    setTitle('');
    setDescription('');
    setYoutubeUrl('');
    setExternalUrl('');
    setSelectedFiles([]);
    setCategory('deliverable');
    setCustomCategory('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addMaterial = useMutation({
    mutationFn: async () => {
      const results = [];

      if (materialType === 'file' && selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const path = `portal/${portalLinkId}/${Date.now()}_${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('project-files')
            .upload(path, file);
          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from('project-files')
            .getPublicUrl(path);

          const finalCategory = category === 'custom' ? customCategory.trim().toLowerCase() : category;
          const fileTitle = selectedFiles.length === 1 && title.trim() ? title.trim() : file.name.replace(/\.[^/.]+$/, '');

          const { data: inserted, error } = await supabase
            .from('portal_deliverables')
            .insert({
              portal_link_id: portalLinkId,
              title: fileTitle,
              description: description.trim() || null,
              file_url: data.publicUrl,
              type: file.type,
              visible_in_portal: true,
              awaiting_approval: true,
              status: 'pending',
              current_version: 1,
              material_category: finalCategory || 'deliverable',
            })
            .select()
            .single();
          if (error) throw error;
          results.push(inserted);
        }
      } else {
        const finalCategory = category === 'custom' ? customCategory.trim().toLowerCase() : category;
        const { data: inserted, error } = await supabase
          .from('portal_deliverables')
          .insert({
            portal_link_id: portalLinkId,
            title: title.trim(),
            description: description.trim() || null,
            file_url: null,
            type: null,
            youtube_url: materialType === 'youtube' ? youtubeUrl.trim() : null,
            external_url: materialType === 'link' ? externalUrl.trim() : null,
            visible_in_portal: true,
            awaiting_approval: true,
            status: 'pending',
            current_version: 1,
            material_category: finalCategory || 'deliverable',
          })
          .select()
          .single();
        if (error) throw error;
        results.push(inserted);
      }

      return results;

      const finalCategory = category === 'custom' ? customCategory.trim().toLowerCase() : category;

      // Insert deliverable
      const { data, error } = await supabase
        .from('portal_deliverables')
        .insert({
          portal_link_id: portalLinkId,
          title: title.trim(),
          description: description.trim() || null,
          file_url: null,
          type: null,
          youtube_url: materialType === 'youtube' ? youtubeUrl.trim() : null,
          external_url: materialType === 'link' ? externalUrl.trim() : null,
          visible_in_portal: true,
          awaiting_approval: true,
          status: 'pending',
          current_version: 1,
          material_category: finalCategory || 'deliverable',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Material adicionado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['client-portal'] });
      queryClient.invalidateQueries({ queryKey: ['portal-link'] });
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error adding material:', error);
      toast.error('Erro ao adicionar material');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      if (!title && files.length === 1) {
        const nameWithoutExt = files[0].name.replace(/\.[^/.]+$/, '');
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleFileDrop = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
    if (!title && files.length === 1) {
      const nameWithoutExt = files[0].name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExt);
    }
    setMaterialType('file');
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const isFormValid = () => {
    if (!title.trim() && materialType !== 'file') return false;
    if (materialType === 'file' && selectedFiles.length === 0) return false;
    if (materialType === 'file' && selectedFiles.length > 1) return true; // multi-file doesn't need title
    if (materialType === 'file' && selectedFiles.length === 1 && !title.trim()) return false;
    if (materialType === 'youtube' && !youtubeUrl.trim()) return false;
    if (materialType === 'link' && !externalUrl.trim()) return false;
    return true;
  };

  const typeOptions = [
    { type: 'file' as const, icon: Upload, label: 'Arquivo', desc: 'Upload de vídeo, PDF, imagem' },
    { type: 'youtube' as const, icon: Youtube, label: 'YouTube', desc: 'Cole o link do vídeo' },
    { type: 'link' as const, icon: LinkIcon, label: 'Link Externo', desc: 'Drive, Vimeo, outros' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Material</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Material Type Selection */}
          <div className="grid grid-cols-3 gap-2">
            {typeOptions.map(({ type, icon: Icon, label, desc }) => (
              <button
                key={type}
                type="button"
                onClick={() => setMaterialType(type)}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all text-left",
                  materialType === type
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 mb-2",
                  materialType === type ? "text-primary" : "text-muted-foreground"
                )} />
                <p className={cn(
                  "text-sm font-medium",
                  materialType === type ? "text-foreground" : "text-muted-foreground"
                )}>
                  {label}
                </p>
                <p className="text-[10px] text-muted-foreground">{desc}</p>
              </button>
            ))}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do material"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o material..."
              rows={2}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar categoria" />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
                <SelectItem value="custom">+ Personalizada</SelectItem>
              </SelectContent>
            </Select>
            {category === 'custom' && (
              <Input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Ex: storyboard, briefing..."
                className="mt-2"
              />
            )}
          </div>

          {/* Conditional Fields based on type */}
          {materialType === 'file' && (
            <div className="space-y-2">
              <Label>Arquivo(s) *</Label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept={UNIVERSAL_ACCEPT}
              />
              <div
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary', 'bg-primary/5'); }}
                onDragLeave={(e) => { e.currentTarget.classList.remove('border-primary', 'bg-primary/5'); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                  handleFileDrop(Array.from(e.dataTransfer.files));
                }}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer transition-all hover:border-primary/40 hover:bg-muted/30"
              >
                <Upload className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Arraste arquivos aqui ou clique para selecionar</p>
                <p className="text-[10px] text-muted-foreground/60">Qualquer tipo de arquivo</p>
              </div>
              {selectedFiles.length > 0 && (
                <div className="space-y-1.5">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 border border-border">
                      <FileVideo className="w-5 h-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(idx);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {materialType === 'youtube' && (
            <div className="space-y-2">
              <Label htmlFor="youtube">URL do YouTube *</Label>
              <Input
                id="youtube"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
          )}

          {materialType === 'link' && (
            <div className="space-y-2">
              <Label htmlFor="link">URL Externa *</Label>
              <Input
                id="link"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://drive.google.com/... ou https://vimeo.com/..."
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => addMaterial.mutate()}
            disabled={!isFormValid() || addMaterial.isPending}
          >
            {addMaterial.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Adicionar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
