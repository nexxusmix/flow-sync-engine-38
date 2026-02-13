/**
 * GenericBlockEditor — works for Storyboard, Moodboard, Visual Identity,
 * Motion/Direction, Lettering and Storyboard Images blocks.
 * Uses a simple key-value JSON editor with labeled fields.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CreativeBlock, CreativeBlockType } from '@/types/creative-works';

const BLOCK_FIELDS: Record<string, Array<{ key: string; label: string; type: 'text' | 'textarea' | 'list'; placeholder: string }>> = {
  storyboard: [
    { key: 'overview', label: 'Visão Geral', type: 'textarea', placeholder: 'Descrição geral do storyboard...' },
    { key: 'scenes_text', label: 'Cenas (formato livre)', type: 'textarea', placeholder: 'Descreva cada cena...' },
  ],
  storyboard_images: [
    { key: 'description', label: 'Descrição das Imagens', type: 'textarea', placeholder: 'Descreva as imagens do storyboard...' },
    { key: 'style', label: 'Estilo Visual', type: 'text', placeholder: 'Ex: Cinematic, Minimalista' },
  ],
  moodboard: [
    { key: 'theme', label: 'Tema', type: 'text', placeholder: 'Tema do moodboard' },
    { key: 'visual_style', label: 'Estilo Visual', type: 'text', placeholder: 'Ex: Dark moody, clean minimal' },
    { key: 'keywords', label: 'Palavras-chave (separadas por vírgula)', type: 'text', placeholder: 'cinema, luz, textura' },
    { key: 'do_visual', label: 'Do (fazer)', type: 'textarea', placeholder: 'O que usar...' },
    { key: 'dont_visual', label: "Don't (não fazer)", type: 'textarea', placeholder: 'O que evitar...' },
  ],
  visual_identity: [
    { key: 'primary_color', label: 'Cor Primária', type: 'text', placeholder: '#009CCA' },
    { key: 'secondary_color', label: 'Cor Secundária', type: 'text', placeholder: '#000000' },
    { key: 'heading_font', label: 'Fonte Títulos', type: 'text', placeholder: 'Google Sans Flex' },
    { key: 'body_font', label: 'Fonte Corpo', type: 'text', placeholder: 'Inter' },
    { key: 'do_list', label: 'Do (fazer)', type: 'textarea', placeholder: 'Regras visuais a seguir...' },
    { key: 'dont_list', label: "Don't (não fazer)", type: 'textarea', placeholder: 'O que evitar...' },
  ],
  motion_direction: [
    { key: 'style', label: 'Estilo', type: 'text', placeholder: 'Ex: Cinematic, Documental' },
    { key: 'rhythm', label: 'Ritmo', type: 'text', placeholder: 'Ex: slow, dynamic' },
    { key: 'transitions', label: 'Transições', type: 'textarea', placeholder: 'Descreva transições entre cenas...' },
    { key: 'effects', label: 'Efeitos', type: 'textarea', placeholder: 'Efeitos visuais a usar...' },
    { key: 'references', label: 'Referências', type: 'textarea', placeholder: 'Links ou descrições de referências...' },
  ],
  lettering: [
    { key: 'hierarchy', label: 'Hierarquia', type: 'textarea', placeholder: 'Descreva a hierarquia tipográfica...' },
    { key: 'fonts_text', label: 'Fontes (nome — uso — peso)', type: 'textarea', placeholder: 'Google Sans Flex — títulos — Bold\nInter — corpo — Regular' },
    { key: 'usage_rules', label: 'Regras de Uso', type: 'textarea', placeholder: 'Regras de aplicação...' },
  ],
};

const BLOCK_SECTION_LABELS: Record<string, string> = {
  storyboard: 'Storyboard',
  storyboard_images: 'Imagens',
  moodboard: 'Moodboard',
  visual_identity: 'Identidade Visual',
  motion_direction: 'Motion / Direção',
  lettering: 'Tipografia',
};

interface GenericBlockEditorProps {
  blockType: CreativeBlockType;
  block: CreativeBlock | null;
  onSave: (content: Record<string, unknown>) => void;
  onGenerate: () => Promise<void>;
  isGenerating?: boolean;
}

export function GenericBlockEditor({ blockType, block, onSave, onGenerate, isGenerating = false }: GenericBlockEditorProps) {
  const [content, setContent] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const fields = BLOCK_FIELDS[blockType] || [];
  const sectionLabel = BLOCK_SECTION_LABELS[blockType] || blockType;

  useEffect(() => {
    if (block?.content) {
      const c = block.content as Record<string, unknown>;
      const flat: Record<string, string> = {};
      fields.forEach(f => {
        const val = c[f.key];
        flat[f.key] = Array.isArray(val) ? val.join(', ') : String(val || '');
      });
      setContent(flat);
      setHasChanges(false);
    } else {
      setContent({});
    }
  }, [block, blockType]);

  const debouncedSave = useCallback((c: Record<string, string>) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => onSave(c as Record<string, unknown>), 2000);
  }, [onSave]);

  const update = (key: string, value: string) => {
    const next = { ...content, [key]: value };
    setContent(next); setHasChanges(true); debouncedSave(next);
  };

  const isEmpty = fields.every(f => !content[f.key]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glassBorder)]">
        <p className="text-[11px] text-primary uppercase tracking-[0.12em]">{sectionLabel}</p>
        <div className="flex items-center gap-2">
          <button onClick={onGenerate} disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded bg-primary text-white text-xs hover:bg-primary/80 disabled:opacity-50">
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {isEmpty ? 'Gerar com IA' : 'Regenerar IA'}
          </button>
          <button onClick={() => { onSave(content as Record<string, unknown>); setHasChanges(false); }} disabled={!hasChanges}
            className="px-4 py-2 rounded border border-[var(--glassBorder)] text-muted-foreground text-xs disabled:opacity-20">Salvar</button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-6 pb-8 pt-4 max-w-4xl mx-auto space-y-6">
          {isEmpty && !isGenerating ? (
            <div className="glass-projection rounded-lg py-16 flex flex-col items-center text-center">
              <h3 className="text-lg font-light text-muted-foreground mb-2">{sectionLabel}</h3>
              <p className="text-sm text-muted-foreground/50 mb-6">Clique para gerar com IA ou preencher manualmente.</p>
              <div className="flex gap-3">
                <button onClick={onGenerate} className="px-6 py-3 rounded bg-primary text-white text-sm">Gerar com IA</button>
                <button onClick={() => update(fields[0]?.key || '', ' ')} className="px-6 py-3 rounded border border-[var(--glassBorder)] text-muted-foreground text-sm">Criar Manualmente</button>
              </div>
            </div>
          ) : (
            <div className="holographic-card rounded-lg p-6 space-y-4">
              {fields.map(f => (
                <div key={f.key} className="space-y-2">
                  <label className="text-[11px] text-muted-foreground/60">{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea value={content[f.key] || ''} onChange={(e) => update(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full bg-[var(--glassSurface)] border border-[var(--glassBorder)] rounded px-4 py-3 text-sm text-foreground/70 outline-none focus:border-primary/40 resize-none min-h-[80px] placeholder:text-muted-foreground/30" />
                  ) : (
                    <input value={content[f.key] || ''} onChange={(e) => update(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full h-9 bg-[var(--glassSurface)] border border-[var(--glassBorder)] rounded px-3 text-sm text-foreground/60 outline-none focus:border-primary/40 placeholder:text-muted-foreground/30" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
