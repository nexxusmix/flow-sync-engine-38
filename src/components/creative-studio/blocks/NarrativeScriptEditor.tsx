import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Save, History, RotateCcw } from 'lucide-react';
import { VoiceInputButton } from '@/components/ai/VoiceInputButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { cn } from '@/lib/utils';
import type { CreativeBlock, NarrativeScriptContent } from '@/types/creative-works';

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
  logline: '',
  premise: '',
  tone: '',
  theme: '',
  structure: {
    act1: '',
    act2: '',
    act3: '',
  },
  scenes: [],
  full_script: '',
};

export function NarrativeScriptEditor({
  block,
  onSave,
  onGenerate,
  onImprove,
  onRegenerate,
  isGenerating = false,
  versions = [],
  onRestoreVersion,
}: NarrativeScriptEditorProps) {
  const [content, setContent] = useState<NarrativeScriptContent>(emptyContent);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (block?.content) {
      const blockContent = block.content as unknown as NarrativeScriptContent;
      setContent({
        logline: blockContent.logline || '',
        premise: blockContent.premise || '',
        tone: blockContent.tone || '',
        theme: blockContent.theme || '',
        structure: blockContent.structure || { act1: '', act2: '', act3: '' },
        scenes: blockContent.scenes || [],
        full_script: blockContent.full_script || '',
      });
      setHasChanges(false);
    } else {
      setContent(emptyContent);
      setHasChanges(false);
    }
  }, [block]);

  const updateField = <K extends keyof NarrativeScriptContent>(
    field: K,
    value: NarrativeScriptContent[K]
  ) => {
    setContent((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const updateStructure = (act: 'act1' | 'act2' | 'act3', value: string) => {
    setContent((prev) => ({
      ...prev,
      structure: { ...prev.structure, [act]: value },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(content);
    setHasChanges(false);
  };

  const isEmpty = !content.logline && !content.premise && !content.full_script;
  const statusBadge = block?.status || 'empty';

  return (
    <div className="h-full flex flex-col">
      {/* Topbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Roteiro Narrativo</h2>
          <Badge 
            variant="secondary"
            className={cn(
              "text-xs",
              statusBadge === 'empty' && "bg-muted text-muted-foreground",
              statusBadge === 'draft' && "bg-secondary text-secondary-foreground",
              statusBadge === 'ready' && "bg-accent text-accent-foreground",
              statusBadge === 'approved' && "bg-primary/20 text-primary"
            )}
          >
            {statusBadge === 'empty' ? 'Vazio' : 
             statusBadge === 'draft' ? 'Rascunho' : 
             statusBadge === 'ready' ? 'Pronto' : 'Aprovado'}
          </Badge>
          {block?.version && block.version > 1 && (
            <Badge variant="outline" className="text-xs">
              v{block.version}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Version History */}
          {versions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <History className="w-4 h-4 mr-1.5" />
                  Versões
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {versions.map((v) => (
                  <DropdownMenuItem
                    key={v.version}
                    onClick={() => onRestoreVersion?.(v.version)}
                  >
                    Versão {v.version} - {new Date(v.created_at).toLocaleDateString('pt-BR')}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Generate Actions */}
          {isEmpty ? (
            <Button onClick={onGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Gerar com IA
                </>
              )}
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={onImprove} disabled={isGenerating}>
                <Sparkles className="w-4 h-4 mr-1.5" />
                Melhorar
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isGenerating}>
                    <RotateCcw className="w-4 h-4 mr-1.5" />
                    Regenerar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Regenerar Roteiro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso irá substituir o conteúdo atual. A versão atual será salva no histórico.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onRegenerate}>
                      Regenerar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {/* Save */}
          <Button onClick={handleSave} disabled={!hasChanges || isGenerating}>
            <Save className="w-4 h-4 mr-1.5" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
          {/* Empty State */}
          {isEmpty && !isGenerating && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <div className="text-muted-foreground mb-4">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">Nenhum roteiro criado</p>
                  <p className="text-sm">Clique em "Gerar com IA" ou comece a escrever manualmente</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={onGenerate} disabled={isGenerating}>
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Gerar com IA
                  </Button>
                  <Button variant="outline" onClick={() => updateField('logline', ' ')}>
                    Criar Manualmente
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form Fields */}
          {(!isEmpty || isGenerating) && (
            <>
              {/* Logline & Premise */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Conceito Central</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="logline">Logline</Label>
                    <Textarea
                      id="logline"
                      value={content.logline}
                      onChange={(e) => updateField('logline', e.target.value)}
                      placeholder="Uma frase que resume a essência da história..."
                      className="min-h-[60px] resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="premise">Premissa</Label>
                    <Textarea
                      id="premise"
                      value={content.premise}
                      onChange={(e) => updateField('premise', e.target.value)}
                      placeholder="O argumento central e a mensagem..."
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tone">Tom</Label>
                      <Input
                        id="tone"
                        value={content.tone}
                        onChange={(e) => updateField('tone', e.target.value)}
                        placeholder="Ex: Inspirador, Dramático, Divertido"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="theme">Tema</Label>
                      <Input
                        id="theme"
                        value={content.theme}
                        onChange={(e) => updateField('theme', e.target.value)}
                        placeholder="Ex: Superação, Transformação"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Structure (3 Acts) */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Estrutura Narrativa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="act1" className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Ato 1</Badge>
                      Apresentação / Setup
                    </Label>
                    <Textarea
                      id="act1"
                      value={content.structure?.act1 || ''}
                      onChange={(e) => updateStructure('act1', e.target.value)}
                      placeholder="Introdução do protagonista, mundo e conflito inicial..."
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="act2" className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Ato 2</Badge>
                      Confrontação / Desenvolvimento
                    </Label>
                    <Textarea
                      id="act2"
                      value={content.structure?.act2 || ''}
                      onChange={(e) => updateStructure('act2', e.target.value)}
                      placeholder="Escalada do conflito, obstáculos, ponto de virada..."
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="act3" className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Ato 3</Badge>
                      Resolução / Clímax
                    </Label>
                    <Textarea
                      id="act3"
                      value={content.structure?.act3 || ''}
                      onChange={(e) => updateStructure('act3', e.target.value)}
                      placeholder="Clímax, resolução do conflito, novo equilíbrio..."
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Full Script */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Roteiro Completo</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <Textarea
                    value={content.full_script || ''}
                    onChange={(e) => updateField('full_script', e.target.value)}
                    placeholder="Escreva o roteiro completo aqui, com diálogos e ações..."
                    className="min-h-[300px] font-mono text-sm pr-12"
                  />
                  <div className="absolute right-6 top-6">
                    <VoiceInputButton
                      onTranscript={(text) => updateField('full_script', (content.full_script || '') + '\n' + text)}
                      mode="append"
                      className="h-7 w-7"
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
