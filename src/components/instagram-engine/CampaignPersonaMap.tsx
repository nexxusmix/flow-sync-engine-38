import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { InstagramPost, InstagramCampaign } from '@/hooks/useInstagramEngine';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCircle, Plus, Sparkles, Loader2, Trash2, Link2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

interface Persona {
  id: string;
  name: string;
  age_range: string;
  pain: string;
  desire: string;
  objection: string;
  funnel_stage: 'tofu' | 'mofu' | 'bofu';
  linked_posts: string[];
}

const FUNNEL_LABELS: Record<string, { label: string; color: string }> = {
  tofu: { label: 'Topo', color: 'bg-blue-500/15 text-blue-400' },
  mofu: { label: 'Meio', color: 'bg-amber-500/15 text-amber-400' },
  bofu: { label: 'Fundo', color: 'bg-emerald-500/15 text-emerald-400' },
};

export function CampaignPersonaMap({ campaign, posts }: Props) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState<Omit<Persona, 'id' | 'linked_posts'>>({
    name: '', age_range: '', pain: '', desire: '', objection: '', funnel_stage: 'tofu',
  });
  const [linkingPersona, setLinkingPersona] = useState<string | null>(null);

  const addPersona = () => {
    if (!form.name.trim()) { toast.error('Dê um nome à persona'); return; }
    setPersonas(prev => [...prev, { ...form, id: crypto.randomUUID(), linked_posts: [] }]);
    setForm({ name: '', age_range: '', pain: '', desire: '', objection: '', funnel_stage: 'tofu' });
    setShowForm(false);
  };

  const removePersona = (id: string) => setPersonas(prev => prev.filter(p => p.id !== id));

  const togglePostLink = (personaId: string, postId: string) => {
    setPersonas(prev => prev.map(p => {
      if (p.id !== personaId) return p;
      const linked = p.linked_posts.includes(postId)
        ? p.linked_posts.filter(id => id !== postId)
        : [...p.linked_posts, postId];
      return { ...p, linked_posts: linked };
    }));
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
        setPersonas(result.personas.map((p: any) => ({ ...p, id: crypto.randomUUID(), linked_posts: [] })));
      } else throw new Error('Formato inesperado');
    } catch {
      setPersonas([
        { id: crypto.randomUUID(), name: 'Maria Empreendedora', age_range: '28-40', pain: 'Não sabe criar conteúdo que vende', desire: 'Crescer no Instagram e atrair clientes', objection: 'Não tenho tempo', funnel_stage: 'tofu', linked_posts: [] },
        { id: crypto.randomUUID(), name: 'Carlos Gestor', age_range: '35-50', pain: 'Equipe sem processo de conteúdo', desire: 'Marketing previsível e escalável', objection: 'Já tentei e não funcionou', funnel_stage: 'mofu', linked_posts: [] },
        { id: crypto.randomUUID(), name: 'Ana Decisora', age_range: '30-45', pain: 'Precisa de resultados rápidos', desire: 'Contratar alguém que resolva', objection: 'É caro demais', funnel_stage: 'bofu', linked_posts: [] },
      ]);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-pink-500/15 flex items-center justify-center">
          <UserCircle className="w-4 h-4 text-pink-400" />
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

      {/* Manual form */}
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
              <Button size="sm" className="w-full text-[9px]" onClick={addPersona}>Salvar Persona</Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persona cards */}
      {personas.length === 0 ? (
        <Card className="glass-card p-8 text-center">
          <UserCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-[10px] text-muted-foreground">Crie personas para mapear seu público</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {personas.map((persona, i) => {
            const funnel = FUNNEL_LABELS[persona.funnel_stage];
            return (
              <motion.div key={persona.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-pink-500/15 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-pink-400">{persona.name.charAt(0)}</span>
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
                      <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => removePersona(persona.id)}>
                        <Trash2 className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div>
                      <span className="text-[7px] text-rose-400 uppercase">Dor</span>
                      <p className="text-[8px] text-foreground/70 mt-0.5">{persona.pain}</p>
                    </div>
                    <div>
                      <span className="text-[7px] text-emerald-400 uppercase">Desejo</span>
                      <p className="text-[8px] text-foreground/70 mt-0.5">{persona.desire}</p>
                    </div>
                    <div>
                      <span className="text-[7px] text-amber-400 uppercase">Objeção</span>
                      <p className="text-[8px] text-foreground/70 mt-0.5">{persona.objection}</p>
                    </div>
                  </div>

                  {/* Linked posts */}
                  {persona.linked_posts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border/10">
                      {persona.linked_posts.map(pid => {
                        const p = posts.find(x => x.id === pid);
                        return p ? <Badge key={pid} variant="outline" className="text-[7px]">📝 {p.title.slice(0, 20)}</Badge> : null;
                      })}
                    </div>
                  )}

                  {/* Link posts UI */}
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
