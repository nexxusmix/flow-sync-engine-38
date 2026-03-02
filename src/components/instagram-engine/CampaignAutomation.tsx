import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InstagramCampaign, InstagramPost, FORMATS } from '@/hooks/useInstagramEngine';
import { Plus, Zap, ArrowRight, Clock, Trash2, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';

interface AutomationRule {
  id: string;
  name: string;
  trigger: {
    event: 'post_published' | 'post_scheduled' | 'status_changed';
    filter_format?: string;
    filter_status?: string;
  };
  action: {
    type: 'create_story' | 'schedule_repost' | 'change_status' | 'create_reminder';
    delay_hours?: number;
    target_format?: string;
    target_status?: string;
    template?: string;
  };
  enabled: boolean;
}

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TRIGGER_EVENTS = [
  { key: 'post_published', label: 'Post publicado' },
  { key: 'post_scheduled', label: 'Post agendado' },
  { key: 'status_changed', label: 'Status alterado' },
];

const ACTION_TYPES = [
  { key: 'create_story', label: 'Criar Story de suporte', icon: '📱' },
  { key: 'schedule_repost', label: 'Agendar repostagem', icon: '🔄' },
  { key: 'change_status', label: 'Alterar status', icon: '🏷️' },
  { key: 'create_reminder', label: 'Criar lembrete', icon: '⏰' },
];

const PRESET_RULES: Omit<AutomationRule, 'id'>[] = [
  {
    name: 'Story após Reels',
    trigger: { event: 'post_published', filter_format: 'reel' },
    action: { type: 'create_story', delay_hours: 2, template: 'Novo Reels! 🎬 Corre lá no feed ver completo 👆' },
    enabled: true,
  },
  {
    name: 'Repost semanal de carrossel',
    trigger: { event: 'post_published', filter_format: 'carousel' },
    action: { type: 'schedule_repost', delay_hours: 168 },
    enabled: true,
  },
  {
    name: 'Lembrete 24h antes',
    trigger: { event: 'post_scheduled' },
    action: { type: 'create_reminder', delay_hours: -24 },
    enabled: true,
  },
];

export function CampaignAutomation({ campaign, posts, open, onOpenChange }: Props) {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [showAddRule, setShowAddRule] = useState(false);
  const [editRule, setEditRule] = useState<Partial<AutomationRule>>({
    name: '',
    trigger: { event: 'post_published' },
    action: { type: 'create_story', delay_hours: 2 },
    enabled: true,
  });

  const addPreset = (preset: Omit<AutomationRule, 'id'>) => {
    const exists = rules.some(r => r.name === preset.name);
    if (exists) {
      toast.info('Regra já adicionada');
      return;
    }
    setRules(prev => [...prev, { ...preset, id: crypto.randomUUID() }]);
    toast.success(`Regra "${preset.name}" adicionada`);
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const removeRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success('Regra removida');
  };

  const saveCustomRule = () => {
    if (!editRule.name?.trim()) {
      toast.error('Nome da regra é obrigatório');
      return;
    }
    setRules(prev => [...prev, {
      id: crypto.randomUUID(),
      name: editRule.name!,
      trigger: editRule.trigger as AutomationRule['trigger'],
      action: editRule.action as AutomationRule['action'],
      enabled: true,
    }]);
    setShowAddRule(false);
    setEditRule({ name: '', trigger: { event: 'post_published' }, action: { type: 'create_story', delay_hours: 2 }, enabled: true });
    toast.success('Regra criada');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Automações — {campaign.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="pr-3 space-y-5">
            {/* Presets */}
            <div>
              <h4 className="text-[11px] text-muted-foreground uppercase tracking-wide mb-2">Regras Prontas</h4>
              <div className="grid grid-cols-1 gap-2">
                {PRESET_RULES.map((preset, i) => {
                  const triggerEvent = TRIGGER_EVENTS.find(t => t.key === preset.trigger.event);
                  const actionType = ACTION_TYPES.find(a => a.key === preset.action.type);
                  const alreadyAdded = rules.some(r => r.name === preset.name);
                  return (
                    <Card key={i} className={`glass-card p-3 ${alreadyAdded ? 'opacity-50' : 'hover:border-primary/20 cursor-pointer'}`} onClick={() => !alreadyAdded && addPreset(preset)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{actionType?.icon}</span>
                          <div>
                            <p className="text-xs font-medium text-foreground">{preset.name}</p>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              {triggerEvent?.label} <ArrowRight className="w-3 h-3" /> {actionType?.label}
                              {preset.action.delay_hours && <span className="text-primary">({preset.action.delay_hours > 0 ? `+${preset.action.delay_hours}h` : `${preset.action.delay_hours}h`})</span>}
                            </p>
                          </div>
                        </div>
                        {alreadyAdded ? (
                          <Badge className="bg-emerald-500/15 text-emerald-400 text-[9px]">Adicionada</Badge>
                        ) : (
                          <Plus className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Active rules */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[11px] text-muted-foreground uppercase tracking-wide">Regras Ativas ({rules.length})</h4>
                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => setShowAddRule(true)}>
                  <Plus className="w-3 h-3" /> Regra Personalizada
                </Button>
              </div>
              {rules.length === 0 ? (
                <Card className="glass-card p-4 text-center text-xs text-muted-foreground">
                  Nenhuma regra ativa. Adicione regras prontas acima ou crie uma personalizada.
                </Card>
              ) : (
                <div className="space-y-2">
                  {rules.map(rule => {
                    const triggerEvent = TRIGGER_EVENTS.find(t => t.key === rule.trigger.event);
                    const actionType = ACTION_TYPES.find(a => a.key === rule.action.type);
                    return (
                      <Card key={rule.id} className={`glass-card p-3 ${!rule.enabled ? 'opacity-50' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{actionType?.icon}</span>
                            <div>
                              <p className="text-xs font-medium text-foreground">{rule.name}</p>
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                {triggerEvent?.label}
                                {rule.trigger.filter_format && <Badge variant="outline" className="text-[8px] h-4">{FORMATS.find(f => f.key === rule.trigger.filter_format)?.label}</Badge>}
                                <ArrowRight className="w-3 h-3" />
                                {actionType?.label}
                                {rule.action.delay_hours && <span className="text-primary">({rule.action.delay_hours}h)</span>}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => removeRule(rule.id)}>
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Custom rule builder */}
            {showAddRule && (
              <Card className="glass-card p-4 border-primary/20 space-y-3">
                <h5 className="text-xs font-semibold text-foreground">Nova Regra Personalizada</h5>
                <Input
                  placeholder="Nome da regra"
                  value={editRule.name || ''}
                  onChange={e => setEditRule(prev => ({ ...prev, name: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Quando</label>
                    <Select value={editRule.trigger?.event} onValueChange={v => setEditRule(prev => ({ ...prev, trigger: { ...prev.trigger!, event: v as any } }))}>
                      <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TRIGGER_EVENTS.map(t => <SelectItem key={t.key} value={t.key} className="text-[11px]">{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Filtro formato</label>
                    <Select value={editRule.trigger?.filter_format || '_none'} onValueChange={v => setEditRule(prev => ({ ...prev, trigger: { ...prev.trigger!, filter_format: v === '_none' ? undefined : v } }))}>
                      <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none" className="text-[11px]">Todos</SelectItem>
                        {FORMATS.map(f => <SelectItem key={f.key} value={f.key} className="text-[11px]">{f.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Ação</label>
                    <Select value={editRule.action?.type} onValueChange={v => setEditRule(prev => ({ ...prev, action: { ...prev.action!, type: v as any } }))}>
                      <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ACTION_TYPES.map(a => <SelectItem key={a.key} value={a.key} className="text-[11px]">{a.icon} {a.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Delay (horas)</label>
                    <Input type="number" className="h-8 text-[11px]" value={editRule.action?.delay_hours ?? 2} onChange={e => setEditRule(prev => ({ ...prev, action: { ...prev.action!, delay_hours: parseInt(e.target.value) || 0 } }))} />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setShowAddRule(false)}>Cancelar</Button>
                  <Button size="sm" onClick={saveCustomRule}>Criar Regra</Button>
                </div>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
