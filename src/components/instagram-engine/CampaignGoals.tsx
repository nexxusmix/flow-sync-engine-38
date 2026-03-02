import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useProfileSnapshots } from '@/hooks/useInstagramEngine';
import { Plus, Target, TrendingUp, Trash2, Edit2, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  campaignId: string;
}

interface Goal {
  id: string;
  campaign_id: string;
  title: string;
  metric_key: string;
  target_value: number;
  current_value: number;
  unit: string;
}

const METRIC_PRESETS = [
  { key: 'reach', label: 'Alcance', unit: 'pessoas', icon: '👁️' },
  { key: 'engagement', label: 'Engajamento', unit: '%', icon: '❤️' },
  { key: 'followers', label: 'Novos Seguidores', unit: 'seguidores', icon: '👥' },
  { key: 'leads', label: 'Leads Gerados', unit: 'leads', icon: '📋' },
  { key: 'clicks', label: 'Cliques no Link', unit: 'cliques', icon: '🔗' },
  { key: 'saves', label: 'Salvamentos', unit: 'saves', icon: '🔖' },
  { key: 'shares', label: 'Compartilhamentos', unit: 'shares', icon: '🔄' },
  { key: 'sales', label: 'Vendas', unit: 'R$', icon: '💰' },
  { key: 'comments', label: 'Comentários', unit: 'comentários', icon: '💬' },
  { key: 'custom', label: 'Personalizado', unit: '', icon: '⚙️' },
];

