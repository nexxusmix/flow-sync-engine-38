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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState('deliverable');
  const [customCategory, setCustomCategory] = useState('');

  const resetForm = () => {
    setMaterialType('file');
    setTitle('');
    setDescription('');
    setYoutubeUrl('');
    setExternalUrl('');
    setSelectedFile(null);
    setCategory('deliverable');
    setCustomCategory('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addMaterial = useMutation({
    mutationFn: async () => {
      let fileUrl: string | null = null;
      let fileType: string | null = null;

      // If file upload, upload first
      if (materialType === 'file' && selectedFile) {
        const path = `portal/${portalLinkId}/${Date.now()}_${selectedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(path, selectedFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('project-files')
          .getPublicUrl(path);
        
        fileUrl = data.publicUrl;
        fileType = selectedFile.type;
      }

      const finalCategory = category === 'custom' ? customCategory.trim().toLowerCase() : category;

      // Insert deliverable
      const { data, error } = await supabase
        .from('portal_deliverables')
        .insert({
          portal_link_id: portalLinkId,
          title: title.trim(),
          description: description.trim() || null,
          file_url: fileUrl,
          type: fileType,
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
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title) {
        // Auto-fill title with filename without extension
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setTitle(nameWithoutExt);
      }
    }
  };

  const isFormValid = () => {
    if (!title.trim()) return false;
    if (materialType === 'file' && !selectedFile) return false;
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
              <Label>Arquivo *</Label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="video/*,image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              />
              {selectedFile ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <FileVideo className="w-8 h-8 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-20 border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-center">
                    <Upload className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Clique para selecionar</p>
                  </div>
                </Button>
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
