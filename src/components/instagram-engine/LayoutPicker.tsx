import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Check, Sparkles, Eye } from 'lucide-react';

export interface LayoutMockupStyle {
  bg: string;
  textColor: string;
  textAlign: 'center' | 'left' | 'right';
  textSize: string;
  fontWeight: string;
  letterSpacing?: string;
  textTransform?: 'uppercase' | 'none';
  padding?: string;
  justify?: string;
  overlay?: string;
  extra?: 'bars' | 'frame' | 'quote' | 'split' | 'diagonal' | 'grid' | 'spotlight';
}

export interface LayoutOption {
  key: string;
  label: string;
  promptModifier: string;
  preview: string;
  category: string;
  mockup: LayoutMockupStyle;
}

export interface ReferenceItem {
  id: string;
  thumbnail_url: string | null;
  media_type: string | null;
  tags: string[] | null;
  note: string | null;
  caption: string | null;
}

const M = (overrides: Partial<LayoutMockupStyle>): LayoutMockupStyle => ({
  bg: 'linear-gradient(135deg, hsl(220 20% 15%), hsl(220 15% 22%))',
  textColor: '#fff',
  textAlign: 'center',
  textSize: 'text-sm',
  fontWeight: 'font-bold',
  textTransform: 'none',
  ...overrides,
});

