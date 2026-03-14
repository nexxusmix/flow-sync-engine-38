import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import {
  Target, TrendingUp, Eye, Zap, Users, BarChart3,
} from "lucide-react";
import { ScrollLinked } from "./ScrollLinked";

const springCfg = { stiffness: 120, damping: 30 };

const benefits = [
  {
    icon: Target,
    title: "Centralização total",
    desc: "Clientes, projetos, financeiro, documentos e comunicação em um só lugar. Zero informação perdida.",
  },
  {
    icon: TrendingUp,
    title: "Mais produtividade",
    desc: "Automatize tarefas repetitivas e libere a equipe para o que realmente importa: criar e entregar.",
  },
  {
    icon: Eye,
    title: "Visão executiva real",
    desc: "Dashboard em tempo real com métricas operacionais, financeiras e de equipe. Decisões rápidas e informadas.",
  },
  {
    icon: Zap,
    title: "Automação com governança",
    desc: "Fluxos automáticos com aprovação humana quando necessário. Velocidade sem perder controle.",
  },
  {
    icon: Users,
    title: "Cliente mais bem atendido",
    desc: "Portal premium com aprovações, progresso e comunicação centralizada. Percepção de valor profissional.",
  },
  {
    icon: BarChart3,
    title: "Escala sem caos",
    desc: "Processos padronizados e replicáveis. Cresça de 5 para 50 clientes mantendo qualidade e organização.",
  },
];

function BenefitCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useSpring(useTransform(scrollYProgress, [0, 1], [0.92, 1]), springCfg);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.5], [0, 1]), springCfg);

  return (
    <motion.div
      ref={ref}
      className="p-6 rounded-2xl border border-border/15 bg-card group hover:border-primary/15 transition-all duration-500"
      style={{ scale, opacity }}
    >
      <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center mb-5 group-hover:bg-primary/12 transition-colors">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="text-base font-medium text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </motion.div>
  );
}

export function LandingBenefits() {
  return (
    <ScrollLinked id="beneficios" className="relative z-10 px-6 md:px-12 py-24 md:py-32">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14 md:mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-5"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Por que adotar</span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-light text-foreground tracking-tight leading-[1.1]">
            Não é só gestão.<br />
            É <span className="text-primary">inteligência operacional.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b, i) => (
            <BenefitCard key={i} icon={b.icon} title={b.title} desc={b.desc} />
          ))}
        </div>
      </div>
    </ScrollLinked>
  );
}
