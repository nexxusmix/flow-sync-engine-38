import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { InstagramCampaign, useInstagramAI, useMoodBoardItems, useMoodBoardMutations } from '@/hooks/useInstagramEngine';
import { Palette, Plus, Sparkles, Loader2, Image, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { sc } from '@/lib/colors';

interface Props {
  campaign: InstagramCampaign;
}

export function CampaignMoodBoard({ campaign }: Props) {
  const ai = useInstagramAI();
  const { data: items = [], isLoading } = useMoodBoardItems(campaign.id);
  const { create, remove } = useMoodBoardMutations(campaign.id);
  const [uploading, setUploading] = useState(false);
  const [aiPalette, setAiPalette] = useState<any>(null);
  const [noteText, setNoteText] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `moodboards/${campaign.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('marketing-assets').upload(path, file);
      if (error) { toast.error('Erro no upload'); continue; }
      const { data: urlData } = supabase.storage.from('marketing-assets').getPublicUrl(path);
      create.mutate({ type: 'image', url: urlData.publicUrl, label: file.name, position: items.length });
    }
    setUploading(false);
    toast.success('Referências adicionadas!');
  };

  const addColor = (color: string, label?: string) => {
    create.mutate({ type: 'color', color, label: label || color, position: items.length });
  };

  const addNote = () => {
    if (!noteText.trim()) return;
    create.mutate({ type: 'note', note: noteText, position: items.length });
    setNoteText('');
  };

  const handleAIPalette = async () => {
    try {
      const result = await ai.mutateAsync({
        action: 'generate_from_context',
        data: {
          command: `Para a campanha "${campaign.name}" (objetivo: ${campaign.objective || 'geral'}, público: ${campaign.target_audience || 'geral'}), gere uma direção visual completa.

Retorne JSON com:
- palette: array de 6 cores hex (primária, secundária, accent, neutro claro, neutro escuro, destaque)
- palette_names: array com nome de cada cor (ex: "Azul Confiança")
- mood_keywords: array de 5-7 palavras-chave visuais (ex: "minimalista", "premium", "luz natural")
- typography_suggestion: objeto {display: "nome da fonte display", body: "nome da fonte body", style: "descrição do estilo"}
- visual_references: array de 3-5 descrições de referências visuais detalhadas
- do_list: array de 4 coisas para fazer no visual
- dont_list: array de 4 coisas para evitar`,
          format: 'moodboard',
        },
      });
      setAiPalette(result);
      if (Array.isArray(result?.palette)) {
        result.palette.forEach((c: string, i: number) => {
          addColor(c, result.palette_names?.[i]);
        });
      }
      toast.success('Direção visual gerada!');
    } catch { /* handled */ }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary/40" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Mood Board & Direção Visual</h3>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="gap-1.5 text-xs h-8" onClick={handleAIPalette} disabled={ai.isPending}>
            {ai.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Gerar Direção Visual
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <label className="flex-1">
          <div className="flex items-center gap-2 p-3 bg-card/50 border border-dashed border-border/40 rounded-lg cursor-pointer hover:border-primary/30 transition-colors text-center">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (
              <>
                <Image className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Adicionar referências visuais</span>
              </>
            )}
          </div>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
        </label>
        <div className="flex-1 flex gap-1.5">
          <Input
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Nota rápida..."
            className="text-xs h-auto"
            onKeyDown={e => e.key === 'Enter' && addNote()}
          />
          <Button size="icon" variant="outline" className="h-full w-9 shrink-0" onClick={addNote}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {items.map(item => (
            <div key={item.id} className="relative group">
              {item.type === 'image' && (
                <div className="aspect-square rounded-lg overflow-hidden bg-muted/20">
                  <img src={item.url!} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              {item.type === 'color' && (
                <div className="aspect-square rounded-lg flex flex-col items-center justify-center gap-1" style={{ backgroundColor: item.color! }}>
                  <span className="text-[8px] font-mono text-white mix-blend-difference">{item.color}</span>
                  {item.label && item.label !== item.color && (
                    <span className="text-[7px] text-white mix-blend-difference">{item.label}</span>
                  )}
                </div>
              )}
              {item.type === 'note' && (
                <div className="aspect-square rounded-lg bg-card/80 border border-border/30 p-2 flex items-center justify-center">
                  <p className="text-[9px] text-foreground text-center line-clamp-4">{item.note}</p>
                </div>
              )}
              <button
                onClick={() => remove.mutate(item.id)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-full p-0.5"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      {aiPalette && (
        <div className="space-y-4">
          {Array.isArray(aiPalette.palette) && (
            <Card className="p-4 bg-card/50 border-border/30">
              <h4 className="text-xs font-semibold text-foreground mb-3">🎨 Paleta Gerada</h4>
              <div className="flex gap-1.5">
                {aiPalette.palette.map((c: string, i: number) => (
                  <div key={i} className="flex-1 text-center">
                    <div className="h-12 rounded-lg mb-1" style={{ backgroundColor: c }} />
                    <span className="text-[8px] font-mono text-muted-foreground">{c}</span>
                    {aiPalette.palette_names?.[i] && (
                      <div className="text-[7px] text-muted-foreground">{aiPalette.palette_names[i]}</div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {Array.isArray(aiPalette.mood_keywords) && (
              <Card className="p-4 bg-card/50 border-border/30">
                <h4 className="text-xs font-semibold text-foreground mb-2">✨ Keywords Visuais</h4>
                <div className="flex flex-wrap gap-1.5">
                  {aiPalette.mood_keywords.map((kw: string) => (
                    <Badge key={kw} variant="outline" className="text-[9px]">{kw}</Badge>
                  ))}
                </div>
              </Card>
            )}
            {aiPalette.typography_suggestion && (
              <Card className="p-4 bg-card/50 border-border/30">
                <h4 className="text-xs font-semibold text-foreground mb-2">🔤 Tipografia</h4>
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground">Display: <span className="text-foreground font-medium">{aiPalette.typography_suggestion.display}</span></div>
                  <div className="text-[10px] text-muted-foreground">Body: <span className="text-foreground font-medium">{aiPalette.typography_suggestion.body}</span></div>
                  {aiPalette.typography_suggestion.style && (
                    <div className="text-[10px] text-muted-foreground mt-1">{aiPalette.typography_suggestion.style}</div>
                  )}
                </div>
              </Card>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {Array.isArray(aiPalette.do_list) && (
              <Card className="p-4 bg-card/50 border-border/30">
                <h4 className={`text-xs font-semibold mb-2 ${sc.status('success').text}`}>✅ Fazer</h4>
                <div className="space-y-1">
                  {aiPalette.do_list.map((d: string, i: number) => (
                    <div key={i} className="text-[10px] text-muted-foreground">• {d}</div>
                  ))}
                </div>
              </Card>
            )}
            {Array.isArray(aiPalette.dont_list) && (
              <Card className="p-4 bg-card/50 border-border/30">
                <h4 className={`text-xs font-semibold mb-2 ${sc.status('error').text}`}>🚫 Evitar</h4>
                <div className="space-y-1">
                  {aiPalette.dont_list.map((d: string, i: number) => (
                    <div key={i} className="text-[10px] text-muted-foreground">• {d}</div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {Array.isArray(aiPalette.visual_references) && (
            <Card className="p-4 bg-card/50 border-border/30">
              <h4 className="text-xs font-semibold text-foreground mb-2">🖼️ Referências Visuais Sugeridas</h4>
              <div className="space-y-2">
                {aiPalette.visual_references.map((ref: string, i: number) => (
                  <div key={i} className="text-[10px] text-muted-foreground p-2 bg-background/40 rounded">
                    {i + 1}. {ref}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {items.length === 0 && !aiPalette && (
        <Card className="p-8 bg-card/30 border-border/20 text-center">
          <Palette className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Adicione imagens de referência ou gere uma direção visual com IA</p>
        </Card>
      )}
    </div>
  );
}
