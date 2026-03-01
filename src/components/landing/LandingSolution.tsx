import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Check, Clapperboard, Palette } from "lucide-react";
import { ScrollLinked } from "./ScrollLinked";

const filmFeatures = [
  "Pipeline visual de projetos", "Tarefas inteligentes com IA", "Entregáveis com preview automático",
  "Upload com IA", "Cronograma integrado", "Financeiro integrado",
  "Exportação profissional em PDF", "Portal do cliente", "IA que executa por comando de voz",
];

const marketingFeatures = [
  "Gestão de clientes", "Planejamento editorial", "Calendário de conteúdo",
  "Roteirização com IA", "Branding & Logomarca", "Biblioteca criativa",
  "Upload inteligente", "Correção gramatical automática", "Geração de storyboards", "Exportações premium",
];

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <span className="text-sm text-muted-foreground">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ModuleCard({ icon: Icon, emoji, title, description, features, delay }: {
  icon: React.ElementType; emoji: string; title: string; description: string; features: string[]; delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useSpring(useTransform(scrollYProgress, [0, 1], [0.92, 1]), { stiffness: 120, damping: 30 });
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.5], [0, 1]), { stiffness: 120, damping: 30 });

  return (
    <motion.div
      ref={ref}
      className="rounded-2xl border border-border/20 overflow-hidden group hover:border-primary/15 transition-all duration-500 bg-card"
      style={{ scale, opacity }}
    >
      <div className="p-8 border-b border-border/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="text-[9px] text-primary/50 uppercase tracking-wider font-medium">{emoji} Módulo</span>
            <h3 className="text-lg font-medium text-foreground">{title}</h3>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="p-8">
        <FeatureList items={features} />
      </div>
    </motion.div>
  );
}

export function LandingSolution() {
  return (
    <ScrollLinked className="relative z-10 px-6 md:px-12 py-24 md:py-32">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">A solução</span>
          <h2 className="text-3xl md:text-5xl font-light text-foreground mt-4 mb-3 tracking-tight">
            O HUB nasceu para <span className="text-primary">centralizar tudo</span>
          </h2>
          <p className="text-sm text-muted-foreground">Módulos integrados em uma única plataforma</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <ModuleCard icon={Clapperboard} emoji="🎬" title="Produtora" description="Gestão completa de projetos audiovisuais." features={filmFeatures} delay={0} />
          <ModuleCard icon={Palette} emoji="🎨" title="Marketing & Design" description="Módulo dedicado para agências e social media." features={marketingFeatures} delay={0.1} />
        </div>
      </div>
    </ScrollLinked>
  );
}
