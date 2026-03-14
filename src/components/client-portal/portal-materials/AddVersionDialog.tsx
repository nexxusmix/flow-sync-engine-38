/**
 * AddVersionDialog - Modal para enviar nova versão de um material
 * Com seleção de tags e changelog
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload,
  Youtube,
  Link as LinkIcon,
  Loader2,
  FileVideo,
  X,
  Check,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PortalDeliverable } from "@/hooks/useClientPortalEnhanced";
import { REVISION_TAGS, type ChangelogItem } from "./types";

type MaterialType = 'file' | 'youtube' | 'link';

interface AddVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliverable: PortalDeliverable;
  portalLinkId: string;
  onSuccess?: () => void;
}

export function AddVersionDialog({
  open,
  onOpenChange,
  deliverable,
  portalLinkId,
  onSuccess,
}: AddVersionDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [materialType, setMaterialType] = useState<MaterialType>('file');
  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [changelogItems, setChangelogItems] = useState<ChangelogItem[]>([{ description: '' }]);

  const resetForm = () => {
    setMaterialType('file');
    setTitle('');
    setYoutubeUrl('');
    setExternalUrl('');
    setSelectedFile(null);
    setSelectedTags([]);
    setChangelogItems([{ description: '' }]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addVersion = useMutation({
    mutationFn: async () => {
      let fileUrl: string | null = null;
      let fileType: string | null = null;

      // Upload file if selected
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

      const newVersionNumber = deliverable.current_version + 1;

      // Filter out empty changelog items
      const validChangelog = changelogItems.filter(item => item.description.trim());

      // Create new version record
      const { error: versionError } = await supabase
        .from('portal_deliverable_versions')
        .insert([{
          deliverable_id: deliverable.id,
          version_number: newVersionNumber,
          title: title.trim() || `V${String(newVersionNumber).padStart(2, '0')}`,
          notes: validChangelog.map(c => c.description).join('\n'),
          file_url: fileUrl || (materialType === 'youtube' ? youtubeUrl : externalUrl),
          change_tags: selectedTags,
          changelog_items: validChangelog as any,
        }]);

      if (versionError) throw versionError;

      // Update deliverable with new version and URLs
      const updateData: any = {
        current_version: newVersionNumber,
        status: 'pending',
        awaiting_approval: true,
        updated_at: new Date().toISOString(),
      };

      if (fileUrl) {
        updateData.file_url = fileUrl;
        updateData.type = fileType;
      }
      if (materialType === 'youtube') {
        updateData.youtube_url = youtubeUrl;
      }
      if (materialType === 'link') {
        updateData.external_url = externalUrl;
      }

      const { error: updateError } = await supabase
        .from('portal_deliverables')
        .update(updateData)
        .eq('id', deliverable.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success(`Versão V${String(deliverable.current_version + 1).padStart(2, '0')} enviada!`);
      queryClient.invalidateQueries({ queryKey: ['client-portal'] });
      queryClient.invalidateQueries({ queryKey: ['portal-link'] });
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error adding version:', error);
      toast.error('Erro ao enviar nova versão');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const addChangelogItem = () => {
    setChangelogItems(prev => [...prev, { description: '' }]);
  };

  const updateChangelogItem = (index: number, value: string) => {
    setChangelogItems(prev =>
      prev.map((item, i) => i === index ? { ...item, description: value } : item)
    );
  };

  const removeChangelogItem = (index: number) => {
    if (changelogItems.length > 1) {
      setChangelogItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const isFormValid = () => {
    if (materialType === 'file' && !selectedFile) return false;
    if (materialType === 'youtube' && !youtubeUrl.trim()) return false;
    if (materialType === 'link' && !externalUrl.trim()) return false;
    return true;
  };

  const typeOptions = [
    { type: 'file' as const, icon: Upload, label: 'Arquivo' },
    { type: 'youtube' as const, icon: Youtube, label: 'YouTube' },
    { type: 'link' as const, icon: LinkIcon, label: 'Link' },
  ];

  const nextVersion = deliverable.current_version + 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#0a0a0a] border-[#1a1a1a]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-3">
            Nova Versão
            <Badge className="bg-primary/20 text-primary font-mono">
              V{String(nextVersion).padStart(2, '0')}
            </Badge>
          </DialogTitle>
          <p className="text-sm text-gray-500">{deliverable.title}</p>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Material Type Selection */}
          <div className="flex gap-2">
            {typeOptions.map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                type="button"
                onClick={() => setMaterialType(type)}
                className={cn(
                  "flex-1 p-3 rounded-lg border transition-all flex flex-col items-center gap-2",
                  materialType === type
                    ? "border-primary bg-primary/10"
                    : "border-[#2a2a2a] hover:border-[#3a3a3a]"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5",
                  materialType === type ? "text-primary" : "text-gray-500"
                )} />
                <span className={cn(
                  "text-xs",
                  materialType === type ? "text-white" : "text-gray-500"
                )}>
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* File/URL Input */}
          {materialType === 'file' && (
            <div className="space-y-2">
              <Label className="text-gray-400">Arquivo</Label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="video/*,image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              />
              {selectedFile ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#111] border border-[#2a2a2a]">
                  <FileVideo className="w-8 h-8 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
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
                  className="w-full h-20 border-dashed border-[#2a2a2a]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-center">
                    <Upload className="w-6 h-6 mx-auto mb-1 text-gray-500" />
                    <p className="text-sm text-gray-500">Clique para selecionar</p>
                  </div>
                </Button>
              )}
            </div>
          )}

          {materialType === 'youtube' && (
            <div className="space-y-2">
              <Label className="text-gray-400">URL do YouTube</Label>
              <Input
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="bg-[#111] border-[#2a2a2a]"
              />
            </div>
          )}

          {materialType === 'link' && (
            <div className="space-y-2">
              <Label className="text-gray-400">URL Externa</Label>
              <Input
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="bg-[#111] border-[#2a2a2a]"
              />
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label className="text-gray-400">Título da versão (opcional)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`V${String(nextVersion).padStart(2, '0')} - Final`}
              className="bg-[#111] border-[#2a2a2a]"
            />
          </div>

          {/* Tags Selection */}
          <div className="space-y-2">
            <Label className="text-gray-400">O que foi alterado?</Label>
            <div className="flex flex-wrap gap-2">
              {REVISION_TAGS.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    selectedTags.includes(tag.id)
                      ? cn(tag.color, "text-white")
                      : "bg-[#1a1a1a] text-gray-500 hover:bg-[#2a2a2a]"
                  )}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Changelog Items */}
          <div className="space-y-2">
            <Label className="text-gray-400">Detalhes das alterações</Label>
            <div className="space-y-2">
              {changelogItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <span className="text-cyan-500 mt-2.5">•</span>
                  <Input
                    value={item.description}
                    onChange={(e) => updateChangelogItem(index, e.target.value)}
                    placeholder="Ex: Ajuste de color grading nos takes externos"
                    className="bg-[#111] border-[#2a2a2a] flex-1"
                  />
                  {changelogItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-gray-500 hover:text-red-400"
                      onClick={() => removeChangelogItem(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-cyan-400"
                onClick={addChangelogItem}
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar item
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            className="border-[#2a2a2a]"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => addVersion.mutate()}
            disabled={!isFormValid() || addVersion.isPending}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            {addVersion.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Enviar V{String(nextVersion).padStart(2, '0')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
