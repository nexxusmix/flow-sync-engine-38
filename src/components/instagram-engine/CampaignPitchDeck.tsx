import { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InstagramCampaign, InstagramPost, PILLARS, FORMATS, POST_STATUSES } from '@/hooks/useInstagramEngine';
import { Presentation, ChevronLeft, ChevronRight, X, Maximize2, Target, Users, Calendar, BarChart3, TrendingUp, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

type Slide = {
  type: 'cover' | 'overview' | 'pillars' | 'formats' | 'top_posts' | 'learnings';
  title: string;
};

const SLIDES: Slide[] = [
  { type: 'cover', title: 'Capa' },
  { type: 'overview', title: 'Visão Geral' },
  { type: 'pillars', title: 'Pilares' },
  { type: 'formats', title: 'Formatos' },
  { type: 'top_posts', title: 'Top Posts' },
  { type: 'learnings', title: 'Aprendizados' },
];

export function CampaignPitchDeck({ campaign, posts }: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const published = posts.filter(p => p.status === 'published').length;
  const pillars: Record<string, number> = {};
  const formats: Record<string, number> = {};
  posts.forEach(p => {
    if (p.pillar) pillars[p.pillar] = (pillars[p.pillar] || 0) + 1;
    if (p.format) formats[p.format] = (formats[p.format] || 0) + 1;
  });
  const completionRate = posts.length ? ((published / posts.length) * 100).toFixed(0) : '0';
  const topPosts = posts.filter(p => p.hook && p.caption_short).slice(0, 3);

  const next = () => setCurrentSlide(s => Math.min(s + 1, SLIDES.length - 1));
  const prev = () => setCurrentSlide(s => Math.max(s - 1, 0));

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') next();
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'Escape') setIsFullscreen(false);
  }, []);

  useEffect(() => {
    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFullscreen, handleKeyDown]);

  const renderSlide = (slide: Slide) => {
    switch (slide.type) {
      case 'cover':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground text-center">{campaign.name}</h1>
            {campaign.objective && <p className="text-lg text-muted-foreground text-center max-w-md">{campaign.objective}</p>}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {campaign.start_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(campaign.start_date), "dd MMM", { locale: ptBR })} — {campaign.end_date ? format(new Date(campaign.end_date), "dd MMM yyyy", { locale: ptBR }) : '...'}
                </span>
              )}
              {campaign.target_audience && (
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {campaign.target_audience}</span>
              )}
            </div>
          </div>
        );

      case 'overview':
        return (
          <div className="flex flex-col h-full p-8">
            <h2 className="text-2xl font-bold text-foreground mb-8">📊 Visão Geral</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1 items-center">
              <Card className="p-6 bg-card/50 border-border/30 text-center">
                <div className="text-4xl font-bold text-primary">{posts.length}</div>
                <div className="text-sm text-muted-foreground mt-1">Total Posts</div>
              </Card>
              <Card className="p-6 bg-card/50 border-border/30 text-center">
                <div className="text-4xl font-bold text-primary">{published}</div>
                <div className="text-sm text-muted-foreground mt-1">Publicados</div>
              </Card>
              <Card className="p-6 bg-card/50 border-border/30 text-center">
                <div className="text-4xl font-bold text-foreground">{completionRate}%</div>
                <div className="text-sm text-muted-foreground mt-1">Conclusão</div>
              </Card>
              <Card className="p-6 bg-card/50 border-border/30 text-center">
                <div className="text-4xl font-bold text-primary/70">{Object.keys(pillars).length}</div>
                <div className="text-sm text-muted-foreground mt-1">Pilares</div>
              </Card>
            </div>
          </div>
        );

      case 'pillars':
        return (
          <div className="flex flex-col h-full p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">🎯 Distribuição por Pilar</h2>
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              {PILLARS.map(p => {
                const count = pillars[p.key] || 0;
                const pct = posts.length ? (count / posts.length) * 100 : 0;
                return (
                  <div key={p.key} className="flex items-center gap-4">
                    <span className="text-sm font-medium text-foreground w-28">{p.label}</span>
                    <div className="flex-1 h-6 bg-muted/20 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                    </div>
                    <span className="text-sm font-bold text-foreground w-16 text-right">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'formats':
        return (
          <div className="flex flex-col h-full p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">📱 Formatos Utilizados</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1 items-center">
              {FORMATS.map(f => {
                const count = formats[f.key] || 0;
                return (
                  <Card key={f.key} className="p-6 bg-card/50 border-border/30 text-center">
                    <div className="text-3xl font-bold text-primary">{count}</div>
                    <div className="text-sm text-muted-foreground mt-1">{f.label}</div>
                    {posts.length > 0 && (
                      <div className="text-[10px] text-muted-foreground/60">{((count / posts.length) * 100).toFixed(0)}%</div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 'top_posts':
        return (
          <div className="flex flex-col h-full p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">⭐ Top Posts</h2>
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              {topPosts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">Nenhum post com conteúdo completo</p>
              ) : (
                topPosts.map((p, i) => (
                  <Card key={p.id} className="p-4 bg-card/50 border-border/30">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <Star className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{p.title}</h4>
                        {p.hook && <p className="text-xs text-primary mt-0.5">🎯 {p.hook}</p>}
                        {p.caption_short && <p className="text-xs text-muted-foreground mt-1">{p.caption_short}</p>}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        );

      case 'learnings':
        return (
          <div className="flex flex-col h-full p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">💡 Aprendizados</h2>
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              <Card className="p-4 bg-card/50 border-border/30">
                <h4 className="text-sm font-semibold text-primary mb-2">✅ O que funcionou</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {Object.entries(pillars).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, v]) => (
                    <li key={k}>• Pilar "{PILLARS.find(p => p.key === k)?.label || k}" com {v} posts</li>
                  ))}
                  {Object.entries(formats).sort((a, b) => b[1] - a[1]).slice(0, 1).map(([k, v]) => (
                    <li key={k}>• Formato "{FORMATS.find(f => f.key === k)?.label || k}" mais utilizado ({v}x)</li>
                  ))}
                </ul>
              </Card>
              <Card className="p-4 bg-card/50 border-border/30">
                <h4 className="text-sm font-semibold text-amber-400 mb-2">⚠️ Oportunidades</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {PILLARS.filter(p => !pillars[p.key]).slice(0, 2).map(p => (
                    <li key={p.key}>• Pilar "{p.label}" não utilizado — considerar na próxima campanha</li>
                  ))}
                  {FORMATS.filter(f => !formats[f.key]).slice(0, 2).map(f => (
                    <li key={f.key}>• Formato "{f.label}" não explorado</li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        );
    }
  };

  const slideContent = (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'rounded-xl overflow-hidden'}`}>
      {/* Slide */}
      <div className={`${isFullscreen ? 'h-screen' : 'aspect-video'} bg-background flex flex-col`}>
        {renderSlide(SLIDES[currentSlide])}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border/30">
        <Button size="icon" variant="ghost" className="w-7 h-7" onClick={prev} disabled={currentSlide === 0}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-xs text-muted-foreground min-w-[40px] text-center">
          {currentSlide + 1} / {SLIDES.length}
        </span>
        <Button size="icon" variant="ghost" className="w-7 h-7" onClick={next} disabled={currentSlide === SLIDES.length - 1}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        {isFullscreen && (
          <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => setIsFullscreen(false)}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${i === currentSlide ? 'bg-primary' : 'bg-muted/40'}`}
            onClick={() => setCurrentSlide(i)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Presentation className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Pitch Deck — Modo Apresentação</h3>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8" onClick={() => { setIsFullscreen(true); setCurrentSlide(0); }}>
          <Maximize2 className="w-3.5 h-3.5" /> Tela Cheia
        </Button>
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {SLIDES.map((s, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`shrink-0 px-3 py-1.5 rounded-md text-[10px] font-medium transition-colors ${
              i === currentSlide ? 'bg-primary text-primary-foreground' : 'bg-muted/20 text-muted-foreground hover:bg-muted/40'
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      {slideContent}
    </div>
  );
}
