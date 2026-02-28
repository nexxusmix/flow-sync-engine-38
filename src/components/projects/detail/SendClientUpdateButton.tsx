/**
 * SendClientUpdateButton - Botão para enviar atualização ao cliente
 * Gera mensagem com IA e permite copiar/enviar
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Loader2, Copy, Check, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SendClientUpdateButtonProps {
  projectId: string;
  projectName: string;
  clientName: string;
  currentStage?: string;
  progress?: number;
  className?: string;
}

export function SendClientUpdateButton({
  projectId,
  projectName,
  clientName,
  currentStage,
  progress,
  className,
}: SendClientUpdateButtonProps) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [variants, setVariants] = useState<{ short: string; normal: string; long: string } | null>(null);
  const [selected, setSelected] = useState<'short' | 'normal' | 'long'>('normal');
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-client-message', {
        body: {
          goal: 'atualização de progresso do projeto',
          projectContext: {
            name: projectName,
            client: clientName,
            currentStage,
            progress: progress ? `${progress}%` : undefined,
          },
          useEmoji: true,
          length: 'normal',
        },
      });
      if (error) throw error;
      setVariants(data.variants);
      setCustomMessage(data.variants.normal || '');
    } catch (err) {
      console.error('Generate message error:', err);
      toast.error('Erro ao gerar mensagem');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    const text = customMessage || variants?.[selected] || '';
    await navigator.clipboard.writeText(text);
    setCopied(true);
    
    // Log as sent
    try {
      await supabase.from('client_messages').insert({
        project_id: projectId,
        content: text,
        channel: 'whatsapp',
        ai_goal: 'atualização de progresso',
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    } catch { /* silent */ }
    
    toast.success('Mensagem copiada! Cole no WhatsApp.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpen = () => {
    setOpen(true);
    setVariants(null);
    setCopied(false);
    handleGenerate();
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen} className={className}>
        <Send className="w-4 h-4 mr-2" />
        Enviar Update ao Cliente
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Mensagem para {clientName || 'Cliente'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Gerando mensagem com IA...</p>
              </div>
            ) : variants ? (
              <>
                {/* Variant selector */}
                <div className="flex gap-2">
                  {(['short', 'normal', 'long'] as const).map((v) => (
                    <Badge
                      key={v}
                      variant={selected === v ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelected(v);
                        setCustomMessage(variants[v] || '');
                      }}
                    >
                      {v === 'short' ? 'Curta' : v === 'normal' ? 'Normal' : 'Completa'}
                    </Badge>
                  ))}
                </div>

                {/* Editable message */}
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={8}
                  className="text-sm"
                />

                {/* Re-generate */}
                <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={isGenerating}>
                  <Sparkles className="w-4 h-4 mr-1" />
                  Gerar novamente
                </Button>
              </>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCopy} disabled={!customMessage && !variants}>
              {copied ? (
                <><Check className="w-4 h-4 mr-2" /> Copiado!</>
              ) : (
                <><Copy className="w-4 h-4 mr-2" /> Copiar Mensagem</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
