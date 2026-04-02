import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Link, FileText, Terminal, X, Film, Plus, Check } from 'lucide-react';
import { DropZone } from '@/components/ui/DropZone';
import { CockpitTab } from '@/components/instagram-engine/CockpitTab';
import { CalendarTab } from '@/components/instagram-engine/CalendarTab';
import { ScriptsTab } from '@/components/instagram-engine/ScriptsTab';
import { CreateWithAITab } from '@/components/instagram-engine/CreateWithAITab';
import { InsightsAnalyzerTab } from '@/components/instagram-engine/InsightsAnalyzerTab';
import { CampaignsTab } from '@/components/instagram-engine/CampaignsTab';
import { ProjectionsTab } from '@/components/instagram-engine/ProjectionsTab';
import { ProfileHealthTab } from '@/components/instagram-engine/ProfileHealthTab';
import { SnapshotsTab } from '@/components/instagram-engine/SnapshotsTab';
import { LibraryTab } from '@/components/instagram-engine/LibraryTab';
import { PostResultView } from '@/components/instagram-engine/PostResultView';
import { useInstagramAI, useCreatePost, useProfileConfig, useSaveProfileConfig, useSaveHooks, InstagramPost } from '@/hooks/useInstagramEngine';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { LayoutPicker, LAYOUT_OPTIONS, type ReferenceItem } from '@/components/instagram-engine/LayoutPicker';

const TABS = [
  { key: 'cockpit', label: 'Cockpit', icon: 'rocket_launch' },
  { key: 'library', label: 'Library', icon: 'folder_open' },
  { key: 'insights', label: 'Insights IA', icon: 'analytics' },
  { key: 'calendar', label: 'Calendário', icon: 'calendar_month' },
  { key: 'scripts', label: 'Roteiros', icon: 'description' },
  { key: 'create', label: 'Criar com IA', icon: 'auto_awesome' },
  { key: 'campaigns', label: 'Campanhas', icon: 'campaign' },
  { key: 'snapshots', label: 'Histórico', icon: 'timeline' },
  { key: 'projections', label: 'Projeções', icon: 'trending_up' },
  { key: 'health', label: 'Saúde', icon: 'monitoring' },
];

const POST_TYPES = [
  { key: 'single', label: 'Post Único', icon: '🖼️', desc: 'Imagem ou vídeo avulso' },
  { key: 'carousel', label: 'Carrossel', icon: '📑', desc: 'Slides deslizáveis (até 10)' },
  { key: 'reel', label: 'Reel', icon: '🎬', desc: 'Vídeo curto vertical' },
  { key: 'story', label: 'Story Único', icon: '⭕', desc: '1 story avulso' },
  { key: 'story_sequence', label: 'Sequência Stories', icon: '📺', desc: '3-7 stories com arco narrativo' },
  { key: 'full_package', label: 'Pacote Completo', icon: '🚀', desc: 'Feed + Stories + Carrossel — tudo de uma vez' },
];

const ASPECT_RATIOS = [
  { key: '1:1', label: '1:1', desc: 'Feed quadrado' },
  { key: '4:5', label: '4:5', desc: 'Feed vertical (recomendado)' },
  { key: '9:16', label: '9:16', desc: 'Stories / Reels' },
  { key: '16:9', label: '16:9', desc: 'Widescreen / YouTube' },
  { key: 'auto', label: 'Auto', desc: 'IA escolhe o melhor' },
];

const TREND_STYLES_QUICK = [
  { key: 'cinematic_reel', label: '🎬 Cinematográfico' },
  { key: 'documentary', label: '🎙️ Documental' },
  { key: 'collage_art', label: '🎨 Collage' },
  { key: 'series_episode', label: '📺 Séries' },
  { key: 'brand_manifesto', label: '✊ Manifesto' },
  { key: 'mood_grid', label: '🖤 Mood' },
  { key: 'auto', label: '✨ IA Decide' },
];

const PILLARS_QUICK = [
  { key: 'autoridade', label: 'Autoridade' },
  { key: 'luxury', label: 'Luxury' },
  { key: 'bastidores', label: 'Bastidores' },
  { key: 'educacao', label: 'Educação' },
  { key: 'venda', label: 'Venda' },
  { key: 'portfolio', label: 'Portfólio' },
];

