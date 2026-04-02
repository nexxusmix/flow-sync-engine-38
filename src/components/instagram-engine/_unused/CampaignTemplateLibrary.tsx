import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { InstagramCampaign, InstagramPost, FORMATS, PILLARS } from '@/hooks/useInstagramEngine';
import { BookTemplate, Plus, Loader2, Trash2, Rocket, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onApplyTemplate?: (templateId: string) => void;
}

interface CampaignTemplate {
  id: string;
  name: string;
  description: string | null;
  objective: string | null;
  target_audience: string | null;
  budget: number | null;
  duration_days: number | null;
  formats: string[];
  pillars: string[];
  post_templates: any[];
  tone: string | null;
  themes: any[];
  times_used: number;
  created_at: string;
}

export function CampaignTemplateLibrary({ open, onOpenChange, onApplyTemplate }: Props) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', objective: '', target_audience: '',
    budget: '', duration_days: '', tone: '',
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ['campaign-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_campaign_templates' as any)
        .select('*')
        .order('times_used', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CampaignTemplate[];
    },
    enabled: open,
  });

  const handleSaveTemplate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('instagram_campaign_templates' as any).insert({
        name: form.name,
        description: form.description || null,
        objective: form.objective || null,
        target_audience: form.target_audience || null,
        budget: form.budget ? parseFloat(form.budget) : null,
        duration_days: form.duration_days ? parseInt(form.duration_days) : null,
        tone: form.tone || null,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['campaign-templates'] });
      toast.success('Template salvo!');
      setShowCreate(false);
      setForm({ name: '', description: '', objective: '', target_audience: '', budget: '', duration_days: '', tone: '' });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApply = async (template: CampaignTemplate) => {
    setApplying(template.id);
    try {
      // Create campaign from template
      const { data: newCampaign, error } = await supabase.from('instagram_campaigns').insert({
        name: `${template.name}`,
        objective: template.objective,
        target_audience: template.target_audience,
        budget: template.budget,
        status: 'planning',
      } as any).select().single();
      if (error) throw error;

      // Increment usage
      await supabase.from('instagram_campaign_templates' as any)
        .update({ times_used: template.times_used + 1 })
        .eq('id', template.id);

      // Create posts from post_templates
      if (template.post_templates?.length > 0) {
        const posts = template.post_templates.map((pt: any, i: number) => ({
          title: pt.title || `Post ${i + 1}`,
          format: pt.format || 'reel',
          pillar: pt.pillar || null,
          status: 'idea',
          campaign_id: (newCampaign as any).id,
          position: i,
        }));
        await supabase.from('instagram_posts').insert(posts as any);
      }

      qc.invalidateQueries({ queryKey: ['instagram-campaigns'] });
      qc.invalidateQueries({ queryKey: ['instagram-posts'] });
      qc.invalidateQueries({ queryKey: ['campaign-templates'] });
      toast.success('Campanha criada a partir do template!');
      onOpenChange(false);
      onApplyTemplate?.((newCampaign as any).id);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setApplying(null);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('instagram_campaign_templates' as any).delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      qc.invalidateQueries({ queryKey: ['campaign-templates'] });
      toast.success('Template removido');
    }
  };

  const handleSaveFromCampaign = async (campaign: { name: string; objective?: string | null; target_audience?: string | null; budget?: number | null }, postCount: number) => {
    try {
      const { error } = await supabase.from('instagram_campaign_templates' as any).insert({
        name: `Template: ${campaign.name}`,
        objective: campaign.objective || null,
        target_audience: campaign.target_audience || null,
        budget: campaign.budget || null,
        description: `Baseado na campanha "${campaign.name}" com ${postCount} posts`,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['campaign-templates'] });
      toast.success('Campanha salva como template!');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <BookTemplate className="w-4 h-4 text-primary" />
            Biblioteca de Templates
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{templates?.length || 0} templates disponíveis</p>
            <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7" onClick={() => setShowCreate(true)}>
              <Plus className="w-3 h-3" /> Criar Template
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : (!templates || templates.length === 0) ? (
            <Card className="glass-card p-6 text-center">
              <BookTemplate className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground mb-3">Nenhum template ainda. Salve campanhas bem-sucedidas como templates reutilizáveis.</p>
              <Button size="sm" variant="outline" onClick={() => setShowCreate(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Criar Primeiro Template
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map(t => (
                <Card key={t.id} className="glass-card p-4 hover:border-primary/20 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="text-[11px] font-semibold text-foreground">{t.name}</h5>
                      {t.description && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="w-6 h-6 text-red-400" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3 text-[9px] text-muted-foreground">
                    {t.objective && <Badge variant="outline" className="text-[8px]">🎯 {t.objective.slice(0, 30)}</Badge>}
                    {t.target_audience && <Badge variant="outline" className="text-[8px]">👥 {t.target_audience.slice(0, 25)}</Badge>}
                    {t.budget && <Badge variant="outline" className="text-[8px]">💰 R$ {Number(t.budget).toLocaleString()}</Badge>}
                    {t.duration_days && <Badge variant="outline" className="text-[8px]">📅 {t.duration_days} dias</Badge>}
                    {t.tone && <Badge variant="outline" className="text-[8px]">🗣 {t.tone}</Badge>}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" /> Usado {t.times_used}x
                    </span>
                    <Button
                      size="sm"
                      className="gap-1 text-[10px] h-7"
                      onClick={() => handleApply(t)}
                      disabled={applying === t.id}
                    >
                      {applying === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />}
                      Usar Template
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Create template dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-sm">Novo Template de Campanha</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome do template" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <Textarea placeholder="Descrição" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
              <Input placeholder="Objetivo padrão" value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} />
              <Input placeholder="Público-alvo padrão" value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))} />
              <div className="grid grid-cols-3 gap-3">
                <Input type="number" placeholder="Orçamento (R$)" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
                <Input type="number" placeholder="Duração (dias)" value={form.duration_days} onChange={e => setForm(f => ({ ...f, duration_days: e.target.value }))} />
                <Input placeholder="Tom de voz" value={form.tone} onChange={e => setForm(f => ({ ...f, tone: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button onClick={handleSaveTemplate} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Template'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

// Export helper to save existing campaign as template
export function SaveCampaignAsTemplateButton({ campaign, postCount }: { campaign: InstagramCampaign; postCount: number }) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('instagram_campaign_templates' as any).insert({
        name: `Template: ${campaign.name}`,
        objective: campaign.objective || null,
        target_audience: campaign.target_audience || null,
        budget: campaign.budget || null,
        description: `Baseado na campanha "${campaign.name}" com ${postCount} posts`,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['campaign-templates'] });
      toast.success('Campanha salva como template!');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7" onClick={handleSave} disabled={saving}>
      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookTemplate className="w-3.5 h-3.5" />} Salvar como Template
    </Button>
  );
}
