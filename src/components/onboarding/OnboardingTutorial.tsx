import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  LayoutDashboard, FolderKanban, Users, DollarSign, 
  Megaphone, CheckSquare, Sparkles, Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Sparkles,
    title: "Bem-vindo ao Hub! ✨",
    description: "Sua central de comando para gerenciar projetos, clientes, finanças e conteúdo — tudo em um só lugar.",
    color: "from-primary/20 to-primary/5",
    iconColor: "text-primary",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description: "Visão geral com KPIs em tempo real: receita, pipeline, projetos ativos e próximos prazos. Tudo que importa, num relance.",
    color: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-400",
  },
  {
    icon: FolderKanban,
    title: "Projetos",
    description: "Acompanhe cada projeto do briefing à entrega. Etapas visuais, health score e controle de produção completo.",
    color: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-400",
  },
  {
    icon: Users,
    title: "CRM & Vendas",
    description: "Pipeline de vendas com contatos, deals e funil visual. Saiba exatamente onde cada oportunidade está.",
    color: "from-violet-500/20 to-violet-500/5",
    iconColor: "text-violet-400",
  },
  {
    icon: DollarSign,
    title: "Financeiro",
    description: "Receitas, despesas e fluxo de caixa. Controle total das suas finanças com alertas de pagamentos pendentes.",
    color: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-400",
  },
  {
    icon: Megaphone,
    title: "Marketing & Conteúdo",
    description: "Pipeline de conteúdo, calendário editorial e campanhas. Planeje, crie e publique de forma organizada.",
    color: "from-pink-500/20 to-pink-500/5",
    iconColor: "text-pink-400",
  },
  {
    icon: CheckSquare,
    title: "Tarefas",
    description: "Quadro Kanban inteligente com categorias, tags e prioridades. Organize seu dia, semana e backlog.",
    color: "from-cyan-500/20 to-cyan-500/5",
    iconColor: "text-cyan-400",
  },
  {
    icon: Rocket,
    title: "Pronto para começar! 🚀",
    description: "Explore à vontade. Tudo já está com dados de exemplo para você testar cada funcionalidade.",
    color: "from-primary/20 to-primary/5",
    iconColor: "text-primary",
  },
];

export function OnboardingTutorial() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);

  const { data: showTutorial, isLoading } = useQuery({
    queryKey: ['onboarding-state', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from('ui_state')
        .select('state')
        .eq('user_id', user.id)
        .eq('scope', 'onboarding')
        .eq('scope_key', 'completed')
        .maybeSingle();
      return !(data?.state as any)?.completed;
    },
    enabled: !!user?.id,
  });

  const complete = async () => {
    if (!user?.id) return;
    await supabase.from('ui_state').upsert({
      user_id: user.id,
      scope: 'onboarding',
      scope_key: 'completed',
      state: { completed: true },
    }, { onConflict: 'user_id,scope' });
    queryClient.setQueryData(['onboarding-state', user.id], false);
  };

  if (isLoading || !showTutorial) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Card */}
        <motion.div
          className="relative z-10 w-[90vw] max-w-lg mx-auto"
          initial={{ scale: 0.8, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
            {/* Progress bar */}
            <div className="h-1 bg-muted">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            {/* Content */}
            <div className="p-8 md:p-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center text-center"
                >
                  {/* Icon */}
                  <motion.div
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6`}
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                  >
                    <step.icon className={`w-10 h-10 ${step.iconColor}`} />
                  </motion.div>

                  {/* Title */}
                  <motion.h2
                    className="text-2xl font-semibold text-foreground mb-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    {step.title}
                  </motion.h2>

                  {/* Description */}
                  <motion.p
                    className="text-muted-foreground text-sm leading-relaxed max-w-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {step.description}
                  </motion.p>
                </motion.div>
              </AnimatePresence>

              {/* Dots */}
              <div className="flex items-center justify-center gap-1.5 mt-8 mb-6">
                {steps.map((_, i) => (
                  <motion.div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${i === currentStep ? 'bg-primary w-6' : 'bg-muted-foreground/20 w-1.5'}`}
                    layout
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground text-xs"
                  onClick={complete}
                >
                  Pular
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    if (isLast) {
                      complete();
                    } else {
                      setCurrentStep(prev => prev + 1);
                    }
                  }}
                  className="px-6"
                >
                  {isLast ? "Começar!" : "Próximo →"}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
