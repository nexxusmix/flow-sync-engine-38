import { useState } from "react";
import { Plus, Link2, Bookmark, ChevronDown, FileVideo, Megaphone } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Campaign } from "@/types/marketing";
import { CreativeBrief, ConceptContent, ScriptContent } from "@/types/creative-studio";

interface StudioApplyActionsProps {
  brief: CreativeBrief;
  concept?: ConceptContent;
  script?: ScriptContent;
  campaigns: Campaign[];
  onCreateContent: (data: { title: string; hook?: string; script?: string }) => void;
  onLinkToCampaign: (campaignId: string) => void;
  onSaveAsReference: () => void;
}

export function StudioApplyActions({
  brief,
  concept,
  script,
  campaigns,
  onCreateContent,
  onLinkToCampaign,
  onSaveAsReference,
}: StudioApplyActionsProps) {
  const [showContentDialog, setShowContentDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [contentTitle, setContentTitle] = useState(brief.title);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");

  const handleCreateContent = () => {
    onCreateContent({
      title: contentTitle,
      hook: script?.hook,
      script: script?.desenvolvimento,
    });
    setShowContentDialog(false);
  };

  const handleLinkToCampaign = () => {
    if (selectedCampaign) {
      onLinkToCampaign(selectedCampaign);
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
            <FileVideo className="w-4 h-4 mr-2" />
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
      <Dialog open={showContentDialog} onOpenChange={setShowContentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Conteúdo no Pipeline</DialogTitle>
            <DialogDescription>
              Um novo item será criado no Pipeline de Conteúdo com o roteiro e conceito gerados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título do Conteúdo</Label>
              <Input
                value={contentTitle}
                onChange={(e) => setContentTitle(e.target.value)}
                placeholder="Ex: Vídeo Lançamento Produto X"
              />
            </div>

            {script?.hook && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Hook (será preenchido)</Label>
                <p className="text-sm p-3 rounded-lg bg-muted/50 line-clamp-2">
                  {script.hook}
                </p>
              </div>
            )}

            {concept?.headline && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Headline (será preenchido)</Label>
                <p className="text-sm p-3 rounded-lg bg-muted/50">
                  {concept.headline}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContentDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateContent} disabled={!contentTitle}>
              <FileVideo className="w-4 h-4 mr-2" />
              Criar Conteúdo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
