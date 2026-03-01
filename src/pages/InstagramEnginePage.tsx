import { useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Link, FileText, Terminal, X } from 'lucide-react';
import { DropZone } from '@/components/ui/DropZone';
import { CockpitTab } from '@/components/instagram-engine/CockpitTab';
import { CalendarTab } from '@/components/instagram-engine/CalendarTab';
import { ScriptsTab } from '@/components/instagram-engine/ScriptsTab';
import { CreateWithAITab } from '@/components/instagram-engine/CreateWithAITab';
import { CampaignsTab } from '@/components/instagram-engine/CampaignsTab';
import { ProjectionsTab } from '@/components/instagram-engine/ProjectionsTab';
import { ProfileHealthTab } from '@/components/instagram-engine/ProfileHealthTab';
import { SnapshotsTab } from '@/components/instagram-engine/SnapshotsTab';
import { useInstagramAI, useProfileConfig, useSaveProfileConfig } from '@/hooks/useInstagramEngine';
import { toast } from 'sonner';

const TABS = [
  { key: 'cockpit', label: 'Cockpit', icon: 'rocket_launch' },
  { key: 'calendar', label: 'Calendário', icon: 'calendar_month' },
  { key: 'scripts', label: 'Roteiros', icon: 'description' },
  { key: 'create', label: 'Criar com IA', icon: 'auto_awesome' },
  { key: 'campaigns', label: 'Campanhas', icon: 'campaign' },
  { key: 'snapshots', label: 'Histórico', icon: 'timeline' },
  { key: 'projections', label: 'Projeções', icon: 'trending_up' },
  { key: 'health', label: 'Saúde', icon: 'monitoring' },
];

export default function InstagramEnginePage() {
  const [activeTab, setActiveTab] = useState('cockpit');
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

  const { data: config } = useProfileConfig();
  const saveConfig = useSaveProfileConfig();
  const aiMutation = useInstagramAI();

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

  return (
    <DashboardLayout title="Instagram Engine">
      <motion.div
        className="space-y-6 max-w-[1600px] mx-auto"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
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
              <p className="text-xs text-muted-foreground">Sistema operacional de crescimento e posicionamento • @squadfilme</p>
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
          <TabsList className="w-full justify-start gap-0 bg-muted/30 border border-border/50 rounded-xl p-1 overflow-x-auto flex-nowrap">
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

          <TabsContent value="cockpit" className="mt-6"><CockpitTab /></TabsContent>
          <TabsContent value="calendar" className="mt-6"><CalendarTab /></TabsContent>
          <TabsContent value="scripts" className="mt-6"><ScriptsTab /></TabsContent>
          <TabsContent value="create" className="mt-6"><CreateWithAITab /></TabsContent>
          <TabsContent value="campaigns" className="mt-6"><CampaignsTab /></TabsContent>
          <TabsContent value="snapshots" className="mt-6"><SnapshotsTab /></TabsContent>
          <TabsContent value="projections" className="mt-6"><ProjectionsTab /></TabsContent>
          <TabsContent value="health" className="mt-6"><ProfileHealthTab /></TabsContent>
        </Tabs>
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
                placeholder="squadfilme"
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
    </DashboardLayout>
  );
}