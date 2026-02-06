import { useState } from "react";
import { Link2, Megaphone, Check } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Campaign } from "@/types/marketing";
import { CreativeBrief, ConceptContent, ScriptContent, StoryboardScene, ShotlistItem, MoodboardContent } from "@/types/creative-studio";
import { CreativePackageContent } from "@/types/creative-packages";

interface LinkToCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brief: CreativeBrief;
  concept?: ConceptContent;
  script?: ScriptContent;
  storyboard?: StoryboardScene[];
  shotlist?: ShotlistItem[];
  moodboard?: MoodboardContent;
  captionVariations?: string[];
  hashtags?: string[];
  campaigns: Campaign[];
  onCampaignCreated?: (campaign: Campaign) => void;
}

export function LinkToCampaignDialog({
  open,
  onOpenChange,
  brief,
  concept,
  script,
  storyboard,
  shotlist,
  moodboard,
  captionVariations,
  hashtags,
  campaigns,
  onCampaignCreated,
}: LinkToCampaignDialogProps) {
  const [activeTab, setActiveTab] = useState<"existing" | "new">("existing");
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Existing campaign selection
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  
  // New campaign form
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    objective: "",
    offer: "",
    start_date: "",
    end_date: "",
  });
  
  // Package title
  const [packageTitle, setPackageTitle] = useState(`Pacote Criativo - ${brief.title}`);
  
  // Output selection
  const [includeConcept, setIncludeConcept] = useState(true);
  const [includeScript, setIncludeScript] = useState(true);
  const [includeStoryboard, setIncludeStoryboard] = useState(true);
  const [includeShotlist, setIncludeShotlist] = useState(true);
  const [includeMoodboard, setIncludeMoodboard] = useState(true);
  const [includeCaptions, setIncludeCaptions] = useState(true);
  const [includeHashtags, setIncludeHashtags] = useState(true);

  const handleSave = async () => {
    let campaignId = selectedCampaignId;
    
    // If creating new campaign
    if (activeTab === "new") {
      if (!newCampaign.name) {
        toast.error("Nome da campanha é obrigatório");
        return;
      }
      
      const { data: createdCampaign, error: campaignError } = await supabase
        .from("campaigns")
        .insert([{
          name: newCampaign.name,
          objective: newCampaign.objective || null,
          offer: newCampaign.offer || null,
          start_date: newCampaign.start_date || null,
          end_date: newCampaign.end_date || null,
          status: "draft",
        }])
        .select()
        .single();
      
      if (campaignError) {
        console.error("Error creating campaign:", campaignError);
        toast.error("Erro ao criar campanha");
        return;
      }
      
      campaignId = createdCampaign.id;
      onCampaignCreated?.(createdCampaign as Campaign);
    } else {
      if (!campaignId) {
        toast.error("Selecione uma campanha");
        return;
      }
    }
    
    setIsSaving(true);
    
    try {
      // Build package content
      const packageContent: CreativePackageContent = {};
      
      if (includeConcept && concept) packageContent.concept = concept;
      if (includeScript && script) packageContent.script = script;
      if (includeStoryboard && storyboard?.length) packageContent.storyboard = storyboard;
      if (includeShotlist && shotlist?.length) packageContent.shotlist = shotlist;
      if (includeMoodboard && moodboard) packageContent.moodboard = moodboard;
      if (includeCaptions && captionVariations?.length) packageContent.captionVariations = captionVariations;
      if (includeHashtags && hashtags?.length) packageContent.hashtags = hashtags;
      
      // Create creative package
      const { error: packageError } = await supabase
        .from("campaign_creative_packages")
        .insert([{
          campaign_id: campaignId,
          studio_run_id: brief.id,
          title: packageTitle,
          package_json: packageContent as Json,
        }]);
      
      if (packageError) throw packageError;
      
      setSuccess(true);
      toast.success("Pacote criativo salvo na campanha!");
      
    } catch (error) {
      console.error("Error saving package:", error);
      toast.error("Erro ao salvar pacote");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setSelectedCampaignId("");
    setNewCampaign({ name: "", objective: "", offer: "", start_date: "", end_date: "" });
    onOpenChange(false);
  };

  // Success state
  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
              <Check className="w-6 h-6 text-emerald-500" />
            </div>
            <DialogTitle className="text-center">Pacote Criativo Salvo!</DialogTitle>
            <DialogDescription className="text-center">
              O pacote foi vinculado à campanha com sucesso.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleClose} className="w-full">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const hasAnyOutput = concept || script || storyboard?.length || shotlist?.length || moodboard || captionVariations?.length || hashtags?.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vincular à Campanha</DialogTitle>
          <DialogDescription>
            Salve os outputs do Studio como um Pacote Criativo dentro de uma campanha.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Package Title */}
          <div className="space-y-2">
            <Label>Título do Pacote</Label>
            <Input
              value={packageTitle}
              onChange={(e) => setPackageTitle(e.target.value)}
              placeholder="Ex: Pacote Criativo v1"
            />
          </div>

          {/* Campaign Selection Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "existing" | "new")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">Campanha Existente</TabsTrigger>
              <TabsTrigger value="new">Nova Campanha</TabsTrigger>
            </TabsList>
            
            <TabsContent value="existing" className="mt-4 space-y-3">
              <div className="space-y-2">
                <Label>Selecionar Campanha</Label>
                <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha uma campanha" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map(campaign => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        <span className="flex items-center gap-2">
                          <Megaphone className="w-3 h-3" />
                          {campaign.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {campaigns.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma campanha encontrada. Crie uma nova.
                </p>
              )}
            </TabsContent>
            
            <TabsContent value="new" className="mt-4 space-y-3">
              <div className="space-y-2">
                <Label>Nome da Campanha *</Label>
                <Input
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="Ex: Lançamento Verão 2025"
                />
              </div>
              <div className="space-y-2">
                <Label>Objetivo</Label>
                <Input
                  value={newCampaign.objective}
                  onChange={(e) => setNewCampaign({ ...newCampaign, objective: e.target.value })}
                  placeholder="O que queremos alcançar?"
                />
              </div>
              <div className="space-y-2">
                <Label>Oferta</Label>
                <Input
                  value={newCampaign.offer}
                  onChange={(e) => setNewCampaign({ ...newCampaign, offer: e.target.value })}
                  placeholder="Ex: 20% de desconto"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={newCampaign.start_date}
                    onChange={(e) => setNewCampaign({ ...newCampaign, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={newCampaign.end_date}
                    onChange={(e) => setNewCampaign({ ...newCampaign, end_date: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Output Selection */}
          <div className="space-y-3">
            <Label>Outputs a Incluir</Label>
            <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border">
              {concept && (
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="include-concept" 
                    checked={includeConcept} 
                    onCheckedChange={(v) => setIncludeConcept(!!v)} 
                  />
                  <label htmlFor="include-concept" className="flex-1 text-sm cursor-pointer">
                    <span className="font-medium">Conceito Narrativo</span>
                    {concept.headline && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{concept.headline}</p>
                    )}
                  </label>
                  <Badge variant="secondary" className="text-[10px]">concept</Badge>
                </div>
              )}

              {script && (
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="include-script" 
                    checked={includeScript} 
                    onCheckedChange={(v) => setIncludeScript(!!v)} 
                  />
                  <label htmlFor="include-script" className="flex-1 text-sm cursor-pointer">
                    <span className="font-medium">Roteiro</span>
                    {script.hook && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{script.hook}</p>
                    )}
                  </label>
                  <Badge variant="secondary" className="text-[10px]">script</Badge>
                </div>
              )}

              {storyboard && storyboard.length > 0 && (
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="include-storyboard" 
                    checked={includeStoryboard} 
                    onCheckedChange={(v) => setIncludeStoryboard(!!v)} 
                  />
                  <label htmlFor="include-storyboard" className="flex-1 text-sm cursor-pointer">
                    <span className="font-medium">Storyboard</span>
                    <p className="text-xs text-muted-foreground">{storyboard.length} cena(s)</p>
                  </label>
                  <Badge variant="secondary" className="text-[10px]">storyboard</Badge>
                </div>
              )}

              {shotlist && shotlist.length > 0 && (
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="include-shotlist" 
                    checked={includeShotlist} 
                    onCheckedChange={(v) => setIncludeShotlist(!!v)} 
                  />
                  <label htmlFor="include-shotlist" className="flex-1 text-sm cursor-pointer">
                    <span className="font-medium">Shotlist</span>
                    <p className="text-xs text-muted-foreground">{shotlist.length} shot(s)</p>
                  </label>
                  <Badge variant="secondary" className="text-[10px]">shotlist</Badge>
                </div>
              )}

              {moodboard && (
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="include-moodboard" 
                    checked={includeMoodboard} 
                    onCheckedChange={(v) => setIncludeMoodboard(!!v)} 
                  />
                  <label htmlFor="include-moodboard" className="flex-1 text-sm cursor-pointer">
                    <span className="font-medium">Moodboard</span>
                  </label>
                  <Badge variant="secondary" className="text-[10px]">moodboard</Badge>
                </div>
              )}

              {captionVariations && captionVariations.length > 0 && (
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="include-captions" 
                    checked={includeCaptions} 
                    onCheckedChange={(v) => setIncludeCaptions(!!v)} 
                  />
                  <label htmlFor="include-captions" className="flex-1 text-sm cursor-pointer">
                    <span className="font-medium">Variações de Legenda</span>
                    <p className="text-xs text-muted-foreground">{captionVariations.length} variação(ões)</p>
                  </label>
                  <Badge variant="secondary" className="text-[10px]">captions</Badge>
                </div>
              )}

              {hashtags && hashtags.length > 0 && (
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="include-hashtags" 
                    checked={includeHashtags} 
                    onCheckedChange={(v) => setIncludeHashtags(!!v)} 
                  />
                  <label htmlFor="include-hashtags" className="flex-1 text-sm cursor-pointer">
                    <span className="font-medium">Hashtags</span>
                    <p className="text-xs text-muted-foreground">{hashtags.slice(0, 3).join(" ")}...</p>
                  </label>
                  <Badge variant="secondary" className="text-[10px]">hashtags</Badge>
                </div>
              )}

              {!hasAnyOutput && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhum output disponível. Gere o pacote criativo primeiro.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !hasAnyOutput || (activeTab === "existing" && !selectedCampaignId) || (activeTab === "new" && !newCampaign.name)}
            className="gap-2"
          >
            <Link2 className="w-4 h-4" />
            {isSaving ? "Salvando..." : "Salvar Pacote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
