import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CreativeBlock, ShotlistContent } from '@/types/creative-works';

interface ShotlistEditorProps {
  block: CreativeBlock | null;
  onSave: (content: ShotlistContent) => void;
  onGenerate: () => Promise<void>;
  isGenerating?: boolean;
}

const emptyShot = { order: 1, scene: '', camera: '', movement: '', duration: '', equipment: '', notes: '', priority: 'essential' as const };

export function ShotlistEditor({ block, onSave, onGenerate, isGenerating = false }: ShotlistEditorProps) {
  const [content, setContent] = useState<ShotlistContent>({ shots: [] });
  const [hasChanges, setHasChanges] = useState(false);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (block?.content) {
      const c = block.content as unknown as ShotlistContent;
      setContent({ shots: c.shots || [] });
      setHasChanges(false);
    }
  }, [block]);

  const debouncedSave = useCallback((c: ShotlistContent) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => onSave(c), 2000);
  }, [onSave]);

  const updateShot = (index: number, field: string, value: string) => {
    const next = { shots: content.shots.map((s, i) => i === index ? { ...s, [field]: value } : s) };
    setContent(next);
    setHasChanges(true);
    debouncedSave(next);
  };

  const addShot = () => {
    const next = { shots: [...content.shots, { ...emptyShot, order: content.shots.length + 1 }] };
    setContent(next);
    setHasChanges(true);
  };

  const removeShot = (index: number) => {
    const next = { shots: content.shots.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })) };
    setContent(next);
    setHasChanges(true);
    debouncedSave(next);
  };

  const isEmpty = content.shots.length === 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glassBorder)]">
        <p className="text-[11px] text-primary uppercase tracking-[0.12em]">Section_04 // Shotlist</p>
        <div className="flex items-center gap-2">
          <button onClick={onGenerate} disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded bg-primary text-white text-xs hover:bg-primary/80 transition-colors disabled:opacity-50">
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {isEmpty ? 'Gerar com IA' : 'Regenerar IA'}
          </button>
          <button onClick={() => { onSave(content); setHasChanges(false); }} disabled={!hasChanges}
            className="px-4 py-2 rounded border border-[var(--glassBorder)] text-muted-foreground text-xs disabled:opacity-20">
            Salvar
          </button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-6 pb-8 pt-4 max-w-5xl mx-auto">
          {isEmpty && !isGenerating ? (
            <div className="glass-projection rounded-lg py-16 flex flex-col items-center text-center">
              <h3 className="text-lg font-light text-muted-foreground mb-2">Shotlist</h3>
              <p className="text-sm text-muted-foreground/50 mb-6">Lista técnica de planos, câmeras e equipamentos.</p>
              <div className="flex gap-3">
                <button onClick={onGenerate} className="px-6 py-3 rounded bg-primary text-white text-sm">Gerar com IA</button>
                <button onClick={addShot} className="px-6 py-3 rounded border border-[var(--glassBorder)] text-muted-foreground text-sm">Criar Manualmente</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table header */}
              <div className="grid grid-cols-[40px_1fr_1fr_1fr_80px_80px_40px] gap-2 px-3 py-2 text-[9px] text-muted-foreground uppercase tracking-wider">
                <span>#</span><span>Cena</span><span>Câmera</span><span>Movimento</span><span>Duração</span><span>Prior.</span><span></span>
              </div>
              {content.shots.map((shot, i) => (
                <div key={i} className="grid grid-cols-[40px_1fr_1fr_1fr_80px_80px_40px] gap-2 holographic-card rounded p-2 items-center">
                  <span className="text-[10px] text-primary font-mono">{shot.order}</span>
                  <input value={shot.scene} onChange={(e) => updateShot(i, 'scene', e.target.value)}
                    className="h-7 bg-transparent border border-[var(--glassBorder)] rounded px-2 text-xs text-foreground/60 outline-none focus:border-primary/40" placeholder="Cena" />
                  <input value={shot.camera} onChange={(e) => updateShot(i, 'camera', e.target.value)}
                    className="h-7 bg-transparent border border-[var(--glassBorder)] rounded px-2 text-xs text-foreground/60 outline-none focus:border-primary/40" placeholder="Câmera" />
                  <input value={shot.movement} onChange={(e) => updateShot(i, 'movement', e.target.value)}
                    className="h-7 bg-transparent border border-[var(--glassBorder)] rounded px-2 text-xs text-foreground/60 outline-none focus:border-primary/40" placeholder="Movimento" />
                  <input value={shot.duration} onChange={(e) => updateShot(i, 'duration', e.target.value)}
                    className="h-7 bg-transparent border border-[var(--glassBorder)] rounded px-2 text-xs text-foreground/60 outline-none focus:border-primary/40" placeholder="5s" />
                  <select value={shot.priority} onChange={(e) => updateShot(i, 'priority', e.target.value)}
                    className="h-7 bg-transparent border border-[var(--glassBorder)] rounded px-1 text-[10px] text-foreground/60 outline-none">
                    <option value="essential">Essencial</option>
                    <option value="important">Importante</option>
                    <option value="nice_to_have">Desejável</option>
                  </select>
                  <button onClick={() => removeShot(i)} className="text-muted-foreground/30 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button onClick={addShot} className="flex items-center gap-2 text-xs text-primary/60 hover:text-primary mt-3">
                <Plus className="w-3.5 h-3.5" /> Adicionar plano
              </button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
