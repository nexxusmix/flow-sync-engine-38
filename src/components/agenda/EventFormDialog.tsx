import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ReminderConfig } from "./ReminderConfig";
import { DBCalendarEvent, CreateEventInput } from "@/hooks/useCalendar";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEvent: DBCalendarEvent | null;
  defaultDate: Date | null;
  onCreate: (input: CreateEventInput) => void;
  onUpdate: (id: string, data: Partial<DBCalendarEvent>) => void;
  onDelete: (id: string) => void;
  isCreating: boolean;
}

const EVENT_TYPES = [
  { value: "meeting", label: "Reunião", color: "#8b5cf6" },
  { value: "deadline", label: "Prazo", color: "#ef4444" },
  { value: "delivery", label: "Entrega", color: "#22c55e" },
  { value: "task", label: "Tarefa", color: "#3b82f6" },
  { value: "milestone", label: "Marco", color: "#f59e0b" },
];

export function EventFormDialog({ open, onOpenChange, editingEvent, defaultDate, onCreate, onUpdate, onDelete, isCreating }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("10:00");
  const [allDay, setAllDay] = useState(false);
  const [eventType, setEventType] = useState<string>("meeting");
  const [color, setColor] = useState("#3b82f6");
  const [location, setLocation] = useState("");
  const [meetUrl, setMeetUrl] = useState("");
  const [reminderMinutes, setReminderMinutes] = useState<number[]>([30]);
  const [reminderChannels, setReminderChannels] = useState<string[]>(["in_app"]);

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setDescription(editingEvent.description || "");
      setStartDate(editingEvent.start_at.split("T")[0]);
      setStartTime(editingEvent.start_at.split("T")[1]?.substring(0, 5) || "09:00");
      setEndDate(editingEvent.end_at.split("T")[0]);
      setEndTime(editingEvent.end_at.split("T")[1]?.substring(0, 5) || "10:00");
      setAllDay(editingEvent.all_day || false);
      setEventType(editingEvent.event_type || "meeting");
      setColor(editingEvent.color || "#3b82f6");
      setLocation(editingEvent.location || "");
      setMeetUrl(editingEvent.meet_url || "");
    } else {
      const d = defaultDate || new Date();
      const dateStr = format(d, "yyyy-MM-dd");
      setTitle("");
      setDescription("");
      setStartDate(dateStr);
      setStartTime("09:00");
      setEndDate(dateStr);
      setEndTime("10:00");
      setAllDay(false);
      setEventType("meeting");
      setColor("#3b82f6");
      setLocation("");
      setMeetUrl("");
      setReminderMinutes([30]);
      setReminderChannels(["in_app"]);
    }
  }, [editingEvent, defaultDate, open]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    const start_at = allDay ? `${startDate}T00:00:00` : `${startDate}T${startTime}:00`;
    const end_at = allDay ? `${endDate || startDate}T23:59:59` : `${endDate || startDate}T${endTime}:00`;

    if (editingEvent) {
      onUpdate(editingEvent.id, {
        title, description: description || null, start_at, end_at,
        all_day: allDay, event_type: eventType as any, color,
        location: location || null, meet_url: meetUrl || null,
      });
    } else {
      onCreate({
        title, description, start_at, end_at,
        all_day: allDay, event_type: eventType as any, color,
        location, meet_url: meetUrl,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingEvent ? "Editar Evento" : "Novo Evento"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Reunião com cliente" />
          </div>

          <div>
            <Label>Tipo</Label>
            <Select value={eventType} onValueChange={v => { setEventType(v); setColor(EVENT_TYPES.find(t => t.value === v)?.color || "#3b82f6"); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                      {t.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={allDay} onCheckedChange={setAllDay} />
            <Label>Dia inteiro</Label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Início</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              {!allDay && <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="mt-1" />}
            </div>
            <div>
              <Label>Fim</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              {!allDay && <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="mt-1" />}
            </div>
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Local</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Escritório, etc." />
            </div>
            <div>
              <Label>Link da reunião</Label>
              <Input value={meetUrl} onChange={e => setMeetUrl(e.target.value)} placeholder="https://meet.google.com/..." />
            </div>
          </div>

          <ReminderConfig
            minutes={reminderMinutes}
            channels={reminderChannels}
            onMinutesChange={setReminderMinutes}
            onChannelsChange={setReminderChannels}
          />
        </div>

        <DialogFooter className="flex justify-between">
          {editingEvent && (
            <Button variant="destructive" size="sm" onClick={() => onDelete(editingEvent.id)}>
              <Trash2 className="w-4 h-4 mr-1" /> Excluir
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!title.trim() || isCreating}>
              {editingEvent ? "Salvar" : "Criar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
