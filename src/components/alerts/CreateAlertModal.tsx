import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarIcon, Plus, Sparkles, Loader2, CheckSquare, XSquare } from 'lucide-react';
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
  defaultProjectId?: string;
}

interface SelectedItems {
  deliverables: any[];
  meetings: any[];
  revenues: any[];
  revisions: any[];
  includeScope: boolean;
  includeDueDate: boolean;
  includeHealth: boolean;
}

export function CreateAlertModal({ open, onOpenChange, defaultProjectId }: CreateAlertModalProps) {
  const { createAlert } = useAlerts();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('custom_reminder');
  const [severity, setSeverity] = useState<'info' | 'warning' | 'critical'>('info');
  const [projectId, setProjectId] = useState<string>(defaultProjectId || 'none');
  const [dueDate, setDueDate] = useState<Date>();
  const [userNote, setUserNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selected, setSelected] = useState<SelectedItems>({
    deliverables: [], meetings: [], revenues: [], revisions: [],
    includeScope: false, includeDueDate: false, includeHealth: false,
  });

  useEffect(() => {
    if (defaultProjectId) setProjectId(defaultProjectId);
  }, [defaultProjectId]);

  const activeProjectId = projectId !== 'none' ? projectId : null;

  // Fetch projects list
  const { data: projects = [] } = useQuery({
    queryKey: ['projects-for-alerts'],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('id, name').neq('status', 'archived').order('name');
      return (data || []) as Array<{ id: string; name: string }>;
    },
  });

  // Fetch project details when selected
  const { data: projectData } = useQuery({
    queryKey: ['project-context', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId) return null;
      const { data } = await supabase.from('projects').select('*').eq('id', activeProjectId).single();
      return data;
    },
    enabled: !!activeProjectId,
  });

  // Fetch deliverables via portal_links
  const { data: deliverables = [] } = useQuery({
    queryKey: ['project-deliverables', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId) return [];
      const { data: links } = await supabase.from('portal_links').select('id').eq('project_id', activeProjectId);
      if (!links?.length) return [];
      const linkIds = links.map(l => l.id);
      const { data } = await supabase.from('portal_deliverables').select('*').in('portal_link_id', linkIds);
      return data || [];
    },
    enabled: !!activeProjectId,
  });

  // Fetch meetings
  const { data: meetings = [] } = useQuery({
    queryKey: ['project-meetings', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId) return [];
      const { data } = await supabase.from('calendar_events').select('*').eq('project_id', activeProjectId).order('start_at');
      return data || [];
    },
    enabled: !!activeProjectId,
  });

  // Fetch revenues
  const { data: revenues = [] } = useQuery({
    queryKey: ['project-revenues', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId) return [];
      const { data } = await supabase.from('revenues').select('*').eq('project_id', activeProjectId).order('due_date');
      return data || [];
    },
    enabled: !!activeProjectId,
  });

  // Fetch revisions via portal_links
  const { data: revisions = [] } = useQuery({
    queryKey: ['project-revisions', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId) return [];
      const { data: links } = await supabase.from('portal_links').select('id').eq('project_id', activeProjectId);
      if (!links?.length) return [];
      const linkIds = links.map(l => l.id);
      const { data } = await supabase.from('portal_change_requests').select('*').in('portal_link_id', linkIds);
      return data || [];
    },
    enabled: !!activeProjectId,
  });

  const hasContext = !!activeProjectId && !!(deliverables.length || meetings.length || revenues.length || revisions.length || projectData);

  const toggleItem = (category: 'deliverables' | 'meetings' | 'revenues' | 'revisions', item: any) => {
    setSelected(prev => {
      const exists = prev[category].some(i => i.id === item.id);
      return {
        ...prev,
        [category]: exists ? prev[category].filter(i => i.id !== item.id) : [...prev[category], item],
      };
    });
  };

  const selectAll = () => {
    setSelected({
      deliverables: [...deliverables],
      meetings: [...meetings],
      revenues: [...revenues],
      revisions: [...revisions],
      includeScope: !!projectData?.description,
      includeDueDate: !!projectData?.due_date,
      includeHealth: projectData?.health_score != null,
    });
  };

  const clearAll = () => {
    setSelected({ deliverables: [], meetings: [], revenues: [], revisions: [], includeScope: false, includeDueDate: false, includeHealth: false });
  };

  const selectedCount = useMemo(() => {
    return selected.deliverables.length + selected.meetings.length + selected.revenues.length + selected.revisions.length
      + (selected.includeScope ? 1 : 0) + (selected.includeDueDate ? 1 : 0) + (selected.includeHealth ? 1 : 0);
  }, [selected]);

  const handleGenerate = async () => {
    if (!activeProjectId) { toast.error('Selecione um projeto'); return; }
    if (selectedCount === 0) { toast.error('Selecione pelo menos um item de contexto'); return; }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-alert-ai', {
        body: {
          projectName: projectData?.name,
          clientName: projectData?.client_name,
          dueDate: selected.includeDueDate ? projectData?.due_date : null,
          stageCurrent: projectData?.stage_current,
          healthScore: selected.includeHealth ? projectData?.health_score : null,
          selectedItems: {
            deliverables: selected.deliverables.map(d => ({ title: d.title || d.file_name, status: d.status })),
            meetings: selected.meetings.map(m => ({ title: m.title, start_at: m.start_at })),
            revenues: selected.revenues.map(r => ({ amount: r.amount, due_date: r.due_date, status: r.status })),
            revisions: selected.revisions.map(r => ({ description: r.description, status: r.status })),
            includeScope: selected.includeScope,
            scopeText: selected.includeScope ? projectData?.description : null,
          },
          userNote,
        },
      });
      if (error) throw error;
      if (data?.title) setTitle(data.title);
      if (data?.message) setMessage(data.message);
      if (data?.type) setType(data.type);
      if (data?.severity) setSeverity(data.severity);
      toast.success('Aviso gerado com IA!');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Erro ao gerar com IA');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Título é obrigatório'); return; }
    setIsSubmitting(true);
    try {
      await createAlert.mutateAsync({
        title: title.trim(),
        message: message.trim() || null,
        type: type as any,
        severity,
        project_id: activeProjectId,
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
    setTitle(''); setMessage(''); setType('custom_reminder'); setSeverity('info');
    setDueDate(undefined); setUserNote(''); clearAll();
    if (!defaultProjectId) setProjectId('none');
  };

  const renderContextSection = (label: string, items: any[], category: 'deliverables' | 'meetings' | 'revenues' | 'revisions', renderLabel: (item: any) => string) => {
    if (!items.length) return null;
    return (
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">{label} ({items.length})</p>
        {items.map(item => (
          <label key={item.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/30 rounded px-1.5 py-1 transition-colors">
            <Checkbox
              checked={selected[category].some(s => s.id === item.id)}
              onCheckedChange={() => toggleItem(category, item)}
              className="h-3.5 w-3.5"
            />
            <span className="text-foreground/80 truncate">{renderLabel(item)}</span>
          </label>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-md", hasContext && "max-w-3xl")}>
        <DialogHeader>
          <DialogTitle>Novo Aviso Inteligente</DialogTitle>
        </DialogHeader>
        <div className={cn("gap-4", hasContext ? "grid grid-cols-[1fr_260px]" : "")}>
          {/* Left - Form */}
          <div className="space-y-3">
            {!defaultProjectId && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Projeto</label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger><SelectValue placeholder="Selecionar projeto" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (aviso geral)</SelectItem>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Título *</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Prazo do projeto X vence amanhã" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Mensagem</label>
              <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Detalhes..." rows={3} />
            </div>

            {activeProjectId && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nota para IA (opcional)</label>
                <Input value={userNote} onChange={e => setUserNote(e.target.value)} placeholder="Ex: Focar no prazo de entrega..." />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{typeOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
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

            <div className="flex gap-2">
              {activeProjectId && (
                <Button onClick={handleGenerate} disabled={isGenerating || selectedCount === 0} variant="outline" className="flex-1">
                  {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {isGenerating ? 'Gerando...' : `Gerar com IA (${selectedCount})`}
                </Button>
              )}
              <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                <Plus className="w-4 h-4 mr-2" /> {isSubmitting ? 'Criando...' : 'Criar Aviso'}
              </Button>
            </div>
          </div>

          {/* Right - Context Panel */}
          {hasContext && (
            <div className="border-l border-border pl-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-foreground/80">Contexto do Projeto</p>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={selectAll} className="h-6 px-1.5 text-[10px]">
                    <CheckSquare className="w-3 h-3 mr-1" /> Tudo
                  </Button>
                  <Button size="sm" variant="ghost" onClick={clearAll} className="h-6 px-1.5 text-[10px]">
                    <XSquare className="w-3 h-3 mr-1" /> Limpar
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-[380px] pr-2">
                <div className="space-y-3">
                  {/* Project meta */}
                  {(projectData?.due_date || projectData?.health_score != null || projectData?.description) && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Projeto</p>
                      {projectData?.due_date && (
                        <label className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/30 rounded px-1.5 py-1 transition-colors">
                          <Checkbox checked={selected.includeDueDate} onCheckedChange={v => setSelected(p => ({ ...p, includeDueDate: !!v }))} className="h-3.5 w-3.5" />
                          <span className="text-foreground/80">Prazo: {format(new Date(projectData.due_date), 'dd/MM/yyyy')}</span>
                        </label>
                      )}
                      {projectData?.health_score != null && (
                        <label className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/30 rounded px-1.5 py-1 transition-colors">
                          <Checkbox checked={selected.includeHealth} onCheckedChange={v => setSelected(p => ({ ...p, includeHealth: !!v }))} className="h-3.5 w-3.5" />
                          <span className="text-foreground/80">Saúde: {projectData.health_score}%</span>
                        </label>
                      )}
                      {projectData?.description && (
                        <label className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/30 rounded px-1.5 py-1 transition-colors">
                          <Checkbox checked={selected.includeScope} onCheckedChange={v => setSelected(p => ({ ...p, includeScope: !!v }))} className="h-3.5 w-3.5" />
                          <span className="text-foreground/80 truncate">Escopo: {projectData.description.slice(0, 40)}...</span>
                        </label>
                      )}
                    </div>
                  )}

                  {renderContextSection('Entregas', deliverables, 'deliverables', d => d.title || d.file_name || 'Entrega')}
                  {renderContextSection('Reuniões', meetings, 'meetings', m => `${m.title} (${format(new Date(m.start_at), 'dd/MM HH:mm')})`)}
                  {renderContextSection('Financeiro', revenues, 'revenues', r => `R$${r.amount} - ${r.due_date ? format(new Date(r.due_date), 'dd/MM') : 'sem data'}`)}
                  {renderContextSection('Revisões', revisions, 'revisions', r => r.description?.slice(0, 50) || 'Revisão pendente')}

                  {!deliverables.length && !meetings.length && !revenues.length && !revisions.length && !projectData?.description && (
                    <p className="text-xs text-muted-foreground/40 text-center py-4">Nenhum dado encontrado para este projeto</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
