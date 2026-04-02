import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { InstagramPost, InstagramCampaign, FORMATS, PILLARS } from '@/hooks/useInstagramEngine';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Sparkles, Loader2, Copy, RefreshCw, Target, MousePointerClick, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

interface AdVariant {
  headline: string;
  primary_text: string;
  description: string;
  cta_button: string;
  objective_fit: string;
}

export function CampaignAdsCopyGenerator({ campaign, posts }: Props) {
  const [selectedPost, setSelectedPost] = useState('');
  const [adObjective, setAdObjective] = useState<string>('traffic');
  const [variants, setVariants] = useState<AdVariant[]>([]);
  const [loading, setLoading] = useState(false);

  const post = posts.find(p => p.id === selectedPost);

  const objectives = [
    { key: 'traffic', label: 'Tráfego', icon: <MousePointerClick className="w-3 h-3" /> },
    { key: 'engagement', label: 'Engajamento', icon: <Eye className="w-3 h-3" /> },
    { key: 'leads', label: 'Leads', icon: <Target className="w-3 h-3" /> },
    { key: 'conversions', label: 'Conversões', icon: <Megaphone className="w-3 h-3" /> },
  ];

  const handleGenerate = async () => {
    if (!post) { toast.error('Selecione um post'); return; }
    setLoading(true);
    setVariants([]);
    try {
      const { data, error } = await supabase.functions.invoke('instagram-ai', {
        body: {
          action: 'generate_ads_copy',
          context: {
            campaign_name: campaign.name,
            campaign_objective: campaign.objective,
            target_audience: campaign.target_audience,
            post_title: post.title,
            post_hook: post.hook,
            post_caption: post.caption_short || post.caption_long,
            post_cta: post.cta,
            post_format: post.format,
            post_pillar: post.pillar,
            ad_objective: adObjective,
          }
        }
      });
      if (error) throw error;
      const out = data?.output || data;
      if (out?.variants && Array.isArray(out.variants)) {
        setVariants(out.variants);
      } else {
        throw new Error('Formato inesperado');
      }
    } catch {
      // Fallback local
      const hook = post.hook || post.title;
      const caption = post.caption_short || post.caption_long || '';
      setVariants([
        {
          headline: `${hook.slice(0, 40)}`,
          primary_text: `${caption.slice(0, 120)}... Saiba mais ➜`,
          description: `${campaign.name} · ${post.title}`,
          cta_button: adObjective === 'traffic' ? 'Saiba Mais' : adObjective === 'leads' ? 'Cadastre-se' : 'Ver Oferta',
          objective_fit: 'Alta',
        },
        {
          headline: `🔥 ${post.title.slice(0, 35)}`,
          primary_text: `Você precisa ver isso! ${caption.slice(0, 100)}...`,
          description: campaign.objective || 'Descubra agora',
          cta_button: adObjective === 'traffic' ? 'Ver Agora' : 'Quero Saber',
          objective_fit: 'Média',
        },
        {
          headline: `⚡ ${hook.slice(0, 38)}`,
          primary_text: `[NOVO] ${caption.slice(0, 90)}... Não perca!`,
          description: `Campanha: ${campaign.name}`,
          cta_button: 'Aproveitar',
          objective_fit: 'Alta',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyAll = (variant: AdVariant) => {
    const text = `HEADLINE: ${variant.headline}\nTEXTO PRIMÁRIO: ${variant.primary_text}\nDESCRIÇÃO: ${variant.description}\nBOTÃO CTA: ${variant.cta_button}`;
    navigator.clipboard.writeText(text);
    toast.success('Copy do anúncio copiado!');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center">
          <Megaphone className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Gerador de Ads Copy</h4>
          <p className="text-[10px] text-muted-foreground">Copy otimizado para Meta Ads a partir dos seus posts</p>
        </div>
      </div>

      {/* Config */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="glass-card p-4">
          <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Post Base</h5>
          <Select value={selectedPost} onValueChange={setSelectedPost}>
            <SelectTrigger className="text-[10px] h-8">
              <SelectValue placeholder="Escolha um post..." />
            </SelectTrigger>
            <SelectContent>
              {posts.map(p => (
                <SelectItem key={p.id} value={p.id} className="text-[10px]">
                  📝 {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {post && (
            <div className="flex gap-1.5 mt-2">
              {post.format && <Badge variant="outline" className="text-[7px]">{FORMATS.find(f => f.key === post.format)?.label}</Badge>}
              {post.pillar && <Badge variant="outline" className="text-[7px]">{PILLARS.find(p => p.key === post.pillar)?.label}</Badge>}
            </div>
          )}
        </Card>

        <Card className="glass-card p-4">
          <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Objetivo do Anúncio</h5>
          <div className="grid grid-cols-2 gap-2">
            {objectives.map(obj => (
              <Button key={obj.key} size="sm" variant={adObjective === obj.key ? 'default' : 'outline'} className="gap-1 text-[9px] h-7" onClick={() => setAdObjective(obj.key)}>
                {obj.icon} {obj.label}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      <Button className="w-full gap-2" onClick={handleGenerate} disabled={!selectedPost || loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        Gerar 3 Variações de Ads Copy
      </Button>

      {/* Results */}
      <AnimatePresence>
        {variants.length > 0 && (
          <div className="space-y-3">
            {variants.map((v, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="glass-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-red-500/15 text-red-400 text-[8px]">Variação {String.fromCharCode(65 + i)}</Badge>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[7px]">Fit: {v.objective_fit}</Badge>
                      <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => copyAll(v)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-[8px] text-muted-foreground uppercase">Headline (40 chars)</span>
                      <p className="text-[11px] font-bold text-foreground bg-muted/10 rounded px-2 py-1 mt-0.5">{v.headline}</p>
                    </div>
                    <div>
                      <span className="text-[8px] text-muted-foreground uppercase">Texto Primário (125 chars)</span>
                      <p className="text-[10px] text-foreground/80 bg-muted/10 rounded px-2 py-1.5 mt-0.5 leading-relaxed">{v.primary_text}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] text-muted-foreground uppercase">Descrição</span>
                        <p className="text-[9px] text-foreground/70 bg-muted/10 rounded px-2 py-1 mt-0.5">{v.description}</p>
                      </div>
                      <div>
                        <span className="text-[8px] text-muted-foreground uppercase">Botão CTA</span>
                        <div className="mt-0.5">
                          <Badge className="bg-blue-600 text-white text-[9px]">{v.cta_button}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
