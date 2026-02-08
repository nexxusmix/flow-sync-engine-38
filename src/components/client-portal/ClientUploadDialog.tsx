/**
 * ClientUploadDialog - Dialog para cliente enviar material
 * 
 * Permite upload de:
 * - Links do YouTube
 * - Links externos (Drive, Vimeo, etc)
 * - Arquivos de referência
 */

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  Youtube, 
  Link2, 
  FileUp, 
  X, 
  Loader2,
  CheckCircle2,
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

const uploadTypes = [
  {
    id: 'youtube' as UploadType,
    label: 'YouTube',
    icon: Youtube,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    placeholder: 'https://youtube.com/watch?v=...',
  },
  {
    id: 'link' as UploadType,
    label: 'Link Externo',
    icon: Link2,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    placeholder: 'https://drive.google.com/...',
  },
  {
    id: 'file' as UploadType,
    label: 'Arquivo',
    icon: FileUp,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    placeholder: 'Selecione um arquivo',
  },
];

function ClientUploadDialogComponent({
  open,
  onOpenChange,
  onUpload,
  isUploading = false,
}: ClientUploadDialogProps) {
  const [selectedType, setSelectedType] = useState<UploadType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setSelectedType(null);
    setTitle('');
    setDescription('');
    setUrl('');
    setFile(null);
    setError(null);
  };

  const handleClose = () => {
    if (!isUploading) {
      resetForm();
      onOpenChange(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType || !title.trim()) {
      setError('Preencha o título');
      return;
    }

    if (selectedType !== 'file' && !url.trim()) {
      setError('Preencha o link');
      return;
    }

    if (selectedType === 'file' && !file) {
      setError('Selecione um arquivo');
      return;
    }

    setError(null);

    try {
      await onUpload({
        type: selectedType,
        title: title.trim(),
        description: description.trim() || undefined,
        url: url.trim() || undefined,
        file: file || undefined,
      });
      handleClose();
    } catch (err) {
      setError('Erro ao enviar. Tente novamente.');
    }
  };

  const selectedTypeConfig = uploadTypes.find(t => t.id === selectedType);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-[#1a1a1a]">
          <DialogTitle className="text-lg font-medium uppercase tracking-wider">
            Enviar Material
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Compartilhe referências, logos ou arquivos com a equipe
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Type Selection */}
          <AnimatePresence mode="wait">
            {!selectedType ? (
              <motion.div
                key="type-selection"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="grid grid-cols-3 gap-3"
              >
                {uploadTypes.map((type) => (
                  <motion.button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 border rounded-none transition-all",
                      "border-[#1a1a1a] hover:border-gray-600",
                      type.bgColor
                    )}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <type.icon className={cn("w-6 h-6", type.color)} />
                    <span className="text-xs uppercase tracking-wider text-gray-400">
                      {type.label}
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                {/* Selected Type Header */}
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5",
                    selectedTypeConfig?.bgColor,
                    "border",
                    selectedTypeConfig?.borderColor
                  )}>
                    {selectedTypeConfig && (
                      <selectedTypeConfig.icon className={cn("w-4 h-4", selectedTypeConfig.color)} />
                    )}
                    <span className="text-xs uppercase tracking-wider text-gray-400">
                      {selectedTypeConfig?.label}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedType(null)}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-wider text-gray-500">
                    Título *
                  </Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Logo principal PNG"
                    className="bg-[#0a0a0a] border-[#1a1a1a] rounded-none focus:border-cyan-500"
                  />
                </div>

                {/* URL or File */}
                {selectedType === 'file' ? (
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-wider text-gray-500">
                      Arquivo *
                    </Label>
                    <div className="relative">
                      <input
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="image/*,video/*,.pdf,.doc,.docx,.zip"
                      />
                      <div className={cn(
                        "flex items-center justify-center gap-2 p-4 border border-dashed",
                        "border-[#1a1a1a] hover:border-gray-600 transition-colors",
                        file && "border-emerald-500/50 bg-emerald-500/5"
                      )}>
                        {file ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm text-gray-400 truncate max-w-[200px]">
                              {file.name}
                            </span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-500">
                              Clique para selecionar
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-wider text-gray-500">
                      URL *
                    </Label>
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder={selectedTypeConfig?.placeholder}
                      className="bg-[#0a0a0a] border-[#1a1a1a] rounded-none focus:border-cyan-500"
                    />
                  </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-wider text-gray-500">
                    Descrição (opcional)
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Adicione detalhes ou instruções..."
                    rows={2}
                    className="bg-[#0a0a0a] border-[#1a1a1a] rounded-none focus:border-cyan-500 resize-none"
                  />
                </div>

                {/* Error */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-red-500"
                  >
                    {error}
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {selectedType && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 pt-4 border-t border-[#1a1a1a] flex justify-end gap-3"
          >
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isUploading}
              className="text-gray-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isUploading}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-none"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar Material
                </>
              )}
            </Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export const ClientUploadDialog = memo(ClientUploadDialogComponent);
