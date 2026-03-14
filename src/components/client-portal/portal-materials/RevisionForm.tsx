/**
 * RevisionForm - Formulário avançado de revisão
 * 
 * Features:
 * - Timecode marcado
 * - Screenshot/anotação anexada
 * - Seleção de prioridade
 * - Descrição detalhada
 */

import { memo, useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  ImageIcon,
  AlertTriangle,
  Send,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Priority = 'normal' | 'high' | 'urgent';

interface RevisionFormProps {
  materialId: string;
  materialTitle: string;
  timestampMs?: number;
  screenshotUrl?: string;
  onSubmit: (data: {
    authorName: string;
    authorEmail?: string;
    content: string;
    priority: Priority;
    timecode?: string;
    screenshotUrl?: string;
    frameTimestampMs?: number;
  }) => void;
  onCancel: () => void;
  onChangeTimestamp?: () => void;
  isSubmitting?: boolean;
}

function formatTimecode(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const PRIORITIES: { id: Priority; label: string; color: string }[] = [
  { id: 'normal', label: 'Normal', color: 'bg-muted-foreground' },
  { id: 'high', label: 'Alta', color: 'bg-muted-foreground' },
  { id: 'urgent', label: 'Urgente', color: 'bg-destructive' },
];

function RevisionFormComponent({
  materialId,
  materialTitle,
  timestampMs,
  screenshotUrl,
  onSubmit,
  onCancel,
  onChangeTimestamp,
  isSubmitting = false,
}: RevisionFormProps) {
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<Priority>('normal');

  const hasTimestamp = timestampMs !== undefined;
  const hasScreenshot = !!screenshotUrl;

  const handleSubmit = () => {
    if (!authorName.trim() || !content.trim()) return;

    onSubmit({
      authorName: authorName.trim(),
      authorEmail: authorEmail.trim() || undefined,
      content: content.trim(),
      priority,
      timecode: hasTimestamp ? formatTimecode(timestampMs!) : undefined,
      screenshotUrl,
      frameTimestampMs: timestampMs,
    });
  };

  const isValid = authorName.trim().length > 0 && content.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-medium text-white">Solicitar Ajuste</h3>
            <p className="text-xs text-gray-500">{materialTitle}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-500 hover:text-white"
          onClick={onCancel}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Timestamp & Screenshot */}
      {(hasTimestamp || hasScreenshot) && (
        <div className="p-4 border-b border-[#1a1a1a] bg-[#111]">
          <div className="flex gap-4">
            {/* Screenshot Preview */}
            {hasScreenshot && (
              <div className="w-32 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-black">
                <img
                  src={screenshotUrl}
                  alt="Frame anotado"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Timestamp Info */}
            <div className="flex-1 flex flex-col justify-center">
              {hasTimestamp && (
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-cyan-500" />
                  <span className="text-sm text-white font-mono">
                    {formatTimecode(timestampMs!)}
                  </span>
                  {onChangeTimestamp && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs text-cyan-400"
                      onClick={onChangeTimestamp}
                    >
                      Alterar
                    </Button>
                  )}
                </div>
              )}
              {hasScreenshot && (
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-gray-400">
                    Anotação visual anexada
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form Body */}
      <div className="p-4 space-y-4">
        {/* Author Info */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Seu nome *"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="bg-[#111] border-[#2a2a2a] text-sm"
          />
          <Input
            placeholder="E-mail (opcional)"
            type="email"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            className="bg-[#111] border-[#2a2a2a] text-sm"
          />
        </div>

        {/* Description */}
        <Textarea
          placeholder="Descreva detalhadamente o ajuste necessário..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="bg-[#111] border-[#2a2a2a] text-sm resize-none"
        />

        {/* Priority */}
        <div className="space-y-2">
          <label className="text-xs text-gray-500">Prioridade</label>
          <div className="flex gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPriority(p.id)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all",
                  priority === p.id
                    ? `${p.color} text-white`
                    : "bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a]"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-2 p-4 border-t border-[#1a1a1a]">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          size="sm"
          className={cn(
            "transition-colors",
            priority === 'urgent'
              ? "bg-destructive hover:bg-destructive/90"
              : priority === 'high'
                ? "bg-muted-foreground hover:bg-muted-foreground/90"
                : "bg-primary hover:bg-primary/90"
          )}
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Enviar Ajuste
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

export const RevisionForm = memo(RevisionFormComponent);
