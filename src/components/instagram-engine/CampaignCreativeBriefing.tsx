import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InstagramPost, FORMATS, PILLARS, useInstagramAI } from '@/hooks/useInstagramEngine';
import { Loader2, Palette, Camera, Type, Music, Lightbulb, Download, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  post: InstagramPost;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

interface BriefingResult {
  conceito_visual: string;
  paleta_cores: { nome: string; hex: string; uso: string }[];
  direcao_arte: {
    composicao: string;
    iluminacao: string;
    angulos_camera: string[];
    movimentos_camera: string[];
  };
  tipografia: { estilo: string; tamanho: string; posicionamento: string };
  trilha_sonora: { genero: string; mood: string; referencias: string[] };
  referencias_visuais: { descricao: string; estilo: string }[];
  shotlist: { cena: number; descricao: string; duracao: string; tipo_plano: string }[];
  equipamento_sugerido: string[];
  notas_edicao: string[];
}

export function CampaignCreativeBriefing({ post, open, onOpenChange }: Props) {
  const ai = useInstagramAI();
  const [briefing, setBriefing] = useState<BriefingResult | null>(null);
  const [loading, setLoading] = useState(false);

  const fmt = FORMATS.find(f => f.key === post.format);
  const pillar = PILLARS.find(p => p.key === post.pillar);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await ai.mutateAsync({
        action: 'generate_creative_briefing',
        data: {
          title: post.title,
          format: post.format,
          pillar: post.pillar,
          hook: post.hook,
          script: post.script,
          objective: post.objective,
        },
      });
      setBriefing(result as BriefingResult);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao gerar briefing');
    } finally {
      setLoading(false);
    }
  };

  const handleExportText = () => {
    if (!briefing) return;
    const lines = [
      `BRIEFING CRIATIVO — ${post.title}`,
      `Formato: ${fmt?.label || post.format} | Pilar: ${pillar?.label || post.pillar}`,
      '',
      `📐 CONCEITO VISUAL`,
      briefing.conceito_visual,
      '',
      `🎨 PALETA DE CORES`,
      ...briefing.paleta_cores.map(c => `  ${c.hex} — ${c.nome}: ${c.uso}`),
      '',
      `🎬 DIREÇÃO DE ARTE`,
      `  Composição: ${briefing.direcao_arte.composicao}`,
      `  Iluminação: ${briefing.direcao_arte.iluminacao}`,
      `  Ângulos: ${briefing.direcao_arte.angulos_camera.join(', ')}`,
      `  Movimentos: ${briefing.direcao_arte.movimentos_camera.join(', ')}`,
      '',
      `🔤 TIPOGRAFIA`,
      `  ${briefing.tipografia.estilo} — ${briefing.tipografia.posicionamento}`,
      '',
      `🎵 TRILHA SONORA`,
      `  ${briefing.trilha_sonora.genero} (${briefing.trilha_sonora.mood})`,
      `  Refs: ${briefing.trilha_sonora.referencias.join(', ')}`,
      '',
      `📋 SHOTLIST`,
      ...briefing.shotlist.map(s => `  Cena ${s.cena}: ${s.descricao} (${s.tipo_plano}, ${s.duracao})`),
      '',
      `📝 NOTAS DE EDIÇÃO`,
      ...briefing.notas_edicao.map(n => `  • ${n}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `briefing-${post.title.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Briefing exportado!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Palette className="w-4 h-4 text-primary" />
            Briefing Criativo: {post.title}
          </DialogTitle>
        </DialogHeader>

        {!briefing ? (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <Palette className="w-12 h-12 text-muted-foreground" />
            <p className="text-xs text-muted-foreground text-center max-w-sm">
              A IA vai gerar um briefing visual completo com paleta de cores, direção de arte, shotlist, tipografia e referências visuais.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {fmt && <Badge variant="outline" className="text-[9px]">{fmt.label}</Badge>}
              {pillar && <Badge variant="outline" className="text-[9px]">{pillar.label}</Badge>}
              {post.hook && <Badge variant="outline" className="text-[9px] max-w-[200px] truncate">🪝 {post.hook}</Badge>}
            </div>
            <Button onClick={handleGenerate} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Gerar Briefing Criativo
            </Button>
          </div>
        ) : (
          <ScrollArea className="max-h-[65vh]">
            <div className="space-y-5 pr-4">
              {/* Concept */}
              <Section icon={<Lightbulb className="w-4 h-4" />} title="Conceito Visual">
                <p className="text-xs text-foreground">{briefing.conceito_visual}</p>
              </Section>

              {/* Color palette */}
              <Section icon={<Palette className="w-4 h-4" />} title="Paleta de Cores">
                <div className="flex flex-wrap gap-2">
                  {briefing.paleta_cores?.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 bg-muted/20 rounded-lg px-3 py-2">
                      <div className="w-6 h-6 rounded-full border border-border/30" style={{ backgroundColor: c.hex }} />
                      <div>
                        <p className="text-[10px] font-medium text-foreground">{c.nome}</p>
                        <p className="text-[9px] text-muted-foreground">{c.hex} — {c.uso}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Art direction */}
              <Section icon={<Camera className="w-4 h-4" />} title="Direção de Arte">
                <div className="grid grid-cols-2 gap-3">
                  <InfoBlock label="Composição" value={briefing.direcao_arte?.composicao} />
                  <InfoBlock label="Iluminação" value={briefing.direcao_arte?.iluminacao} />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase mb-1">Ângulos de Câmera</p>
                    <div className="flex flex-wrap gap-1">
                      {briefing.direcao_arte?.angulos_camera?.map((a, i) => (
                        <Badge key={i} variant="outline" className="text-[8px]">{a}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase mb-1">Movimentos</p>
                    <div className="flex flex-wrap gap-1">
                      {briefing.direcao_arte?.movimentos_camera?.map((m, i) => (
                        <Badge key={i} variant="outline" className="text-[8px]">{m}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>

              {/* Typography */}
              <Section icon={<Type className="w-4 h-4" />} title="Tipografia">
                <div className="grid grid-cols-3 gap-3">
                  <InfoBlock label="Estilo" value={briefing.tipografia?.estilo} />
                  <InfoBlock label="Tamanho" value={briefing.tipografia?.tamanho} />
                  <InfoBlock label="Posição" value={briefing.tipografia?.posicionamento} />
                </div>
              </Section>

              {/* Soundtrack */}
              <Section icon={<Music className="w-4 h-4" />} title="Trilha Sonora">
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <InfoBlock label="Gênero" value={briefing.trilha_sonora?.genero} />
                  <InfoBlock label="Mood" value={briefing.trilha_sonora?.mood} />
                </div>
                <div className="flex flex-wrap gap-1">
                  {briefing.trilha_sonora?.referencias?.map((r, i) => (
                    <Badge key={i} variant="outline" className="text-[8px]">{r}</Badge>
                  ))}
                </div>
              </Section>

              {/* Shotlist */}
              <Section icon={<Camera className="w-4 h-4" />} title="Shotlist">
                <div className="space-y-1.5">
                  {briefing.shotlist?.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-[10px] bg-muted/10 rounded-lg px-2.5 py-1.5">
                      <span className="text-primary font-bold shrink-0">#{s.cena}</span>
                      <span className="text-foreground flex-1">{s.descricao}</span>
                      <Badge variant="outline" className="text-[8px] shrink-0">{s.tipo_plano}</Badge>
                      <span className="text-muted-foreground shrink-0">{s.duracao}</span>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Edit notes */}
              {briefing.notas_edicao?.length > 0 && (
                <Section icon={<Lightbulb className="w-4 h-4" />} title="Notas de Edição">
                  <ul className="space-y-1">
                    {briefing.notas_edicao.map((n, i) => (
                      <li key={i} className="text-[10px] text-foreground flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span> {n}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Export */}
              <div className="flex justify-end pt-2">
                <Button size="sm" variant="outline" className="gap-1 text-[10px]" onClick={handleExportText}>
                  <Download className="w-3.5 h-3.5" /> Exportar Briefing
                </Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card className="glass-card p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-primary">{icon}</span>
        <h5 className="text-[10px] font-semibold text-foreground uppercase tracking-wide">{title}</h5>
      </div>
      {children}
    </Card>
  );
}

function InfoBlock({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[9px] text-muted-foreground uppercase">{label}</p>
      <p className="text-[10px] text-foreground">{value || '—'}</p>
    </div>
  );
}
