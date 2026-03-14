import { useState } from 'react';
import { useBillingAddons, useSaveAddon, useDeleteAddon, BillingAddon } from '@/hooks/useBilling';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit, Loader2 } from 'lucide-react';

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export function BillingAddons() {
  const { data: addons = [], isLoading } = useBillingAddons();
  const saveAddon = useSaveAddon();
  const deleteAddon = useDeleteAddon();
  const [editing, setEditing] = useState<Partial<BillingAddon> | null>(null);

  const handleSave = async () => {
    if (!editing?.name) return;
    await saveAddon.mutateAsync(editing as any);
    setEditing(null);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">Addons Disponíveis</h3>
        <Button size="sm" onClick={() => setEditing({ name: '', price: 0, billing_type: 'recurring', addon_type: 'generic', limit_amount: 0, status: 'active' })} className="gap-1.5">
          <Plus className="w-4 h-4" /> Novo Addon
        </Button>
      </div>

      {addons.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-rounded text-4xl text-muted-foreground/40">extension</span>
          <p className="text-sm text-muted-foreground mt-2">Nenhum addon cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addons.map(addon => (
            <div key={addon.id} className="glass-card rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{addon.name}</h4>
                  {addon.description && <p className="text-xs text-muted-foreground line-clamp-2">{addon.description}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditing(addon)}><Edit className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteAddon.mutate(addon.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">{fmt(addon.price)}</span>
                <Badge variant="outline" className="text-[10px]">{addon.billing_type === 'recurring' ? 'Recorrente' : 'Avulso'}</Badge>
              </div>
              {addon.limit_key && (
                <p className="text-[11px] text-muted-foreground">+{addon.limit_amount} {addon.limit_key}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing?.id ? 'Editar Addon' : 'Novo Addon'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3 pt-2">
              <div><Label className="text-xs">Nome *</Label><Input value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} className="h-9 text-sm" /></div>
              <div><Label className="text-xs">Descrição</Label><Input value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} className="h-9 text-sm" /></div>
              <div><Label className="text-xs">Preço (R$)</Label><Input type="number" value={editing.price || 0} onChange={e => setEditing({ ...editing, price: +e.target.value })} className="h-9 text-sm" /></div>
              <div>
                <Label className="text-xs">Tipo de cobrança</Label>
                <Select value={editing.billing_type || 'recurring'} onValueChange={v => setEditing({ ...editing, billing_type: v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recurring">Recorrente</SelectItem>
                    <SelectItem value="one_time">Avulso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Limite key</Label><Input value={editing.limit_key || ''} onChange={e => setEditing({ ...editing, limit_key: e.target.value })} placeholder="ex: users" className="h-9 text-sm" /></div>
                <div><Label className="text-xs">Quantidade</Label><Input type="number" value={editing.limit_amount || 0} onChange={e => setEditing({ ...editing, limit_amount: +e.target.value })} className="h-9 text-sm" /></div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditing(null)} className="flex-1">Cancelar</Button>
                <Button onClick={handleSave} disabled={saveAddon.isPending} className="flex-1">{saveAddon.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
