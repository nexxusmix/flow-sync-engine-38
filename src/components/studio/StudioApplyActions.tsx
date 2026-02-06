import { useState } from "react";
import { Plus, Bookmark, ChevronDown, Megaphone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Campaign, ContentChannel } from "@/types/marketing";
import { CreativeBrief, ConceptContent, ScriptContent, StoryboardScene, ShotlistItem, MoodboardContent } from "@/types/creative-studio";
import { CreateContentDialog } from "./CreateContentDialog";
import { ScheduleContentDialog } from "./ScheduleContentDialog";
import { LinkToCampaignDialog } from "@/components/campaigns/LinkToCampaignDialog";

interface StudioApplyActionsProps {
  brief: CreativeBrief;
  concept?: ConceptContent;
  script?: ScriptContent;
  storyboard?: StoryboardScene[];
  shotlist?: ShotlistItem[];
  moodboard?: MoodboardContent;
  captionVariations?: string[];
  hashtags?: string[];
  campaigns: Campaign[];
  onSaveAsReference: () => void;
  onCampaignCreated?: (campaign: Campaign) => void;
}

export function StudioApplyActions({
  brief,
  concept,
  script,
  storyboard,
  shotlist,
  moodboard,
  captionVariations,
  hashtags,
  campaigns,
  onSaveAsReference,
  onCampaignCreated,
}: StudioApplyActionsProps) {
  const [showContentDialog, setShowContentDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  // Build content data for scheduling
  const scheduleContentData = {
    title: brief.title,
    channel: brief.delivery_type?.includes("instagram") ? "instagram" as ContentChannel :
             brief.delivery_type?.includes("tiktok") ? "tiktok" as ContentChannel :
             brief.delivery_type?.includes("youtube") ? "youtube" as ContentChannel : undefined,
    script: script?.desenvolvimento,
    hook: script?.hook,
    caption_short: captionVariations?.[0],
    caption_long: captionVariations?.[1],
    hashtags: hashtags?.join(" "),
    cta: script?.cta,
    notes: `Criado a partir do Studio Criativo: ${brief.title} (ID: ${brief.id})`,
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
          <DropdownMenuItem onClick={() => setShowScheduleDialog(true)}>
            <Calendar className="w-4 h-4 mr-2" />
            Agendar no Calendário
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

      {/* Schedule Content Dialog */}
      <ScheduleContentDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        newContentData={scheduleContentData}
        defaultChannel={scheduleContentData.channel}
      />

      {/* Link to Campaign Dialog */}
      <LinkToCampaignDialog
        open={showCampaignDialog}
        onOpenChange={setShowCampaignDialog}
        brief={brief}
        concept={concept}
        script={script}
        storyboard={storyboard}
        shotlist={shotlist}
        moodboard={moodboard}
        captionVariations={captionVariations}
        hashtags={hashtags}
        campaigns={campaigns}
        onCampaignCreated={onCampaignCreated}
      />
    </>
  );
}
