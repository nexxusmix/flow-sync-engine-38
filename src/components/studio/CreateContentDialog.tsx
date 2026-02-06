import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileVideo, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Campaign, 
  ContentChannel, 
  ContentFormat, 
  ContentPillar,
  ContentItemStatus,
  CONTENT_CHANNELS, 
  CONTENT_FORMATS, 
  CONTENT_PILLARS,
  CONTENT_ITEM_STAGES,
} from "@/types/marketing";
import { CreativeBrief, ConceptContent, ScriptContent } from "@/types/creative-studio";

interface CreateContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brief: CreativeBrief;
  concept?: ConceptContent;
  script?: ScriptContent;
  captionVariations?: string[];
  hashtags?: string[];
  campaigns: Campaign[];
}

export function CreateContentDialog({
  open,
  onOpenChange,
  brief,
  concept,
  script,
  captionVariations,
  hashtags,
  campaigns,
}: CreateContentDialogProps) {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [createdItemId, setCreatedItemId] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState(brief.title);
  const [channel, setChannel] = useState<ContentChannel | "">("");
  const [format, setFormat] = useState<ContentFormat | "">("");
  const [pillar, setPillar] = useState<ContentPillar | "">("");
  const [campaignId, setCampaignId] = useState<string>("");
  const [initialStatus, setInitialStatus] = useState<ContentItemStatus>("briefing");
  
  // Output selection
  const [useScript, setUseScript] = useState(true);
  const [useCaption, setUseCaption] = useState(true);
  const [useHashtags, setUseHashtags] = useState(true);
  const [useHook, setUseHook] = useState(true);

  const handleCreate = async () => {
    if (!title) {
      toast.error("Título é obrigatório");
      return;
    }

    setIsCreating(true);

    try {
      // Build content item data from selected outputs
      const contentData: Record<string, unknown> = {
        title,
        status: initialStatus,
        ai_generated: true,
      };

      // Add optional fields
      if (channel) contentData.channel = channel;
      if (format) contentData.format = format;
      if (pillar) contentData.pillar = pillar;
      if (campaignId) contentData.campaign_id = campaignId;

      // Add selected outputs
      if (useScript && script?.desenvolvimento) {
        contentData.script = script.desenvolvimento;
      }

      if (useHook && script?.hook) {
        contentData.hook = script.hook;
      }

      if (useCaption && captionVariations?.length) {
        contentData.caption_short = captionVariations[0];
        if (captionVariations.length > 1) {
          contentData.caption_long = captionVariations[1];
        }
      }

      if (useHashtags && hashtags?.length) {
        contentData.hashtags = hashtags.join(" ");
      }

      if (script?.cta) {
        contentData.cta = script.cta;
      }

      // Store reference to brief
      contentData.notes = `Criado a partir do Studio Criativo: ${brief.title} (ID: ${brief.id})`;

      const { data, error } = await supabase
        .from("content_items")
        .insert([{
          title,
          status: initialStatus,
          ai_generated: true,
          channel: channel || null,
          format: format || null,
          pillar: pillar || null,
          campaign_id: campaignId && campaignId !== "none" ? campaignId : null,
          script: useScript && script?.desenvolvimento ? script.desenvolvimento : null,
          hook: useHook && script?.hook ? script.hook : null,
          caption_short: useCaption && captionVariations?.length ? captionVariations[0] : null,
          caption_long: useCaption && captionVariations && captionVariations.length > 1 ? captionVariations[1] : null,
          hashtags: useHashtags && hashtags?.length ? hashtags.join(" ") : null,
          cta: script?.cta || null,
          notes: `Criado a partir do Studio Criativo: ${brief.title} (ID: ${brief.id})`,
        }])
        .select()
        .single();

      if (error) throw error;

      setCreatedItemId(data.id);
      toast.success("Conteúdo criado no Pipeline!");

    } catch (error) {
      console.error("Error creating content:", error);
      toast.error("Erro ao criar conteúdo");
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenInPipeline = () => {
    onOpenChange(false);
    navigate("/marketing/pipeline");
  };

  const handleClose = () => {
    setCreatedItemId(null);
    onOpenChange(false);
  };

  // Success state
  if (createdItemId) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
              <Check className="w-6 h-6 text-emerald-500" />
            </div>
            <DialogTitle className="text-center">Conteúdo Criado!</DialogTitle>
            <DialogDescription className="text-center">
              O item foi adicionado ao Pipeline de Conteúdo no estágio "{CONTENT_ITEM_STAGES.find(s => s.type === initialStatus)?.name}".
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Continuar no Studio
            </Button>
            <Button onClick={handleOpenInPipeline} className="flex-1 gap-2">
              <ExternalLink className="w-4 h-4" />
              Abrir no Pipeline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Conteúdo no Pipeline</DialogTitle>
          <DialogDescription>
            Configure o novo item de conteúdo que será criado a partir dos outputs do Studio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label>Título do Conteúdo *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Vídeo Lançamento Produto X"
            />
          </div>

          {/* Row: Channel + Format */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Canal</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as ContentChannel)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_CHANNELS.map(ch => (
                    <SelectItem key={ch.type} value={ch.type}>
                      <span className="flex items-center gap-2">
                        <span>{ch.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Formato</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as ContentFormat)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_FORMATS.map(f => (
                    <SelectItem key={f.type} value={f.type}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row: Pillar + Campaign */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Pilar de Conteúdo</Label>
              <Select value={pillar} onValueChange={(v) => setPillar(v as ContentPillar)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_PILLARS.map(p => (
                    <SelectItem key={p.type} value={p.type}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Campanha</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {campaigns.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Initial Status */}
          <div className="space-y-2">
            <Label>Status Inicial</Label>
            <Select value={initialStatus} onValueChange={(v) => setInitialStatus(v as ContentItemStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_ITEM_STAGES.slice(0, 4).map(stage => (
                  <SelectItem key={stage.type} value={stage.type}>
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${stage.color}`} />
                      {stage.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Outputs to include */}
          <div className="space-y-3">
            <Label>Outputs a Incluir</Label>
            <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border">
              {script?.hook && (
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="use-hook" 
                    checked={useHook} 
                    onCheckedChange={(v) => setUseHook(!!v)} 
                  />
                  <label htmlFor="use-hook" className="flex-1 text-sm cursor-pointer">
                    <span className="font-medium">Hook</span>
                    <p className="text-xs text-muted-foreground line-clamp-1">{script.hook}</p>
                  </label>
                  <Badge variant="secondary" className="text-[10px]">hook</Badge>
                </div>
              )}

              {script?.desenvolvimento && (
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="use-script" 
                    checked={useScript} 
                    onCheckedChange={(v) => setUseScript(!!v)} 
                  />
                  <label htmlFor="use-script" className="flex-1 text-sm cursor-pointer">
                    <span className="font-medium">Roteiro</span>
                    <p className="text-xs text-muted-foreground line-clamp-1">{script.desenvolvimento.slice(0, 80)}...</p>
                  </label>
                  <Badge variant="secondary" className="text-[10px]">script</Badge>
                </div>
              )}

              {captionVariations && captionVariations.length > 0 && (
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="use-caption" 
                    checked={useCaption} 
                    onCheckedChange={(v) => setUseCaption(!!v)} 
                  />
                  <label htmlFor="use-caption" className="flex-1 text-sm cursor-pointer">
                    <span className="font-medium">Legendas</span>
                    <p className="text-xs text-muted-foreground">{captionVariations.length} variação(ões)</p>
                  </label>
                  <Badge variant="secondary" className="text-[10px]">caption</Badge>
                </div>
              )}

              {hashtags && hashtags.length > 0 && (
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="use-hashtags" 
                    checked={useHashtags} 
                    onCheckedChange={(v) => setUseHashtags(!!v)} 
                  />
                  <label htmlFor="use-hashtags" className="flex-1 text-sm cursor-pointer">
                    <span className="font-medium">Hashtags</span>
                    <p className="text-xs text-muted-foreground">{hashtags.slice(0, 3).join(" ")}...</p>
                  </label>
                  <Badge variant="secondary" className="text-[10px]">hashtags</Badge>
                </div>
              )}

              {!script?.hook && !script?.desenvolvimento && !captionVariations?.length && !hashtags?.length && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhum output disponível. Gere o pacote criativo primeiro.
                </p>
              )}
            </div>
          </div>

          {/* Preview */}
          {concept?.headline && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Headline (referência)</Label>
              <p className="text-sm p-3 rounded-lg bg-primary/5 border border-primary/20">
                {concept.headline}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || !title} className="gap-2">
            <FileVideo className="w-4 h-4" />
            {isCreating ? "Criando..." : "Criar Conteúdo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
