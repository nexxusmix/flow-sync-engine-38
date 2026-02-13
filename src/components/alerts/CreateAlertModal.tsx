import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAlerts } from '@/hooks/useAlerts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const typeOptions = [
  { value: 'deadline_due', label: 'Prazo próximo' },
  { value: 'deadline_overdue', label: 'Prazo vencido' },
  { value: 'delivery_due', label: 'Entrega próxima' },
  { value: 'delivery_overdue', label: 'Entrega atrasada' },
  { value: 'no_client_contact', label: 'Sem contato' },
  { value: 'client_waiting_reply', label: 'Cliente aguardando' },
  { value: 'internal_waiting_reply', label: 'Aguardando interno' },
  { value: 'meeting_upcoming', label: 'Reunião próxima' },
  { value: 'meeting_followup', label: 'Follow-up reunião' },
  { value: 'payment_due', label: 'Pagamento próximo' },
  { value: 'payment_overdue', label: 'Pagamento vencido' },
  { value: 'production_stalled', label: 'Produção travada' },
  { value: 'risk_health_drop', label: 'Saúde crítica' },
  { value: 'materials_missing', label: 'Materiais faltando' },
  { value: 'review_pending', label: 'Revisão pendente' },
  { value: 'custom_reminder', label: 'Lembrete' },
];

interface CreateAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAlertModal({ open, onOpenChange }: CreateAlertModalProps) {
  const { createAlert } = useAlerts();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('custom_reminder');
  const [severity, setSeverity] = useState<'info' | 'warning' | 'critical'>('info');
  const [projectId, setProjectId] = useState<string>('none');
  const [dueDate, setDueDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-for-alerts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, name')
        .neq('status', 'archived')
        .order('name');
      return (data || []) as Array<{ id: string; name: string }>;
    },
  });

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    setIsSubmitting(true);
    try {
      await createAlert.mutateAsync({
        title: title.trim(),
        message: message.trim() || null,
        type: type as any,
        severity,
        project_id: projectId !== 'none' ? projectId : null,
        due_at: dueDate ? dueDate.toISOString() : null,
        scope: 'hub' as any,
        status: 'open' as any,
        channels: { in_app: true },
      });
      toast.success('Aviso criado!');
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error('Erro ao criar aviso');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setType('custom_reminder');
    setSeverity('info');
    setProjectId('none');
    setDueDate(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Aviso</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Título *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Prazo do projeto X vence amanhã" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Mensagem</label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Detalhes opcionais..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {typeOptions.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Severidade</label>
              <Select value={severity} onValueChange={v => setSeverity(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Atenção</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Projeto (opcional)</label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Data limite (opcional)</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} locale={ptBR} className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            <Plus className="w-4 h-4 mr-2" /> {isSubmitting ? 'Criando...' : 'Criar Aviso'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
