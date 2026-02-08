/**
 * QuickRevisionDrawer - Drawer simplificado para solicitar revisão
 * 
 * Permite ao cliente solicitar ajustes de forma rápida e intuitiva
 * diretamente do card do material, sem navegação complexa.
 */

import { memo, useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  FileVideo,
  FileText,
  Image as ImageIcon,
  Youtube,
  Link as LinkIcon,
  X,
  Send,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PortalDeliverable } from "@/hooks/useClientPortalEnhanced";

interface QuickRevisionDrawerProps {
  material: PortalDeliverable | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    deliverableId: string;
    title: string;
    description?: string;
    authorName: string;
    authorEmail?: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
  }) => void;
  isSubmitting?: boolean;
}

const PRIORITIES = [
  { id: 'normal' as const, label: 'Normal', color: 'bg-blue-500', ring: 'ring-blue-500/30' },
  { id: 'high' as const, label: 'Alta', color: 'bg-amber-500', ring: 'ring-amber-500/30' },
  { id: 'urgent' as const, label: 'Urgente', color: 'bg-red-500', ring: 'ring-red-500/30' },
];

function QuickRevisionDrawerComponent({
  material,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: QuickRevisionDrawerProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    authorName: '',
    authorEmail: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
  });

  const getTypeIcon = () => {
    if (!material) return <FileText className="w-5 h-5" />;
    if (material.youtube_url) return <Youtube className="w-5 h-5" />;
    if (material.external_url) return <LinkIcon className="w-5 h-5" />;
    if (material.type?.includes('video')) return <FileVideo className="w-5 h-5" />;
    if (material.type?.includes('image')) return <ImageIcon className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const getYouTubeThumbnail = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
    return null;
  };

  const thumbnail = material?.thumbnail_url ||
    (material?.youtube_url ? getYouTubeThumbnail(material.youtube_url) : null);

  const isVideo = material?.youtube_url || material?.type?.includes('video');

  const handleSubmit = () => {
    if (!material || !formData.title.trim() || !formData.authorName.trim()) return;

    onSubmit({
      deliverableId: material.id,
      title: formData.title,
      description: formData.description || undefined,
      authorName: formData.authorName,
      authorEmail: formData.authorEmail || undefined,
      priority: formData.priority,
    });

    // Reset form
    setFormData({
      title: '',
      description: '',
      authorName: '',
      authorEmail: '',
      priority: 'normal',
    });
  };

  const isValid = formData.title.trim() && formData.authorName.trim();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-[#0a0a0a] border-[#1a1a1a]">
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="pb-2">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-white text-lg">Solicitar Ajuste</DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="px-4 pb-6 space-y-5">
            {/* Material Preview */}
            {material && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#111] border border-[#1a1a1a]"
              >
                {/* Thumbnail */}
                <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                  {thumbnail ? (
                    <>
                      <img
                        src={thumbnail}
                        alt={material.title}
                        className="w-full h-full object-cover"
                      />
                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                            <Play className="w-3 h-3 text-gray-900 ml-0.5" />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-600">{getTypeIcon()}</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{material.title}</p>
                  <Badge className="mt-1 bg-[#1a1a1a] border border-cyan-500/30 text-cyan-400 text-[10px] font-mono">
                    V{String(material.current_version).padStart(2, '0')}
                  </Badge>
                </div>
              </motion.div>
            )}

            {/* Title Field */}
            <div className="space-y-2">
              <label className="text-xs text-gray-500 flex items-center gap-1">
                O que precisa mudar? <span className="text-red-400">*</span>
              </label>
              <Textarea
                placeholder="Ex: O logo precisa ser mais claro no segundo 0:15..."
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600 resize-none focus:border-cyan-500/50 focus:ring-cyan-500/20 min-h-[100px]"
                rows={4}
              />
            </div>

            {/* Priority Selection */}
            <div className="space-y-2">
              <label className="text-xs text-gray-500">Prioridade</label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setFormData(prev => ({ ...prev, priority: p.id }))}
                    className={cn(
                      "flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-all",
                      formData.priority === p.id
                        ? `${p.color} text-white ring-2 ${p.ring}`
                        : "bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-gray-300"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Author Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs text-gray-500 flex items-center gap-1">
                  Seu nome <span className="text-red-400">*</span>
                </label>
                <Input
                  placeholder="Nome"
                  value={formData.authorName}
                  onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                  className="bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-500">E-mail</label>
                <Input
                  placeholder="E-mail (opcional)"
                  type="email"
                  value={formData.authorEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, authorEmail: e.target.value }))}
                  className="bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-medium h-11"
              onClick={handleSubmit}
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Solicitação
                </>
              )}
            </Button>

            {/* Helper Text */}
            <p className="text-[10px] text-gray-600 text-center">
              Sua solicitação será enviada para a equipe responsável.
            </p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export const QuickRevisionDrawer = memo(QuickRevisionDrawerComponent);