const LAYOUT_OPTIONS: LayoutOption[] = [
  // Typography
  { key: 'bold_central', label: 'Bold Central', promptModifier: 'Bold large centered text, minimal background, strong typography, Instagram post', preview: 'linear-gradient(135deg, hsl(0 0% 10%), hsl(0 0% 20%))', category: 'Tipografia', mockup: M({ bg: 'linear-gradient(135deg, hsl(0 0% 8%), hsl(0 0% 18%))', textSize: 'text-lg', fontWeight: 'font-black', textTransform: 'uppercase', letterSpacing: '0.08em' }) },
  { key: 'minimalist_type', label: 'Minimalista', promptModifier: 'Minimalist clean design, lots of white space, thin elegant typography, subtle tones', preview: 'linear-gradient(135deg, hsl(0 0% 95%), hsl(0 0% 85%))', category: 'Tipografia', mockup: M({ bg: 'hsl(0 0% 96%)', textColor: '#222', textSize: 'text-xs', fontWeight: 'font-light', letterSpacing: '0.12em', textTransform: 'uppercase' }) },
  { key: 'editorial', label: 'Editorial', promptModifier: 'Magazine editorial layout, sophisticated typography, serif fonts, elegant composition', preview: 'linear-gradient(135deg, hsl(40 30% 90%), hsl(20 20% 80%))', category: 'Tipografia', mockup: M({ bg: 'linear-gradient(135deg, hsl(40 30% 92%), hsl(20 20% 85%))', textColor: '#2a1f14', textAlign: 'left', textSize: 'text-sm', fontWeight: 'font-semibold' }) },
  { key: 'quote_card', label: 'Quote Card', promptModifier: 'Inspirational quote card, centered text with decorative quotation marks, clean background', preview: 'linear-gradient(135deg, hsl(220 40% 20%), hsl(260 30% 30%))', category: 'Tipografia', mockup: M({ bg: 'linear-gradient(135deg, hsl(220 40% 18%), hsl(260 30% 28%))', textSize: 'text-sm', extra: 'quote' }) },
  { key: 'magazine', label: 'Magazine', promptModifier: 'Fashion magazine cover style, bold headlines, layered text, sophisticated layout', preview: 'linear-gradient(135deg, hsl(350 60% 40%), hsl(330 40% 30%))', category: 'Tipografia', mockup: M({ bg: 'linear-gradient(135deg, hsl(350 60% 38%), hsl(330 40% 28%))', textSize: 'text-base', fontWeight: 'font-black', textTransform: 'uppercase', textAlign: 'left' }) },

  // Colors
  { key: 'gradient_overlay', label: 'Gradient Overlay', promptModifier: 'Vibrant gradient overlay on photo, colorful gradient mesh, modern social media', preview: 'linear-gradient(135deg, hsl(280 80% 50%), hsl(200 80% 50%))', category: 'Cores', mockup: M({ bg: 'linear-gradient(135deg, hsl(280 80% 45%), hsl(200 80% 50%))', textSize: 'text-base', fontWeight: 'font-black' }) },
  { key: 'duotone', label: 'Duotone', promptModifier: 'Duotone effect, two-color treatment, high contrast, artistic color grading', preview: 'linear-gradient(135deg, hsl(200 80% 40%), hsl(330 60% 50%))', category: 'Cores', mockup: M({ bg: 'linear-gradient(135deg, hsl(200 80% 35%), hsl(330 60% 45%))', textSize: 'text-sm' }) },
  { key: 'neon_glow', label: 'Neon Glow', promptModifier: 'Neon glow effect, dark background with neon lights, cyberpunk aesthetic, glowing text', preview: 'linear-gradient(135deg, hsl(280 100% 20%), hsl(180 100% 40%))', category: 'Cores', mockup: M({ bg: 'hsl(260 40% 8%)', textColor: 'hsl(180 100% 60%)', textSize: 'text-base', fontWeight: 'font-black' }) },
  { key: 'pastel_soft', label: 'Pastel Soft', promptModifier: 'Soft pastel colors, dreamy aesthetic, light and airy, gentle tones', preview: 'linear-gradient(135deg, hsl(320 60% 85%), hsl(200 60% 85%))', category: 'Cores', mockup: M({ bg: 'linear-gradient(135deg, hsl(320 50% 88%), hsl(200 50% 88%))', textColor: '#3a3a5a', textSize: 'text-sm', fontWeight: 'font-medium' }) },
  { key: 'high_contrast', label: 'Alto Contraste', promptModifier: 'High contrast black and white with accent color, dramatic lighting, bold', preview: 'linear-gradient(135deg, hsl(0 0% 5%), hsl(0 100% 50%))', category: 'Cores', mockup: M({ bg: 'hsl(0 0% 4%)', textColor: 'hsl(0 100% 55%)', textSize: 'text-lg', fontWeight: 'font-black', textTransform: 'uppercase' }) },

  // Atmosphere
  { key: 'dark_moody', label: 'Dark Moody', promptModifier: 'Dark moody atmosphere, low key lighting, dramatic shadows, cinematic noir', preview: 'linear-gradient(135deg, hsl(220 30% 10%), hsl(240 20% 18%))', category: 'Atmosfera', mockup: M({ bg: 'linear-gradient(135deg, hsl(220 30% 8%), hsl(240 20% 14%))', textColor: 'hsl(0 0% 75%)', textSize: 'text-sm' }) },
  { key: 'cinematic_bars', label: 'Cinematic Bars', promptModifier: 'Cinematic letterbox bars, widescreen movie feel, dramatic lighting, film grain', preview: 'linear-gradient(180deg, hsl(0 0% 0%) 20%, hsl(220 20% 15%) 50%, hsl(0 0% 0%) 80%)', category: 'Atmosfera', mockup: M({ bg: 'hsl(220 15% 12%)', textSize: 'text-xs', extra: 'bars', letterSpacing: '0.15em', textTransform: 'uppercase' }) },
  { key: 'film_grain', label: 'Film Grain', promptModifier: 'Analog film grain texture, vintage camera feel, warm film tones, 35mm aesthetic', preview: 'linear-gradient(135deg, hsl(30 40% 30%), hsl(20 30% 25%))', category: 'Atmosfera', mockup: M({ bg: 'linear-gradient(135deg, hsl(30 35% 28%), hsl(20 25% 22%))', textColor: 'hsl(40 50% 80%)', textSize: 'text-sm' }) },
  { key: 'spotlight', label: 'Spotlight', promptModifier: 'Dramatic spotlight effect, dark background with focused light beam, theatrical', preview: 'radial-gradient(circle at 50% 40%, hsl(40 60% 50%), hsl(0 0% 5%))', category: 'Atmosfera', mockup: M({ bg: 'hsl(0 0% 4%)', extra: 'spotlight', textSize: 'text-base', fontWeight: 'font-black' }) },
  { key: 'golden_hour', label: 'Golden Hour', promptModifier: 'Golden hour warm lighting, sunset glow, warm amber tones, natural beauty', preview: 'linear-gradient(135deg, hsl(35 80% 50%), hsl(15 70% 40%))', category: 'Atmosfera', mockup: M({ bg: 'linear-gradient(135deg, hsl(35 75% 45%), hsl(15 65% 38%))', textSize: 'text-sm' }) },

  // Layout
  { key: 'split_text', label: 'Split Text/Image', promptModifier: 'Split layout half text half image, clean divide, modern design', preview: 'linear-gradient(90deg, hsl(0 0% 95%) 50%, hsl(220 30% 20%) 50%)', category: 'Layout', mockup: M({ bg: 'hsl(220 20% 15%)', extra: 'split', textAlign: 'left', textSize: 'text-sm' }) },
  { key: 'diagonal_split', label: 'Diagonal Split', promptModifier: 'Diagonal split composition, dynamic angle, two contrasting sections', preview: 'linear-gradient(135deg, hsl(200 60% 40%) 40%, hsl(350 60% 50%) 60%)', category: 'Layout', mockup: M({ bg: 'linear-gradient(135deg, hsl(200 55% 35%) 45%, hsl(350 55% 45%) 55%)', extra: 'diagonal', textSize: 'text-sm' }) },
  { key: 'horizontal_bars', label: 'Barras Horizontais', promptModifier: 'Horizontal stripe layout, modern geometric bars, clean sections', preview: 'repeating-linear-gradient(180deg, hsl(220 40% 20%) 0px, hsl(220 40% 20%) 15px, hsl(220 30% 30%) 15px, hsl(220 30% 30%) 30px)', category: 'Layout', mockup: M({ bg: 'hsl(220 30% 18%)', extra: 'bars', textSize: 'text-xs', textTransform: 'uppercase', letterSpacing: '0.1em' }) },
  { key: 'vertical_bars', label: 'Barras Verticais', promptModifier: 'Vertical column layout, side by side sections, modern grid', preview: 'repeating-linear-gradient(90deg, hsl(260 30% 25%) 0px, hsl(260 30% 25%) 15px, hsl(260 20% 35%) 15px, hsl(260 20% 35%) 30px)', category: 'Layout', mockup: M({ bg: 'hsl(260 25% 20%)', extra: 'grid', textSize: 'text-xs' }) },
  { key: 'frame_in_frame', label: 'Frame in Frame', promptModifier: 'Frame within frame composition, bordered photo, elegant border, layered depth', preview: 'radial-gradient(circle, hsl(220 20% 25%) 60%, hsl(0 0% 95%) 60%)', category: 'Layout', mockup: M({ bg: 'hsl(0 0% 94%)', textColor: '#1a1a2e', extra: 'frame', textSize: 'text-sm' }) },

  // Artistic
  { key: 'retro_vintage', label: 'Retro Vintage', promptModifier: 'Retro vintage design, 70s aesthetics, warm faded tones, nostalgic feel', preview: 'linear-gradient(135deg, hsl(30 50% 40%), hsl(40 40% 50%))', category: 'Artístico', mockup: M({ bg: 'linear-gradient(135deg, hsl(30 45% 38%), hsl(40 35% 48%))', textColor: 'hsl(40 60% 90%)', textSize: 'text-sm' }) },
  { key: 'futuristic', label: 'Futurista', promptModifier: 'Futuristic sci-fi design, holographic elements, metallic tones, tech aesthetic', preview: 'linear-gradient(135deg, hsl(200 80% 30%), hsl(260 60% 40%))', category: 'Artístico', mockup: M({ bg: 'linear-gradient(135deg, hsl(200 75% 25%), hsl(260 55% 35%))', textColor: 'hsl(180 80% 70%)', textSize: 'text-sm', fontWeight: 'font-medium', letterSpacing: '0.15em', textTransform: 'uppercase' }) },
  { key: 'geometric', label: 'Geométrico', promptModifier: 'Geometric shapes, abstract patterns, clean lines, mathematical composition', preview: 'conic-gradient(from 45deg, hsl(200 60% 40%), hsl(350 60% 50%), hsl(50 60% 50%), hsl(200 60% 40%))', category: 'Artístico', mockup: M({ bg: 'hsl(0 0% 10%)', textSize: 'text-sm', extra: 'grid' }) },
  { key: 'collage', label: 'Collage', promptModifier: 'Collage art style, cut and paste aesthetic, mixed media, layered elements', preview: 'linear-gradient(135deg, hsl(0 60% 50%) 25%, hsl(200 60% 50%) 25%, hsl(200 60% 50%) 50%, hsl(50 60% 50%) 50%, hsl(50 60% 50%) 75%, hsl(120 40% 40%) 75%)', category: 'Artístico', mockup: M({ bg: 'hsl(45 30% 90%)', textColor: '#1a1a1a', textAlign: 'left', textSize: 'text-sm', extra: 'grid' }) },
  { key: 'watercolor', label: 'Aquarela', promptModifier: 'Watercolor painting effect, soft brush strokes, artistic paint texture, flowing colors', preview: 'linear-gradient(135deg, hsl(200 60% 70%), hsl(330 50% 75%), hsl(50 60% 80%))', category: 'Artístico', mockup: M({ bg: 'linear-gradient(135deg, hsl(200 55% 75%), hsl(330 45% 78%), hsl(50 55% 82%))', textColor: '#2a2a3a', textSize: 'text-sm', fontWeight: 'font-medium' }) },

  // Content
  { key: 'data_driven', label: 'Data-Driven', promptModifier: 'Data visualization infographic, charts and numbers, clean data presentation', preview: 'linear-gradient(135deg, hsl(210 60% 15%), hsl(200 50% 25%))', category: 'Conteúdo', mockup: M({ bg: 'linear-gradient(135deg, hsl(210 55% 12%), hsl(200 45% 22%))', textSize: 'text-xs', textAlign: 'left', extra: 'grid' }) },
  { key: 'comparison', label: 'Comparação', promptModifier: 'Side by side comparison layout, before and after, versus design, split screen', preview: 'linear-gradient(90deg, hsl(0 60% 45%) 48%, hsl(0 0% 80%) 48%, hsl(0 0% 80%) 52%, hsl(140 50% 40%) 52%)', category: 'Conteúdo', mockup: M({ bg: 'hsl(0 0% 12%)', extra: 'split', textSize: 'text-sm' }) },
  { key: 'polaroid', label: 'Polaroid', promptModifier: 'Polaroid photo frame, instant camera feel, white border, casual snapshot', preview: 'linear-gradient(135deg, hsl(0 0% 97%), hsl(40 20% 90%))', category: 'Conteúdo', mockup: M({ bg: 'hsl(0 0% 95%)', textColor: '#333', extra: 'frame', textSize: 'text-xs', fontWeight: 'font-normal' }) },
  { key: 'mosaic_grid', label: 'Mosaico Grid', promptModifier: 'Mosaic grid layout, multiple small images, photo grid, gallery style', preview: 'repeating-conic-gradient(hsl(200 40% 30%) 0% 25%, hsl(350 40% 40%) 0% 50%) 0 0 / 30px 30px', category: 'Conteúdo', mockup: M({ bg: 'hsl(220 20% 12%)', extra: 'grid', textSize: 'text-xs' }) },
  { key: 'glitch_art', label: 'Glitch Art', promptModifier: 'Glitch art effect, digital distortion, RGB shift, broken pixels, cyberpunk', preview: 'linear-gradient(135deg, hsl(0 100% 50%) 0%, hsl(120 100% 50%) 33%, hsl(240 100% 50%) 66%, hsl(0 0% 10%) 100%)', category: 'Conteúdo', mockup: M({ bg: 'hsl(0 0% 5%)', textColor: 'hsl(120 100% 60%)', textSize: 'text-sm', fontWeight: 'font-black', letterSpacing: '0.05em' }) },
];

