import { useState } from "react";
import { Plus, Link2, Bookmark, ChevronDown, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Label } from "@/components/ui/label";
import { Campaign } from "@/types/marketing";
import { CreativeBrief, ConceptContent, ScriptContent } from "@/types/creative-studio";
import { CreateContentDialog } from "./CreateContentDialog";
import { toast } from "sonner";

interface StudioApplyActionsProps {
  brief: CreativeBrief;
  concept?: ConceptContent;
  script?: ScriptContent;
  captionVariations?: string[];
  hashtags?: string[];
  campaigns: Campaign[];
  onSaveAsReference: () => void;
}

export function StudioApplyActions({
  brief,
  concept,
  script,
  captionVariations,
  hashtags,
  campaigns,
  onSaveAsReference,
}: StudioApplyActionsProps) {
  const [showContentDialog, setShowContentDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");

  const handleLinkToCampaign = () => {
    if (selectedCampaign) {
      const campaign = campaigns.find(c => c.id === selectedCampaign);
      toast.success(`Brief vinculado à campanha "${campaign?.name}"`);
      setShowCampaignDialog(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Aplicar
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setShowContentDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Conteúdo no Pipeline
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowCampaignDialog(true)}>
            <Megaphone className="w-4 h-4 mr-2" />
            Vincular à Campanha
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onSaveAsReference}>
            <Bookmark className="w-4 h-4 mr-2" />
            Salvar como Referência
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Content Dialog */}
      <CreateContentDialog
        open={showContentDialog}
        onOpenChange={setShowContentDialog}
        brief={brief}
        concept={concept}
        script={script}
        captionVariations={captionVariations}
        hashtags={hashtags}
        campaigns={campaigns}
      />

      {/* Link to Campaign Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular à Campanha</DialogTitle>
            <DialogDescription>
              O brief será vinculado à campanha selecionada para referência futura.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Campanha</Label>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma campanha" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map(campaign => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {campaigns.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma campanha disponível. Crie uma campanha primeiro.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleLinkToCampaign} disabled={!selectedCampaign}>
              <Link2 className="w-4 h-4 mr-2" />
              Vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
