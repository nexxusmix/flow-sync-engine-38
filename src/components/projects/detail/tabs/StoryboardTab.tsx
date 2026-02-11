import { useState, useRef } from "react";
import { ProjectWithStages } from "@/hooks/useProjects";
import { useProjectStoryboards, COLOR_GRADINGS, PRODUCTION_TYPES, StoryboardScene } from "@/hooks/useProjectStoryboards";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Sparkles, Loader2, Film, Camera, Sun, Palette, 
  ChevronDown, Copy, Check, Trash2, Eye, Plus, Clapperboard,
  Mic, Upload, FileAudio
} from "lucide-react";
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
            <Clapperboard className="w-5 h-5 text-primary" />
            Storyboard IA
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Gere storyboards cinematográficos completos com IA
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Storyboard
        </Button>
      </div>

      {/* Generate Form */}
      {showForm && (
        <StoryboardForm 
          project={project} 
          onGenerate={generate} 
          onClose={() => setShowForm(false)} 
        />
      )}

      {/* Storyboards List */}
      {storyboards.length === 0 && !showForm ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Film className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <h4 className="font-medium text-foreground">Nenhum storyboard</h4>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Crie seu primeiro storyboard a partir de um roteiro, documento ou texto.
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

function StoryboardForm({ project, onGenerate, onClose }: {
  project: ProjectWithStages;
  onGenerate: ReturnType<typeof useProjectStoryboards>["generate"];
  onClose: () => void;
}) {
  const [sourceType, setSourceType] = useState<string>("text");
  const [sourceText, setSourceText] = useState("");
  const [title, setTitle] = useState("");
  const [colorGrading, setColorGrading] = useState("Original neutro");
  const [objective, setObjective] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mediaFileName, setMediaFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTranscribe = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 20MB.");
      return;
    }

    setIsTranscribing(true);
    setMediaFileName(file.name);
    toast.info(`Transcrevendo "${file.name}"...`);

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("transcribe-media", {
        body: {
          audioBase64: base64,
          mimeType: file.type,
          fileName: file.name,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const transcription = data?.transcription || "";
      if (!transcription.trim()) {
        toast.warning("Nenhum conteúdo detectado no áudio/vídeo.");
        return;
      }

      setSourceText((prev) => prev ? `${prev}\n\n--- Transcrição de ${file.name} ---\n${transcription}` : transcription);
      toast.success("Transcrição concluída!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao transcrever");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleTranscribe(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!sourceText.trim()) {
      toast.error("Insira o texto/roteiro para processar");
      return;
    }
    onGenerate.mutate({
      sourceText,
      title: title || `Storyboard - ${project.name}`,
      sourceType,
      colorGrading,
      projectName: project.name,
      clientName: (project as any).account_name,
      objective,
    });
    onClose();
  };

  return (
    <Card className="border-primary/20 bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Gerar Storyboard com IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input 
              placeholder={`Storyboard - ${project.name}`} 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Fonte</Label>
            <Select value={sourceType} onValueChange={setSourceType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Colar texto</SelectItem>
                <SelectItem value="script">Roteiro existente</SelectItem>
                <SelectItem value="file">Arquivo do projeto</SelectItem>
                <SelectItem value="transcription">Transcrição de áudio/vídeo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

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
            <Label>Objetivo (opcional)</Label>
            <Input 
              placeholder="Ex: Vídeo institucional, Reel Instagram..." 
              value={objective} 
              onChange={(e) => setObjective(e.target.value)} 
            />
          </div>
        </div>

        {/* Transcription Upload */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Mic className="w-3.5 h-3.5" />
            Transcrever Áudio / Vídeo
          </Label>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isTranscribing}
              className="gap-2"
            >
              {isTranscribing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isTranscribing ? "Transcrevendo..." : "Enviar áudio/vídeo"}
            </Button>
            {mediaFileName && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <FileAudio className="w-3 h-3" />
                {mediaFileName}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            MP3, MP4, WAV, M4A, WebM — máx 20MB. A transcrição será adicionada ao texto abaixo.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Texto / Roteiro</Label>
          <Textarea 
            placeholder="Cole aqui o roteiro, briefing ou texto que será transformado em storyboard... Ou use o botão acima para transcrever um áudio/vídeo."
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            className="min-h-[160px]"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button 
            size="sm" 
            onClick={handleSubmit} 
            disabled={onGenerate.isPending || isTranscribing}
            className="gap-2"
          >
            {onGenerate.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {onGenerate.isPending ? "Processando..." : "Processar com IA"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

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

  const copyPrompt = () => {
    const prompt = scene.ai_prompt || "";
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast.success("Prompt copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-muted/20 border-border/50">
      <CardContent className="p-4 space-y-3">
        {/* Scene Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-mono">
              Cena {scene.scene_number}
            </Badge>
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

        {/* Description */}
        <p className="text-sm text-muted-foreground">{scene.description}</p>

        {/* Technical Grid */}
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

        {/* AI Prompt */}
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