export function CampaignGoals({ campaignId }: Props) {
  const qc = useQueryClient();
  const { data: snapshots } = useProfileSnapshots();
  const [showAdd, setShowAdd] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState({ title: '', metric_key: '', target_value: '', current_value: '', unit: '' });

  const { data: goals, isLoading } = useQuery({
    queryKey: ['campaign-goals', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_campaign_goals' as any)
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as Goal[];
    },
  });

  const handleMetricSelect = (key: string) => {
    const preset = METRIC_PRESETS.find(m => m.key === key);
    if (preset && key !== 'custom') {
      setForm(f => ({ ...f, metric_key: key, title: preset.label, unit: preset.unit }));
    } else {
      setForm(f => ({ ...f, metric_key: key }));
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.target_value) return;
    setSaving(true);
    try {
      if (editGoal) {
        const { error } = await supabase
          .from('instagram_campaign_goals' as any)
          .update({
            title: form.title,
            metric_key: form.metric_key,
            target_value: parseFloat(form.target_value),
            current_value: parseFloat(form.current_value || '0'),
            unit: form.unit,
          })
          .eq('id', editGoal.id);
        if (error) throw error;
        toast.success('Meta atualizada');
      } else {
        const { error } = await supabase
          .from('instagram_campaign_goals' as any)
          .insert({
            campaign_id: campaignId,
            title: form.title,
            metric_key: form.metric_key || 'custom',
            target_value: parseFloat(form.target_value),
            current_value: parseFloat(form.current_value || '0'),
            unit: form.unit,
          });
        if (error) throw error;
        toast.success('Meta adicionada');
      }
      qc.invalidateQueries({ queryKey: ['campaign-goals', campaignId] });
      setShowAdd(false);
      setEditGoal(null);
      setForm({ title: '', metric_key: '', target_value: '', current_value: '', unit: '' });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('instagram_campaign_goals' as any).delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      qc.invalidateQueries({ queryKey: ['campaign-goals', campaignId] });
      toast.success('Meta removida');
    }
  };

  const handleUpdateProgress = async (goal: Goal, newValue: number) => {
    const { error } = await supabase
      .from('instagram_campaign_goals' as any)
      .update({ current_value: newValue })
      .eq('id', goal.id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ['campaign-goals', campaignId] });
  };

  const openEdit = (goal: Goal) => {
    setEditGoal(goal);
    setForm({
      title: goal.title,
      metric_key: goal.metric_key,
      target_value: String(goal.target_value),
      current_value: String(goal.current_value),
      unit: goal.unit,
    });
    setShowAdd(true);
  };

  // Sync goals with latest snapshot data
  const handleSyncSnapshots = async () => {
    if (!goals || !snapshots || snapshots.length === 0) {
      toast.info('Nenhum snapshot disponível para sincronizar');
      return;
    }
    setSyncing(true);
    const latest = snapshots[0]; // Already sorted by date desc
    let updated = 0;

    for (const goal of goals) {
      let newValue: number | null = null;
      if (goal.metric_key === 'followers' && latest.followers) newValue = latest.followers;
      else if (goal.metric_key === 'engagement' && latest.avg_engagement) newValue = latest.avg_engagement;
      else if (goal.metric_key === 'reach' && latest.avg_reach) newValue = latest.avg_reach;

      if (newValue !== null && newValue !== goal.current_value) {
        await supabase.from('instagram_campaign_goals' as any)
          .update({ current_value: newValue })
          .eq('id', goal.id);
        updated++;
      }
    }

    qc.invalidateQueries({ queryKey: ['campaign-goals', campaignId] });
    setSyncing(false);
    toast.success(updated > 0 ? `${updated} meta(s) atualizada(s) com dados reais!` : 'Metas já estão atualizadas');
  };

  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  const overallProgress = goals && goals.length > 0
    ? Math.round(goals.reduce((acc, g) => acc + Math.min((g.current_value / (g.target_value || 1)) * 100, 100), 0) / goals.length)
    : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">Metas & OKRs</h4>
          {goals && goals.length > 0 && (
            <Badge variant="outline" className="text-[9px]">{overallProgress}% geral</Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {goals && goals.length > 0 && snapshots && snapshots.length > 0 && (
            <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7" onClick={handleSyncSnapshots} disabled={syncing}>
              {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Sincronizar Métricas
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7" onClick={() => {
            setEditGoal(null);
            setForm({ title: '', metric_key: '', target_value: '', current_value: '', unit: '' });
            setShowAdd(true);
          }}>
            <Plus className="w-3 h-3" /> Nova Meta
          </Button>
        </div>
      </div>

      {/* Overall progress */}
      {goals && goals.length > 0 && (
        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${overallProgress >= 80 ? 'bg-primary' : overallProgress >= 50 ? 'bg-primary/60' : 'bg-muted-foreground'}`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      )}

      {/* Goals grid */}
      {(!goals || goals.length === 0) ? (
        <Card className="glass-card p-6 text-center">
          <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Defina metas para acompanhar o progresso da campanha</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {goals.map(goal => {
            const pct = goal.target_value > 0 ? Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100) : 0;
            const preset = METRIC_PRESETS.find(m => m.key === goal.metric_key);

            return (
              <Card key={goal.id} className="glass-card p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{preset?.icon || '🎯'}</span>
                    <span className="text-[11px] font-medium text-foreground">{goal.title}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => openEdit(goal)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-6 h-6 text-destructive" onClick={() => handleDelete(goal.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-end gap-1 mb-1.5">
                  <span className="text-lg font-bold text-foreground">
                    {goal.unit === 'R$' ? `R$ ${goal.current_value.toLocaleString()}` : goal.current_value.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-muted-foreground mb-0.5">
                    / {goal.unit === 'R$' ? `R$ ${goal.target_value.toLocaleString()}` : `${goal.target_value.toLocaleString()} ${goal.unit}`}
                  </span>
                </div>

                <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-primary' : pct >= 70 ? 'bg-primary/70' : pct >= 40 ? 'bg-muted-foreground' : 'bg-destructive'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-medium ${pct >= 100 ? 'text-primary' : pct >= 70 ? 'text-primary/70' : 'text-muted-foreground'}`}>
                    {pct}% concluído
                  </span>
                  <Input
                    type="number"
                    className="w-20 h-6 text-[10px] text-right"
                    value={goal.current_value}
                    onChange={e => handleUpdateProgress(goal, parseFloat(e.target.value) || 0)}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={showAdd} onOpenChange={o => { if (!o) { setShowAdd(false); setEditGoal(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm">{editGoal ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase">Tipo de Métrica</label>
              <Select value={form.metric_key} onValueChange={handleMetricSelect}>
                <SelectTrigger className="mt-0.5"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {METRIC_PRESETS.map(m => (
                    <SelectItem key={m.key} value={m.key}>{m.icon} {m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Título da meta" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Valor alvo" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} />
              <Input type="number" placeholder="Valor atual" value={form.current_value} onChange={e => setForm(f => ({ ...f, current_value: e.target.value }))} />
            </div>
            <Input placeholder="Unidade (ex: %, leads, R$)" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowAdd(false); setEditGoal(null); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editGoal ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
