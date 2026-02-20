import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FolderOpen,
  TrendingUp,
  FileText,
  Users,
  BarChart2,
  Megaphone,
  ChevronRight,
  Sparkles,
  Building2,
  Loader2,
  Upload,
  CheckCircle2,
  Plus,
  Trash2,
  Layers,
} from "lucide-react";

interface OnboardingDialogProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_STAGES = [
  "Briefing",
  "Pré-Produção",
  "Produção",
  "Pós-Produção",
  "Entrega",
];

const BUSINESS_TYPES = [
  { value: "produtora", label: "Produtora de Vídeo" },
  { value: "agencia", label: "Agência Criativa" },
  { value: "fotografo", label: "Fotógrafo / Videomaker" },
  { value: "freelancer", label: "Freelancer" },
  { value: "outro", label: "Outro" },
];

const TOTAL_STEPS = 4;

const sections = [
  { icon: FolderOpen, label: "Projetos", desc: "Kanban e gestão operacional" },
  { icon: TrendingUp, label: "CRM", desc: "Pipeline de vendas e leads" },
  { icon: FileText, label: "Propostas", desc: "Geração com IA em segundos" },
  { icon: Users, label: "Clientes", desc: "Portal e comunicação direta" },
  { icon: BarChart2, label: "Financeiro", desc: "Receitas, despesas e fluxo" },
  { icon: Megaphone, label: "Marketing", desc: "Studio criativo com IA" },
];

