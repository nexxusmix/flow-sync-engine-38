import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InstagramPost, InstagramCampaign, FORMATS, PILLARS } from '@/hooks/useInstagramEngine';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Repeat2, Sparkles, Loader2, Copy, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

interface SpinVariation {
  angle: string;
  hook: string;
  caption: string;
  cta: string;
  suggested_format: string;
}

const ANGLES = [
  { key: 'polemico', label: '🔥 Polêmico', desc: 'Opinião forte que gera debate' },
  { key: 'educativo', label: '📚 Educativo', desc: 'Ensina algo prático e aplicável' },
  { key: 'storytelling', label: '📖 Storytelling', desc: 'Narrativa envolvente e emocional' },
  { key: 'dados', label: '📊 Dados & Provas', desc: 'Estatísticas e evidências concretas' },
  { key: 'humor', label: '😂 Humor/Meme', desc: 'Abordagem leve e compartilhável' },
];

export function CampaignSpinGenerator({ campaign, posts }: Props) {
  const [selectedPost, setSelectedPost] = useState('');
  const [variations, setVariations] = useState<SpinVariation[]>([]);
  const [loading, setLoading] = useState(false);

  const post = posts.find(p => p.id === selectedPost);

  const handleGenerate = async () => {
    if (!post) { toast.error('Selecione um post'); return; }
    setLoading(true);
    setVariations([]);
    try {
      const { data, error } = await supabase.functions.invoke('instagram-ai', {
        body: {
          action: 'generate_spin_variations',
          data: {
            post_title: post.title,
            post_hook: post.hook,
            post_caption: post.caption_short || post.caption_long,
            post_cta: post.cta,
            post_format: post.format,
            post_pillar: post.pillar,
            campaign_name: campaign.name,
            angles: ANGLES.map(a => a.key),
          }
        }
      });
      if (error) throw error;
      const out = data?.result || data?.output || data;
      if (out?.variations && Array.isArray(out.variations)) {
        setVariations(out.variations);
      } else throw new Error('Formato inesperado');
    } catch {
      // Fallback local
      const hook = post.hook || post.title;
      const caption = post.caption_short || post.caption_long || post.title;
      setVariations(ANGLES.map(angle => ({
        angle: angle.key,
        hook: angle.key === 'polemico' ? `Ninguém fala sobre isso: ${hook.slice(0, 40)}` :
              angle.key === 'educativo' ? `3 passos para: ${hook.slice(0, 40)}` :
              angle.key === 'storytelling' ? `Quando eu descobri que ${hook.slice(0, 35)}...` :
              angle.key === 'dados' ? `97% das pessoas erram isso: ${hook.slice(0, 30)}` :
              `POV: quando ${hook.slice(0, 40)}`,
        caption: `[${angle.label}] ${caption.slice(0, 100)}...`,
        cta: post.cta || 'Salve para depois',
        suggested_format: post.format || 'reel',
      })));
    } finally {
      setLoading(false);
    }
  };

  const copyVariation = (v: SpinVariation) => {
    navigator.clipboard.writeText(`HOOK: ${v.hook}\nLEGENDA: ${v.caption}\nCTA: ${v.cta}`);
    toast.success('Variação copiada!');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-fuchsia-500/15 flex items-center justify-center">
          <Repeat2 className="w-4 h-4 text-fuchsia-400" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Gerador de Variações (Spin)</h4>
          <p className="text-[10px] text-muted-foreground">Crie 5 ângulos diferentes a partir de um post de alta performance</p>
        </div>
      </div>

      <Card className="glass-card p-4">
        <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Post Original</h5>
        <Select value={selectedPost} onValueChange={setSelectedPost}>
          <SelectTrigger className="text-[10px] h-8">
            <SelectValue placeholder="Escolha um post para variar..." />
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
          <div className="mt-2 space-y-1">
            <div className="flex gap-1.5">
              {post.format && <Badge variant="outline" className="text-[7px]">{FORMATS.find(f => f.key === post.format)?.label}</Badge>}
              {post.pillar && <Badge variant="outline" className="text-[7px]">{PILLARS.find(p => p.key === post.pillar)?.label}</Badge>}
              {post.ai_generated && <Badge className="bg-primary/15 text-primary text-[7px]">IA</Badge>}
            </div>
            {post.hook && <p className="text-[9px] text-foreground/70 italic">"{post.hook}"</p>}
          </div>
        )}
      </Card>

      {/* Angle legend */}
      <div className="flex gap-1.5 flex-wrap">
        {ANGLES.map(a => (
          <Badge key={a.key} variant="outline" className="text-[7px] gap-0.5">
            {a.label}
          </Badge>
        ))}
      </div>

      <Button className="w-full gap-2" onClick={handleGenerate} disabled={!selectedPost || loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        Gerar 5 Variações de Ângulo
      </Button>

      <AnimatePresence>
        {variations.length > 0 && (
          <div className="space-y-3">
            {variations.map((v, i) => {
              const angleConfig = ANGLES.find(a => a.key === v.angle) || ANGLES[i % ANGLES.length];
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                  <Card className="glass-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-fuchsia-500/15 text-fuchsia-400 text-[8px]">{angleConfig.label}</Badge>
                        <Badge variant="outline" className="text-[7px]">{FORMATS.find(f => f.key === v.suggested_format)?.label || v.suggested_format}</Badge>
                      </div>
                      <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => copyVariation(v)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-[8px] text-muted-foreground uppercase">Hook</span>
                        <p className="text-[11px] font-bold text-foreground bg-muted/10 rounded px-2 py-1 mt-0.5">{v.hook}</p>
                      </div>
                      <div>
                        <span className="text-[8px] text-muted-foreground uppercase">Legenda</span>
                        <p className="text-[10px] text-foreground/80 bg-muted/10 rounded px-2 py-1.5 mt-0.5 leading-relaxed line-clamp-3">{v.caption}</p>
                      </div>
                      <div>
                        <span className="text-[8px] text-muted-foreground uppercase">CTA</span>
                        <p className="text-[9px] text-foreground/70 bg-muted/10 rounded px-2 py-1 mt-0.5">{v.cta}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
