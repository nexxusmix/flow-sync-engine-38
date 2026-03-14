import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InstagramPost, FORMATS, PILLARS, InstagramCampaign } from '@/hooks/useInstagramEngine';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, Sparkles, Loader2, Download, Palette, Camera, Music, Layout, Type, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

interface Briefing {
  visual_direction: string;
  color_palette: string[];
  typography: string;
  shotlist: string[];
  soundtrack_mood: string;
  recording_tips: string[];
  styling_notes: string;
  references: string[];
}

export function CampaignBriefingGenerator({ campaign, posts }: Props) {
  const [selectedPost, setSelectedPost] = useState<string>('');
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(false);

  const post = posts.find(p => p.id === selectedPost);
  const eligiblePosts = posts.filter(p => p.status !== 'published');

  const handleGenerate = async () => {
    if (!post) { toast.error('Selecione um post'); return; }
    setLoading(true);
    setBriefing(null);
    try {
      const { data, error } = await supabase.functions.invoke('instagram-ai', {
        body: {
          action: 'generate_briefing',
          context: {
            campaign_name: campaign.name,
            objective: campaign.objective,
            target_audience: campaign.target_audience,
            post_title: post.title,
            post_hook: post.hook,
            post_caption: post.caption_short || post.caption_long,
            post_cta: post.cta,
            post_format: post.format,
            post_pillar: post.pillar,
            post_script: post.script,
          }
        }
      });
      if (error) throw error;
      const out = data?.output || data;
      setBriefing({
        visual_direction: out.visual_direction || 'Estética clean e moderna com contraste alto.',
        color_palette: out.color_palette || ['#000000', '#FFFFFF', '#009CCA', '#F5F5F5'],
        typography: out.typography || 'Títulos: Space Grotesk Bold. Corpo: Inter Regular.',
        shotlist: out.shotlist || ['Close-up do produto/rosto', 'B-roll do ambiente', 'Take final com CTA em tela'],
        soundtrack_mood: out.soundtrack_mood || 'Upbeat e motivacional, 120-130 BPM',
        recording_tips: out.recording_tips || ['Gravar em 4K vertical 9:16', 'Iluminação natural lateral', 'Microfone lapela para áudio limpo'],
        styling_notes: out.styling_notes || 'Cores neutras no vestuário para destacar cenário.',
        references: out.references || ['Estilo @garyvee para engajamento direto', 'Estética @thepreviewapp para grid coeso'],
      });
    } catch {
      // Fallback local
      const fmt = FORMATS.find(f => f.key === post.format);
      setBriefing({
        visual_direction: `Estilo ${fmt?.label || 'Feed'} moderno. Foco em legibilidade e impacto visual nos primeiros 3 segundos.`,
        color_palette: ['#000000', '#FFFFFF', '#009CCA', '#FF6B35'],
        typography: 'Display: Space Grotesk 700. Body: Inter 400. Accent: Playfair Display Italic.',
        shotlist: [
          'Abertura: gancho visual forte (0-3s)',
          'Desenvolvimento: conteúdo principal (3-15s)',
          'B-roll: imagens de apoio / cutaways',
          'Fechamento: CTA claro em tela + narração',
        ],
        soundtrack_mood: 'Trending audio ou beat original 120 BPM, sem vocal.',
        recording_tips: [
          'Formato 9:16 (1080x1920)',
          'Iluminação: ring light + luz natural',
          'Áudio: microfone externo obrigatório',
          'Gravar em 30fps para edição suave',
        ],
        styling_notes: 'Paleta de cores alinhada ao brand. Evitar padrões complexos no vestuário.',
        references: ['Estilo editorial @later', 'Motion graphics @canva'],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportBriefing = () => {
    if (!briefing || !post) return;
    const now = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Briefing - ${post.title}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');
      * { margin:0; padding:0; box-sizing:border-box; }
      body { background:#000; color:#fff; font-family:'Space Grotesk',sans-serif; padding:40px; }
      .header { border-bottom:2px solid #009CCA; padding-bottom:20px; margin-bottom:28px; }
      .header h1 { font-size:22px; font-weight:700; color:#009CCA; }
      .header p { color:#666; font-size:11px; margin-top:4px; }
      .section { margin-bottom:24px; }
      .section h2 { font-size:12px; color:#009CCA; text-transform:uppercase; letter-spacing:2px; margin-bottom:8px; border-left:3px solid #009CCA; padding-left:10px; }
      .content { background:#0a0a0a; border:1px solid #1a1a1a; border-radius:8px; padding:16px; color:#ccc; font-size:11px; line-height:1.8; }
      .color-row { display:flex; gap:8px; margin-top:8px; }
      .color-swatch { width:40px; height:40px; border-radius:6px; border:1px solid #333; }
      ul { list-style:none; padding:0; }
      ul li { padding:4px 0; border-bottom:1px solid #111; font-size:11px; color:#ccc; }
      ul li::before { content:'▸ '; color:#009CCA; }
      .footer { margin-top:32px; border-top:1px solid #1a1a1a; padding-top:12px; color:#444; font-size:9px; text-align:center; }
      @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
    </style></head><body>
    <div class="header">
      <h1>📋 Briefing Criativo</h1>
      <p>${post.title} · ${campaign.name} · ${now}</p>
    </div>
    <div class="section"><h2>Direção Visual</h2><div class="content">${briefing.visual_direction}</div></div>
    <div class="section"><h2>Paleta de Cores</h2><div class="content"><div class="color-row">${briefing.color_palette.map(c => `<div class="color-swatch" style="background:${c}" title="${c}"></div>`).join('')}</div><p style="margin-top:8px;font-size:10px;color:#666">${briefing.color_palette.join(' · ')}</p></div></div>
    <div class="section"><h2>Tipografia</h2><div class="content">${briefing.typography}</div></div>
    <div class="section"><h2>Shotlist</h2><div class="content"><ul>${briefing.shotlist.map(s => `<li>${s}</li>`).join('')}</ul></div></div>
    <div class="section"><h2>Trilha Sonora</h2><div class="content">${briefing.soundtrack_mood}</div></div>
    <div class="section"><h2>Dicas de Gravação</h2><div class="content"><ul>${briefing.recording_tips.map(t => `<li>${t}</li>`).join('')}</ul></div></div>
    <div class="section"><h2>Styling</h2><div class="content">${briefing.styling_notes}</div></div>
    <div class="section"><h2>Referências</h2><div class="content"><ul>${briefing.references.map(r => `<li>${r}</li>`).join('')}</ul></div></div>
    <div class="footer">SQUAD · Briefing gerado automaticamente · ${now}</div>
    </body></html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    document.body.appendChild(iframe);
    iframe.contentDocument!.open();
    iframe.contentDocument!.write(html);
    iframe.contentDocument!.close();
    setTimeout(() => { iframe.contentWindow!.print(); setTimeout(() => document.body.removeChild(iframe), 1000); }, 500);
    toast.success('Briefing PDF gerado!');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
          <FileSpreadsheet className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Gerador de Briefing</h4>
          <p className="text-[10px] text-muted-foreground">Briefing criativo completo para equipe de produção</p>
        </div>
      </div>

      {/* Post selector */}
      <Card className="glass-card p-4">
        <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Selecione o Post</h5>
        <Select value={selectedPost} onValueChange={setSelectedPost}>
          <SelectTrigger className="text-[10px] h-8">
            <SelectValue placeholder="Escolha um post para gerar briefing..." />
          </SelectTrigger>
          <SelectContent>
            {eligiblePosts.map(p => (
              <SelectItem key={p.id} value={p.id} className="text-[10px]">
                📝 {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {post && (
          <div className="mt-2 flex items-center gap-2 text-[8px] text-muted-foreground">
            {post.format && <Badge variant="outline" className="text-[7px]">{FORMATS.find(f => f.key === post.format)?.label}</Badge>}
            {post.pillar && <Badge variant="outline" className="text-[7px]">{PILLARS.find(p => p.key === post.pillar)?.label}</Badge>}
            {post.ai_generated && <Badge className="bg-primary/15 text-primary text-[7px]">IA</Badge>}
          </div>
        )}
        <Button className="w-full mt-3 gap-2" onClick={handleGenerate} disabled={!selectedPost || loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Gerar Briefing com IA
        </Button>
      </Card>

      {/* Briefing result */}
      <AnimatePresence>
        {briefing && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {/* Visual Direction */}
            <Card className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Layout className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-semibold text-foreground">Direção Visual</span>
              </div>
              <p className="text-[10px] text-foreground/80 leading-relaxed">{briefing.visual_direction}</p>
            </Card>

            {/* Color Palette */}
            <Card className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-[10px] font-semibold text-foreground">Paleta de Cores</span>
              </div>
              <div className="flex gap-2">
                {briefing.color_palette.map((color, i) => (
                  <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }} className="text-center">
                    <div className="w-10 h-10 rounded-lg border border-border/20" style={{ backgroundColor: color }} />
                    <span className="text-[7px] text-muted-foreground">{color}</span>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Typography */}
            <Card className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Type className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-[10px] font-semibold text-foreground">Tipografia</span>
              </div>
              <p className="text-[10px] text-foreground/80">{briefing.typography}</p>
            </Card>

            {/* Shotlist */}
            <Card className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-[10px] font-semibold text-foreground">Shotlist</span>
              </div>
              <div className="space-y-1">
                {briefing.shotlist.map((shot, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center gap-2 text-[9px] text-foreground/80">
                    <Badge variant="outline" className="text-[7px] shrink-0">{i + 1}</Badge>
                    <span>{shot}</span>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Soundtrack */}
            <Card className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Music className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-[10px] font-semibold text-foreground">Trilha Sonora</span>
              </div>
              <p className="text-[10px] text-foreground/80">{briefing.soundtrack_mood}</p>
            </Card>

            {/* Recording tips */}
            <Card className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-[10px] font-semibold text-foreground">Dicas de Gravação</span>
              </div>
              <div className="space-y-1">
                {briefing.recording_tips.map((tip, i) => (
                  <div key={i} className="text-[9px] text-foreground/80 flex items-center gap-1.5">
                    <span className="text-pink-400">▸</span> {tip}
                  </div>
                ))}
              </div>
            </Card>

            {/* Export */}
            <Button className="w-full gap-2" variant="outline" onClick={handleExportBriefing}>
              <Download className="w-4 h-4" /> Exportar Briefing PDF
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
