import { useState, useEffect } from 'react';
import { Wand2, Loader2, Sparkles, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { BrandKit } from '@/types/marketing';
import { TemplateGallery } from './TemplateGallery';
import { BrandKitSelector, BrandKitSnapshot, snapshotFromBrandKit } from './BrandKitSelector';
import { TemplateFieldsEditor } from './TemplateFieldsEditor';
import type { FigmaTemplate } from '@/lib/figma-community-templates';

interface TemplateStudioPanelProps {
  brandKits: BrandKit[];
}

export function TemplateStudioPanel({ brandKits }: TemplateStudioPanelProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<FigmaTemplate | null>(null);
  const [selectedBrandKitId, setSelectedBrandKitId] = useState<string | null>(null);
  const [brandSnapshot, setBrandSnapshot] = useState<BrandKitSnapshot>(snapshotFromBrandKit(null));
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFields, setGeneratedFields] = useState<Record<string, string> | null>(null);

  // Reset field values when template changes
  useEffect(() => {
    setFieldValues({});
    setGeneratedFields(null);
  }, [selectedTemplate?.id]);

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      toast.error('Selecione um template primeiro');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-template-fields', {
        body: {
          templateId: selectedTemplate.id,
          templateName: selectedTemplate.name,
          category: selectedTemplate.category,
          fields: selectedTemplate.fields.map(f => ({ key: f.key, label: f.label })),
          brandKit: brandSnapshot,
          existingValues: fieldValues,
        },
      });

      if (error) throw error;

      if (data?.fields) {
        setGeneratedFields(data.fields);
        setFieldValues(prev => ({ ...prev, ...data.fields }));
        toast.success('Campos preenchidos pela IA!');
      }
    } catch (error) {
      console.error('Error generating fields:', error);
      toast.error('Erro ao gerar campos com IA');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToContent = async () => {
    if (!selectedTemplate) return;

    try {
      const { error } = await supabase
        .from('content_items')
        .insert([{
          title: fieldValues.title || selectedTemplate.name,
          hook: fieldValues.subtitle || null,
          caption_short: fieldValues.cta || null,
          caption_long: fieldValues.body || null,
          status: 'briefing',
          template_id: selectedTemplate.id,
          template_fields: fieldValues as any,
          brand_kit_snapshot: brandSnapshot as any,
        }]);

      if (error) throw error;

      toast.success('Conteúdo salvo no Pipeline!');
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Erro ao salvar conteúdo');
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-4 h-4 text-primary" />
          <h2 className="font-medium text-foreground text-sm">Templates & Brand Kit</h2>
        </div>
        {selectedTemplate && (
          <Badge variant="outline" className="text-[10px]">
            {selectedTemplate.name}
          </Badge>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Template Gallery */}
          <TemplateGallery
            selectedTemplateId={selectedTemplate?.id || null}
            onSelectTemplate={setSelectedTemplate}
          />

          <Separator />

          {/* Brand Kit Selector */}
          <BrandKitSelector
            brandKits={brandKits}
            selectedBrandKitId={selectedBrandKitId}
            snapshot={brandSnapshot}
            onSnapshotChange={setBrandSnapshot}
            onBrandKitChange={setSelectedBrandKitId}
          />

          {/* Template Fields */}
          {selectedTemplate && (
            <>
              <Separator />
              <TemplateFieldsEditor
                fields={selectedTemplate.fields}
                values={fieldValues}
                onChange={setFieldValues}
                disabled={isGenerating}
              />

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <Button
                  className="w-full h-9 gap-2 text-xs"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5" />
                  )}
                  {isGenerating ? 'Gerando...' : 'Preencher com IA'}
                </Button>

                {Object.keys(fieldValues).length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full h-9 gap-2 text-xs"
                    onClick={handleSaveToContent}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Salvar no Pipeline
                  </Button>
                )}
              </div>

              {generatedFields && (
                <div className="p-2 rounded bg-primary/5 border border-primary/20">
                  <p className="text-[10px] text-primary">
                    ✨ Campos preenchidos pela IA. Ajuste conforme necessário.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