export function OnboardingDialog({ open, onClose }: OnboardingDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  // Step 1 — Company
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Step 2 — Project Stages
  const [stages, setStages] = useState<string[]>(DEFAULT_STAGES);
  const [newStage, setNewStage] = useState("");
  const [savingStages, setSavingStages] = useState(false);

  // Step 3 — Demo Project
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectCreated, setProjectCreated] = useState(false);
  const [usedDemo, setUsedDemo] = useState(false);

  // ----- Logo upload -----
  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo deve ter menos de 5MB");
      return;
    }
    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `workspace/logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      setLogoUrl(urlData.publicUrl);
    } catch (err) {
      toast.error("Erro ao enviar logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  // ----- Step 1: Save Workspace -----
  const handleSaveWorkspace = async () => {
    if (!companyName.trim()) {
      toast.error("Informe o nome da empresa");
      return;
    }
    setSavingWorkspace(true);
    try {
      const { data: existing } = await supabase
        .from("workspace_settings")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        await supabase
          .from("workspace_settings")
          .update({ company_name: companyName })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("workspace_settings")
          .insert({ company_name: companyName });
      }

      // If logo uploaded, save to branding_settings
      if (logoUrl) {
        const { data: branding } = await supabase
          .from("branding_settings")
          .select("id")
          .limit(1)
          .maybeSingle();

        if (branding?.id) {
          await supabase
            .from("branding_settings")
            .update({ logo_url: logoUrl })
            .eq("id", branding.id);
        } else {
          await supabase.from("branding_settings").insert({ logo_url: logoUrl });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingWorkspace(false);
      setStep(2);
    }
  };

  // ----- Step 2: Save Stages -----
  const handleSaveStages = async () => {
    setSavingStages(true);
    try {
      // Delete existing default stage settings and recreate
      const { data: existing } = await supabase
        .from("project_stage_settings")
        .select("id, key")
        .order("stage_order");

      const existingKeys = (existing || []).map((s: any) => s.key || s.stage_key);

      for (let i = 0; i < stages.length; i++) {
        const label = stages[i];
        const key = label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
        if (existingKeys.includes(key)) {
          await (supabase as any)
            .from("project_stage_settings")
            .update({ stage_label: label, stage_order: i + 1 })
            .eq("key", key);
        } else {
          await (supabase as any)
            .from("project_stage_settings")
            .insert({ key, stage_label: label, stage_key: key, stage_order: i + 1, is_default: false });
        }
      }
    } catch (err) {
      console.error("Error saving stages:", err);
    } finally {
      setSavingStages(false);
      setStep(3);
    }
  };

  // ----- Step 3: Create first project or seed demo -----
  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      toast.error("Informe o nome do projeto");
      return;
    }
    setCreatingProject(true);
    try {
      const startDate = new Date().toISOString().split("T")[0];
      const dueDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const { error } = await supabase.from("projects").insert({
        name: projectName.trim(),
        client_name: clientName.trim() || "Cliente",
        description: "Primeiro projeto criado no onboarding",
        status: "em_andamento",
        stage_current: stages[0]?.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") || "briefing",
        start_date: startDate,
        due_date: dueDate,
        owner_id: user?.id,
        owner_name: user?.email?.split("@")[0],
        created_by: user?.id,
      });
      if (error) throw error;
      setProjectCreated(true);
      toast.success(`Projeto "${projectName}" criado! 🎬`);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      setTimeout(() => setStep(4), 1200);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar projeto. Tente novamente.");
    } finally {
      setCreatingProject(false);
    }
  };

  const handleSeedDemo = async () => {
    setCreatingProject(true);
    setUsedDemo(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seed-demo-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({}),
        }
      );
      if (res.ok) {
        toast.success("Dados demo criados! Explore a plataforma 🎉");
        queryClient.invalidateQueries();
      } else {
        toast.error("Erro ao criar demo — continue mesmo assim.");
      }
    } catch {
      toast.error("Erro ao criar demo — continue mesmo assim.");
    } finally {
      setCreatingProject(false);
      setStep(4);
    }
  };

  const slideVariants = {
    enter: { opacity: 0, x: 40, filter: "blur(4px)" },
    center: { opacity: 1, x: 0, filter: "blur(0px)" },
    exit: { opacity: 0, x: -40, filter: "blur(4px)" },
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && step === TOTAL_STEPS) onClose(); }}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border-border/50 gap-0">
        {/* Progress bar */}
        <div className="h-1 bg-muted w-full">
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.5, type: "spring" }}
          />
        </div>

        <div className="p-8">
          {/* Step counter */}
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-6 font-light">
            Passo {step} de {TOTAL_STEPS}
          </p>

          <AnimatePresence mode="wait">
            {/* ── STEP 1: Empresa + Logo ── */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-normal text-foreground">Bem-vindo!</h2>
                    <p className="text-xs text-muted-foreground font-light">Configure sua empresa</p>
                  </div>
                </div>

                {/* Logo upload */}
                <div className="space-y-2">
                  <Label>Logo da empresa <span className="text-muted-foreground">(opcional)</span></Label>
                  <div
                    className="border-2 border-dashed border-border/50 rounded-xl p-4 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="h-16 object-contain rounded-lg" />
                    ) : uploadingLogo ? (
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                          <Upload className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          Clique para enviar seu logo<br />
                          <span className="text-[10px]">PNG, JPG ou SVG · max 5MB</span>
                        </p>
                      </>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleLogoUpload(f);
                      }}
                    />
                  </div>
                  {logoUrl && (
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-auto p-1" onClick={() => setLogoUrl(null)}>
                      Remover logo
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Nome da empresa *</Label>
                  <Input
                    id="company"
                    placeholder="Ex: Produtora Alvo"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveWorkspace()}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de negócio</Label>
                  <Select value={businessType} onValueChange={setBusinessType}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full"
                  onClick={handleSaveWorkspace}
                  disabled={savingWorkspace || !companyName.trim()}
                >
                  {savingWorkspace ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                  Continuar
                </Button>
              </motion.div>
            )}

            {/* ── STEP 2: Etapas de Projeto ── */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-normal text-foreground">Etapas do Projeto</h2>
                    <p className="text-xs text-muted-foreground font-light">Defina o fluxo de produção da sua empresa</p>
                  </div>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {stages.map((stage, i) => (
                    <div key={i} className="flex items-center gap-2 glass-card rounded-lg px-3 py-2">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] text-primary font-medium">{i + 1}</span>
                      </div>
                      <Input
                        value={stage}
                        onChange={(e) => {
                          const updated = [...stages];
                          updated[i] = e.target.value;
                          setStages(updated);
                        }}
                        className="h-7 border-0 bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                      {stages.length > 2 && (
                        <button
                          className="text-muted-foreground hover:text-destructive transition-colors ml-auto"
                          onClick={() => setStages(stages.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add new stage */}
                {stages.length < 10 && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nova etapa..."
                      value={newStage}
                      onChange={(e) => setNewStage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newStage.trim()) {
                          setStages([...stages, newStage.trim()]);
                          setNewStage("");
                        }
                      }}
                      className="h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3"
                      disabled={!newStage.trim()}
                      onClick={() => {
                        if (newStage.trim()) {
                          setStages([...stages, newStage.trim()]);
                          setNewStage("");
                        }
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setStep(1)}>
                    Voltar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSaveStages}
                    disabled={savingStages || stages.length === 0}
                  >
                    {savingStages ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                    Salvar e Continuar
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Primeiro Projeto ── */}
            {step === 3 && (
              <motion.div
                key="step3"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-normal text-foreground">Seu Primeiro Projeto</h2>
                    <p className="text-xs text-muted-foreground font-light">Cadastre um projeto real ou explore com dados demo</p>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-4 space-y-4 border border-border/30">
                  <p className="text-xs font-medium text-foreground uppercase tracking-wider">Criar projeto real</p>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="proj-name">Nome do projeto</Label>
                      <Input
                        id="proj-name"
                        placeholder="Ex: Vídeo Institucional Empresa X"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="client-name">Cliente</Label>
                      <Input
                        id="client-name"
                        placeholder="Ex: Empresa X"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                      />
                    </div>
                  </div>

                  {projectCreated ? (
                    <div className="flex items-center gap-2 text-sm text-success">
                      <CheckCircle2 className="w-4 h-4" />
                      Projeto criado! Redirecionando...
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={handleCreateProject}
                      disabled={creatingProject || !projectName.trim()}
                    >
                      {creatingProject && !usedDemo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                      Criar Projeto
                    </Button>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/30" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-background px-2 text-muted-foreground tracking-widest">ou</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSeedDemo}
                  disabled={creatingProject}
                >
                  {creatingProject && usedDemo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Explorar com dados demo
                </Button>

                <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => setStep(4)} disabled={creatingProject}>
                  Pular por agora
                </Button>
              </motion.div>
            )}

            {/* ── STEP 4: Done ── */}
            {step === 4 && (
              <motion.div
                key="step4"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto"
                  >
                    <CheckCircle2 className="w-7 h-7 text-primary" />
                  </motion.div>
                  <h2 className="text-xl font-normal text-foreground">Tudo pronto! 🎉</h2>
                  <p className="text-xs text-muted-foreground font-light">Aqui está o que você pode explorar</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {sections.map(({ icon: Icon, label, desc }, i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.06 }}
                      className="glass-card rounded-xl p-3 flex items-start gap-2 border border-border/30"
                    >
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-normal text-foreground">{label}</p>
                        <p className="text-[10px] text-muted-foreground font-light leading-snug">{desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Button className="w-full" onClick={onClose}>
                  Entrar na Plataforma
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
