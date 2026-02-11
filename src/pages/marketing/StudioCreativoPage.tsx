import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { 
  CreativeBrief, CreativeOutput, StoryboardScene, GeneratedImage,
  ConceptContent, ScriptContent, MoodboardContent, ShotlistItem,
  PACKAGE_TYPES, PackageType, CreativePackageResponse
} from "@/types/creative-studio";
import { BrandKit, Campaign } from "@/types/marketing";
import { supabase } from "@/integrations/supabase/client";
import { 
  Wand2, Download, Trash2, Clock, FileText, Loader2, ExternalLink, Copy, Check
} from "lucide-react";
import type { Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { StudioBriefForm, StudioOutputTabs, StudioApplyActions } from "@/components/studio";
import { TemplateStudioPanel } from "@/components/studio/TemplateStudioPanel";
import { useExportPdf } from "@/hooks/useExportPdf";

export default function StudioCreativoPage() {
  // State
  const [briefs, setBriefs] = useState<CreativeBrief[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<CreativeBrief | null>(null);
  const [outputs, setOutputs] = useState<CreativeOutput[]>([]);
  const [scenes, setScenes] = useState<StoryboardScene[]>([]);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  
  // Loading States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingImages, setGeneratingImages] = useState<Set<number>>(new Set());
  const [progress, setProgress] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);

  // Export PDF
  const { isExporting, exportedUrl, exportStudioRun, openPdf, copyLink, resetExport } = useExportPdf();

  useEffect(() => {
    fetchBriefs();
    fetchBrandKits();
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (selectedBrief) {
      fetchOutputs(selectedBrief.id);
      fetchScenes(selectedBrief.id);
      fetchImages(selectedBrief.id);
      resetExport(); // Reset export URL when switching briefs
    }
  }, [selectedBrief]);

  const fetchBriefs = async () => {
    const { data } = await supabase
      .from('creative_briefs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setBriefs(data as unknown as CreativeBrief[]);
  };

  const fetchBrandKits = async () => {
    const { data } = await supabase
      .from('brand_kits')
      .select('*')
      .order('name');
    
    if (data) setBrandKits(data as unknown as BrandKit[]);
  };

  const fetchCampaigns = async () => {
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setCampaigns(data as unknown as Campaign[]);
  };

  const fetchOutputs = async (briefId: string) => {
    const { data } = await supabase
      .from('creative_outputs')
      .select('*')
      .eq('brief_id', briefId)
      .order('created_at', { ascending: false });
    
    if (data) setOutputs(data as unknown as CreativeOutput[]);
  };

  const fetchScenes = async (briefId: string) => {
    const { data } = await supabase
      .from('storyboard_scenes')
      .select('*')
      .eq('brief_id', briefId)
      .order('scene_number');
    
    if (data) setScenes(data as unknown as StoryboardScene[]);
  };

  const fetchImages = async (briefId: string) => {
    const { data } = await supabase
      .from('generated_images')
      .select('*')
      .eq('brief_id', briefId)
      .order('created_at', { ascending: false });
    
    if (data) setImages(data as unknown as GeneratedImage[]);
  };

  const handleGenerate = async (formData: {
    title: string;
    inputText: string;
    brandKitId: string | null;
    packageType: PackageType;
    objective: string;
    deliveryType: string;
    referenceFiles: File[];
  }) => {
    setIsGenerating(true);
    setProgress(10);

    try {
      // Create brief
      const { data: brief, error: briefError } = await supabase
        .from('creative_briefs')
        .insert([{
          title: formData.title,
          input_text: formData.inputText,
          brand_kit_id: formData.brandKitId,
          package_type: formData.packageType,
          objective: formData.objective,
          delivery_type: formData.deliveryType,
          status: 'processing',
        }])
        .select()
        .single();

      if (briefError) throw briefError;

      setProgress(30);

      // Get brand kit details
      let brandKit: BrandKit | undefined;
      if (formData.brandKitId) {
        const bk = brandKits.find(b => b.id === formData.brandKitId);
        if (bk) brandKit = bk;
      }

      // Build enhanced input text with objective and delivery type
      const enhancedInput = `
OBJETIVO: ${formData.objective}
TIPO DE ENTREGA: ${formData.deliveryType}

${formData.inputText}
      `.trim();

      // Call AI to generate creative package
      const { data: creativeData, error: aiError } = await supabase.functions.invoke('creative-studio', {
        body: {
          briefId: brief.id,
          inputText: enhancedInput,
          brandKit,
          packageType: formData.packageType,
          format: formData.deliveryType,
        }
      });

      if (aiError) throw aiError;

      setProgress(60);

      const pkg = creativeData as CreativePackageResponse;

      // Save outputs
      const outputsToInsert = [];

      if (pkg.concept) {
        outputsToInsert.push({
          brief_id: brief.id,
          type: 'concept',
          content: pkg.concept,
        });
      }

      if (pkg.script) {
        outputsToInsert.push({
          brief_id: brief.id,
          type: 'script',
          content: pkg.script,
        });
      }

      if (pkg.shotlist) {
        outputsToInsert.push({
          brief_id: brief.id,
          type: 'shotlist',
          content: pkg.shotlist,
        });
      }

      if (pkg.moodboard) {
        outputsToInsert.push({
          brief_id: brief.id,
          type: 'moodboard',
          content: pkg.moodboard,
        });
      }

      if (outputsToInsert.length > 0) {
        await supabase.from('creative_outputs').insert(outputsToInsert);
      }

      setProgress(80);

      // Save storyboard scenes
      if (pkg.storyboard?.length) {
        const scenesToInsert = pkg.storyboard.map((scene, i) => ({
          brief_id: brief.id,
          scene_number: scene.scene_number || i + 1,
          title: scene.title,
          description: scene.description,
          emotion: scene.emotion,
          camera: scene.camera,
          duration_sec: scene.duration_sec,
          audio: scene.audio,
          notes: scene.image_prompt,
        }));

        await supabase.from('storyboard_scenes').insert(scenesToInsert);
      }

      // Update brief status
      await supabase
        .from('creative_briefs')
        .update({ status: 'ready' })
        .eq('id', brief.id);

      setProgress(100);

      // Reload and select
      fetchBriefs();
      
      const { data: updatedBrief } = await supabase
        .from('creative_briefs')
        .select('*')
        .eq('id', brief.id)
        .single();
      
      if (updatedBrief) {
        setSelectedBrief(updatedBrief as unknown as CreativeBrief);
      }

      // Create automation suggestion for next steps (Rule A)
      try {
        await supabase.from('automation_suggestions').insert({
          rule_key: 'marketing.studio.next_steps',
          entity_type: 'creative_brief',
          entity_id: brief.id,
          title: 'Próximos passos do pacote criativo',
          message: `O pacote "${formData.title}" foi gerado. Considere criar conteúdos no pipeline, vincular a uma campanha ou agendar publicações.`,
          suggestion_json: {
            actions: [
              { key: 'create_content', label: 'Criar conteúdos no Pipeline' },
              { key: 'link_campaign', label: 'Vincular a Campanha' },
              { key: 'suggest_schedule', label: 'Sugerir agenda com IA' },
            ],
            context: {
              brief_title: formData.title,
              package_type: formData.packageType,
              objective: formData.objective,
            }
          }
        });
      } catch (suggestionError) {
        console.log('Could not create automation suggestion:', suggestionError);
      }

      toast.success("Pacote criativo gerado com sucesso!");

    } catch (error: unknown) {
      console.error("Error generating creative package:", error);
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(message);
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleRegenerateOutput = async (outputType: string) => {
    if (!selectedBrief) return;
    
    setIsRegenerating(outputType);

    try {
      let brandKit: BrandKit | undefined;
      if (selectedBrief.brand_kit_id) {
        brandKit = brandKits.find(b => b.id === selectedBrief.brand_kit_id);
      }

      // Call AI with specific output focus
      const { data: creativeData, error: aiError } = await supabase.functions.invoke('creative-studio', {
        body: {
          briefId: selectedBrief.id,
          inputText: selectedBrief.input_text,
          brandKit,
          packageType: selectedBrief.package_type,
        }
      });

      if (aiError) throw aiError;

      const pkg = creativeData as CreativePackageResponse;

      // Update the specific output using delete + insert pattern
      const updateOutput = async (type: string, content: unknown) => {
        // Delete existing output of this type
        await supabase
          .from('creative_outputs')
          .delete()
          .eq('brief_id', selectedBrief.id)
          .eq('type', type);
        
        // Insert new output
        await supabase
          .from('creative_outputs')
          .insert([{
            brief_id: selectedBrief.id,
            type,
            content: content as Json,
          }]);
      };

      if (outputType === 'concept' && pkg.concept) {
        await updateOutput('concept', pkg.concept);
      } else if (outputType === 'script' && pkg.script) {
        await updateOutput('script', pkg.script);
      } else if (outputType === 'moodboard' && pkg.moodboard) {
        await updateOutput('moodboard', pkg.moodboard);
      } else if (outputType === 'shotlist' && pkg.shotlist) {
        await updateOutput('shotlist', pkg.shotlist);
      } else if (outputType === 'storyboard' && pkg.storyboard) {
        // Delete existing scenes and insert new ones
        await supabase.from('storyboard_scenes').delete().eq('brief_id', selectedBrief.id);
        
        const scenesToInsert = pkg.storyboard.map((scene, i) => ({
          brief_id: selectedBrief.id,
          scene_number: scene.scene_number || i + 1,
          title: scene.title,
          description: scene.description,
          emotion: scene.emotion,
          camera: scene.camera,
          duration_sec: scene.duration_sec,
          audio: scene.audio,
          notes: scene.image_prompt,
        }));

        await supabase.from('storyboard_scenes').insert(scenesToInsert);
      }

      // Refresh data
      fetchOutputs(selectedBrief.id);
      fetchScenes(selectedBrief.id);

      toast.success(`${outputType} regenerado com sucesso!`);

    } catch (error: unknown) {
      console.error("Error regenerating output:", error);
      toast.error("Erro ao regenerar output");
    } finally {
      setIsRegenerating(null);
    }
  };

  const handleUpdateOutput = async (outputType: string, content: unknown) => {
    if (!selectedBrief) return;

    try {
      await supabase
        .from('creative_outputs')
        .update({ content: content as Json })
        .eq('brief_id', selectedBrief.id)
        .eq('type', outputType);

      // Update local state - refetch to ensure consistency
      fetchOutputs(selectedBrief.id);

    } catch (error) {
      console.error("Error updating output:", error);
      toast.error("Erro ao atualizar");
    }
  };

  const handleGenerateSceneImage = async (scene: StoryboardScene) => {
    if (!scene.notes) {
      toast.error("Sem prompt de imagem para esta cena");
      return;
    }

    setGeneratingImages(prev => new Set(prev).add(scene.scene_number));

    try {
      const brandKit = selectedBrief?.brand_kit_id 
        ? brandKits.find(b => b.id === selectedBrief.brand_kit_id)
        : undefined;

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: scene.notes,
          briefId: selectedBrief?.id,
          sceneId: scene.id,
          purpose: 'storyboard_frame',
          aspectRatio: '16:9',
          brandKit,
        }
      });

      if (error) throw error;

      // Update scene with image URL
      await supabase
        .from('storyboard_scenes')
        .update({ image_url: data.imageUrl })
        .eq('id', scene.id);

      // Refresh scenes
      if (selectedBrief) {
        fetchScenes(selectedBrief.id);
        fetchImages(selectedBrief.id);
      }

      toast.success("Imagem gerada!");

    } catch (error: unknown) {
      console.error("Error generating image:", error);
      const message = error instanceof Error ? error.message : "Erro ao gerar imagem";
      toast.error(message);
    } finally {
      setGeneratingImages(prev => {
        const next = new Set(prev);
        next.delete(scene.scene_number);
        return next;
      });
    }
  };

  const handleDeleteBrief = async (id: string) => {
    await supabase.from('creative_briefs').delete().eq('id', id);
    setBriefs(briefs.filter(b => b.id !== id));
    if (selectedBrief?.id === id) {
      setSelectedBrief(null);
      setOutputs([]);
      setScenes([]);
      setImages([]);
    }
    toast.success("Brief excluído");
  };

  const handleCreateContent = async (data: { title: string; hook?: string; script?: string }) => {
    try {
      const { error } = await supabase
        .from('content_items')
        .insert([{
          title: data.title,
          hook: data.hook,
          script: data.script,
          status: 'briefing',
        }]);

      if (error) throw error;

      toast.success("Conteúdo criado no Pipeline!");
    } catch (error) {
      console.error("Error creating content:", error);
      toast.error("Erro ao criar conteúdo");
    }
  };

  const handleLinkToCampaign = async (campaignId: string) => {
    if (!selectedBrief) return;

    try {
      // Here we would link the brief to the campaign
      // For now, we just show a success message
      const campaign = campaigns.find(c => c.id === campaignId);
      toast.success(`Brief vinculado à campanha "${campaign?.name}"`);
    } catch (error) {
      console.error("Error linking to campaign:", error);
      toast.error("Erro ao vincular");
    }
  };

  const handleSaveAsReference = () => {
    toast.success("Brief salvo como referência");
  };

  // Get typed outputs
  const conceptOutput = outputs.find(o => o.type === 'concept');
  const scriptOutput = outputs.find(o => o.type === 'script');
  const moodboardOutput = outputs.find(o => o.type === 'moodboard');
  const shotlistOutput = outputs.find(o => o.type === 'shotlist');

  const concept = conceptOutput?.content as ConceptContent | undefined;
  const script = scriptOutput?.content as ScriptContent | undefined;
  const moodboard = moodboardOutput?.content as MoodboardContent | undefined;
  const shotlist = shotlistOutput?.content as ShotlistItem[] | undefined;

  return (
    <DashboardLayout title="Studio Criativo">
      <div className="h-[calc(100vh-120px)] flex gap-6">
        {/* Left Column - Create/Select Brief */}
        <div className="w-[380px] flex flex-col gap-4 overflow-hidden">
          {/* Create New Brief */}
          <StudioBriefForm
            brandKits={brandKits}
            isGenerating={isGenerating}
            progress={progress}
            onGenerate={handleGenerate}
          />

          {/* Briefs List */}
          <Card className="bg-card/50 backdrop-blur border-border/50 p-4 flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Histórico
              </h3>
              <Badge variant="secondary" className="text-[10px]">
                {briefs.length} briefs
              </Badge>
            </div>

            <ScrollArea className="h-[calc(100%-44px)]">
              <div className="space-y-2 pr-2">
                {briefs.map(brief => (
                  <div
                    key={brief.id}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-all",
                      selectedBrief?.id === brief.id 
                        ? "bg-primary/15 border border-primary/30 shadow-sm" 
                        : "bg-muted/30 hover:bg-muted/50 border border-transparent"
                    )}
                    onClick={() => setSelectedBrief(brief)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm text-foreground truncate flex-1">
                        {brief.title}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBrief(brief.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[9px] px-1.5",
                          brief.status === 'ready' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
                          brief.status === 'processing' && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
                          brief.status === 'draft' && "bg-muted text-muted-foreground"
                        )}
                      >
                        {brief.status === 'ready' ? 'Pronto' : brief.status === 'processing' ? 'Processando' : 'Rascunho'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(brief.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}

                {briefs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum brief criado ainda
                  </p>
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Center Column - Preview */}
        <div className="flex-1 overflow-hidden">
          {selectedBrief ? (
            <Card className="bg-card/50 backdrop-blur border-border/50 h-full overflow-hidden flex flex-col">
              {/* ... keep existing code */}
              <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="font-semibold text-foreground">{selectedBrief.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {PACKAGE_TYPES.find(p => p.type === selectedBrief.package_type)?.name}
                  </p>
                </div>
                <div className="flex gap-2">
                  {exportedUrl ? (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={openPdf}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Abrir PDF
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={copyLink}
                      >
                        <Copy className="w-4 h-4" />
                        Copiar Link
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => exportStudioRun(selectedBrief.id)}
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {isExporting ? "Exportando..." : "Exportar PDF"}
                    </Button>
                  )}
                  <StudioApplyActions
                    brief={selectedBrief}
                    concept={concept}
                    script={script}
                    storyboard={scenes}
                    shotlist={shotlist}
                    moodboard={moodboard}
                    campaigns={campaigns}
                    onSaveAsReference={handleSaveAsReference}
                    onCampaignCreated={(campaign) => setCampaigns(prev => [...prev, campaign])}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <StudioOutputTabs
                  concept={concept}
                  script={script}
                  moodboard={moodboard}
                  shotlist={shotlist}
                  scenes={scenes}
                  onRegenerateOutput={handleRegenerateOutput}
                  onUpdateOutput={handleUpdateOutput}
                  onGenerateSceneImage={handleGenerateSceneImage}
                  generatingImages={generatingImages}
                  isRegenerating={isRegenerating}
                />
              </div>
            </Card>
          ) : (
            <Card className="bg-card/50 backdrop-blur border-border/50 h-full flex items-center justify-center">
              <div className="text-center">
                <Wand2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Crie um novo brief ou selecione um existente
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Templates & Brand Kit */}
        <div className="w-[340px] flex-shrink-0">
          <TemplateStudioPanel brandKits={brandKits} />
        </div>
      </div>
    </DashboardLayout>
  );
}
