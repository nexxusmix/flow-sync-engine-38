import { useState } from 'react';
import { useBillingPlans, useSavePlan, useDeletePlan, BillingPlan } from '@/hooks/useBilling';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Edit, Loader2, Star } from 'lucide-react';

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export function BillingPlans() {
  const { data: plans = [], isLoading } = useBillingPlans();
  const savePlan = useSavePlan();
  const deletePlan = useDeletePlan();
  const [editing, setEditing] = useState<Partial<BillingPlan> | null>(null);

  const handleSave = async () => {
    if (!editing?.name || !editing?.slug) return;
    await savePlan.mutateAsync(editing as any);
    setEditing(null);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">Planos da Plataforma</h3>
        <Button size="sm" onClick={() => setEditing({ name: '', slug: '', price_monthly: 0, price_yearly: 0, trial_days: 14, features: [], limits: {}, is_highlighted: false, status: 'active', sort_order: plans.length })} className="gap-1.5">
          <Plus className="w-4 h-4" /> Novo Plano
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {plans.map(plan => (
          <div key={plan.id} className={`glass-card rounded-xl p-5 space-y-3 relative ${plan.is_highlighted ? 'border-primary/40 ring-1 ring-primary/20' : ''}`}>
            {plan.is_highlighted && (
              <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px]">
                <Star className="w-3 h-3 mr-1" /> Recomendado
              </Badge>
            )}
            <div className="pt-1">
              <h4 className="text-base font-bold text-foreground">{plan.name}</h4>
              {plan.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{plan.description}</p>}
            </div>
            <div>
              <span className="text-2xl font-bold text-foreground">{fmt(plan.price_monthly)}</span>
              <span className="text-xs text-muted-foreground">/mês</span>
            </div>
            {plan.price_yearly > 0 && (
              <p className="text-xs text-muted-foreground">{fmt(plan.price_yearly)}/ano ({fmt(plan.price_yearly / 12)}/mês)</p>
            )}
            {plan.trial_days > 0 && (
              <Badge variant="outline" className="text-[10px]">{plan.trial_days} dias de trial</Badge>
            )}
            {(plan.features as string[])?.length > 0 && (
              <ul className="space-y-1">
                {(plan.features as string[]).slice(0, 6).map((f, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="material-symbols-rounded text-[12px] text-primary">check_circle</span> {f}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-1 pt-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setEditing(plan)}>
                <Edit className="w-3 h-3 mr-1" /> Editar
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deletePlan.mutate(plan.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-xs">Nome *</Label>
                <Input value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Slug *</Label>
                <Input value={editing.slug || ''} onChange={e => setEditing({ ...editing, slug: e.target.value })} placeholder="ex: starter" className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Descrição</Label>
                <Textarea value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={2} className="text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Preço mensal (R$)</Label>
                  <Input type="number" value={editing.price_monthly || 0} onChange={e => setEditing({ ...editing, price_monthly: +e.target.value })} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Preço anual (R$)</Label>
                  <Input type="number" value={editing.price_yearly || 0} onChange={e => setEditing({ ...editing, price_yearly: +e.target.value })} className="h-9 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Dias de trial</Label>
                <Input type="number" value={editing.trial_days || 0} onChange={e => setEditing({ ...editing, trial_days: +e.target.value })} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Features (uma por linha)</Label>
                <Textarea
                  value={Array.isArray(editing.features) ? (editing.features as string[]).join('\n') : ''}
                  onChange={e => setEditing({ ...editing, features: e.target.value.split('\n').filter(Boolean) as any })}
                  rows={4} className="text-sm" placeholder={"Até 5 usuários\n10 projetos\nSuporte por email"}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.is_highlighted || false} onCheckedChange={v => setEditing({ ...editing, is_highlighted: v })} />
                <Label className="text-xs">Destacar como recomendado</Label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditing(null)} className="flex-1">Cancelar</Button>
                <Button onClick={handleSave} disabled={savePlan.isPending} className="flex-1 gap-1">
                  {savePlan.isPending && <Loader2 className="w-3 h-3 animate-spin" />} Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
