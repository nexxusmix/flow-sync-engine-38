import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CreativeBlock, BriefContent } from '@/types/creative-works';

interface BriefEditorProps {
  block: CreativeBlock | null;
  onSave: (content: BriefContent) => void;
  onGenerate: () => Promise<void>;
  isGenerating?: boolean;
}

const emptyContent: BriefContent = {
  objective: '', audience: '', offer: '', restrictions: '',
  tone: '', references: [], deliverables: [], deadline: '',
};

export function BriefEditor({ block, onSave, onGenerate, isGenerating = false }: BriefEditorProps) {
  const [content, setContent] = useState<BriefContent>(emptyContent);
  const [hasChanges, setHasChanges] = useState(false);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (block?.content) {
      const c = block.content as unknown as BriefContent;
      setContent({
        objective: c.objective || '', audience: c.audience || '',
        offer: c.offer || '', restrictions: c.restrictions || '',
        tone: c.tone || '', references: c.references || [],
        deliverables: c.deliverables || [], deadline: c.deadline || '',
      });
      setHasChanges(false);
    }
  }, [block]);

  const debouncedSave = useCallback((c: BriefContent) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => onSave(c), 2000);
  }, [onSave]);

  const update = <K extends keyof BriefContent>(field: K, value: BriefContent[K]) => {
    const next = { ...content, [field]: value };
    setContent(next);
    setHasChanges(true);
    debouncedSave(next);
  };

  const isEmpty = !content.objective && !content.audience && !content.tone;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glassBorder)]">
        <p className="text-[11px] text-primary uppercase tracking-[0.12em]">Section_00 // Brief</p>
        <div className="flex items-center gap-2">
          {isEmpty ? (
            <button onClick={onGenerate} disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 rounded bg-primary text-white text-sm hover:bg-primary/80 transition-colors disabled:opacity-50">
              {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</> : 'Gerar com IA'}
            </button>
          ) : (
            <button onClick={() => { onSave(content); setHasChanges(false); }} disabled={!hasChanges}
              className="flex items-center gap-1.5 px-4 py-2 rounded border border-[var(--glassBorder)] text-muted-foreground hover:text-foreground text-xs transition-colors disabled:opacity-20">
              Salvar
            </button>
          )}
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-6 pb-8 pt-4 space-y-6 max-w-4xl mx-auto">
          {isEmpty && !isGenerating ? (
            <div className="glass-projection rounded-lg py-16 flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-light text-muted-foreground mb-2">Brief do Projeto</h3>
              <p className="text-sm text-muted-foreground/50 mb-6">Defina objetivos, público-alvo e entregas.</p>
              <button onClick={onGenerate} disabled={isGenerating}
                className="px-6 py-3 rounded bg-primary text-white text-sm hover:bg-primary/80 transition-colors">
                Gerar com IA
              </button>
            </div>
          ) : (
            <>
              <div className="holographic-card rounded-lg p-6 space-y-4">
                <h3 className="text-[10px] text-muted-foreground uppercase tracking-[0.12em]">Objetivo & Público</h3>
                <div className="space-y-2">
                  <label className="text-[11px] text-muted-foreground/60">Objetivo</label>
                  <textarea value={content.objective} onChange={(e) => update('objective', e.target.value)}
                    placeholder="Qual o objetivo principal deste projeto criativo?"
                    className="w-full bg-[var(--glassSurface)] border border-[var(--glassBorder)] rounded px-4 py-3 text-sm text-foreground/70 outline-none focus:border-primary/40 resize-none min-h-[80px] placeholder:text-muted-foreground/30" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] text-muted-foreground/60">Público-Alvo</label>
                  <textarea value={content.audience} onChange={(e) => update('audience', e.target.value)}
                    placeholder="Para quem é este conteúdo?"
                    className="w-full bg-[var(--glassSurface)] border border-[var(--glassBorder)] rounded px-4 py-3 text-sm text-foreground/70 outline-none focus:border-primary/40 resize-none min-h-[60px] placeholder:text-muted-foreground/30" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] text-muted-foreground/60">Tom</label>
                    <input value={content.tone} onChange={(e) => update('tone', e.target.value)}
                      placeholder="Ex: Inspirador, Direto"
                      className="w-full h-9 bg-[var(--glassSurface)] border border-[var(--glassBorder)] rounded px-3 text-sm text-foreground/60 outline-none focus:border-primary/40 placeholder:text-muted-foreground/30" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] text-muted-foreground/60">Prazo</label>
                    <input type="date" value={content.deadline || ''} onChange={(e) => update('deadline', e.target.value)}
                      className="w-full h-9 bg-[var(--glassSurface)] border border-[var(--glassBorder)] rounded px-3 text-sm text-foreground/60 outline-none focus:border-primary/40" />
                  </div>
                </div>
              </div>
              <div className="holographic-card rounded-lg p-6 space-y-4">
                <h3 className="text-[10px] text-muted-foreground uppercase tracking-[0.12em]">Oferta & Restrições</h3>
                <div className="space-y-2">
                  <label className="text-[11px] text-muted-foreground/60">Oferta / Proposta de Valor</label>
                  <textarea value={content.offer || ''} onChange={(e) => update('offer', e.target.value)}
                    placeholder="Qual é a oferta central?"
                    className="w-full bg-[var(--glassSurface)] border border-[var(--glassBorder)] rounded px-4 py-3 text-sm text-foreground/70 outline-none focus:border-primary/40 resize-none min-h-[60px] placeholder:text-muted-foreground/30" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] text-muted-foreground/60">Restrições</label>
                  <textarea value={content.restrictions || ''} onChange={(e) => update('restrictions', e.target.value)}
                    placeholder="O que NÃO pode ser feito/mostrado?"
                    className="w-full bg-[var(--glassSurface)] border border-[var(--glassBorder)] rounded px-4 py-3 text-sm text-foreground/70 outline-none focus:border-primary/40 resize-none min-h-[60px] placeholder:text-muted-foreground/30" />
                </div>
              </div>
              <div className="holographic-card rounded-lg p-6 space-y-4">
                <h3 className="text-[10px] text-muted-foreground uppercase tracking-[0.12em]">Entregas</h3>
                <div className="space-y-2">
                  {(content.deliverables || []).map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[9px] text-primary">{i + 1}.</span>
                      <input value={d} onChange={(e) => {
                        const next = [...(content.deliverables || [])];
                        next[i] = e.target.value;
                        update('deliverables', next);
                      }}
                        className="flex-1 h-8 bg-[var(--glassSurface)] border border-[var(--glassBorder)] rounded px-3 text-sm text-foreground/60 outline-none focus:border-primary/40" />
                      <button onClick={() => {
                        const next = (content.deliverables || []).filter((_, idx) => idx !== i);
                        update('deliverables', next);
                      }} className="text-muted-foreground/30 hover:text-red-400 text-xs">✕</button>
                    </div>
                  ))}
                  <button onClick={() => update('deliverables', [...(content.deliverables || []), ''])}
                    className="text-xs text-primary/60 hover:text-primary transition-colors">+ Adicionar entrega</button>
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
