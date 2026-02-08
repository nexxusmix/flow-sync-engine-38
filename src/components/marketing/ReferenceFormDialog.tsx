import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { InstagramReference } from "@/types/marketing";
import { REFERENCE_MEDIA_TYPES } from "@/types/reference-links";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Upload, Link2 } from "lucide-react";

interface ReferenceFormData {
  permalink: string;
  caption: string;
  thumbnail_url: string;
  note: string;
  tags: string;
  media_type: string;
}

const defaultFormData: ReferenceFormData = {
  permalink: '',
  caption: '',
  thumbnail_url: '',
  note: '',
  tags: '',
  media_type: 'post',
};

interface ReferenceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reference?: InstagramReference | null;
  onSaved: (ref: InstagramReference) => void;
}

export function ReferenceFormDialog({
  open,
  onOpenChange,
  reference,
  onSaved,
}: ReferenceFormDialogProps) {
  const [formData, setFormData] = useState<ReferenceFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!reference;

  useEffect(() => {
    if (reference) {
      setFormData({
        permalink: reference.permalink || '',
        caption: reference.caption || '',
        thumbnail_url: reference.thumbnail_url || '',
        note: reference.note || '',
        tags: reference.tags?.join(', ') || '',
        media_type: reference.media_type || 'post',
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [reference, open]);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `references/${Date.now()}.${ext}`;
      
      const { error } = await supabase.storage
        .from('marketing-assets')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('marketing-assets')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, thumbnail_url: urlData.publicUrl }));
      toast.success('Imagem enviada!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar imagem');
    } finally {
      setIsUploading(false);
    }
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!formData.permalink) {
      toast.error('URL do post é obrigatória');
      return;
    }

    if (!validateUrl(formData.permalink)) {
      toast.error('URL inválida');
      return;
    }

    setIsSaving(true);
    try {
      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const payload = {
        permalink: formData.permalink,
        caption: formData.caption || null,
        thumbnail_url: formData.thumbnail_url || null,
        note: formData.note || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        media_type: formData.media_type,
      };

      let result;

      if (isEditing && reference) {
        const { data, error } = await supabase
          .from('instagram_references')
          .update(payload)
          .eq('id', reference.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
        toast.success('Referência atualizada!');
      } else {
        const { data, error } = await supabase
          .from('instagram_references')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        result = data;
        toast.success('Referência salva!');
      }

      onSaved(result as InstagramReference);
      onOpenChange(false);
      setFormData(defaultFormData);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar referência');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFormData(defaultFormData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Referência' : 'Nova Referência'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleThumbnailUpload}
          />

          <div>
            <Label>URL do Post *</Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={formData.permalink}
                onChange={(e) => setFormData(prev => ({ ...prev, permalink: e.target.value }))}
                placeholder="https://instagram.com/p/..."
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label>Tipo</Label>
            <Select 
              value={formData.media_type} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, media_type: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {REFERENCE_MEDIA_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Thumbnail</Label>
            <div className="flex gap-2">
              <Input
                value={formData.thumbnail_url}
                onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                placeholder="URL da imagem ou faça upload"
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
              </Button>
            </div>
            {formData.thumbnail_url && (
              <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden bg-muted">
                <img 
                  src={formData.thumbnail_url} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <Label>Legenda / Descrição</Label>
            <Textarea
              value={formData.caption}
              onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
              placeholder="Copie a legenda ou descreva o conteúdo"
              rows={3}
            />
          </div>

          <div>
            <Label>Nota / Por que salvar</Label>
            <Input
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              placeholder="Ex: Boa estrutura de carrossel"
            />
          </div>

          <div>
            <Label>Tags (separadas por vírgula)</Label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="storytelling, carrossel, educacional"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? 'Salvar Alterações' : 'Salvar Referência'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
