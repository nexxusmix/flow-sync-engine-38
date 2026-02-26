import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, MessageCircle, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  minutes: number[];
  channels: string[];
  onMinutesChange: (minutes: number[]) => void;
  onChannelsChange: (channels: string[]) => void;
}

const MINUTE_OPTIONS = [
  { value: 5, label: "5 min antes" },
  { value: 10, label: "10 min antes" },
  { value: 15, label: "15 min antes" },
  { value: 30, label: "30 min antes" },
  { value: 60, label: "1 hora antes" },
  { value: 120, label: "2 horas antes" },
  { value: 1440, label: "1 dia antes" },
];

const CHANNEL_OPTIONS = [
  { value: "in_app", label: "In-App", icon: Bell },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "email", label: "Email", icon: Mail },
];

export function ReminderConfig({ minutes, channels, onMinutesChange, onChannelsChange }: Props) {
  const toggleChannel = (ch: string) => {
    if (channels.includes(ch)) {
      if (channels.length > 1) onChannelsChange(channels.filter(c => c !== ch));
    } else {
      onChannelsChange([...channels, ch]);
    }
  };

  const addMinute = (val: string) => {
    const n = parseInt(val);
    if (!minutes.includes(n)) onMinutesChange([...minutes, n].sort((a, b) => a - b));
  };

  const removeMinute = (val: number) => {
    if (minutes.length > 1) onMinutesChange(minutes.filter(m => m !== val));
  };

  return (
    <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
      <Label className="text-xs font-medium flex items-center gap-1">
        <Bell className="w-3 h-3" /> Lembretes
      </Label>

      {/* Timing */}
      <div className="flex flex-wrap gap-1">
        {minutes.map(m => {
          const opt = MINUTE_OPTIONS.find(o => o.value === m);
          return (
            <Badge key={m} variant="secondary" className="text-[10px] gap-1 cursor-pointer" onClick={() => removeMinute(m)}>
              {opt?.label || `${m} min`}
              <X className="w-2.5 h-2.5" />
            </Badge>
          );
        })}
        <Select onValueChange={addMinute}>
          <SelectTrigger className="w-[120px] h-6 text-[10px]">
            <SelectValue placeholder="+ Adicionar" />
          </SelectTrigger>
          <SelectContent>
            {MINUTE_OPTIONS.filter(o => !minutes.includes(o.value)).map(o => (
              <SelectItem key={o.value} value={String(o.value)} className="text-xs">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Channels */}
      <div className="flex gap-2">
        {CHANNEL_OPTIONS.map(ch => {
          const Icon = ch.icon;
          const active = channels.includes(ch.value);
          return (
            <Button
              key={ch.value}
              type="button"
              variant={active ? "default" : "outline"}
              size="sm"
              className="text-[10px] h-7 gap-1"
              onClick={() => toggleChannel(ch.value)}
            >
              <Icon className="w-3 h-3" />
              {ch.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
