import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, RefreshCw, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Alert } from '@/hooks/useAlerts';

interface AIComposerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alert?: Alert | null;
  projectContext?: string;
}

const objectives = [
  { id: 'cobrar_material', label: 'Cobrar entrega de material' },
  { id: 'lembrar_revisao', label: 'Lembrar revisão' },
  { id: 'confirmar_reuniao', label: 'Confirmar reunião' },
  { id: 'cobrar_pagamento', label: 'Cobrar pagamento' },
  { id: 'status_update', label: 'Atualização do status' },
  { id: 'responder_cliente', label: 'Responder cliente' },
  { id: 'followup', label: 'Follow-up geral' },
];

const tones = [
  { id: 'profissional', label: 'Profissional' },
  { id: 'amigavel', label: 'Amigável' },
  { id: 'direto', label: 'Direto e curto' },
  { id: 'vip', label: 'VIP / Premium' },
];

const formats = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'email', label: 'Email' },
  { id: 'portal', label: 'Portal' },
];

export function AIComposerDrawer({ open, onOpenChange, alert, projectContext }: AIComposerDrawerProps) {
  const [objective, setObjective] = useState(objectives[0].id);
  const [tone, setTone] = useState(tones[0].id);
  const [format, setFormat] = useState(formats[0].id);
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-compose-alert', {
        body: {
          objective,
          tone,
          format,
          alertTitle: alert?.title,
          alertMessage: alert?.message,
          alertType: alert?.type,
          projectContext,
          meta: alert?.meta,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setContent(data?.content || '');
      toast.success('Mensagem gerada!');
    } catch (err) {
      console.error('AI Compose error:', err);
      toast.error('Erro ao gerar mensagem');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!content.trim()) { toast.error('Conteúdo vazio'); return; }
    setIsSending(true);
    try {
      const { error } = await supabase.from('ai_outbox').insert({
        alert_id: alert?.id || null,
        project_id: alert?.project_id || null,
        client_id: alert?.client_id || null,
        channel: format === 'whatsapp' ? 'whatsapp' : format === 'email' ? 'email' : 'inapp',
        content: content.trim(),
        status: 'queued',
        created_by: (await supabase.auth.getUser()).data.user?.id,
      });
      if (error) throw error;

      // If linked to alert, resolve it
      if (alert?.id) {
        await supabase.from('alerts').update({ status: 'resolved', read_at: new Date().toISOString() }).eq('id', alert.id);
      }

      toast.success('Mensagem enviada para fila!');
      setContent('');
      onOpenChange(false);
    } catch (err) {
      console.error('Send error:', err);
      toast.error('Erro ao enviar');
    } finally {
      setIsSending(false);
    }
  };

  const handleRefine = async (action: string) => {
    if (!content) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-compose-alert', {
        body: {
          refine: true,
          action,
          currentContent: content,
          tone,
          format,
        },
      });
      if (error) throw error;
      setContent(data?.content || content);
    } catch {
      toast.error('Erro ao refinar');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-[#0a0a0f] border-l border-white/10 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-medium text-white/80 uppercase tracking-wider">IA Composer</h3>
              </div>
              <button onClick={() => onOpenChange(false)} className="text-white/30 hover:text-white/60">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Alert context */}
              {alert && (
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Contexto do alerta</p>
                  <p className="text-xs text-white/60">{alert.title}</p>
                  {alert.message && <p className="text-[11px] text-white/30 mt-1">{alert.message}</p>}
                </div>
              )}

              {/* Objective */}
              <div className="space-y-2">
                <p className="text-[10px] text-white/25 uppercase tracking-wider">Objetivo</p>
                <div className="flex flex-wrap gap-1.5">
                  {objectives.map(o => (
                    <button
                      key={o.id}
                      onClick={() => setObjective(o.id)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-[11px] transition-colors border",
                        objective === o.id
                          ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
                          : "border-white/[0.06] text-white/30 hover:text-white/50"
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone */}
              <div className="space-y-2">
                <p className="text-[10px] text-white/25 uppercase tracking-wider">Tom</p>
                <div className="flex gap-1.5">
                  {tones.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTone(t.id)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-[11px] transition-colors border",
                        tone === t.id
                          ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                          : "border-white/[0.06] text-white/30 hover:text-white/50"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div className="space-y-2">
                <p className="text-[10px] text-white/25 uppercase tracking-wider">Formato</p>
                <div className="flex gap-1.5">
                  {formats.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-[11px] transition-colors border",
                        format === f.id
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-white/[0.06] text-white/30 hover:text-white/50"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isGenerating ? 'Gerando...' : 'Gerar Mensagem'}
              </Button>

              {/* Content preview */}
              {content && (
                <div className="space-y-2">
                  <p className="text-[10px] text-white/25 uppercase tracking-wider">Preview</p>
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={8}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/70 resize-none focus:outline-none focus:border-purple-500/30"
                  />
                  {/* Refine buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { action: 'rewrite', label: 'Reescrever' },
                      { action: 'shorter', label: 'Encurtar' },
                      { action: 'formal', label: 'Mais formal' },
                      { action: 'human', label: 'Mais humano' },
                      { action: 'add_cta', label: 'Adicionar CTA' },
                    ].map(r => (
                      <button
                        key={r.action}
                        onClick={() => handleRefine(r.action)}
                        disabled={isGenerating}
                        className="px-2 py-1 rounded text-[10px] text-white/30 border border-white/[0.06] hover:bg-white/[0.04] hover:text-white/50 transition-colors disabled:opacity-30"
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {content && (
              <div className="px-6 py-4 border-t border-white/[0.06]">
                <Button
                  onClick={handleSend}
                  disabled={isSending}
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Enviar para fila
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
