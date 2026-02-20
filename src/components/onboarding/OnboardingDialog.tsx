import { useState } from "react";
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
} from "lucide-react";

interface OnboardingDialogProps {
  open: boolean;
  onClose: () => void;
}

const sections = [
  { icon: FolderOpen, label: "Projetos", desc: "Kanban e gestão operacional" },
  { icon: TrendingUp, label: "CRM", desc: "Pipeline de vendas e leads" },
  { icon: FileText, label: "Propostas", desc: "Geração com IA em segundos" },
  { icon: Users, label: "Clientes", desc: "Portal e comunicação direta" },
  { icon: BarChart2, label: "Financeiro", desc: "Receitas, despesas e fluxo" },
  { icon: Megaphone, label: "Marketing", desc: "Studio criativo com IA" },
];

export function OnboardingDialog({ open, onClose }: OnboardingDialogProps) {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [seedingDemo, setSeedingDemo] = useState(false);

  const handleSaveWorkspace = async () => {
    if (!companyName.trim()) {
      toast.error("Informe o nome da empresa");
      return;
    }
    setSavingWorkspace(true);
    try {
      await (supabase as any)
        .from("workspace_settings")
        .upsert({ company_name: companyName, business_type: businessType }, { onConflict: "workspace_id" });
    } catch (_) {
      // Non-critical: workspace_settings may not exist yet — continue anyway
    } finally {
      setSavingWorkspace(false);
      setStep(2);
    }
  };

  const handleSeedDemo = async () => {
    setSeedingDemo(true);
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
        toast.success("Projeto demo criado! Explore a plataforma 🎉");
      } else {
        toast.error("Erro ao criar demo — continue mesmo assim.");
      }
    } catch (_) {
      toast.error("Erro ao criar demo — continue mesmo assim.");
    } finally {
      setSeedingDemo(false);
      setStep(3);
    }
  };

  const slideVariants = {
    enter: { opacity: 0, x: 40, filter: "blur(4px)" },
    center: { opacity: 1, x: 0, filter: "blur(0px)" },
    exit: { opacity: 0, x: -40, filter: "blur(4px)" },
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border-border/50 gap-0">
        {/* Progress bar */}
        <div className="h-1 bg-muted w-full">
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.5, type: "spring" }}
          />
        </div>

        <div className="p-8">
          {/* Step counter */}
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-6 font-light">
            Passo {step} de 3
          </p>

          <AnimatePresence mode="wait">
            {/* STEP 1 — Workspace */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-normal text-foreground">Bem-vindo à plataforma!</h2>
                      <p className="text-xs text-muted-foreground font-light">Vamos configurar seu workspace</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Nome da empresa</Label>
                    <Input
                      id="company"
                      placeholder="Ex: Produtora Alvo"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de negócio</Label>
                    <Select value={businessType} onValueChange={setBusinessType}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="produtora">Produtora de Vídeo</SelectItem>
                        <SelectItem value="agencia">Agência</SelectItem>
                        <SelectItem value="freelancer">Freelancer</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleSaveWorkspace}
                  disabled={savingWorkspace}
                >
                  {savingWorkspace ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ChevronRight className="w-4 h-4 mr-2" />
                  )}
                  Continuar
                </Button>
              </motion.div>
            )}

            {/* STEP 2 — Demo Project */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-normal text-foreground">Projeto Demo</h2>
                      <p className="text-xs text-muted-foreground font-light">Explore a plataforma com dados reais</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-4 border border-primary/10">
                  <p className="text-sm text-foreground font-light leading-relaxed">
                    Criamos um <strong>projeto demo completo</strong> para você explorar todas as funcionalidades — CRM, propostas, financeiro, marketing e muito mais.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full"
                    onClick={handleSeedDemo}
                    disabled={seedingDemo}
                  >
                    {seedingDemo ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Sim, criar projeto demo
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={() => setStep(3)}
                    disabled={seedingDemo}
                  >
                    Não, começar do zero
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3 — Done */}
            {step === 3 && (
              <motion.div
                key="step3"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-normal text-foreground mb-1">Tudo pronto! 🎉</h2>
                  <p className="text-xs text-muted-foreground font-light">Aqui está o que você pode fazer na plataforma</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {sections.map(({ icon: Icon, label, desc }) => (
                    <div
                      key={label}
                      className="glass-card rounded-xl p-3 flex items-start gap-2 border border-border/30"
                    >
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-normal text-foreground">{label}</p>
                        <p className="text-[10px] text-muted-foreground font-light leading-snug">{desc}</p>
                      </div>
                    </div>
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
