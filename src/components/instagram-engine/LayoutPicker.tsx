import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Check, Sparkles } from 'lucide-react';

export interface LayoutOption {
  key: string;
  label: string;
  promptModifier: string;
  preview: string; // CSS gradient or emoji representation
  category: string;
}

export interface ReferenceItem {
  id: string;
  thumbnail_url: string | null;
  media_type: string | null;
  tags: string[] | null;
  note: string | null;
  caption: string | null;
}

const LAYOUT_OPTIONS: LayoutOption[] = [
  // Typography & Text
  { key: 'bold_central', label: 'Bold Central', promptModifier: 'Bold large centered text, minimal background, strong typography, Instagram post', preview: 'linear-gradient(135deg, hsl(0 0% 10%), hsl(0 0% 20%))', category: 'Tipografia' },
  { key: 'minimalist_type', label: 'Minimalista', promptModifier: 'Minimalist clean design, lots of white space, thin elegant typography, subtle tones', preview: 'linear-gradient(135deg, hsl(0 0% 95%), hsl(0 0% 85%))', category: 'Tipografia' },
  { key: 'editorial', label: 'Editorial', promptModifier: 'Magazine editorial layout, sophisticated typography, serif fonts, elegant composition', preview: 'linear-gradient(135deg, hsl(40 30% 90%), hsl(20 20% 80%))', category: 'Tipografia' },
  { key: 'quote_card', label: 'Quote Card', promptModifier: 'Inspirational quote card, centered text with decorative quotation marks, clean background', preview: 'linear-gradient(135deg, hsl(220 40% 20%), hsl(260 30% 30%))', category: 'Tipografia' },
  { key: 'magazine', label: 'Magazine', promptModifier: 'Fashion magazine cover style, bold headlines, layered text, sophisticated layout', preview: 'linear-gradient(135deg, hsl(350 60% 40%), hsl(330 40% 30%))', category: 'Tipografia' },
  
  // Color & Gradient
  { key: 'gradient_overlay', label: 'Gradient Overlay', promptModifier: 'Vibrant gradient overlay on photo, colorful gradient mesh, modern social media', preview: 'linear-gradient(135deg, hsl(280 80% 50%), hsl(200 80% 50%))', category: 'Cores' },
  { key: 'duotone', label: 'Duotone', promptModifier: 'Duotone effect, two-color treatment, high contrast, artistic color grading', preview: 'linear-gradient(135deg, hsl(200 80% 40%), hsl(330 60% 50%))', category: 'Cores' },
  { key: 'neon_glow', label: 'Neon Glow', promptModifier: 'Neon glow effect, dark background with neon lights, cyberpunk aesthetic, glowing text', preview: 'linear-gradient(135deg, hsl(280 100% 20%), hsl(180 100% 40%))', category: 'Cores' },
  { key: 'pastel_soft', label: 'Pastel Soft', promptModifier: 'Soft pastel colors, dreamy aesthetic, light and airy, gentle tones', preview: 'linear-gradient(135deg, hsl(320 60% 85%), hsl(200 60% 85%))', category: 'Cores' },
  { key: 'high_contrast', label: 'Alto Contraste', promptModifier: 'High contrast black and white with accent color, dramatic lighting, bold', preview: 'linear-gradient(135deg, hsl(0 0% 5%), hsl(0 100% 50%))', category: 'Cores' },

  // Mood & Atmosphere
  { key: 'dark_moody', label: 'Dark Moody', promptModifier: 'Dark moody atmosphere, low key lighting, dramatic shadows, cinematic noir', preview: 'linear-gradient(135deg, hsl(220 30% 10%), hsl(240 20% 18%))', category: 'Atmosfera' },
  { key: 'cinematic_bars', label: 'Cinematic Bars', promptModifier: 'Cinematic letterbox bars, widescreen movie feel, dramatic lighting, film grain', preview: 'linear-gradient(180deg, hsl(0 0% 0%) 20%, hsl(220 20% 15%) 50%, hsl(0 0% 0%) 80%)', category: 'Atmosfera' },
  { key: 'film_grain', label: 'Film Grain', promptModifier: 'Analog film grain texture, vintage camera feel, warm film tones, 35mm aesthetic', preview: 'linear-gradient(135deg, hsl(30 40% 30%), hsl(20 30% 25%))', category: 'Atmosfera' },
  { key: 'spotlight', label: 'Spotlight', promptModifier: 'Dramatic spotlight effect, dark background with focused light beam, theatrical', preview: 'radial-gradient(circle at 50% 40%, hsl(40 60% 50%), hsl(0 0% 5%))', category: 'Atmosfera' },
  { key: 'golden_hour', label: 'Golden Hour', promptModifier: 'Golden hour warm lighting, sunset glow, warm amber tones, natural beauty', preview: 'linear-gradient(135deg, hsl(35 80% 50%), hsl(15 70% 40%))', category: 'Atmosfera' },

  // Layout & Composition
  { key: 'split_text', label: 'Split Text/Image', promptModifier: 'Split layout half text half image, clean divide, modern design', preview: 'linear-gradient(90deg, hsl(0 0% 95%) 50%, hsl(220 30% 20%) 50%)', category: 'Layout' },
  { key: 'diagonal_split', label: 'Diagonal Split', promptModifier: 'Diagonal split composition, dynamic angle, two contrasting sections', preview: 'linear-gradient(135deg, hsl(200 60% 40%) 40%, hsl(350 60% 50%) 60%)', category: 'Layout' },
  { key: 'horizontal_bars', label: 'Barras Horizontais', promptModifier: 'Horizontal stripe layout, modern geometric bars, clean sections', preview: 'repeating-linear-gradient(180deg, hsl(220 40% 20%) 0px, hsl(220 40% 20%) 15px, hsl(220 30% 30%) 15px, hsl(220 30% 30%) 30px)', category: 'Layout' },
  { key: 'vertical_bars', label: 'Barras Verticais', promptModifier: 'Vertical column layout, side by side sections, modern grid', preview: 'repeating-linear-gradient(90deg, hsl(260 30% 25%) 0px, hsl(260 30% 25%) 15px, hsl(260 20% 35%) 15px, hsl(260 20% 35%) 30px)', category: 'Layout' },
  { key: 'frame_in_frame', label: 'Frame in Frame', promptModifier: 'Frame within frame composition, bordered photo, elegant border, layered depth', preview: 'radial-gradient(circle, hsl(220 20% 25%) 60%, hsl(0 0% 95%) 60%)', category: 'Layout' },

  // Artistic Styles
  { key: 'retro_vintage', label: 'Retro Vintage', promptModifier: 'Retro vintage design, 70s aesthetics, warm faded tones, nostalgic feel', preview: 'linear-gradient(135deg, hsl(30 50% 40%), hsl(40 40% 50%))', category: 'Artístico' },
  { key: 'futuristic', label: 'Futurista', promptModifier: 'Futuristic sci-fi design, holographic elements, metallic tones, tech aesthetic', preview: 'linear-gradient(135deg, hsl(200 80% 30%), hsl(260 60% 40%))', category: 'Artístico' },
  { key: 'geometric', label: 'Geométrico', promptModifier: 'Geometric shapes, abstract patterns, clean lines, mathematical composition', preview: 'conic-gradient(from 45deg, hsl(200 60% 40%), hsl(350 60% 50%), hsl(50 60% 50%), hsl(200 60% 40%))', category: 'Artístico' },
  { key: 'collage', label: 'Collage', promptModifier: 'Collage art style, cut and paste aesthetic, mixed media, layered elements', preview: 'linear-gradient(135deg, hsl(0 60% 50%) 25%, hsl(200 60% 50%) 25%, hsl(200 60% 50%) 50%, hsl(50 60% 50%) 50%, hsl(50 60% 50%) 75%, hsl(120 40% 40%) 75%)', category: 'Artístico' },
  { key: 'watercolor', label: 'Aquarela', promptModifier: 'Watercolor painting effect, soft brush strokes, artistic paint texture, flowing colors', preview: 'linear-gradient(135deg, hsl(200 60% 70%), hsl(330 50% 75%), hsl(50 60% 80%))', category: 'Artístico' },
  
  // Data & Content
  { key: 'data_driven', label: 'Data-Driven', promptModifier: 'Data visualization infographic, charts and numbers, clean data presentation', preview: 'linear-gradient(135deg, hsl(210 60% 15%), hsl(200 50% 25%))', category: 'Conteúdo' },
  { key: 'comparison', label: 'Comparação', promptModifier: 'Side by side comparison layout, before and after, versus design, split screen', preview: 'linear-gradient(90deg, hsl(0 60% 45%) 48%, hsl(0 0% 80%) 48%, hsl(0 0% 80%) 52%, hsl(140 50% 40%) 52%)', category: 'Conteúdo' },
  { key: 'polaroid', label: 'Polaroid', promptModifier: 'Polaroid photo frame, instant camera feel, white border, casual snapshot', preview: 'linear-gradient(135deg, hsl(0 0% 97%), hsl(40 20% 90%))', category: 'Conteúdo' },
  { key: 'mosaic_grid', label: 'Mosaico Grid', promptModifier: 'Mosaic grid layout, multiple small images, photo grid, gallery style', preview: 'repeating-conic-gradient(hsl(200 40% 30%) 0% 25%, hsl(350 40% 40%) 0% 50%) 0 0 / 30px 30px', category: 'Conteúdo' },
  { key: 'glitch_art', label: 'Glitch Art', promptModifier: 'Glitch art effect, digital distortion, RGB shift, broken pixels, cyberpunk', preview: 'linear-gradient(135deg, hsl(0 100% 50%) 0%, hsl(120 100% 50%) 33%, hsl(240 100% 50%) 66%, hsl(0 0% 10%) 100%)', category: 'Conteúdo' },
];

const CATEGORIES = [...new Set(LAYOUT_OPTIONS.map(l => l.category))];

interface LayoutPickerProps {
  selected: string | null;
  onSelect: (layout: LayoutOption | null) => void;
  selectedReference?: ReferenceItem | null;
  onSelectReference?: (ref: ReferenceItem | null) => void;
  compact?: boolean;
}

export function LayoutPicker({ selected, onSelect, selectedReference, onSelectReference, compact }: LayoutPickerProps) {
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
              Referência selecionada: {selectedReference.note || selectedReference.caption?.substring(0, 60) || 'Sem descrição'}
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

      {selectedLayout && (
        <Badge variant="secondary" className="text-[9px]">
          ✨ {selectedLayout.label}
        </Badge>
      )}
    </div>
  );
}

export { LAYOUT_OPTIONS };
