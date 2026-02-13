import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Plus, Trash2, Copy } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import type { CreativeBlock, CopyVariationsContent } from '@/types/creative-works';

interface CopyEditorProps {
  block: CreativeBlock | null;
  onSave: (content: CopyVariationsContent) => void;
  onGenerate: () => Promise<void>;
  isGenerating?: boolean;
}

const emptyContent: CopyVariationsContent = { variations: [], hashtags: [], cta: '' };

export function CopyEditor({ block, onSave, onGenerate, isGenerating = false }: CopyEditorProps) {
  const [content, setContent] = useState<CopyVariationsContent>(emptyContent);
  const [hasChanges, setHasChanges] = useState(false);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (block?.content) {
      const c = block.content as unknown as CopyVariationsContent;
      setContent({ variations: c.variations || [], hashtags: c.hashtags || [], cta: c.cta || '' });
      setHasChanges(false);
    }
  }, [block]);

  const debouncedSave = useCallback((c: CopyVariationsContent) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => onSave(c), 2000);
  }, [onSave]);

  const updateVariation = (i: number, field: string, value: string) => {
    const next = { ...content, variations: content.variations.map((v, idx) => idx === i ? { ...v, [field]: value } : v) };
    setContent(next); setHasChanges(true); debouncedSave(next);
  };

  const addVariation = () => {
    const next = { ...content, variations: [...content.variations, { text: '', tone: 'padrão', channel: 'instagram', length: 'medium' as const }] };
    setContent(next); setHasChanges(true);
  };

  const removeVariation = (i: number) => {
    const next = { ...content, variations: content.variations.filter((_, idx) => idx !== i) };
    setContent(next); setHasChanges(true); debouncedSave(next);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const isEmpty = content.variations.length === 0 && !content.cta;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glassBorder)]">
        <p className="text-[11px] text-primary uppercase tracking-[0.12em]">Section_09 // Copy & Legendas</p>
        <div className="flex items-center gap-2">
          <button onClick={onGenerate} disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded bg-primary text-white text-xs hover:bg-primary/80 disabled:opacity-50">
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {isEmpty ? 'Gerar com IA' : 'Gerar Variações'}
          </button>
          <button onClick={() => { onSave(content); setHasChanges(false); }} disabled={!hasChanges}
            className="px-4 py-2 rounded border border-[var(--glassBorder)] text-muted-foreground text-xs disabled:opacity-20">Salvar</button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-6 pb-8 pt-4 max-w-4xl mx-auto space-y-6">
          {isEmpty && !isGenerating ? (
            <div className="glass-projection rounded-lg py-16 flex flex-col items-center text-center">
              <h3 className="text-lg font-light text-muted-foreground mb-2">Copy / Legendas</h3>
              <p className="text-sm text-muted-foreground/50 mb-6">Variações de texto para diferentes canais e tons.</p>
              <div className="flex gap-3">
                <button onClick={onGenerate} className="px-6 py-3 rounded bg-primary text-white text-sm">Gerar com IA</button>
                <button onClick={addVariation} className="px-6 py-3 rounded border border-[var(--glassBorder)] text-muted-foreground text-sm">Criar Manualmente</button>
              </div>
            </div>
          ) : (
            <>
              {content.variations.map((v, i) => (
                <div key={i} className="holographic-card rounded-lg p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-primary uppercase tracking-wider">Variação {i + 1}</span>
                      <select value={v.tone} onChange={(e) => updateVariation(i, 'tone', e.target.value)}
                        className="h-6 bg-transparent border border-[var(--glassBorder)] rounded px-2 text-[10px] text-foreground/50 outline-none">
                        <option value="padrão">Padrão</option><option value="curta">Curta</option>
                        <option value="detalhada">Detalhada</option><option value="firme">Firme</option>
                        <option value="carinhosa">Carinhosa</option><option value="objetiva">Objetiva</option>
                      </select>
                      <select value={v.channel} onChange={(e) => updateVariation(i, 'channel', e.target.value)}
                        className="h-6 bg-transparent border border-[var(--glassBorder)] rounded px-2 text-[10px] text-foreground/50 outline-none">
                        <option value="instagram">Instagram</option><option value="youtube">YouTube</option>
                        <option value="whatsapp">WhatsApp</option><option value="linkedin">LinkedIn</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => copyText(v.text)} className="p-1 text-muted-foreground/30 hover:text-primary"><Copy className="w-3.5 h-3.5" /></button>
                      <button onClick={() => removeVariation(i)} className="p-1 text-muted-foreground/30 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <textarea value={v.text} onChange={(e) => updateVariation(i, 'text', e.target.value)}
                    placeholder="Texto da copy..."
                    className="w-full bg-[var(--glassSurface)] border border-[var(--glassBorder)] rounded px-4 py-3 text-sm text-foreground/70 outline-none focus:border-primary/40 resize-none min-h-[100px] placeholder:text-muted-foreground/30" />
                </div>
              ))}
              <button onClick={addVariation} className="flex items-center gap-2 text-xs text-primary/60 hover:text-primary">
                <Plus className="w-3.5 h-3.5" /> Adicionar variação
              </button>
              {/* Hashtags & CTA */}
              <div className="holographic-card rounded-lg p-5 space-y-3">
                <h3 className="text-[10px] text-muted-foreground uppercase tracking-[0.12em]">CTA & Hashtags</h3>
                <input value={content.cta} onChange={(e) => {
                  const next = { ...content, cta: e.target.value };
                  setContent(next); setHasChanges(true); debouncedSave(next);
                }}
                  placeholder="Call to Action principal"
                  className="w-full h-9 bg-[var(--glassSurface)] border border-[var(--glassBorder)] rounded px-3 text-sm text-foreground/60 outline-none focus:border-primary/40 placeholder:text-muted-foreground/30" />
                <input value={(content.hashtags || []).join(' ')} onChange={(e) => {
                  const next = { ...content, hashtags: e.target.value.split(' ').filter(Boolean) };
                  setContent(next); setHasChanges(true); debouncedSave(next);
                }}
                  placeholder="#hashtag1 #hashtag2"
                  className="w-full h-9 bg-[var(--glassSurface)] border border-[var(--glassBorder)] rounded px-3 text-sm text-foreground/60 outline-none focus:border-primary/40 placeholder:text-muted-foreground/30" />
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
