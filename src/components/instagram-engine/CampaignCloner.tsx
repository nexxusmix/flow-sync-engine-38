import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { InstagramCampaign, InstagramPost, useCreatePost } from '@/hooks/useInstagramEngine';
import { Copy, Loader2, BookTemplate, Save, ChevronRight, Calendar, FileText, Layers, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { addDays, differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  campaigns: InstagramCampaign[];
  posts: InstagramPost[];
}

interface CampaignTemplate {
  id: string;
  name: string;
  campaign: Partial<InstagramCampaign>;
  postTemplates: Partial<InstagramPost>[];
  createdAt: string;
}

export function CampaignCloner({ campaigns, posts }: Props) {
  const qc = useQueryClient();
  const createPost = useCreatePost();
  const [cloning, setCloning] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [saving, setSaving] = useState(false);

  const campaign = campaigns.find(c => c.id === selectedCampaign);
  const campaignPosts = posts.filter(p => p.campaign_id === selectedCampaign);

  const handleClone = async () => {
    if (!campaign || !newName.trim()) return;
    setCloning(true);

    try {
      // Create new campaign
      const { data: newCampaign, error } = await supabase
        .from('instagram_campaigns')
        .insert({
          name: newName.trim(),
          objective: campaign.objective,
          target_audience: campaign.target_audience,
          budget: campaign.budget,
          status: 'planning',
          key_messages: campaign.key_messages,
          kpis: campaign.kpis,
          start_date: newStartDate || null,
          end_date: newStartDate && campaign.start_date && campaign.end_date
            ? addDays(new Date(newStartDate), differenceInDays(new Date(campaign.end_date), new Date(campaign.start_date))).toISOString().slice(0, 10)
            : null,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Clone posts
      let cloned = 0;
      const dayOffset = campaign.start_date && newStartDate
        ? differenceInDays(new Date(newStartDate), new Date(campaign.start_date))
        : 0;

      for (const post of campaignPosts) {
        try {
          let scheduledAt = post.scheduled_at;
          if (scheduledAt && dayOffset !== 0) {
            scheduledAt = addDays(new Date(scheduledAt), dayOffset).toISOString();
          }

          await createPost.mutateAsync({
            title: post.title,
            format: post.format,
            pillar: post.pillar,
            objective: post.objective,
            status: 'idea',
            hook: post.hook,
            script: post.script,
            caption_short: post.caption_short,
            caption_medium: post.caption_medium,
            caption_long: post.caption_long,
            cta: post.cta,
            pinned_comment: post.pinned_comment,
            hashtags: post.hashtags,
            cover_suggestion: post.cover_suggestion,
            carousel_slides: post.carousel_slides,
            story_sequence: post.story_sequence,
            checklist: post.checklist,
            ai_generated: post.ai_generated,
            campaign_id: newCampaign.id,
            scheduled_at: scheduledAt,
            position: cloned,
          } as any);
          cloned++;
        } catch { /* continue */ }
      }

      qc.invalidateQueries({ queryKey: ['instagram-campaigns'] });
      toast.success(`Campanha clonada: "${newName}" com ${cloned} posts!`);
      setSelectedCampaign(null);
      setNewName('');
      setNewStartDate('');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao clonar');
    } finally {
      setCloning(false);
    }
  };

  const saveAsTemplate = () => {
    if (!campaign) return;
    setSaving(true);
    const template: CampaignTemplate = {
      id: Date.now().toString(),
      name: `Template: ${campaign.name}`,
      campaign: {
        name: campaign.name,
        objective: campaign.objective,
        target_audience: campaign.target_audience,
        budget: campaign.budget,
        key_messages: campaign.key_messages,
        kpis: campaign.kpis,
      },
      postTemplates: campaignPosts.map(p => ({
        title: p.title,
        format: p.format,
        pillar: p.pillar,
        objective: p.objective,
        hook: p.hook,
        script: p.script,
        caption_short: p.caption_short,
        caption_medium: p.caption_medium,
        caption_long: p.caption_long,
        cta: p.cta,
        hashtags: p.hashtags,
        cover_suggestion: p.cover_suggestion,
        carousel_slides: p.carousel_slides,
        story_sequence: p.story_sequence,
        checklist: p.checklist,
      })),
      createdAt: new Date().toISOString(),
    };
    setTemplates(prev => [...prev, template]);
    setSaving(false);
    toast.success('Template salvo!');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Copy className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Campaign Cloner & Template Library</h3>
      </div>

      {/* Campaign selector */}
      <Card className="p-4 bg-card/50 border-border/30">
        <h4 className="text-xs font-semibold text-foreground mb-3">📋 Selecione uma campanha para clonar</h4>
        <div className="grid gap-2 max-h-[200px] overflow-y-auto">
          {campaigns.map(c => {
            const cPosts = posts.filter(p => p.campaign_id === c.id);
            return (
              <button
                key={c.id}
                onClick={() => { setSelectedCampaign(c.id); setNewName(`${c.name} (Cópia)`); }}
                className={`flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                  selectedCampaign === c.id ? 'bg-primary/10 border border-primary/30' : 'bg-card/30 border border-border/20 hover:border-border/40'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-foreground truncate block">{c.name}</span>
                  <span className="text-[10px] text-muted-foreground">{cPosts.length} posts</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>
      </Card>

      {/* Clone form */}
      {campaign && (
        <Card className="p-4 bg-card/50 border-border/30 space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Clonar "{campaign.name}"</span>
            <Badge variant="outline" className="text-[9px]">{campaignPosts.length} posts</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Nome da nova campanha</label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Nova data de início</label>
              <Input type="date" value={newStartDate} onChange={e => setNewStartDate(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="gap-1.5 text-xs h-8 flex-1" onClick={handleClone} disabled={cloning || !newName.trim()}>
              {cloning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
              Clonar Campanha
            </Button>
            <Button variant="outline" className="gap-1.5 text-xs h-8" onClick={saveAsTemplate}>
              <BookTemplate className="w-3.5 h-3.5" /> Salvar Template
            </Button>
          </div>
        </Card>
      )}

      {/* Template library */}
      {templates.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground">📚 Templates Salvos</h4>
          {templates.map(t => (
            <Card key={t.id} className="p-3 bg-card/50 border-border/30">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-foreground">{t.name}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[9px]">{t.postTemplates.length} posts</Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(t.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => setTemplates(prev => prev.filter(x => x.id !== t.id))}
                >
                  <Trash2 className="w-3 h-3 text-muted-foreground" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
