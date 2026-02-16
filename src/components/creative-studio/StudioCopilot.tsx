/**
 * StudioCopilot — SQUAD FILM / Liquid Glass
 * Right panel with tabs: Copiloto | Referências | Ações
 */
import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AiPromptField } from '@/components/ai/AiPromptField';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import type { CreativeWork, CreativeBlock } from '@/types/creative-works';

interface StudioCopilotProps {
  work: CreativeWork | null;
  currentBlock: CreativeBlock | null;
  onQuickAction: (action: string, instruction?: string) => Promise<void>;
  isProcessing?: boolean;
  previewResult?: Record<string, unknown> | null;
  onApplyPreview?: () => void;
  onDiscardPreview?: () => void;
  onDuplicate?: () => void;
  onArchive?: () => void;
}

export function StudioCopilot({
  work,
  currentBlock,
  onQuickAction,
  isProcessing = false,
  previewResult,
  onApplyPreview,
  onDiscardPreview,
  onDuplicate,
  onArchive,
}: StudioCopilotProps) {
  const [instruction, setInstruction] = useState('');
  const [activeTab, setActiveTab] = useState<'copilot' | 'references' | 'actions'>('copilot');

  const handleSendInstruction = async () => {
    if (!instruction.trim()) return;
    await onQuickAction('custom', instruction);
    setInstruction('');
  };

  const quickActions = [
    { id: 'summarize', label: 'Resumir', icon: 'compress' },
    { id: 'expand', label: 'Expandir', icon: 'expand' },
    { id: 'adjust_tone', label: 'Ajustar Tom', icon: 'tune' },
    { id: 'adapt_brand', label: 'Adaptar ao Brand Kit', icon: 'palette' },
  ];

  const tabs = [
    { key: 'copilot' as const, label: 'Copiloto' },
    { key: 'references' as const, label: 'Referências' },
    { key: 'actions' as const, label: 'Ações' },
  ];

  return (
    <div
      className="w-[320px] border-l border-[rgba(0,156,202,0.08)] bg-[#050507] flex flex-col h-full shrink-0"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* Tab switcher */}
      <div className="flex border-b border-[rgba(0,156,202,0.08)]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-[11px] tracking-[0.08em] transition-colors ${
              activeTab === tab.key
                ? 'text-white/80 border-b border-[hsl(195,100%,50%)]'
                : 'text-white/25 hover:text-white/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        {activeTab === 'copilot' && (
          <div className="p-5 space-y-5">
            {/* Preview Result */}
            {previewResult && (
              <div className="border border-[rgba(0,156,202,0.2)] rounded-lg overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-[rgba(0,156,202,0.1)]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[hsl(195,100%,55%)]" style={{ fontVariationSettings: "'wght' 200" }}>auto_awesome</span>
                    <span className="text-xs text-white/60">Resultado IA</span>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-white/25 border border-white/10 px-1.5 py-0.5 rounded">Preview</span>
                </div>
                <div className="p-3">
                  <pre className="text-[10px] text-white/30 whitespace-pre-wrap max-h-32 overflow-y-auto font-mono">
                    {JSON.stringify(previewResult, null, 2)}
                  </pre>
                </div>
                <div className="flex gap-2 px-3 pb-3">
                  <button
                    onClick={onApplyPreview}
                    className="flex-1 py-2 rounded text-xs bg-[hsl(195,100%,40%)] text-white hover:bg-[hsl(195,100%,45%)] transition-colors"
                  >
                    Aplicar
                  </button>
                  <button
                    onClick={onDiscardPreview}
                    className="py-2 px-4 rounded text-xs border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 transition-colors"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-3">
              <h4 className="text-[10px] text-white/25 uppercase tracking-[0.12em]">
                Ações Rápidas
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => onQuickAction(action.id)}
                    disabled={isProcessing || !currentBlock}
                    className="flex items-center gap-2 px-3 py-2.5 rounded border border-[rgba(0,156,202,0.1)] text-white/40 hover:text-white/60 hover:border-[rgba(0,156,202,0.2)] hover:bg-white/[0.02] transition-all text-[11px] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-sm text-[hsl(195,100%,50%)]" style={{ fontVariationSettings: "'wght' 200" }}>{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Instruction */}
            <div className="space-y-3">
              <h4 className="text-[10px] text-white/25 uppercase tracking-[0.12em]">
                Instrução Personalizada
              </h4>
              <div className="relative">
                <AiPromptField
                  value={instruction}
                  onChange={setInstruction}
                  placeholder="Ex: deixe mais emocional, adicione mais detalhes visuais..."
                  rows={3}
                  disabled={isProcessing}
                  featureId="copilot-instruction"
                  showCounter={false}
                />
              </div>

              <div className="flex items-center gap-2 text-[10px] text-white/20">
                <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'wght' 200" }}>swap_horiz</span>
                Substituir
              </div>

              <button
                onClick={handleSendInstruction}
                disabled={isProcessing || !instruction.trim() || !currentBlock}
                className="w-full py-3 rounded bg-[hsl(195,100%,40%)] text-white text-sm hover:bg-[hsl(195,100%,45%)] transition-colors flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'wght' 200" }}>send</span>
                    Enviar Instrução
                  </>
                )}
              </button>
            </div>

            {/* Tips */}
            <div className="pt-3 border-t border-[rgba(0,156,202,0.06)] space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[hsl(195,100%,50%)]" style={{ fontVariationSettings: "'wght' 200" }}>lightbulb</span>
                <span className="text-[10px] text-white/25 uppercase tracking-[0.1em]">Dicas</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-white/20 pl-1">
                <li>Use "Gerar com IA" no editor para criar do zero</li>
                <li>Use ações rápidas para ajustar conteúdo existente</li>
                <li>Vincule cliente e projeto para contexto melhor</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'references' && (
          <ReferencesPanel workId={work?.id} />
        )}

        {activeTab === 'actions' && (
          <div className="p-5 space-y-2">
            <h4 className="text-[10px] text-white/25 uppercase tracking-[0.12em] mb-3">Aplicar em</h4>
            {[
              { icon: 'article', label: 'Criar Conteúdo no Pipeline', disabled: !work?.project_id },
              { icon: 'campaign', label: 'Vincular à Campanha', disabled: !work?.campaign_id },
              { icon: 'calendar_month', label: 'Agendar no Calendário', disabled: false },
            ].map((a) => (
              <button
                key={a.label}
                disabled={a.disabled}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded border border-[rgba(0,156,202,0.08)] text-white/35 hover:text-white/55 hover:border-[rgba(0,156,202,0.15)] transition-all text-[12px] disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'wght' 200" }}>{a.icon}</span>
                {a.label}
              </button>
            ))}

            <div className="my-4 border-t border-[rgba(0,156,202,0.06)]" />

            <h4 className="text-[10px] text-white/25 uppercase tracking-[0.12em] mb-3">Gerenciar</h4>
            {[
              { icon: 'content_copy', label: 'Duplicar Trabalho', onClick: onDuplicate },
              { icon: 'download', label: 'Exportar PDF', onClick: async () => {
                if (!work) return;
                try {
                  const { data, error } = await supabase.functions.invoke('export-creative-pdf', { body: { work_id: work.id } });
                  if (error) throw error;
                  if (data?.public_url) { window.open(data.public_url, '_blank'); toast.success('PDF gerado!'); }
                  else toast.warning('PDF não disponível no momento');
                } catch { toast.error('Erro ao exportar PDF'); }
              } },
              { icon: 'archive', label: 'Arquivar', destructive: true, onClick: onArchive },
            ].map((a) => (
              <button
                key={a.label}
                onClick={a.onClick}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded border border-[rgba(0,156,202,0.08)] hover:border-[rgba(0,156,202,0.15)] transition-all text-[12px] ${
                  a.destructive ? 'text-red-400/40 hover:text-red-400/60' : 'text-white/35 hover:text-white/55'
                }`}
              >
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'wght' 200" }}>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[rgba(0,156,202,0.06)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/15 tracking-wider">powered by</span>
          <span className="text-[10px] text-[hsl(195,100%,50%)] tracking-wider font-medium">SQUAD///FILM</span>
        </div>
      </div>
    </div>
  );
}

// ======== References Sub-Panel ========
interface Reference {
  id: string;
  type: string;
  url: string | null;
  title: string;
  tags: string[];
  use_for_ai: boolean;
}

function ReferencesPanel({ workId }: { workId?: string }) {
  const queryClient = useQueryClient();
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');

  const { data: refs = [] } = useQuery({
    queryKey: ['cw-references', workId],
    queryFn: async () => {
      if (!workId) return [];
      const { data } = await supabase
        .from('creative_work_references')
        .select('*')
        .eq('creative_work_id', workId)
        .order('created_at', { ascending: false });
      return (data || []) as Reference[];
    },
    enabled: !!workId,
  });

  const addRef = useMutation({
    mutationFn: async () => {
      if (!workId || !newUrl.trim()) return;
      const type = newUrl.includes('youtube') ? 'youtube'
        : newUrl.includes('figma') ? 'figma'
        : newUrl.includes('drive.google') ? 'drive' : 'url';
      await supabase.from('creative_work_references').insert({
        creative_work_id: workId,
        url: newUrl,
        title: newTitle || newUrl,
        type,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cw-references', workId] });
      setNewUrl(''); setNewTitle('');
      toast.success('Referência adicionada');
    },
  });

  const deleteRef = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('creative_work_references').delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cw-references', workId] });
    },
  });

  const toggleAI = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => {
      await supabase.from('creative_work_references').update({ use_for_ai: val }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cw-references', workId] });
    },
  });

  return (
    <div className="p-5 space-y-4">
      {/* Add reference */}
      <div className="space-y-2">
        <h4 className="text-[10px] text-white/25 uppercase tracking-[0.12em]">Adicionar Referência</h4>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Título (opcional)"
          className="w-full h-8 bg-[rgba(255,255,255,0.03)] border border-[rgba(0,156,202,0.1)] rounded px-3 text-xs text-white/60 outline-none focus:border-[rgba(0,156,202,0.3)]"
        />
        <div className="flex gap-2">
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="URL (YouTube, Figma, Drive...)"
            className="flex-1 h-8 bg-[rgba(255,255,255,0.03)] border border-[rgba(0,156,202,0.1)] rounded px-3 text-xs text-white/60 outline-none focus:border-[rgba(0,156,202,0.3)]"
          />
          <button onClick={() => addRef.mutate()} disabled={!newUrl.trim()}
            className="px-3 h-8 rounded bg-[hsl(195,100%,40%)] text-white text-xs disabled:opacity-30">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* List */}
      {refs.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-white/20">Nenhuma referência</p>
        </div>
      ) : (
        <div className="space-y-2">
          {refs.map((ref) => (
            <div key={ref.id} className="flex items-center gap-2 p-2 rounded border border-[rgba(0,156,202,0.08)] hover:border-[rgba(0,156,202,0.15)] transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/50 truncate">{ref.title}</p>
                <p className="text-[9px] text-white/20 truncate">{ref.url}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[8px] text-white/20">IA</span>
                <Switch
                  checked={ref.use_for_ai}
                  onCheckedChange={(val) => toggleAI.mutate({ id: ref.id, val })}
                  className="scale-75"
                />
                {ref.url && (
                  <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-primary">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <button onClick={() => deleteRef.mutate(ref.id)} className="text-white/20 hover:text-red-400">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
