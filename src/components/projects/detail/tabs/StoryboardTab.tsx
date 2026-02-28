import { useState, useRef } from "react";
import { ProjectWithStages } from "@/hooks/useProjects";
import { useProjectStoryboards, COLOR_GRADINGS, PRODUCTION_TYPES, StoryboardScene, ProjectContextData } from "@/hooks/useProjectStoryboards";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, Loader2, Film, Camera, Sun, Palette, 
  ChevronDown, Copy, Check, Trash2, Eye, Plus, Clapperboard,
  Mic, Upload, FileAudio, FileText, FolderSearch, Brain, 
  FileUp, X, CheckCircle2, ImageIcon, RefreshCw
} from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StoryboardTabProps {
  project: ProjectWithStages;
}

export function StoryboardTab({ project }: StoryboardTabProps) {
  const { storyboards, isLoading, generate, deleteStoryboard } = useProjectStoryboards(project.id);
  const [showForm, setShowForm] = useState(false);
  const [selectedStoryboardId, setSelectedStoryboardId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
            <Clapperboard className="w-5 h-5 text-primary" />
            Storyboard IA
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Motor inteligente de leitura e direção criativa do projeto
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Storyboard
        </Button>
      </div>

      {showForm && (
        <StoryboardForm 
          project={project} 
          onGenerate={generate} 
          onClose={() => setShowForm(false)} 
        />
      )}

      {storyboards.length === 0 && !showForm ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Film className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <h4 className="font-medium text-foreground">Nenhum storyboard</h4>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Crie seu primeiro storyboard a partir de roteiros, arquivos do projeto ou contexto completo.
            </p>
            <Button onClick={() => setShowForm(true)} variant="outline" size="sm" className="mt-4 gap-2">
              <Sparkles className="w-4 h-4" />
              Gerar Storyboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {storyboards.map((sb) => (
            <StoryboardCard
              key={sb.id}
              storyboard={sb}
              isSelected={selectedStoryboardId === sb.id}
              onSelect={() => setSelectedStoryboardId(selectedStoryboardId === sb.id ? null : sb.id)}
              onDelete={() => deleteStoryboard.mutate(sb.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ───── FORM ─────
function StoryboardForm({ project, onGenerate, onClose }: {
  project: ProjectWithStages;
  onGenerate: ReturnType<typeof useProjectStoryboards>["generate"];
  onClose: () => void;
}) {
  const { deliverables, projectFiles, fetchProjectContext } = useProjectStoryboards(project.id);
  const [sourceText, setSourceText] = useState("");
  const [title, setTitle] = useState("");
  const [colorGrading, setColorGrading] = useState("Original neutro");
  const [objective, setObjective] = useState("");
  const [deliverableId, setDeliverableId] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [contextLoaded, setContextLoaded] = useState(false);
  const [projectContext, setProjectContext] = useState<ProjectContextData | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<{ name: string; content: string }[]>([]);
  const [selectedProjectFiles, setSelectedProjectFiles] = useState<string[]>([]);
  const [showFilesBrowser, setShowFilesBrowser] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Auto-load project context
  const handleLoadContext = async () => {
    setIsLoadingContext(true);
    try {
      const ctx = await fetchProjectContext();
      setProjectContext(ctx);
      setContextLoaded(true);
      toast.success("Contexto do projeto carregado!");
    } catch {
      toast.error("Erro ao carregar contexto do projeto");
    } finally {
      setIsLoadingContext(false);
    }
  };

  // Transcribe audio/video
  const handleTranscribe = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 20MB.");
      return;
    }
    setIsTranscribing(true);
    toast.info(`Transcrevendo "${file.name}"...`);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data, error } = await supabase.functions.invoke("transcribe-media", {
        body: { audioBase64: base64, mimeType: file.type, fileName: file.name },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      const transcription = data?.transcription || "";
      if (!transcription.trim()) {
        toast.warning("Nenhum conteúdo detectado.");
        return;
      }
      setSourceText(prev => prev ? `${prev}\n\n--- Transcrição de ${file.name} ---\n${transcription}` : transcription);
      toast.success("Transcrição concluída!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao transcrever");
    } finally {
      setIsTranscribing(false);
    }
  };

  // Upload documents (PDF, DOCX, TXT, RTF)
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`"${file.name}" excede 25MB.`);
        continue;
      }
      // For TXT/RTF, read as text
      if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".rtf")) {
        const text = await file.text();
        setUploadedDocs(prev => [...prev, { name: file.name, content: text }]);
        setSourceText(prev => prev ? `${prev}\n\n--- ${file.name} ---\n${text}` : text);
        toast.success(`"${file.name}" carregado.`);
      } else {
        // For PDF/DOCX, read as base64 and send to transcribe-media (Gemini can parse docs)
        toast.info(`Processando "${file.name}"...`);
        try {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve((reader.result as string).split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          const { data, error } = await supabase.functions.invoke("transcribe-media", {
            body: { audioBase64: base64, mimeType: file.type, fileName: file.name },
          });
          if (error) throw new Error(error.message);
          if (data?.error) throw new Error(data.error);
          const extracted = data?.transcription || "";
          if (extracted.trim()) {
            setUploadedDocs(prev => [...prev, { name: file.name, content: extracted }]);
            setSourceText(prev => prev ? `${prev}\n\n--- ${file.name} ---\n${extracted}` : extracted);
            toast.success(`"${file.name}" processado.`);
          } else {
            toast.warning(`Nenhum conteúdo extraído de "${file.name}".`);
          }
        } catch (err: any) {
          toast.error(`Erro ao processar "${file.name}": ${err.message}`);
        }
      }
    }
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleTranscribe(file);
    if (mediaInputRef.current) mediaInputRef.current.value = "";
  };

  const handleToggleProjectFile = (fileId: string) => {
    setSelectedProjectFiles(prev =>
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };

  const handleSubmit = async () => {
    if (!sourceText.trim() && !contextLoaded) {
      toast.error("Insira texto, upload de arquivo ou carregue o contexto do projeto");
      return;
    }

    // Build file summaries from selected project files
    const fileSummaries = selectedProjectFiles.map(fid => {
      const pf = projectFiles.find((f: any) => f.id === fid);
      return pf ? { name: pf.name, summary: `Arquivo do projeto: ${pf.name} (${pf.folder})` } : null;
    }).filter(Boolean);

    // Merge uploaded doc summaries
    const allFileSummaries = [
      ...fileSummaries,
      ...uploadedDocs.map(d => ({ name: d.name, summary: d.content.substring(0, 2000) })),
    ];

    const finalContext: ProjectContextData = projectContext 
      ? { ...projectContext, fileSummaries: allFileSummaries as any }
      : { hasContext: allFileSummaries.length > 0, fileSummaries: allFileSummaries as any };

    // Set deliverable if selected
    if (deliverableId) {
      const del = deliverables.find((d: any) => d.id === deliverableId);
      if (del) finalContext.deliverable = del;
    }

    onGenerate.mutate({
      sourceText,
      title: title || `Storyboard - ${project.name}`,
      sourceType: uploadedDocs.length > 0 ? "upload" : contextLoaded ? "project_context" : "text",
      colorGrading,
      projectName: project.name,
      clientName: (project as any).client_name,
      objective,
      deliverableId: deliverableId || undefined,
      sourceFiles: allFileSummaries,
      projectContext: finalContext,
    }, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <Card className="border-primary/20 bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Gerar Storyboard com IA — Motor Inteligente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Row 1: Project info + deliverable */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Projeto</Label>
            <Input value={project.name} disabled className="bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Label>Entrega / Subprojeto</Label>
            <Select value={deliverableId || "none"} onValueChange={(val) => setDeliverableId(val === "none" ? "" : val)}>
              <SelectTrigger><SelectValue placeholder="Selecionar (opcional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {deliverables.map((d: any) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Título</Label>
            <Input placeholder={`Storyboard - ${project.name}`} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
        </div>

        {/* Row 2: Color + Objective */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Color Grading Global</Label>
            <Select value={colorGrading} onValueChange={setColorGrading}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COLOR_GRADINGS.map((cg) => (
                  <SelectItem key={cg} value={cg}>{cg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Objetivo</Label>
            <Input placeholder="Ex: Vídeo institucional, Reel Instagram..." value={objective} onChange={(e) => setObjective(e.target.value)} />
          </div>
        </div>

        <Separator />

        {/* Context Engine */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            Motor de Contexto
          </Label>
          <p className="text-xs text-muted-foreground">
            A IA analisa automaticamente roteiros, briefings, escopo, contrato e arquivos do projeto.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={contextLoaded ? "default" : "outline"}
              size="sm"
              onClick={handleLoadContext}
              disabled={isLoadingContext}
              className="gap-2"
            >
              {isLoadingContext ? <Loader2 className="w-4 h-4 animate-spin" /> : contextLoaded ? <CheckCircle2 className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
              {isLoadingContext ? "Carregando..." : contextLoaded ? "Contexto carregado" : "Buscar contexto do projeto"}
            </Button>

            <Dialog open={showFilesBrowser} onOpenChange={setShowFilesBrowser}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-2">
                  <FolderSearch className="w-4 h-4" />
                  Pesquisar arquivos do projeto
                  {selectedProjectFiles.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">{selectedProjectFiles.length}</Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Arquivos do Projeto</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[400px]">
                  {projectFiles.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhum arquivo encontrado.</p>
                  ) : (
                    <div className="space-y-2">
                      {projectFiles.map((f: any) => (
                        <label key={f.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                          <Checkbox
                            checked={selectedProjectFiles.includes(f.id)}
                            onCheckedChange={() => handleToggleProjectFile(f.id)}
                          />
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{f.name}</p>
                            <p className="text-xs text-muted-foreground">{f.folder} · {f.file_type || 'arquivo'}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => setShowFilesBrowser(false)}>
                    Confirmar ({selectedProjectFiles.length} selecionados)
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Context summary badges */}
          {contextLoaded && projectContext && (
            <div className="flex flex-wrap gap-1.5">
              {projectContext.project && <Badge variant="outline" className="text-xs">Projeto ✓</Badge>}
              {projectContext.contract && <Badge variant="outline" className="text-xs">Contrato ✓</Badge>}
              {(projectContext.scripts?.length ?? 0) > 0 && <Badge variant="outline" className="text-xs">Roteiros ({projectContext.scripts?.length})</Badge>}
              {(projectContext.knowledgeArticles?.length ?? 0) > 0 && <Badge variant="outline" className="text-xs">Artigos ({projectContext.knowledgeArticles?.length})</Badge>}
              {(projectContext.contentItems?.length ?? 0) > 0 && <Badge variant="outline" className="text-xs">Conteúdos ({projectContext.contentItems?.length})</Badge>}
            </div>
          )}
        </div>

        <Separator />

        {/* Document Upload */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <FileUp className="w-3.5 h-3.5" />
            Fontes adicionais (PDF, DOCX, TXT, RTF)
          </Label>
          <div className="flex items-center gap-2">
            <input
              ref={docInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/rtf"
              multiple
              onChange={handleDocUpload}
              className="hidden"
            />
            <Button type="button" variant="outline" size="sm" onClick={() => docInputRef.current?.click()} className="gap-2">
              <FileUp className="w-4 h-4" />
              Upload de documentos
            </Button>
          </div>
          {uploadedDocs.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {uploadedDocs.map((doc, i) => (
                <Badge key={i} variant="secondary" className="gap-1 text-xs">
                  <FileText className="w-3 h-3" />
                  {doc.name}
                  <button onClick={() => setUploadedDocs(prev => prev.filter((_, idx) => idx !== i))} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">Máximo 25MB por arquivo. Conteúdo extraído automaticamente.</p>
        </div>

        {/* Audio/Video transcription */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Mic className="w-3.5 h-3.5" />
            Transcrever Áudio / Vídeo
          </Label>
          <div className="flex items-center gap-2">
            <input ref={mediaInputRef} type="file" accept="audio/*,video/*" onChange={handleMediaChange} className="hidden" />
            <Button type="button" variant="outline" size="sm" onClick={() => mediaInputRef.current?.click()} disabled={isTranscribing} className="gap-2">
              {isTranscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isTranscribing ? "Transcrevendo..." : "Enviar áudio/vídeo"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">MP3, MP4, WAV, M4A, WebM — máx 20MB</p>
        </div>

        {/* Text area */}
        <div className="space-y-2">
          <Label>Texto / Roteiro / Conteúdo Agregado</Label>
          <Textarea
            placeholder="Cole aqui texto adicional ou use os recursos acima para agregar conteúdo automaticamente..."
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            className="min-h-[140px]"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={onGenerate.isPending || isTranscribing}
            className="gap-2"
          >
            {onGenerate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {onGenerate.isPending ? "Processando..." : "Processar com IA"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ───── STORYBOARD CARD ─────
function StoryboardCard({ storyboard, isSelected, onSelect, onDelete }: {
  storyboard: any;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <Collapsible open={isSelected} onOpenChange={onSelect}>
      <Card className={cn("transition-colors", isSelected && "border-primary/30")}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Film className="w-4 h-4 text-primary" />
                <div>
                  <p className="font-medium text-sm">{storyboard.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(storyboard.created_at).toLocaleDateString('pt-BR')} · {storyboard.style_global}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{storyboard.source_type}</Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isSelected && "rotate-180")} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Separator />
          <CardContent className="pt-4">
            <StoryboardScenes storyboardId={storyboard.id} colorGrading={storyboard.style_global} />
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function StoryboardScenes({ storyboardId, colorGrading }: { storyboardId: string; colorGrading: string }) {
  const { data: scenes, isLoading } = useQuery({
    queryKey: ["storyboard-scenes", storyboardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_storyboard_scenes")
        .select("*")
        .eq("storyboard_id", storyboardId)
        .order("scene_number", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <Loader2 className="w-5 h-5 animate-spin mx-auto" />;
  if (!scenes?.length) return <p className="text-sm text-muted-foreground text-center py-4">Nenhuma cena encontrada</p>;

  return (
    <div className="space-y-4">
      {scenes.map((scene) => (
        <SceneCard key={scene.id} scene={scene} />
      ))}
    </div>
  );
}

function SceneCard({ scene }: { scene: any }) {
  const [copied, setCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(scene.image_url || null);

  const copyPrompt = () => {
    navigator.clipboard.writeText(scene.ai_prompt || "");
    setCopied(true);
    toast.success("Prompt copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    try {
      const sonyPrefix = "Cinematic frame shot on Sony FX3 camera with Sony GM 28-70mm f/2.8 lens. Shallow depth of field, natural film-like bokeh, rich color science, S-Cinetone color profile. Professional cinematography, 16:9 widescreen frame.";
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: {
          prompt: `${sonyPrefix} ${scene.ai_prompt || scene.description}`,
          sceneId: scene.id,
          purpose: "storyboard_frame",
          aspectRatio: "16:9",
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.imageUrl) {
        setImageUrl(data.imageUrl);
        // Update scene in database
        await supabase
          .from("project_storyboard_scenes")
          .update({ image_url: data.imageUrl } as any)
          .eq("id", scene.id);
        toast.success("Imagem gerada!");
      }
    } catch (err: any) {
      if (err.message?.includes("429") || err.message?.includes("Rate limit")) {
        toast.error("Rate limit atingido. Tente novamente em alguns segundos.");
      } else if (err.message?.includes("402")) {
        toast.error("Créditos insuficientes. Adicione créditos ao workspace.");
      } else {
        toast.error(err.message || "Erro ao gerar imagem");
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <Card className="bg-muted/20 border-border/50 overflow-hidden">
      {/* Scene Image */}
      {imageUrl ? (
        <div className="relative group">
          <AspectRatio ratio={16 / 9}>
            <img
              src={imageUrl}
              alt={`Cena ${scene.scene_number}: ${scene.title}`}
              className="w-full h-full object-cover"
            />
          </AspectRatio>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleGenerateImage}
              disabled={isGeneratingImage}
              className="gap-2"
            >
              {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Regenerar
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-muted/40 border-b border-border/50">
          <AspectRatio ratio={16 / 9}>
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              {isGeneratingImage ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Gerando imagem...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                  <Button variant="outline" size="sm" onClick={handleGenerateImage} className="gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Gerar Imagem
                  </Button>
                </>
              )}
            </div>
          </AspectRatio>
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-mono">Cena {scene.scene_number}</Badge>
            <span className="text-sm font-medium">{scene.title}</span>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowPrompt(!showPrompt)}>
              <Eye className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyPrompt}>
              {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{scene.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <TechBadge icon={Camera} label="Lente" value={scene.lens} />
          <TechBadge icon={Film} label="FPS" value={scene.fps} />
          <TechBadge icon={Camera} label="Movimento" value={scene.camera_movement} />
          <TechBadge icon={Sun} label="Luz" value={scene.lighting} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <TechBadge icon={Palette} label="Mood" value={scene.mood} />
          <TechBadge icon={Palette} label="Color" value={scene.color_grading} />
          <TechBadge icon={Film} label="Tipo" value={PRODUCTION_TYPES[scene.production_type] || scene.production_type} />
          <TechBadge icon={Camera} label="Direção" value={scene.direction?.substring(0, 40)} />
        </div>

        {showPrompt && scene.ai_prompt && (
          <div className="space-y-2 pt-2">
            <Separator />
            <div className="bg-background rounded-lg p-3 border border-border/50">
              <p className="text-xs font-medium text-primary mb-1">Prompt para IA</p>
              <p className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">{scene.ai_prompt}</p>
              {scene.negative_prompt && (
                <>
                  <p className="text-xs font-medium text-destructive mt-2 mb-1">Negative Prompt</p>
                  <p className="text-xs text-muted-foreground font-mono">{scene.negative_prompt}</p>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TechBadge({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-1.5 text-xs">
      <Icon className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <span className="text-muted-foreground">{label}: </span>
        <span className="text-foreground">{value}</span>
      </div>
    </div>
  );
}
