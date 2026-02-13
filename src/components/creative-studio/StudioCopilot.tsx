import { useState } from 'react';
import { Sparkles, Wand2, Expand, Shrink, Palette, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AiPromptField } from '@/components/ai/AiPromptField';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { CreativeWork, CreativeBlock } from '@/types/creative-works';

interface StudioCopilotProps {
  work: CreativeWork | null;
  currentBlock: CreativeBlock | null;
  onQuickAction: (action: string, instruction?: string) => Promise<void>;
  isProcessing?: boolean;
  previewResult?: Record<string, unknown> | null;
  onApplyPreview?: () => void;
  onDiscardPreview?: () => void;
}

export function StudioCopilot({
  work,
  currentBlock,
  onQuickAction,
  isProcessing = false,
  previewResult,
  onApplyPreview,
  onDiscardPreview,
}: StudioCopilotProps) {
  const [instruction, setInstruction] = useState('');

  const handleSendInstruction = async () => {
    if (!instruction.trim()) return;
    await onQuickAction('custom', instruction);
    setInstruction('');
  };

  const quickActions = [
    { id: 'summarize', label: 'Resumir', icon: Shrink },
    { id: 'expand', label: 'Expandir', icon: Expand },
    { id: 'adjust_tone', label: 'Ajustar Tom', icon: Wand2 },
    { id: 'adapt_brand', label: 'Adaptar ao Brand Kit', icon: Palette },
  ];

  return (
    <div className="w-80 border-l bg-card flex flex-col h-full">
      <Tabs defaultValue="copilot" className="flex flex-col h-full">
        <div className="border-b px-4 py-2">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="copilot" className="text-xs">Copiloto</TabsTrigger>
            <TabsTrigger value="references" className="text-xs">Referências</TabsTrigger>
            <TabsTrigger value="actions" className="text-xs">Ações</TabsTrigger>
          </TabsList>
        </div>

        {/* Copilot Tab */}
        <TabsContent value="copilot" className="flex-1 flex flex-col m-0 overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Preview Result */}
              {previewResult && (
                <Card className="border-primary/50">
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Resultado IA
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">Preview</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(previewResult, null, 2)}
                      </pre>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={onApplyPreview}
                      >
                        Aplicar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={onDiscardPreview}
                      >
                        Descartar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ações Rápidas
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action) => (
                    <Button
                      key={action.id}
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs h-8"
                      onClick={() => onQuickAction(action.id)}
                      disabled={isProcessing || !currentBlock}
                    >
                      <action.icon className="w-3 h-3 mr-1.5" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Instruction */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Instrução Personalizada
                </h4>
                <AiPromptField
                  value={instruction}
                  onChange={setInstruction}
                  placeholder="Ex: deixe mais emocional, adicione mais detalhes visuais..."
                  rows={3}
                  disabled={isProcessing}
                  featureId="copilot-instruction"
                  showCounter={false}
                />
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleSendInstruction}
                  disabled={isProcessing || !instruction.trim() || !currentBlock}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3 mr-1.5" />
                      Enviar Instrução
                    </>
                  )}
                </Button>
              </div>

              {/* Tips */}
              <div className="space-y-2 pt-2">
                <Separator />
                <div className="text-xs text-muted-foreground space-y-1.5 pt-2">
                  <p className="font-medium">💡 Dicas:</p>
                  <ul className="space-y-1 pl-4 list-disc">
                    <li>Use "Gerar com IA" no editor para criar do zero</li>
                    <li>Use ações rápidas para ajustar conteúdo existente</li>
                    <li>Vincule cliente e projeto para contexto melhor</li>
                  </ul>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* References Tab */}
        <TabsContent value="references" className="flex-1 flex flex-col m-0 overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <div className="text-center py-8">
                <div className="text-muted-foreground text-sm">
                  Nenhuma referência vinculada
                </div>
                <Button variant="outline" size="sm" className="mt-3">
                  Adicionar Referência
                </Button>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="flex-1 flex flex-col m-0 overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Aplicar em
              </h4>
              <Button variant="outline" size="sm" className="w-full justify-start" disabled={!work?.project_id}>
                📄 Criar Conteúdo no Pipeline
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" disabled={!work?.campaign_id}>
                📢 Vincular à Campanha
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                📅 Agendar no Calendário
              </Button>
              
              <Separator className="my-3" />
              
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Gerenciar
              </h4>
              <Button variant="outline" size="sm" className="w-full justify-start">
                📋 Duplicar Trabalho
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                📥 Exportar PDF
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-destructive">
                🗑️ Arquivar
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
