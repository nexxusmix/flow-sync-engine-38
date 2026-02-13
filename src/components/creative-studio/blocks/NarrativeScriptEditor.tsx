/**
 * NarrativeScriptEditor — SolaFlux Holographic Design
 * Glass-projection editor area with cyan accents
 */
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { VoiceInputButton } from '@/components/ai/VoiceInputButton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { CreativeBlock, NarrativeScriptContent } from '@/types/creative-works';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface NarrativeScriptEditorProps {
  block: CreativeBlock | null;
  onSave: (content: NarrativeScriptContent) => void;
  onGenerate: () => Promise<void>;
  onImprove: () => Promise<void>;
  onRegenerate: () => Promise<void>;
  isGenerating?: boolean;
  versions?: Array<{ version: number; created_at: string }>;
  onRestoreVersion?: (version: number) => void;
}

const emptyContent: NarrativeScriptContent = {
  logline: '', premise: '', tone: '', theme: '',
  structure: { act1: '', act2: '', act3: '' },
  scenes: [], full_script: '',
};

export function NarrativeScriptEditor({
  block, onSave, onGenerate, onImprove, onRegenerate,
  isGenerating = false, versions = [], onRestoreVersion,
}: NarrativeScriptEditorProps) {
  const [content, setContent] = useState<NarrativeScriptContent>(emptyContent);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (block?.content) {
      const c = block.content as unknown as NarrativeScriptContent;
      setContent({
        logline: c.logline || '', premise: c.premise || '', tone: c.tone || '', theme: c.theme || '',
        structure: c.structure || { act1: '', act2: '', act3: '' },
        scenes: c.scenes || [], full_script: c.full_script || '',
      });
      setHasChanges(false);
    } else {
      setContent(emptyContent);
      setHasChanges(false);
    }
  }, [block]);

  const updateField = <K extends keyof NarrativeScriptContent>(field: K, value: NarrativeScriptContent[K]) => {
    setContent((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const updateStructure = (act: 'act1' | 'act2' | 'act3', value: string) => {
    setContent((prev) => ({ ...prev, structure: { ...prev.structure, [act]: value } }));
    setHasChanges(true);
  };

  const handleSave = () => { onSave(content); setHasChanges(false); };
  const isEmpty = !content.logline && !content.premise && !content.full_script;
  const statusLabel = block?.status === 'draft' ? 'Rascunho' : block?.status === 'ready' ? 'Pronto' : block?.status === 'approved' ? 'Aprovado' : 'Vazio';

  const font = { fontFamily: "'Space Grotesk', sans-serif" };

  return (
    <div className="h-full flex flex-col" style={font}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(0,156,202,0.08)]">
        <div className="flex items-center gap-3">
          <p className="section-label text-[11px] text-[hsl(195,100%,55%)] uppercase tracking-[0.12em]">
            Section_01 // Editor
          </p>
        </div>
      </div>

      {/* Title bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-medium text-white/80 tracking-tight">Roteiro Narrativo</h2>
          <span className="text-[10px] uppercase tracking-[0.1em] px-2.5 py-1 rounded border border-white/10 text-white/30">
            {statusLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isEmpty ? (
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 rounded bg-[hsl(195,100%,40%)] text-white text-sm hover:bg-[hsl(195,100%,45%)] transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'wght' 200" }}>auto_awesome</span>
                  Gerar com IA
                </>
              )}
            </button>
          ) : (
            <>
              <button onClick={onImprove} disabled={isGenerating} className="flex items-center gap-1.5 px-3 py-2 rounded border border-[rgba(0,156,202,0.15)] text-white/40 hover:text-white/60 text-xs transition-colors disabled:opacity-30">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'wght' 200" }}>auto_awesome</span>
                Melhorar
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button disabled={isGenerating} className="flex items-center gap-1.5 px-3 py-2 rounded border border-[rgba(0,156,202,0.15)] text-white/40 hover:text-white/60 text-xs transition-colors disabled:opacity-30">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'wght' 200" }}>refresh</span>
                    Regenerar
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Regenerar Roteiro?</AlertDialogTitle>
                    <AlertDialogDescription>Isso irá substituir o conteúdo atual. A versão atual será salva no histórico.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onRegenerate}>Regenerar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isGenerating}
            className="flex items-center gap-1.5 px-4 py-2 rounded border border-[rgba(0,156,202,0.15)] text-white/40 hover:text-white/60 text-xs transition-colors disabled:opacity-20"
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'wght' 200" }}>save</span>
            Salvar
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <ScrollArea className="flex-1">
        <div className="px-6 pb-8 space-y-6 max-w-4xl mx-auto">
          {/* Empty State */}
          {isEmpty && !isGenerating && (
            <div className="glass-projection rounded-lg py-16 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-5xl text-white/10 mb-4" style={{ fontVariationSettings: "'wght' 200" }}>description</span>
              <h3 className="text-lg font-light text-white/40 mb-2">Nenhum roteiro criado</h3>
              <p className="text-sm text-white/20 mb-6 max-w-md">
                Clique em "Gerar com IA" ou comece a escrever manualmente para estruturar sua narrativa.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-6 py-3 rounded bg-[hsl(195,100%,40%)] text-white text-sm hover:bg-[hsl(195,100%,45%)] transition-colors"
                >
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'wght' 200" }}>auto_awesome</span>
                  Gerar com IA
                </button>
                <button
                  onClick={() => updateField('logline', ' ')}
                  className="flex items-center gap-2 px-6 py-3 rounded border border-white/10 text-white/40 hover:text-white/60 text-sm transition-colors"
                >
                  Criar Manualmente
                </button>
              </div>
            </div>
          )}

          {/* Form Fields */}
          {(!isEmpty || isGenerating) && (
            <>
              {/* Conceito Central */}
              <div className="holographic-card rounded-lg p-6 space-y-4">
                <h3 className="text-[10px] text-white/25 uppercase tracking-[0.12em] mb-3">Conceito Central</h3>
                <div className="space-y-2">
                  <label className="text-[11px] text-white/30">Logline</label>
                  <textarea
                    value={content.logline}
                    onChange={(e) => updateField('logline', e.target.value)}
                    placeholder="Uma frase que resume a essência da história..."
                    className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(0,156,202,0.1)] rounded px-4 py-3 text-sm text-white/70 outline-none focus:border-[rgba(0,156,202,0.3)] transition-colors resize-none min-h-[60px] placeholder:text-white/15"
                    style={font}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] text-white/30">Premissa</label>
                  <textarea
                    value={content.premise}
                    onChange={(e) => updateField('premise', e.target.value)}
                    placeholder="O argumento central e a mensagem..."
                    className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(0,156,202,0.1)] rounded px-4 py-3 text-sm text-white/70 outline-none focus:border-[rgba(0,156,202,0.3)] transition-colors resize-none min-h-[80px] placeholder:text-white/15"
                    style={font}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] text-white/30">Tom</label>
                    <input
                      value={content.tone}
                      onChange={(e) => updateField('tone', e.target.value)}
                      placeholder="Ex: Inspirador, Dramático"
                      className="w-full h-9 bg-[rgba(255,255,255,0.02)] border border-[rgba(0,156,202,0.1)] rounded px-3 text-sm text-white/60 outline-none focus:border-[rgba(0,156,202,0.3)] transition-colors placeholder:text-white/15"
                      style={font}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] text-white/30">Tema</label>
                    <input
                      value={content.theme}
                      onChange={(e) => updateField('theme', e.target.value)}
                      placeholder="Ex: Superação, Transformação"
                      className="w-full h-9 bg-[rgba(255,255,255,0.02)] border border-[rgba(0,156,202,0.1)] rounded px-3 text-sm text-white/60 outline-none focus:border-[rgba(0,156,202,0.3)] transition-colors placeholder:text-white/15"
                      style={font}
                    />
                  </div>
                </div>
              </div>

              {/* Estrutura Narrativa */}
              <div className="holographic-card rounded-lg p-6 space-y-4">
                <h3 className="text-[10px] text-white/25 uppercase tracking-[0.12em] mb-3">Estrutura Narrativa</h3>
                {(['act1', 'act2', 'act3'] as const).map((act, i) => (
                  <div key={act} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-[hsl(195,100%,50%)] border border-[rgba(0,156,202,0.2)] px-1.5 py-0.5 rounded tracking-wider uppercase">Ato {i + 1}</span>
                      <span className="text-[11px] text-white/25">
                        {i === 0 ? 'Apresentação / Setup' : i === 1 ? 'Confrontação / Desenvolvimento' : 'Resolução / Clímax'}
                      </span>
                    </div>
                    <textarea
                      value={content.structure?.[act] || ''}
                      onChange={(e) => updateStructure(act, e.target.value)}
                      placeholder={i === 0 ? 'Introdução do protagonista, mundo e conflito inicial...' : i === 1 ? 'Escalada do conflito, obstáculos, ponto de virada...' : 'Clímax, resolução do conflito, novo equilíbrio...'}
                      className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(0,156,202,0.1)] rounded px-4 py-3 text-sm text-white/70 outline-none focus:border-[rgba(0,156,202,0.3)] transition-colors resize-none min-h-[80px] placeholder:text-white/15"
                      style={font}
                    />
                    {i < 2 && <div className="border-t border-[rgba(0,156,202,0.05)] my-2" />}
                  </div>
                ))}
              </div>

              {/* Roteiro Completo */}
              <div className="holographic-card rounded-lg p-6 space-y-3">
                <h3 className="text-[10px] text-white/25 uppercase tracking-[0.12em]">Roteiro Completo</h3>
                <div className="relative">
                  <textarea
                    value={content.full_script || ''}
                    onChange={(e) => updateField('full_script', e.target.value)}
                    placeholder="Escreva o roteiro completo aqui, com diálogos e ações..."
                    className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(0,156,202,0.1)] rounded px-4 py-3 text-sm text-white/70 outline-none focus:border-[rgba(0,156,202,0.3)] transition-colors resize-none min-h-[300px] font-mono placeholder:text-white/15 pr-12"
                    style={{ fontFamily: "'Space Grotesk', ui-monospace, monospace" }}
                  />
                  <div className="absolute right-4 top-4">
                    <VoiceInputButton
                      onTranscript={(text) => updateField('full_script', (content.full_script || '') + '\n' + text)}
                      mode="append"
                      className="h-7 w-7"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
