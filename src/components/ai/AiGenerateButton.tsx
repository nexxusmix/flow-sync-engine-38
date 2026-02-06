import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAiGenerate, useAiActionMeta } from '@/hooks/useAiGenerate';
import { AiDrawer } from './AiDrawer';
import { toast } from 'sonner';

interface AiGenerateButtonProps {
  actionKey: string;
  entityType: string;
  entityId?: string;
  getContext: () => Record<string, unknown>;
  onPreview?: (result: unknown) => void;
  onApply: (result: unknown, mode: 'replace' | 'append') => void;
  hasExistingContent?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Reusable AI Generate Button
 * Opens drawer with preview and apply functionality
 */
export function AiGenerateButton({
  actionKey,
  entityType,
  entityId,
  getContext,
  onPreview,
  onApply,
  hasExistingContent = false,
  variant = 'outline',
  size = 'sm',
  className,
  children,
}: AiGenerateButtonProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { title } = useAiActionMeta(actionKey);

  const {
    status,
    result,
    error,
    isLoading,
    generate,
    reset,
  } = useAiGenerate({
    actionKey,
    entityType,
    entityId,
    onSuccess: (data) => {
      onPreview?.(data);
    },
    onError: (err) => {
      // Handle specific errors
      if (err.includes('429') || err.includes('rate limit')) {
        toast.error('Limite de requisições excedido. Aguarde alguns segundos.');
      } else if (err.includes('402') || err.includes('payment')) {
        toast.error('Créditos insuficientes. Adicione créditos para continuar.');
      } else {
        toast.error(err);
      }
    },
  });

  const handleClick = async () => {
    const context = getContext();
    await generate(context);
    setDrawerOpen(true);
  };

  const handleApply = (mode: 'replace' | 'append') => {
    if (result) {
      onApply(result, mode);
      setDrawerOpen(false);
      reset();
      toast.success('Conteúdo aplicado com sucesso!');
    }
  };

  const handleClose = () => {
    setDrawerOpen(false);
    reset();
  };

  // Icon based on status
  const renderIcon = () => {
    if (isLoading) {
      return <Loader2 className="w-4 h-4 mr-2 animate-spin" />;
    }
    if (status === 'error') {
      return <AlertCircle className="w-4 h-4 mr-2 text-destructive" />;
    }
    if (status === 'success') {
      return <Check className="w-4 h-4 mr-2 text-primary" />;
    }
    return <Sparkles className="w-4 h-4 mr-2" />;
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          'transition-all duration-200',
          status === 'success' && 'border-primary/50',
          className
        )}
      >
        {renderIcon()}
        {children || (isLoading ? 'Gerando...' : `Gerar com IA`)}
      </Button>

      <AiDrawer
        open={drawerOpen}
        onClose={handleClose}
        actionKey={actionKey}
        result={result}
        error={error}
        isLoading={isLoading}
        hasExistingContent={hasExistingContent}
        onApply={handleApply}
        onRegenerate={() => generate(getContext())}
      />
    </>
  );
}
