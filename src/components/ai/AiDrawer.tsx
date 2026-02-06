import { useState } from 'react';
import { 
  Sparkles, Check, RefreshCw, Copy, Replace, PlusCircle, 
  Loader2, AlertCircle, Clock 
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAiActionMeta } from '@/hooks/useAiGenerate';
import { toast } from 'sonner';

interface AiDrawerProps {
  open: boolean;
  onClose: () => void;
  actionKey: string;
  result: unknown | null;
  error: string | null;
  isLoading: boolean;
  hasExistingContent: boolean;
  onApply: (mode: 'replace' | 'append') => void;
  onRegenerate: () => void;
}

/**
 * AI Preview Drawer
 * Shows generated content with preview, apply options, and history
 */
export function AiDrawer({
  open,
  onClose,
  actionKey,
  result,
  error,
  isLoading,
  hasExistingContent,
  onApply,
  onRegenerate,
}: AiDrawerProps) {
  const [activeTab, setActiveTab] = useState('preview');
  const { title, description, fieldLabels } = useAiActionMeta(actionKey);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  const renderFieldValue = (key: string, value: unknown): React.ReactNode => {
    if (value === null || value === undefined) return null;

    if (Array.isArray(value)) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {value.map((item, i) => (
            <li key={i} className="text-sm text-foreground">
              {typeof item === 'object' ? JSON.stringify(item) : String(item)}
            </li>
          ))}
        </ul>
      );
    }

    if (typeof value === 'object') {
      return (
        <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    const text = String(value);
    const isMultiline = text.includes('\n') || text.length > 100;

    return (
      <div className="relative group">
        {isMultiline ? (
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans bg-muted/30 p-3 rounded-lg">
            {text}
          </pre>
        ) : (
          <p className="text-sm text-foreground">{text}</p>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
          onClick={() => copyToClipboard(text)}
        >
          <Copy className="w-3 h-3" />
        </Button>
      </div>
    );
  };

  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
          <p className="text-sm">Gerando conteúdo com IA...</p>
          <p className="text-xs mt-1">Isso pode levar alguns segundos</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-destructive">
          <AlertCircle className="w-8 h-8 mb-4" />
          <p className="text-sm font-medium">Erro ao gerar</p>
          <p className="text-xs mt-1 text-center max-w-xs">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={onRegenerate}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      );
    }

    if (!result) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Sparkles className="w-8 h-8 mb-4" />
          <p className="text-sm">Clique em "Gerar" para começar</p>
        </div>
      );
    }

    const resultObj = result as Record<string, unknown>;

    return (
      <div className="space-y-4">
        {Object.entries(resultObj).map(([key, value]) => {
          if (value === null || value === undefined) return null;
          
          const label = fieldLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          return (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {label}
              </label>
              {renderFieldValue(key, value)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[500px] sm:max-w-[500px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {title}
          </SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="apply">Aplicar</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="preview" className="mt-0 pr-4">
              {renderPreview()}
            </TabsContent>

            <TabsContent value="apply" className="mt-0 pr-4">
              {result ? (
                <div className="space-y-6">
                  <div className="glass-card p-4 rounded-xl space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Como deseja aplicar?</h4>
                    <p className="text-xs text-muted-foreground">
                      {hasExistingContent
                        ? 'Já existe conteúdo preenchido. Escolha como aplicar o resultado:'
                        : 'O conteúdo gerado será aplicado nos campos correspondentes.'}
                    </p>

                    <div className="grid gap-3 pt-2">
                      <Button 
                        className="w-full justify-start" 
                        variant={hasExistingContent ? 'outline' : 'default'}
                        onClick={() => onApply('replace')}
                      >
                        <Replace className="w-4 h-4 mr-2" />
                        {hasExistingContent ? 'Substituir tudo' : 'Aplicar'}
                      </Button>

                      {hasExistingContent && (
                        <Button 
                          className="w-full justify-start" 
                          variant="outline"
                          onClick={() => onApply('append')}
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Adicionar ao existente
                        </Button>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      O conteúdo só será salvo após você clicar em "Salvar" na página.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <p className="text-sm">Gere conteúdo primeiro para poder aplicar</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <SheetFooter className="mt-4 pt-4 border-t border-border">
          <div className="flex w-full gap-2">
            <Button variant="ghost" onClick={onClose} className="flex-1">
              Fechar
            </Button>
            {result && !isLoading && (
              <Button variant="outline" onClick={onRegenerate} className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerar
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
