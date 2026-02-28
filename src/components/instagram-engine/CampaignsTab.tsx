import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInstagramCampaigns } from '@/hooks/useInstagramEngine';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Target, Calendar, Users, Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  planning: { label: 'Planejamento', color: 'bg-blue-500/15 text-blue-400' },
  active: { label: 'Ativa', color: 'bg-emerald-500/15 text-emerald-400' },
  completed: { label: 'Concluída', color: 'bg-primary/15 text-primary' },
  paused: { label: 'Pausada', color: 'bg-amber-500/15 text-amber-400' },
};

export function CampaignsTab() {
  const { data: campaigns, isLoading } = useInstagramCampaigns();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', objective: '', target_audience: '', start_date: '', end_date: '', budget: '' });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('instagram_campaigns').insert({
        name: form.name,
        objective: form.objective || null,
        target_audience: form.target_audience || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        budget: form.budget ? parseFloat(form.budget) : null,
      } as any);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['instagram-campaigns'] });
      toast.success('Campanha criada');
      setShowCreate(false);
      setForm({ name: '', objective: '', target_audience: '', start_date: '', end_date: '', budget: '' });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Campanhas Instagram</h3>
          <p className="text-xs text-muted-foreground">{campaigns?.length || 0} campanhas</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> Nova Campanha
        </Button>
      </div>

      {(!campaigns || campaigns.length === 0) ? (
        <Card className="glass-card p-8 text-center">
          <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">Nenhuma campanha criada. Crie uma campanha para organizar conteúdo estrategicamente.</p>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> Criar Campanha
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map(c => {
            const status = STATUS_MAP[c.status] || STATUS_MAP.planning;
            return (
              <Card key={c.id} className="glass-card p-5 hover:border-primary/20 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-sm font-semibold text-foreground">{c.name}</h4>
                  <Badge className={`${status.color} text-[9px]`}>{status.label}</Badge>
                </div>
                {c.objective && <p className="text-xs text-muted-foreground mb-3">{c.objective}</p>}
                <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                  {c.target_audience && (
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.target_audience}</span>
                  )}
                  {c.start_date && (
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(c.start_date), 'dd/MM')} — {c.end_date ? format(new Date(c.end_date), 'dd/MM') : '...'}</span>
                  )}
                  {c.budget && (
                    <span className="flex items-center gap-1"><Target className="w-3 h-3" />R$ {Number(c.budget).toLocaleString()}</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Campanha Instagram</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome da campanha" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Textarea placeholder="Objetivo (ex: gerar leads para lançamentos imobiliários)" value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} rows={2} />
            <Input placeholder="Público-alvo" value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
            <Input type="number" placeholder="Orçamento (R$)" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
