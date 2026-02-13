/**
 * StudioCopilot — SolaFlux Holographic Design
 * Right panel with quick actions, custom instruction, tips
 */
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AiPromptField } from '@/components/ai/AiPromptField';
import { ScrollArea } from '@/components/ui/scroll-area';
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
          <div className="p-5 flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-3xl text-white/10 mb-3" style={{ fontVariationSettings: "'wght' 200" }}>link</span>
            <p className="text-sm text-white/25 mb-4">Nenhuma referência vinculada</p>
            <button className="px-4 py-2 rounded border border-[rgba(0,156,202,0.15)] text-[11px] text-white/30 hover:text-white/50 hover:border-[rgba(0,156,202,0.25)] transition-colors">
              Adicionar Referência
            </button>
          </div>
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
              { icon: 'download', label: 'Exportar PDF', onClick: () => toast.info('Export PDF em breve') },
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
