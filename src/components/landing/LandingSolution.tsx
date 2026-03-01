import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Check, Clapperboard, Palette, ArrowRight } from "lucide-react";
import { ScrollLinked } from "./ScrollLinked";

const filmFeatures = [
  "Pipeline visual de projetos", "Tarefas inteligentes com IA", "Entregáveis com preview automático",
  "Upload com descrição automática", "Cronograma integrado", "Financeiro por projeto",
  "Exportação profissional em PDF", "Portal do cliente", "IA que executa por comando de voz",
];

const marketingFeatures = [
  "Gestão de clientes e contas", "Planejamento editorial completo", "Calendário de conteúdo",
  "Roteirização com IA", "Branding & Logomarca", "Biblioteca criativa",
  "Upload inteligente", "Correção gramatical automática", "Geração de storyboards", "Exportações premium",
];

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <span className="text-sm text-muted-foreground">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ModuleCard({ icon: Icon, emoji, title, description, features, index }: {
  icon: React.ElementType; emoji: string; title: string; description: string; features: string[]; index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useSpring(useTransform(scrollYProgress, [0, 1], [0.92, 1]), { stiffness: 120, damping: 30 });
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.5], [0, 1]), { stiffness: 120, damping: 30 });
  const x = useSpring(useTransform(scrollYProgress, [0, 1], [index === 0 ? -40 : 40, 0]), { stiffness: 120, damping: 30 });

  return (
    <motion.div
      ref={ref}
      className="rounded-2xl border border-border/20 overflow-hidden group hover:border-primary/20 transition-all duration-500 bg-card"
      style={{ scale, opacity, x }}
    >
      <div className="p-8 border-b border-border/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center group-hover:bg-primary/12 transition-colors duration-300">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="text-[9px] text-primary/50 uppercase tracking-wider font-medium">{emoji} Módulo</span>
            <h3 className="text-lg font-medium text-foreground">{title}</h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <div className="p-8">
        <FeatureList items={features} />
      </div>
    </motion.div>
  );
}

export function LandingSolution() {
  return (
    <ScrollLinked id="solucao" className="relative z-10 px-6 md:px-12 py-28 md:py-40">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">A solução</span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-light text-foreground tracking-tight leading-[1.1]">
            O HUB nasceu para<br />
            <span className="text-primary">centralizar tudo</span>
          </h2>
          <p className="text-base text-muted-foreground mt-4 max-w-lg mx-auto">
            Dois módulos poderosos em uma única plataforma integrada.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <ModuleCard icon={Clapperboard} emoji="🎬" title="Produtora" description="Gestão completa de projetos audiovisuais — do briefing à entrega final." features={filmFeatures} index={0} />
          <ModuleCard icon={Palette} emoji="🎨" title="Marketing & Design" description="Módulo dedicado para agências, social media e equipes criativas." features={marketingFeatures} index={1} />
        </div>
      </div>
    </ScrollLinked>
  );
}
