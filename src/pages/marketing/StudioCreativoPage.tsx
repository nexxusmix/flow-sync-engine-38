import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { 
  CreativeBrief, CreativeOutput, StoryboardScene, GeneratedImage,
  ConceptContent, ScriptContent, MoodboardContent, ShotlistItem,
  PACKAGE_TYPES, PackageType, CreativePackageResponse
} from "@/types/creative-studio";
import { BrandKit } from "@/types/marketing";
import { supabase } from "@/integrations/supabase/client";
import { 
  Sparkles, Upload, FileText, Image, Film, Palette, 
  List, Download, RefreshCw, ChevronRight, Play, Clock,
  Wand2, Eye, Trash2, Plus, Check, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function StudioCreativoPage() {
  // State
  const [briefs, setBriefs] = useState<CreativeBrief[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<CreativeBrief | null>(null);
  const [outputs, setOutputs] = useState<CreativeOutput[]>([]);
  const [scenes, setScenes] = useState<StoryboardScene[]>([]);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  
  // Form State
  const [title, setTitle] = useState("");
  const [inputText, setInputText] = useState("");
  const [selectedBrandKit, setSelectedBrandKit] = useState<string>("none");
  const [packageType, setPackageType] = useState<PackageType>("full");
  
  // Loading States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingImages, setGeneratingImages] = useState<Set<number>>(new Set());
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchBriefs();
    fetchBrandKits();
  }, []);

  useEffect(() => {
    if (selectedBrief) {
      fetchOutputs(selectedBrief.id);
      fetchScenes(selectedBrief.id);
      fetchImages(selectedBrief.id);
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

  const handleCreateBrief = async () => {
    if (!title || !inputText) {
      toast.error("Título e briefing são obrigatórios");
      return;
    }

    setIsGenerating(true);
    setProgress(10);

    try {
      // Create brief
      const { data: brief, error: briefError } = await supabase
        .from('creative_briefs')
        .insert([{
          title,
          input_text: inputText,
          brand_kit_id: selectedBrandKit === "none" ? null : selectedBrandKit || null,
          package_type: packageType,
          status: 'processing',
        }])
        .select()
        .single();

      if (briefError) throw briefError;

      setProgress(30);

      // Get brand kit details
      let brandKit: BrandKit | undefined;
      if (selectedBrandKit && selectedBrandKit !== "none") {
        const bk = brandKits.find(b => b.id === selectedBrandKit);
        if (bk) brandKit = bk;
      }

      // Call AI to generate creative package
      const { data: creativeData, error: aiError } = await supabase.functions.invoke('creative-studio', {
        body: {
          briefId: brief.id,
          inputText,
          brandKit,
          packageType,
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
          notes: scene.image_prompt, // Store prompt in notes for now
        }));

        await supabase.from('storyboard_scenes').insert(scenesToInsert);
      }

      // Update brief status
      await supabase
        .from('creative_briefs')
        .update({ status: 'ready' })
        .eq('id', brief.id);

      setProgress(100);

      // Reset form and reload
      setTitle("");
      setInputText("");
      setSelectedBrandKit("none");
      fetchBriefs();
      
      // Select the new brief
      const { data: updatedBrief } = await supabase
        .from('creative_briefs')
        .select('*')
        .eq('id', brief.id)
        .single();
      
      if (updatedBrief) {
        setSelectedBrief(updatedBrief as unknown as CreativeBrief);
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

  const handleGenerateAllImages = async () => {
    const scenesWithPrompts = scenes.filter(s => s.notes && !s.image_url);
    
    for (const scene of scenesWithPrompts) {
      await handleGenerateSceneImage(scene);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
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
        <div className="w-[400px] flex flex-col gap-4">
          {/* Create New Brief */}
          <Card className="glass-card p-4">
            <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-primary" />
              Novo Brief Criativo
            </h3>

            <div className="space-y-3">
              <div>
                <Label className="text-xs">Título</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Campanha Lançamento Produto X"
                  disabled={isGenerating}
                />
              </div>

              <div>
                <Label className="text-xs">Brand Kit (opcional)</Label>
                <Select value={selectedBrandKit} onValueChange={setSelectedBrandKit} disabled={isGenerating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {brandKits.map(kit => (
                      <SelectItem key={kit.id} value={kit.id}>{kit.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Tipo de Pacote</Label>
                <Select value={packageType} onValueChange={(v) => setPackageType(v as PackageType)} disabled={isGenerating}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PACKAGE_TYPES.map(pkg => (
                      <SelectItem key={pkg.type} value={pkg.type}>
                        <div>
                          <p className="font-medium">{pkg.name}</p>
                          <p className="text-xs text-muted-foreground">{pkg.description}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Briefing / Input</Label>
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Cole aqui o briefing, descreva a ideia, objetivo, público, restrições..."
                  rows={6}
                  disabled={isGenerating}
                />
              </div>

              {isGenerating && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    Gerando pacote criativo com IA...
                  </p>
                </div>
              )}

              <Button 
                className="w-full" 
                onClick={handleCreateBrief}
                disabled={isGenerating || !title || !inputText}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isGenerating ? "Gerando..." : "Processar com IA"}
              </Button>
            </div>
          </Card>

          {/* Briefs List */}
          <Card className="glass-card p-4 flex-1 overflow-hidden">
            <h3 className="font-medium text-foreground mb-3">Briefs Recentes</h3>
            <ScrollArea className="h-[calc(100%-40px)]">
              <div className="space-y-2 pr-4">
                {briefs.map(brief => (
                  <div
                    key={brief.id}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-colors",
                      selectedBrief?.id === brief.id 
                        ? "bg-primary/20 border border-primary/30" 
                        : "bg-muted/30 hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedBrief(brief)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-foreground truncate">{brief.title}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBrief(brief.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[9px]",
                          brief.status === 'ready' && "bg-emerald-500/20 text-emerald-500",
                          brief.status === 'processing' && "bg-amber-500/20 text-amber-500"
                        )}
                      >
                        {brief.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
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

        {/* Right Column - Preview */}
        <div className="flex-1 overflow-hidden">
          {selectedBrief ? (
            <Card className="glass-card h-full overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="font-medium text-foreground">{selectedBrief.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {PACKAGE_TYPES.find(p => p.type === selectedBrief.package_type)?.name}
                  </p>
                </div>
                <div className="flex gap-2">
                  {scenes.filter(s => s.notes && !s.image_url).length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleGenerateAllImages}>
                      <Image className="w-4 h-4 mr-1" />
                      Gerar Todas Imagens
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Exportar PDF
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="concept" className="h-[calc(100%-80px)]">
                <TabsList className="px-4 pt-2">
                  <TabsTrigger value="concept">Conceito</TabsTrigger>
                  <TabsTrigger value="script">Roteiro</TabsTrigger>
                  <TabsTrigger value="storyboard">Storyboard</TabsTrigger>
                  <TabsTrigger value="shotlist">Shotlist</TabsTrigger>
                  <TabsTrigger value="moodboard">Moodboard</TabsTrigger>
                  <TabsTrigger value="images">Imagens ({images.length})</TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[calc(100%-48px)]">
                  {/* Concept Tab */}
                  <TabsContent value="concept" className="p-4 m-0">
                    {concept ? (
                      <div className="space-y-4">
                        <ConceptCard label="Big Idea" value={concept.big_idea} highlight />
                        <div className="grid grid-cols-2 gap-4">
                          <ConceptCard label="Headline" value={concept.headline} />
                          <ConceptCard label="Subheadline" value={concept.subheadline} />
                        </div>
                        <ConceptCard label="Premissa" value={concept.premissa} />
                        <ConceptCard label="Promessa" value={concept.promessa} />
                        <div className="grid grid-cols-2 gap-4">
                          <ConceptCard label="Tom" value={concept.tom} />
                          <ConceptCard label="Tema" value={concept.tema} />
                        </div>
                        <ConceptCard label="Metáfora Central" value={concept.metafora_central} />
                        <ConceptCard label="Argumento Comercial" value={concept.argumento_comercial} />
                      </div>
                    ) : (
                      <EmptyState message="Conceito não gerado" />
                    )}
                  </TabsContent>

                  {/* Script Tab */}
                  <TabsContent value="script" className="p-4 m-0">
                    {script ? (
                      <div className="space-y-4">
                        <Card className="p-4 bg-primary/10 border-primary/30">
                          <p className="text-xs text-primary uppercase font-medium mb-2">Hook</p>
                          <p className="text-foreground text-lg font-medium">{script.hook}</p>
                        </Card>
                        <Card className="p-4 bg-muted/30">
                          <p className="text-xs text-muted-foreground uppercase mb-2">Desenvolvimento</p>
                          <p className="text-foreground whitespace-pre-wrap">{script.desenvolvimento}</p>
                        </Card>
                        <div className="grid grid-cols-2 gap-4">
                          <Card className="p-4 bg-muted/30">
                            <p className="text-xs text-muted-foreground uppercase mb-2">CTA</p>
                            <p className="text-foreground">{script.cta}</p>
                          </Card>
                          <Card className="p-4 bg-muted/30">
                            <p className="text-xs text-muted-foreground uppercase mb-2">Duração</p>
                            <p className="text-foreground flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {script.duracao_estimada}
                            </p>
                          </Card>
                        </div>
                      </div>
                    ) : (
                      <EmptyState message="Roteiro não gerado" />
                    )}
                  </TabsContent>

                  {/* Storyboard Tab */}
                  <TabsContent value="storyboard" className="p-4 m-0">
                    {scenes.length > 0 ? (
                      <div className="space-y-4">
                        {scenes.map((scene) => (
                          <Card key={scene.id} className="p-4 bg-muted/30">
                            <div className="flex gap-4">
                              {/* Scene Image */}
                              <div className="w-48 h-28 rounded-lg bg-background flex-shrink-0 overflow-hidden relative">
                                {scene.image_url ? (
                                  <img 
                                    src={scene.image_url} 
                                    alt={scene.title || `Cena ${scene.scene_number}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    {generatingImages.has(scene.scene_number) ? (
                                      <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
                                    ) : (
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleGenerateSceneImage(scene)}
                                        disabled={!scene.notes}
                                      >
                                        <Sparkles className="w-4 h-4 mr-1" />
                                        Gerar
                                      </Button>
                                    )}
                                  </div>
                                )}
                                <Badge className="absolute top-2 left-2 bg-black/70 text-white text-[9px]">
                                  {scene.scene_number}
                                </Badge>
                              </div>

                              {/* Scene Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-foreground">{scene.title}</h4>
                                  {scene.duration_sec && (
                                    <Badge variant="outline" className="text-[9px]">
                                      {scene.duration_sec}s
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{scene.description}</p>
                                <div className="flex flex-wrap gap-2 text-[10px]">
                                  {scene.emotion && (
                                    <Badge variant="outline">😊 {scene.emotion}</Badge>
                                  )}
                                  {scene.camera && (
                                    <Badge variant="outline">📷 {scene.camera}</Badge>
                                  )}
                                  {scene.audio && (
                                    <Badge variant="outline">🔊 {scene.audio}</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="Storyboard não gerado" />
                    )}
                  </TabsContent>

                  {/* Shotlist Tab */}
                  <TabsContent value="shotlist" className="p-4 m-0">
                    {shotlist && shotlist.length > 0 ? (
                      <div className="space-y-2">
                        {shotlist.map((shot, i) => (
                          <Card key={i} className="p-3 bg-muted/30">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium">
                                {i + 1}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-foreground">{shot.plano}</p>
                                <p className="text-sm text-muted-foreground">{shot.descricao}</p>
                              </div>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="text-[9px]">{shot.lente_sugerida}</Badge>
                                <Badge variant="outline" className="text-[9px]">{shot.ambiente}</Badge>
                                <Badge variant="outline" className="text-[9px]">{shot.luz}</Badge>
                                <Badge 
                                  className={cn(
                                    "text-[9px]",
                                    shot.prioridade === 'must-have' ? "bg-red-500" : "bg-muted"
                                  )}
                                >
                                  {shot.prioridade}
                                </Badge>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="Shotlist não gerado" />
                    )}
                  </TabsContent>

                  {/* Moodboard Tab */}
                  <TabsContent value="moodboard" className="p-4 m-0">
                    {moodboard ? (
                      <div className="space-y-4">
                        <Card className="p-4 bg-primary/10 border-primary/30">
                          <p className="text-xs text-primary uppercase font-medium mb-2">Direção de Arte</p>
                          <p className="text-foreground">{moodboard.direcao_de_arte}</p>
                        </Card>

                        <div className="grid grid-cols-2 gap-4">
                          {moodboard.paleta?.length > 0 && (
                            <Card className="p-4 bg-muted/30">
                              <p className="text-xs text-muted-foreground uppercase mb-2">Paleta</p>
                              <div className="flex flex-wrap gap-2">
                                {moodboard.paleta.map((color, i) => (
                                  <Badge key={i} variant="outline">{color}</Badge>
                                ))}
                              </div>
                            </Card>
                          )}

                          <Card className="p-4 bg-muted/30">
                            <p className="text-xs text-muted-foreground uppercase mb-2">Materiais & Texturas</p>
                            <p className="text-sm text-foreground">{moodboard.materiais_texturas}</p>
                          </Card>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <Card className="p-4 bg-muted/30">
                            <p className="text-xs text-muted-foreground uppercase mb-2">Figurino</p>
                            <p className="text-sm text-foreground">{moodboard.figurino}</p>
                          </Card>
                          <Card className="p-4 bg-muted/30">
                            <p className="text-xs text-muted-foreground uppercase mb-2">Props</p>
                            <p className="text-sm text-foreground">{moodboard.props}</p>
                          </Card>
                          <Card className="p-4 bg-muted/30">
                            <p className="text-xs text-muted-foreground uppercase mb-2">Clima</p>
                            <p className="text-sm text-foreground">{moodboard.arquitetura_clima}</p>
                          </Card>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {moodboard.do_visual?.length > 0 && (
                            <Card className="p-4 bg-emerald-500/10 border-emerald-500/30">
                              <p className="text-xs text-emerald-500 uppercase font-medium mb-2">✓ DO Visual</p>
                              <ul className="space-y-1">
                                {moodboard.do_visual.map((item, i) => (
                                  <li key={i} className="text-sm text-foreground flex items-center gap-2">
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </Card>
                          )}

                          {moodboard.dont_visual?.length > 0 && (
                            <Card className="p-4 bg-red-500/10 border-red-500/30">
                              <p className="text-xs text-red-500 uppercase font-medium mb-2">✗ DON'T Visual</p>
                              <ul className="space-y-1">
                                {moodboard.dont_visual.map((item, i) => (
                                  <li key={i} className="text-sm text-foreground flex items-center gap-2">
                                    <AlertTriangle className="w-3 h-3 text-red-500" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </Card>
                          )}
                        </div>
                      </div>
                    ) : (
                      <EmptyState message="Moodboard não gerado" />
                    )}
                  </TabsContent>

                  {/* Images Tab */}
                  <TabsContent value="images" className="p-4 m-0">
                    {images.length > 0 ? (
                      <div className="grid grid-cols-3 gap-4">
                        {images.map((img) => (
                          <Card key={img.id} className="overflow-hidden">
                            <div className="aspect-video bg-muted">
                              {img.public_url && (
                                <img 
                                  src={img.public_url} 
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="p-2">
                              <Badge variant="outline" className="text-[9px]">{img.purpose}</Badge>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="Nenhuma imagem gerada ainda" />
                    )}
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </Card>
          ) : (
            <Card className="glass-card h-full flex items-center justify-center">
              <div className="text-center">
                <Wand2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Crie um novo brief ou selecione um existente</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function ConceptCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={cn("p-4", highlight ? "bg-primary/10 border-primary/30" : "bg-muted/30")}>
      <p className={cn("text-xs uppercase mb-2", highlight ? "text-primary font-medium" : "text-muted-foreground")}>
        {label}
      </p>
      <p className={cn("text-foreground", highlight && "text-lg font-medium")}>{value}</p>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