const CATEGORIES = [...new Set(LAYOUT_OPTIONS.map(l => l.category))];

// --- Live Preview Mockup ---
function LayoutMockup({ layout, title, hook }: { layout: LayoutOption; title: string; hook?: string }) {
  const s = layout.mockup;
  const displayTitle = title || 'Título do Post';
  const displayHook = hook || 'Seu hook aparece aqui';

  return (
    <div
      className="aspect-square w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ background: s.bg }}
    >
      {/* Extra elements */}
      {s.extra === 'bars' && (
        <>
          <div className="h-[14%] bg-black/90 w-full" />
          <div className="flex-1" />
          <div className="h-[14%] bg-black/90 w-full" />
        </>
      )}
      {s.extra === 'frame' && (
        <div className="absolute inset-3 border-2 border-white/30 rounded-lg pointer-events-none" />
      )}
      {s.extra === 'spotlight' && (
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 40%, hsla(40,60%,50%,0.25) 0%, transparent 60%)' }} />
      )}
      {s.extra === 'split' && (
        <div className="absolute top-0 left-0 w-1/2 h-full bg-white/10" />
      )}
      {s.extra === 'diagonal' && (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, transparent 45%, rgba(255,255,255,0.08) 45%)' }} />
      )}
      {s.extra === 'grid' && (
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)', backgroundSize: '25% 25%' }} />
      )}
      {s.extra === 'quote' && (
        <div className="absolute top-3 left-4 text-4xl opacity-20" style={{ color: s.textColor }}>"</div>
      )}

      {/* Text content */}
      <div
        className={`absolute inset-0 flex flex-col ${
          s.justify === 'start' ? 'justify-start' : s.justify === 'end' ? 'justify-end' : 'justify-center'
        } ${s.padding || 'p-5'}`}
        style={{ textAlign: s.textAlign }}
      >
        <p
          className={`${s.textSize} ${s.fontWeight} leading-tight`}
          style={{
            color: s.textColor,
            letterSpacing: s.letterSpacing || 'normal',
            textTransform: s.textTransform || 'none',
          }}
        >
          {displayTitle}
        </p>
        <p
          className="text-[10px] mt-1.5 opacity-60 leading-snug"
          style={{ color: s.textColor, textAlign: s.textAlign }}
        >
          {displayHook}
        </p>
      </div>
    </div>
  );
}