export default function InstagramEnginePage() {
  const [activeTab, setActiveTab] = useState('cockpit');
  const [viewingPost, setViewingPost] = useState<InstagramPost | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [setupForm, setSetupForm] = useState({
    handle: '',
    niche: '',
    sub_niche: '',
    target_audience: '',
    brand_voice: '',
    command: '',
    reference_url: '',
  });
  const [setupFiles, setSetupFiles] = useState<File[]>([]);

  // Generate Post dialog state
  const [showGenPost, setShowGenPost] = useState(false);
  const [genPostType, setGenPostType] = useState('reel');
  const [genAspectRatio, setGenAspectRatio] = useState('auto');
  const [genTrend, setGenTrend] = useState('auto');
  const [genPillar, setGenPillar] = useState('autoridade');
  const [genTopic, setGenTopic] = useState('');
  const [genInstruction, setGenInstruction] = useState('');
  const [genLayout, setGenLayout] = useState<string | null>(null);
  const [genReference, setGenReference] = useState<ReferenceItem | null>(null);
  const [genLoading, setGenLoading] = useState(false);

  const { data: config } = useProfileConfig();
  const saveConfig = useSaveProfileConfig();
  const aiMutation = useInstagramAI();
  const createPost = useCreatePost();
  const saveHooks = useSaveHooks();

  const handleOpenSetup = () => {
    // Pre-fill from existing config if available
    if (config) {
      setSetupForm(f => ({
        ...f,
        handle: config.profile_handle || '',
        niche: config.niche || '',
        sub_niche: config.sub_niche || '',
        target_audience: config.target_audience || '',
        brand_voice: config.brand_voice || '',
      }));
    }
    setShowSetup(true);
  };

  const handleSetupFiles = useCallback((files: File[]) => {
    setSetupFiles(prev => [...prev, ...files]);
  }, []);

  const handleGenerateProfile = async () => {
    setIsGenerating(true);
    try {
      // Read file content if any
      let file_content = '';
      if (setupFiles.length > 0) {
        const texts = await Promise.all(
          setupFiles.map(f => f.text().catch(() => `[arquivo binário: ${f.name}]`))
        );
        file_content = texts.join('\n---\n');
      }

      const result = await aiMutation.mutateAsync({
        action: 'setup_profile',
        data: {
          ...setupForm,
          file_content: file_content || undefined,
        },
      });

      if (!result) throw new Error('IA não retornou resultado');

      // Save to profile config
      await saveConfig.mutateAsync({
        profile_handle: setupForm.handle || result.profile_handle,
        profile_name: result.profile_name,
        niche: result.niche,
        sub_niche: result.sub_niche,
        target_audience: result.target_audience,
        brand_voice: result.brand_voice,
        bio_current: result.bio_current,
        bio_suggestions: result.bio_suggestions || [],
        content_pillars: result.content_pillars || [],
        posting_frequency: result.posting_frequency || {},
        competitors: result.competitors || [],
        strategic_briefing: result.strategic_briefing || {},
      });

      toast.success('Perfil configurado com IA! 🚀');
      setShowSetup(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar perfil');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePost = async () => {
    if (!genTopic.trim()) { toast.error('Informe o tema do post'); return; }
    setGenLoading(true);
    try {
      const isFullPackage = genPostType === 'full_package';
      const formatForAI = isFullPackage ? 'reel' : genPostType;
      const result = await aiMutation.mutateAsync({
        action: 'generate_post_trending',
        data: {
          topic: genTopic, format: formatForAI, pillar: genPillar, trend_style: genTrend,
          custom_instruction: [
            genInstruction,
            genAspectRatio !== 'auto' ? `Aspect ratio: ${genAspectRatio}` : '',
            isFullPackage ? 'Gere PACOTE COMPLETO: post de feed + carrossel + sequência de stories integrado' : '',
            genPostType === 'story_sequence' ? 'Foco em 5-7 stories com interativos' : '',
            genPostType === 'carousel' ? 'Gere carrossel com 5-8 slides' : '',
          ].filter(Boolean).join('. ') || undefined,
        },
      });
      if (result) {
        const scheduledDate = new Date(); scheduledDate.setDate(scheduledDate.getDate() + 1); scheduledDate.setHours(10, 0, 0, 0);
        
        // Generate visual image(s) using AI
        let thumbnailUrl: string | null = null;
        let carouselSlidesWithImages = result.carousel_slides || [];
        
        const aspectMap: Record<string, '1:1' | '9:16' | '16:9'> = {
          '1:1': '1:1', '4:5': '1:1', '9:16': '9:16', '16:9': '16:9', 'auto': genPostType === 'reel' || genPostType === 'story' || genPostType === 'story_sequence' ? '9:16' : '1:1',
        };
        const selectedAspect = aspectMap[genAspectRatio] || '1:1';
        const styleHint = genTrend !== 'auto' ? genTrend : 'cinematic, professional';
        const layoutMod = genLayout ? LAYOUT_OPTIONS.find(l => l.key === genLayout)?.promptModifier || '' : '';
        const refContext = genReference ? [genReference.note, genReference.tags?.join(', ')].filter(Boolean).join('. ') : '';

        try {
          // For carousels: generate one image per slide
          if (genPostType === 'carousel' && carouselSlidesWithImages.length > 0) {
            toast.info(`Gerando ${carouselSlidesWithImages.length} imagens do carrossel... 🎨`);
            const slidePromises = carouselSlidesWithImages.map((slide: any, idx: number) => {
              const slidePrompt = [
                `Slide ${idx + 1} of a carousel post.`,
                `Title text overlay: "${slide.title || ''}"`,
                slide.body ? `Subtitle: "${slide.body.substring(0, 80)}"` : '',
                result.title || genTopic,
                `Style: ${styleHint}. Category: ${genPillar}.`,
                layoutMod,
                refContext ? `Reference style: ${refContext}` : '',
                'Include bold readable text overlay on the image. Modern social media design.',
              ].filter(Boolean).join('. ');
              
              return supabase.functions.invoke('generate-image', {
                body: { prompt: slidePrompt, purpose: 'key_visual', aspectRatio: selectedAspect },
              }).then(({ data, error }) => {
                if (!error && data?.imageUrl) return data.imageUrl;
                console.warn(`Slide ${idx + 1} image failed:`, error);
                return null;
              }).catch(() => null);
            });
            
            const slideImages = await Promise.all(slidePromises);
            carouselSlidesWithImages = carouselSlidesWithImages.map((slide: any, idx: number) => ({
              ...slide,
              image_url: slideImages[idx] || null,
            }));
            thumbnailUrl = slideImages[0] || null; // Use first slide as cover
          } else {
            // Single image for non-carousel
            toast.info('Gerando imagem visual do post... 🎨');
            const imagePrompt = [
              result.title || genTopic,
              result.cover_suggestion || '',
              `Style: ${styleHint}`,
              `Category: ${genPillar}`,
              layoutMod,
              refContext ? `Reference style: ${refContext}` : '',
            ].filter(Boolean).join('. ');
            
            const { data: imgData, error: imgError } = await supabase.functions.invoke('generate-image', {
              body: { prompt: imagePrompt, purpose: 'key_visual', aspectRatio: selectedAspect },
            });
            
            if (!imgError && imgData?.imageUrl) {
              thumbnailUrl = imgData.imageUrl;
            } else {
              console.warn('Image generation failed:', imgError);
            }
          }
        } catch (imgErr) {
          console.warn('Image generation error:', imgErr);
        }
        
        const createdPost = await createPost.mutateAsync({
          title: result.title || genTopic, format: result.format || formatForAI, pillar: result.pillar || genPillar,
          objective: result.objective || 'authority', status: 'planned', scheduled_at: scheduledDate.toISOString(),
          hook: result.hook || null, script: result.script || null,
          caption_short: result.caption_short || null, caption_medium: result.caption_medium || null, caption_long: result.caption_long || null,
          cta: result.cta || null, pinned_comment: result.pinned_comment || null, hashtags: result.hashtags || [],
          cover_suggestion: result.cover_suggestion || null, carousel_slides: carouselSlidesWithImages,
          story_sequence: result.story_sequence || [], checklist: result.checklist || [], ai_generated: true, position: 0,
          thumbnail_url: thumbnailUrl,
        } as any);
        if (isFullPackage && result.story_sequence?.length > 0) {
          const storyDate = new Date(scheduledDate); storyDate.setHours(18, 0, 0, 0);
          await createPost.mutateAsync({
            title: `Stories: ${result.title || genTopic}`, format: 'story_sequence', pillar: result.pillar || genPillar,
            objective: 'engagement', status: 'planned', scheduled_at: storyDate.toISOString(),
            hook: null, script: null, caption_short: null, caption_medium: null, caption_long: null,
            cta: null, pinned_comment: null, hashtags: [], cover_suggestion: null, carousel_slides: [],
            story_sequence: result.story_sequence, checklist: [], ai_generated: true, position: 1,
          } as any);
        }
        if (result.hook) {
          await saveHooks.mutateAsync([{ hook_text: result.hook, category: result.pillar || genPillar, format: result.format || formatForAI, hook_score: 85, score_breakdown: null, ai_generated: true }]);
        }
        setShowGenPost(false); setGenTopic(''); setGenInstruction('');
        toast.success(isFullPackage ? '🚀 Pacote completo criado!' : '🎬 Post criado com tendências 2026!');
        // Open the result view with the created post
        if (createdPost) {
          setViewingPost(createdPost as InstagramPost);
        }
      }
    } catch (e: any) { toast.error(e.message || 'Erro ao gerar post'); }
    finally { setGenLoading(false); }
  };

  return (
    <DashboardLayout title="Instagram Engine">
      <motion.div
        className="space-y-6 max-w-[1600px] mx-auto"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {viewingPost ? (
          <PostResultView
            post={viewingPost}
            onBack={() => setViewingPost(null)}
            onSchedule={() => { setViewingPost(null); setActiveTab('calendar'); }}
            onPostUpdated={(updatedPost) => setViewingPost(updatedPost)}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                    Instagram <span className="bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] bg-clip-text text-transparent">Engine</span>
                  </h1>
                  <p className="text-xs text-muted-foreground">Sistema operacional de crescimento e posicionamento • @{config?.profile_handle || 'squadfilme'}</p>
                </div>
                <Button
                  onClick={handleOpenSetup}
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-5 h-10 text-sm font-medium shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Configurar Perfil com IA</span>
                  <span className="sm:hidden">IA</span>
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center w-full gap-1 overflow-x-auto flex-nowrap">
                <TabsList className="flex-1 justify-start gap-0 bg-muted/30 border border-border/50 rounded-xl p-1 flex-nowrap">
                  {TABS.map((tab) => (
                    <TabsTrigger
                      key={tab.key}
                      value={tab.key}
                      className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                <Button
                  onClick={() => setShowGenPost(true)}
                  className="gap-1.5 text-xs h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl whitespace-nowrap shrink-0"
                  disabled={genLoading}
                >
                  {genLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <Film className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Gerar Post</span>
                </Button>
              </div>

              <TabsContent value="cockpit" className="mt-6"><CockpitTab onViewPost={(p) => setViewingPost(p)} /></TabsContent>
              <TabsContent value="library" className="mt-6"><LibraryTab /></TabsContent>
              <TabsContent value="insights" className="mt-6"><InsightsAnalyzerTab /></TabsContent>
              <TabsContent value="calendar" className="mt-6"><CalendarTab /></TabsContent>
              <TabsContent value="scripts" className="mt-6"><ScriptsTab onNavigateToCalendar={() => setActiveTab('calendar')} /></TabsContent>
              <TabsContent value="create" className="mt-6"><CreateWithAITab /></TabsContent>
              <TabsContent value="campaigns" className="mt-6"><CampaignsTab /></TabsContent>
              <TabsContent value="snapshots" className="mt-6"><SnapshotsTab /></TabsContent>
              <TabsContent value="projections" className="mt-6"><ProjectionsTab /></TabsContent>
              <TabsContent value="health" className="mt-6"><ProfileHealthTab /></TabsContent>
            </Tabs>
          </>
        )}
      </motion.div>

      {/* AI Profile Setup Dialog */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-primary" />
              Configurar Perfil com IA
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Preencha os dados básicos e a IA vai gerar pilares, bio, estratégia e frequência ideal.
            </p>
          </DialogHeader>

          <div className="space-y-4 mt-2 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label className="text-xs text-muted-foreground">@ Handle do Instagram</Label>
              <Input
                value={setupForm.handle}
                onChange={e => setSetupForm(f => ({ ...f, handle: e.target.value }))}
                placeholder={config?.profile_handle || "squadfilme"}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Nicho Principal</Label>
              <Input
                value={setupForm.niche}
                onChange={e => setSetupForm(f => ({ ...f, niche: e.target.value }))}
                placeholder="Produção audiovisual premium"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Sub-nicho / Especialidade</Label>
              <Input
                value={setupForm.sub_niche}
                onChange={e => setSetupForm(f => ({ ...f, sub_niche: e.target.value }))}
                placeholder="Imóveis de luxo, cavalos, veículos premium"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Público-alvo</Label>
              <Textarea
                value={setupForm.target_audience}
                onChange={e => setSetupForm(f => ({ ...f, target_audience: e.target.value }))}
                placeholder="Incorporadoras, haras, concessionárias de luxo..."
                className="mt-1 min-h-[60px]"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tom de Voz da Marca</Label>
              <Input
                value={setupForm.brand_voice}
                onChange={e => setSetupForm(f => ({ ...f, brand_voice: e.target.value }))}
                placeholder="Cinematográfico, aspiracional, técnico"
                className="mt-1"
              />
            </div>

            {/* Context section */}
            <div className="border-t border-border/40 pt-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                Contexto adicional (opcional)
              </p>

              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Terminal className="w-3 h-3" /> Comando / Instrução livre
                </Label>
                <Textarea
                  value={setupForm.command}
                  onChange={e => setSetupForm(f => ({ ...f, command: e.target.value }))}
                  placeholder="Ex: Foque em posicionamento premium para o mercado de Brasília..."
                  className="mt-1 min-h-[50px]"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Link className="w-3 h-3" /> Link de referência
                </Label>
                <Input
                  value={setupForm.reference_url}
                  onChange={e => setSetupForm(f => ({ ...f, reference_url: e.target.value }))}
                  placeholder="https://instagram.com/referencia..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                  <FileText className="w-3 h-3" /> Arquivos de contexto
                </Label>
                <DropZone onFiles={handleSetupFiles} compact accept=".pdf,.txt,.md,.csv,.doc,.docx,.png,.jpg,.jpeg,.webp" />
                {setupFiles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {setupFiles.map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-[10px] bg-muted px-2 py-0.5 rounded-full">
                        <FileText className="w-3 h-3" />
                        {f.name}
                        <button onClick={() => setSetupFiles(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowSetup(false)}>Cancelar</Button>
            <Button
              onClick={handleGenerateProfile}
              disabled={isGenerating}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isGenerating ? 'Gerando...' : 'Gerar com IA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Post Dialog */}
      <Dialog open={showGenPost} onOpenChange={setShowGenPost}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" />
              Gerar Post — Tendências 2026
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Escolha tipo, formato, estilo e a IA cria tudo seguindo o padrão SQUAD Film.
            </p>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Post Type */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Tipo de Conteúdo</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {POST_TYPES.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setGenPostType(t.key)}
                    className={`text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                      genPostType === t.key
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border/50 text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{t.icon}</span>
                      <span className="font-medium text-xs">{t.label}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Proporção / Aspect Ratio</Label>
              <div className="flex gap-1.5 flex-wrap">
                {ASPECT_RATIOS.map(a => (
                  <button
                    key={a.key}
                    onClick={() => setGenAspectRatio(a.key)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      genAspectRatio === a.key
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/50 text-muted-foreground hover:border-primary/30'
                    }`}
                    title={a.desc}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground mt-1">
                {ASPECT_RATIOS.find(a => a.key === genAspectRatio)?.desc}
              </p>
            </div>

            {/* Topic */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Tema do post *</Label>
              <Input
                placeholder="Ex: Making of Fazenda da Matta, Behind the scenes Ferrari..."
                value={genTopic}
                onChange={e => setGenTopic(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Trend + Pillar */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Estilo Visual</Label>
                <Select value={genTrend} onValueChange={setGenTrend}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TREND_STYLES_QUICK.map(s => (
                      <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Pilar</Label>
                <Select value={genPillar} onValueChange={setGenPillar}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PILLARS_QUICK.map(p => (
                      <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Layout Picker */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Layout Visual</Label>
              <LayoutPicker
                selected={genLayout}
                onSelect={(l) => setGenLayout(l?.key || null)}
                selectedReference={genReference}
                onSelectReference={setGenReference}
                previewTitle={genTopic}
                previewHook={genInstruction || undefined}
                compact
              />
            </div>

            {/* Custom instruction */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Instrução adicional (opcional)</Label>
              <Input
                placeholder="Ex: Focar em emoção, usar referência do vídeo de cavalos..."
                value={genInstruction}
                onChange={e => setGenInstruction(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Summary */}
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">O que será gerado:</p>
              <div className="grid grid-cols-2 gap-1">
                {[
                  'Hook cinematográfico', 'Roteiro + direção de câmera', '3 legendas (curta/média/longa)',
                  'CTA + comentário fixado', 'Hashtags estratégicas', 'Sugestão de capa',
                  genPostType === 'carousel' || genPostType === 'full_package' ? 'Slides de carrossel' : null,
                  genPostType === 'story_sequence' || genPostType === 'full_package' ? 'Sequência de stories' : null,
                  'Checklist de produção', 'Direção visual completa',
                ].filter(Boolean).map((item, i) => (
                  <div key={i} className="flex items-center gap-1 text-[10px] text-foreground/80">
                    <Check className="w-3 h-3 text-primary/60 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowGenPost(false)}>Cancelar</Button>
            <Button size="sm" className="gap-1.5" onClick={handleGeneratePost} disabled={genLoading || !genTopic.trim()}>
              {genLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
              {genLoading ? 'Gerando...' : genPostType === 'full_package' ? 'Gerar Pacote Completo' : 'Gerar Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}