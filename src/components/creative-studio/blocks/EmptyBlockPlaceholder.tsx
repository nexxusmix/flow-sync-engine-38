import { Sparkles, Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { CreativeBlockType } from '@/types/creative-works';

interface EmptyBlockPlaceholderProps {
  blockType: CreativeBlockType;
  blockLabel: string;
  onGenerate?: () => void;
}

const COMING_SOON_BLOCKS: CreativeBlockType[] = [
  'storyboard',
  'storyboard_images',
  'shotlist',
  'moodboard',
  'visual_identity',
  'motion_direction',
  'lettering',
  'copy_variations',
  'brief',
];

export function EmptyBlockPlaceholder({
  blockType,
  blockLabel,
  onGenerate,
}: EmptyBlockPlaceholderProps) {
  const isComingSoon = COMING_SOON_BLOCKS.includes(blockType);

  if (isComingSoon) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-dashed">
          <CardContent className="py-12 text-center">
            <Construction className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">{blockLabel}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Este bloco será implementado em breve. Por enquanto, utilize o Roteiro Narrativo.
            </p>
            <div className="text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
              🚧 Em desenvolvimento
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-dashed">
        <CardContent className="py-12 text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">{blockLabel}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Nenhum conteúdo criado ainda. Clique para começar.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={onGenerate}>
              <Sparkles className="w-4 h-4 mr-1.5" />
              Gerar com IA
            </Button>
            <Button variant="outline">
              Criar Manualmente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