// --- Main Component ---
interface LayoutPickerProps {
  selected: string | null;
  onSelect: (layout: LayoutOption | null) => void;
  selectedReference?: ReferenceItem | null;
  onSelectReference?: (ref: ReferenceItem | null) => void;
  compact?: boolean;
  previewTitle?: string;
  previewHook?: string;
}

export function LayoutPicker({ selected, onSelect, selectedReference, onSelectReference, compact, previewTitle, previewHook }: LayoutPickerProps) {
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);

  useEffect(() => {
    const fetchRefs = async () => {
      setLoadingRefs(true);
      const { data } = await supabase
        .from('instagram_references' as any)
        .select('id, thumbnail_url, media_type, tags, note, caption')
        .order('created_at', { ascending: false })
        .limit(20);
      setReferences((data || []) as unknown as ReferenceItem[]);
      setLoadingRefs(false);
    };
    fetchRefs();
  }, []);

  const selectedLayout = LAYOUT_OPTIONS.find(l => l.key === selected);

  return (
    <div className="space-y-3">
      {/* Live Preview */}
      {selectedLayout && (
        <Card className="border border-primary/20 bg-muted/20 p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-primary" />
            <p className="text-[10px] font-medium text-primary">Preview — {selectedLayout.label}</p>
          </div>
          <div className="max-w-[220px] mx-auto">
            <LayoutMockup
              layout={selectedLayout}
              title={previewTitle || ''}
              hook={previewHook}
            />
          </div>
        </Card>
      )}

      {/* References Section */}
      {references.length > 0 && onSelectReference && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Suas Referências
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {references.map(ref => (
              <button
                key={ref.id}
                onClick={() => onSelectReference(selectedReference?.id === ref.id ? null : ref)}
                className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedReference?.id === ref.id
                    ? 'border-primary ring-2 ring-primary/30 scale-105'
                    : 'border-border/30 hover:border-primary/40'
                }`}
              >
                {ref.thumbnail_url ? (
                  <img src={ref.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted/50 flex items-center justify-center text-[10px] text-muted-foreground">
                    {ref.media_type === 'VIDEO' ? '🎬' : '📷'}
                  </div>
                )}
              </button>
            ))}
          </div>
          {selectedReference && (
            <p className="text-[9px] text-primary/80 truncate">
              Referência: {selectedReference.note || selectedReference.caption?.substring(0, 60) || 'Sem descrição'}
            </p>
          )}
        </div>
      )}

      {/* Layouts Grid */}
      <div className="space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Layout Visual ({LAYOUT_OPTIONS.length} opções)
        </p>
        <ScrollArea className={compact ? 'max-h-[200px]' : 'max-h-[300px]'}>
          <div className="space-y-3">
            {CATEGORIES.map(cat => (
              <div key={cat}>
                <p className="text-[9px] font-medium text-muted-foreground/70 uppercase tracking-wider mb-1.5">{cat}</p>
                <div className={`grid ${compact ? 'grid-cols-4' : 'grid-cols-5 sm:grid-cols-6'} gap-1.5`}>
                  {LAYOUT_OPTIONS.filter(l => l.category === cat).map(layout => (
                    <button
                      key={layout.key}
                      onClick={() => onSelect(selected === layout.key ? null : layout)}
                      className={`group relative rounded-lg overflow-hidden border transition-all ${
                        selected === layout.key
                          ? 'border-primary ring-2 ring-primary/30 scale-[1.03]'
                          : 'border-border/30 hover:border-primary/40 hover:scale-[1.02]'
                      }`}
                    >
                      <div
                        className="aspect-square w-full"
                        style={{ background: layout.preview }}
                      />
                      {selected === layout.key && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <p className="text-[8px] text-center py-1 px-0.5 text-foreground/80 leading-tight truncate">
                        {layout.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export { LAYOUT_OPTIONS };
