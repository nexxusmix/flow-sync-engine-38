import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { InstagramPost, InstagramCampaign, useCampaignPersonas, useCampaignPersonaMutations } from '@/hooks/useInstagramEngine';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCircle, Plus, Sparkles, Loader2, Trash2, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { sc } from '@/lib/colors';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

const FUNNEL_LABELS: Record<string, { label: string; color: string }> = {
  tofu: { label: 'Topo', color: `${sc.status('pending').bg} ${sc.status('pending').text}` },
  mofu: { label: 'Meio', color: `${sc.status('in_progress').bg} ${sc.status('in_progress').text}` },
  bofu: { label: 'Fundo', color: `${sc.status('success').bg} ${sc.status('success').text}` },
};

export function CampaignPersonaMap({ campaign, posts }: Props) {
  const { data: personas = [], isLoading } = useCampaignPersonas(campaign.id);
  const { create, createMany, update, remove } = useCampaignPersonaMutations(campaign.id);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ name: '', age_range: '', pain: '', desire: '', objection: '', funnel_stage: 'tofu' as string });
  const [linkingPersona, setLinkingPersona] = useState<string | null>(null);

  const addPersona = () => {
    if (!form.name.trim()) { toast.error('Dê um nome à persona'); return; }
    create.mutate({ ...form, linked_posts: [], ai_generated: false });
    setForm({ name: '', age_range: '', pain: '', desire: '', objection: '', funnel_stage: 'tofu' });
    setShowForm(false);
  };

  const togglePostLink = (personaId: string, postId: string) => {
    const persona = personas.find(p => p.id === personaId);
    if (!persona) return;
    const linked = persona.linked_posts.includes(postId)
      ? persona.linked_posts.filter(id => id !== postId)
      : [...persona.linked_posts, postId];
    update.mutate({ id: personaId, linked_posts: linked });
  };

  const generateWithAI = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('instagram-ai', {
        body: {
          action: 'generate_personas',
          data: {
            campaign_name: campaign.name,
            campaign_objective: campaign.objective,
            target_audience: campaign.target_audience,
            niche: campaign.objective,
          }
        }
      });
      if (error) throw error;
      const result = data?.result || data?.output || data;
      if (result?.personas && Array.isArray(result.personas)) {
        createMany.mutate(result.personas.map((p: any) => ({ ...p, linked_posts: [], ai_generated: true })));
      } else throw new Error('Formato inesperado');
    } catch {
      createMany.mutate([
        { name: 'Maria Empreendedora', age_range: '28-40', pain: 'Não sabe criar conteúdo que vende', desire: 'Crescer no Instagram e atrair clientes', objection: 'Não tenho tempo', funnel_stage: 'tofu', linked_posts: [], ai_generated: true },
        { name: 'Carlos Gestor', age_range: '35-50', pain: 'Equipe sem processo de conteúdo', desire: 'Marketing previsível e escalável', objection: 'Já tentei e não funcionou', funnel_stage: 'mofu', linked_posts: [], ai_generated: true },
        { name: 'Ana Decisora', age_range: '30-45', pain: 'Precisa de resultados rápidos', desire: 'Contratar alguém que resolva', objection: 'É caro demais', funnel_stage: 'bofu', linked_posts: [], ai_generated: true },
      ]);
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary/40" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
          <UserCircle className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Mapa de Personas</h4>
          <p className="text-[10px] text-muted-foreground">{personas.length} personas · {posts.length} posts</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="gap-1 text-[9px]" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-3 h-3" /> Manual
        </Button>
        <Button size="sm" className="gap-1 text-[9px]" onClick={generateWithAI} disabled={generating}>
          {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Gerar com IA
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <Card className="glass-card p-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input className="text-[10px] h-7" placeholder="Nome da persona" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <Input className="text-[10px] h-7" placeholder="Faixa etária (ex: 25-35)" value={form.age_range} onChange={e => setForm(f => ({ ...f, age_range: e.target.value }))} />
              </div>
              <Textarea className="text-[10px] min-h-[50px]" placeholder="Dor principal..." value={form.pain} onChange={e => setForm(f => ({ ...f, pain: e.target.value }))} />
              <Textarea className="text-[10px] min-h-[50px]" placeholder="Desejo/aspiração..." value={form.desire} onChange={e => setForm(f => ({ ...f, desire: e.target.value }))} />
              <Input className="text-[10px] h-7" placeholder="Objeção principal" value={form.objection} onChange={e => setForm(f => ({ ...f, objection: e.target.value }))} />
              <div className="flex gap-1.5">
                {(['tofu', 'mofu', 'bofu'] as const).map(s => (
                  <Button key={s} size="sm" variant={form.funnel_stage === s ? 'default' : 'outline'} className="text-[8px] h-6" onClick={() => setForm(f => ({ ...f, funnel_stage: s }))}>
                    {FUNNEL_LABELS[s].label}
                  </Button>
                ))}
              </div>
              <Button size="sm" className="w-full text-[9px]" onClick={addPersona} disabled={create.isPending}>Salvar Persona</Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {personas.length === 0 ? (
        <Card className="glass-card p-8 text-center">
          <UserCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-[10px] text-muted-foreground">Crie personas para mapear seu público</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {personas.map((persona, i) => {
            const funnel = FUNNEL_LABELS[persona.funnel_stage] || FUNNEL_LABELS.tofu;
            return (
              <motion.div key={persona.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-primary">{persona.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-foreground">{persona.name}</p>
                        <p className="text-[8px] text-muted-foreground">{persona.age_range}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge className={`${funnel.color} text-[7px]`}>{funnel.label}</Badge>
                      <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setLinkingPersona(linkingPersona === persona.id ? null : persona.id)}>
                        <Link2 className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => remove.mutate(persona.id)}>
                        <Trash2 className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div>
                      <span className={`text-[7px] uppercase ${sc.status('error').text}`}>Dor</span>
                      <p className="text-[8px] text-foreground/70 mt-0.5">{persona.pain}</p>
                    </div>
                    <div>
                      <span className={`text-[7px] uppercase ${sc.status('success').text}`}>Desejo</span>
                      <p className="text-[8px] text-foreground/70 mt-0.5">{persona.desire}</p>
                    </div>
                    <div>
                      <span className="text-[7px] uppercase text-muted-foreground">Objeção</span>
                      <p className="text-[8px] text-foreground/70 mt-0.5">{persona.objection}</p>
                    </div>
                  </div>

                  {persona.linked_posts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border/10">
                      {persona.linked_posts.map(pid => {
                        const p = posts.find(x => x.id === pid);
                        return p ? <Badge key={pid} variant="outline" className="text-[7px]">📝 {p.title.slice(0, 20)}</Badge> : null;
                      })}
                    </div>
                  )}

                  <AnimatePresence>
                    {linkingPersona === persona.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 pt-2 border-t border-border/10">
                        <p className="text-[8px] text-muted-foreground mb-1">Vincular posts:</p>
                        <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto">
                          {posts.map(p => (
                            <Badge
                              key={p.id}
                              variant={persona.linked_posts.includes(p.id) ? 'default' : 'outline'}
                              className="text-[7px] cursor-pointer"
                              onClick={() => togglePostLink(persona.id, p.id)}
                            >
                              {p.title.slice(0, 18)}
                            </Badge>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
