/**
 * EmptyBlockPlaceholder — SolaFlux Holographic Design
 */
import type { CreativeBlockType } from '@/types/creative-works';

interface EmptyBlockPlaceholderProps {
  blockType: CreativeBlockType;
  blockLabel: string;
  onGenerate?: () => void;
}

const COMING_SOON_BLOCKS: CreativeBlockType[] = [
  'storyboard', 'storyboard_images', 'shotlist', 'moodboard',
  'visual_identity', 'motion_direction', 'lettering', 'copy_variations', 'brief',
];

export function EmptyBlockPlaceholder({ blockType, blockLabel, onGenerate }: EmptyBlockPlaceholderProps) {
  const isComingSoon = COMING_SOON_BLOCKS.includes(blockType);

  return (
    <div className="h-full flex items-center justify-center p-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="glass-projection rounded-lg max-w-md w-full py-16 px-8 text-center">
        <span
          className="material-symbols-outlined text-5xl text-white/10 mb-4 block"
          style={{ fontVariationSettings: "'wght' 200" }}
        >
          {isComingSoon ? 'construction' : 'auto_awesome'}
        </span>
        <h3 className="text-lg font-light text-white/40 mb-2">{blockLabel}</h3>
        <p className="text-sm text-white/20 mb-6">
          {isComingSoon
            ? 'Este bloco será implementado em breve. Por enquanto, utilize o Roteiro Narrativo.'
            : 'Nenhum conteúdo criado ainda. Clique para começar.'}
        </p>
        {isComingSoon ? (
          <span className="inline-block text-[10px] text-white/20 uppercase tracking-[0.12em] border border-white/10 px-3 py-1.5 rounded">
            🚧 Em desenvolvimento
          </span>
        ) : (
          <div className="flex gap-3 justify-center">
            <button
              onClick={onGenerate}
              className="flex items-center gap-2 px-5 py-2.5 rounded bg-[hsl(195,100%,40%)] text-white text-sm hover:bg-[hsl(195,100%,45%)] transition-colors"
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'wght' 200" }}>auto_awesome</span>
              Gerar com IA
            </button>
            <button className="px-5 py-2.5 rounded border border-white/10 text-white/40 hover:text-white/60 text-sm transition-colors">
              Criar Manualmente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
