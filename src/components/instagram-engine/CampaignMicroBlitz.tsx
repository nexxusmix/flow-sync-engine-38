import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { InstagramCampaign, useInstagramAI, useCreatePost } from '@/hooks/useInstagramEngine';
import { Zap, Sparkles, Loader2, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { differenceInMinutes, differenceInHours, addHours, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  campaign: InstagramCampaign;
}

export function CampaignMicroBlitz({ campaign }: Props) {
  const ai = useInstagramAI();
  const createPost = useCreatePost();
  const [topic, setTopic] = useState('');
  const [urgency, setUrgency] = useState<'6h' | '12h' | '24h'>('24h');
  const [generatedPosts, setGeneratedPosts] = useState<any[]>([]);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [now, setNow] = useState(new Date());

  // Countdown timer
  useEffect(() => {
    if (!deadline) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const remaining = useMemo(() => {
    if (!deadline) return null;
    const mins = differenceInMinutes(deadline, now);
    if (mins <= 0) return { text: 'EXPIRADO', urgent: true, hours: 0, minutes: 0 };
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return { text: `${h}h ${m}m`, urgent: mins < 60, hours: h, minutes: m };
  }, [deadline, now]);

  const handleGenerate = async () => {
    if (!topic.trim()) { toast.error('Defina o tema da micro-campanha'); return; }
    const hours = urgency === '6h' ? 6 : urgency === '12h' ? 12 : 24;
    setDeadline(addHours(new Date(), hours));

    try {
      const result = await ai.mutateAsync({
        action: 'generate_from_context',
        data: {
          command: `Crie uma micro-campanha RELÂMPAGO de ${hours}h para: "${topic}".
Campanha: "${campaign.name}"
Público: ${campaign.target_audience || 'geral'}

Gere exatamente 5 posts coordenados para cobrir as próximas ${hours} horas.

Retorne JSON com:
- strategy: string com a estratégia da blitz (2-3 frases)
- posts: array de 5 objetos, cada um com:
  - title: título do post
  - format: "story" | "reel" | "single" | "carousel"
  - suggested_time: horário sugerido (ex: "+1h", "+3h", "+6h")
  - hook: gancho do post
  - caption_short: legenda curta (até 100 chars)
  - caption_long: legenda completa
  - cta: call-to-action
  - urgency_level: "high" | "medium"
  - purpose: "teaser" | "reveal" | "engagement" | "conversion" | "reminder"
- hashtags: array de 10 hashtags relevantes
- countdown_message: mensagem para o countdown`,
          format: 'micro_blitz',
        },
      });

      setGeneratedPosts(result?.posts || []);
      toast.success(`Micro-campanha de ${hours}h gerada! 🔥`);
    } catch { /* handled */ }
  };

  const handleSaveAll = async () => {
    let saved = 0;
    for (const post of generatedPosts) {
      try {
        await createPost.mutateAsync({
          title: post.title,
          format: post.format,
          hook: post.hook,
          caption_short: post.caption_short,
          caption_long: post.caption_long,
          cta: post.cta,
          status: 'planned',
          campaign_id: campaign.id,
          ai_generated: true,
        });
        saved++;
      } catch { /* continue */ }
    }
    toast.success(`${saved} posts salvos na campanha!`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-semibold text-foreground">Micro-Campanha Relâmpago</h3>
          {remaining && (
            <Badge className={`text-[9px] ${remaining.urgent ? 'bg-red-500/15 text-red-400 animate-pulse' : 'bg-amber-500/15 text-amber-400'}`}>
              ⏱️ {remaining.text}
            </Badge>
          )}
        </div>
      </div>

      {/* Setup */}
      {generatedPosts.length === 0 && (
        <Card className="p-5 bg-card/50 border-border/30 space-y-4">
          <div>
            <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Tema / Gatilho da Blitz</label>
            <Textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Ex: Flash sale 50% OFF, Lançamento surpresa, Trending topic viral..."
              className="text-xs min-h-[60px]"
            />
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground font-medium mb-2 block">⏰ Janela de Urgência</label>
            <div className="flex gap-2">
              {(['6h', '12h', '24h'] as const).map(u => (
                <Button
                  key={u}
                  size="sm"
                  variant={urgency === u ? 'default' : 'outline'}
                  className="flex-1 text-xs h-9"
                  onClick={() => setUrgency(u)}
                >
                  {u === '6h' && '🔴 '}
                  {u === '12h' && '🟡 '}
                  {u === '24h' && '🟢 '}
                  {u}
                </Button>
              ))}
            </div>
          </div>

          <Button className="w-full gap-2" onClick={handleGenerate} disabled={ai.isPending}>
            {ai.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Gerar Micro-Campanha ({urgency})
          </Button>
        </Card>
      )}

      {/* Generated Posts */}
      {generatedPosts.length > 0 && (
        <div className="space-y-3">
          {/* Countdown banner */}
          {remaining && (
            <Card className={`p-4 ${remaining.urgent ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className={`w-5 h-5 ${remaining.urgent ? 'text-red-400' : 'text-amber-400'}`} />
                  <div>
                    <div className={`text-lg font-bold ${remaining.urgent ? 'text-red-400' : 'text-amber-400'}`}>{remaining.text}</div>
                    <div className="text-[10px] text-muted-foreground">restantes para completar a blitz</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground">{generatedPosts.length} posts</div>
                  <div className="text-[10px] text-muted-foreground">planejados</div>
                </div>
              </div>
            </Card>
          )}

          {/* Timeline of posts */}
          <div className="relative pl-6 space-y-3">
            <div className="absolute left-2.5 top-0 bottom-0 w-px bg-border/30" />
            {generatedPosts.map((post, i) => (
              <div key={i} className="relative">
                <div className={`absolute -left-6 top-3 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  post.urgency_level === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'
                }`}>
                  {i + 1}
                </div>
                <Card className="p-4 bg-card/50 border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-[8px]">{post.format}</Badge>
                    <Badge className={`text-[8px] ${post.purpose === 'conversion' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-primary/10 text-primary'}`}>
                      {post.purpose}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground ml-auto">📅 {post.suggested_time}</span>
                  </div>
                  <h5 className="text-xs font-semibold text-foreground mb-1">{post.title}</h5>
                  {post.hook && (
                    <div className="text-[10px] text-primary/80 mb-1">🎯 {post.hook}</div>
                  )}
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{post.caption_short}</p>
                  {post.cta && (
                    <div className="text-[9px] text-amber-400 mt-1">📣 {post.cta}</div>
                  )}
                </Card>
              </div>
            ))}
          </div>

          <Button className="w-full gap-2" onClick={handleSaveAll} disabled={createPost.isPending}>
            {createPost.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Salvar Todos na Campanha
          </Button>

          <Button variant="outline" className="w-full text-xs" onClick={() => { setGeneratedPosts([]); setDeadline(null); }}>
            Gerar nova Blitz
          </Button>
        </div>
      )}
    </div>
  );
}
