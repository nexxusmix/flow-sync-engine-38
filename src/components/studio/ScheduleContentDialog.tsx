import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Check, ExternalLink, User } from "lucide-react";
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  CONTENT_CHANNELS, 
  ContentChannel,
} from "@/types/marketing";

interface ScheduleContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // For existing content item
  contentItemId?: string;
  // For new content from Studio
  newContentData?: {
    title: string;
    channel?: ContentChannel;
    format?: string;
    pillar?: string;
    campaign_id?: string;
    script?: string;
    hook?: string;
    caption_short?: string;
    caption_long?: string;
    hashtags?: string;
    cta?: string;
    notes?: string;
  };
  defaultChannel?: ContentChannel;
  onScheduled?: () => void;
}

export function ScheduleContentDialog({
  open,
  onOpenChange,
  contentItemId,
  newContentData,
  defaultChannel,
  onScheduled,
}: ScheduleContentDialogProps) {
  const navigate = useNavigate();
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [scheduledItemId, setScheduledItemId] = useState<string | null>(null);
  
  // Form state
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [channel, setChannel] = useState<ContentChannel | "">(defaultChannel || "");
  const [ownerName, setOwnerName] = useState("");

  // Set default date to tomorrow
  useEffect(() => {
    if (open && !scheduleDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduleDate(tomorrow.toISOString().split("T")[0]);
      setScheduleTime("10:00");
    }
  }, [open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setScheduled(false);
      setScheduledItemId(null);
      setScheduleDate("");
      setScheduleTime("");
      setOwnerName("");
    }
  }, [open]);

  const handleSchedule = async () => {
    if (!scheduleDate) {
      toast.error("Data de publicação é obrigatória");
      return;
    }

    setIsScheduling(true);

    try {
      // Build scheduled_at timestamp
      const scheduledDateTime = scheduleTime 
        ? `${scheduleDate}T${scheduleTime}:00`
        : `${scheduleDate}T10:00:00`;
      
      const scheduledAt = new Date(scheduledDateTime).toISOString();

      if (contentItemId) {
        // Update existing content item
        const updateData: Record<string, unknown> = {
          scheduled_at: scheduledAt,
          status: "scheduled",
        };
        
        if (channel) updateData.channel = channel;
        if (ownerName) {
          updateData.owner_name = ownerName;
          updateData.owner_initials = ownerName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
        }

        const { error } = await supabase
          .from("content_items")
          .update(updateData)
          .eq("id", contentItemId);

        if (error) throw error;
        
        setScheduledItemId(contentItemId);
        
      } else if (newContentData) {
        // Create new content item from Studio data

        const { data, error } = await supabase
          .from("content_items")
          .insert([{
            title: newContentData.title,
            status: "scheduled" as const,
            scheduled_at: scheduledAt,
            ai_generated: true,
            channel: channel || newContentData.channel || null,
            format: newContentData.format || null,
            pillar: newContentData.pillar || null,
            campaign_id: newContentData.campaign_id || null,
            script: newContentData.script || null,
            hook: newContentData.hook || null,
            caption_short: newContentData.caption_short || null,
            caption_long: newContentData.caption_long || null,
            hashtags: newContentData.hashtags || null,
            cta: newContentData.cta || null,
            notes: newContentData.notes || null,
            owner_name: ownerName || null,
            owner_initials: ownerName ? ownerName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : null,
          }])
          .select()
          .single();

        if (error) throw error;
        
        setScheduledItemId(data.id);
      }

      setScheduled(true);
      toast.success("Conteúdo agendado no calendário!");
      onScheduled?.();

    } catch (error) {
      console.error("Error scheduling content:", error);
      toast.error("Erro ao agendar conteúdo");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleOpenCalendar = () => {
    onOpenChange(false);
    navigate("/marketing/calendar");
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  // Success state
  if (scheduled) {
    const formattedDate = scheduleDate 
      ? new Date(scheduleDate).toLocaleDateString("pt-BR", { 
          weekday: "long", 
          day: "numeric", 
          month: "long" 
        })
      : "";

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-2">
              <Check className="w-6 h-6 text-cyan-500" />
            </div>
            <DialogTitle className="text-center">Agendado!</DialogTitle>
            <DialogDescription className="text-center">
              O conteúdo foi agendado para {formattedDate}
              {scheduleTime && ` às ${scheduleTime}`}.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Continuar
            </Button>
            <Button onClick={handleOpenCalendar} className="flex-1 gap-2">
              <Calendar className="w-4 h-4" />
              Ver no Calendário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-500" />
            Agendar no Calendário
          </DialogTitle>
          <DialogDescription>
            Defina a data e hora de publicação para este conteúdo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date */}
          <div className="space-y-2">
            <Label>Data de Publicação *</Label>
            <Input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Horário (opcional)
            </Label>
            <Input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              placeholder="10:00"
            />
          </div>

          {/* Channel */}
          <div className="space-y-2">
            <Label>Canal</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as ContentChannel)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar canal" />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_CHANNELS.map(ch => (
                  <SelectItem key={ch.type} value={ch.type}>
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${ch.color}`} />
                      {ch.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Owner */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="w-3 h-3" />
              Responsável (opcional)
            </Label>
            <Input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Nome do responsável"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSchedule} 
            disabled={isScheduling || !scheduleDate}
            className="gap-2"
          >
            <Calendar className="w-4 h-4" />
            {isScheduling ? "Agendando..." : "Agendar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
