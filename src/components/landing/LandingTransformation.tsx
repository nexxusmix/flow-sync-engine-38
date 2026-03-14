import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, X, Check } from "lucide-react";
import { ScrollLinked } from "./ScrollLinked";

const springCfg = { stiffness: 120, damping: 30 };

const before = [
  "Operação reativa e apagando incêndios",
  "Processos manuais e repetitivos",
  "5+ ferramentas desconectadas",
  "Cliente sem visibilidade do andamento",
  "Caos operacional que impede crescimento",
  "Zero previsibilidade de entrega",
];

const after = [
  "Operação estruturada e previsível",
  "Automações inteligentes com governança",
  "Um sistema central e integrado",
  "Portal do cliente com experiência premium",
  "Escala com controle e organização",
  "Visão executiva em tempo real",
];

function TransformRow({ left, right, index }: { left: string; right: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const xLeft = useSpring(useTransform(scrollYProgress, [0, 1], [-30, 0]), springCfg);
  const xRight = useSpring(useTransform(scrollYProgress, [0, 1], [30, 0]), springCfg);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.6], [0, 1]), springCfg);

  return (
    <motion.div ref={ref} className="grid md:grid-cols-[1fr_auto_1fr] gap-3 items-center" style={{ opacity }}>
      <motion.div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-destructive/4 border border-destructive/8" style={{ x: xLeft }}>
        <X className="w-4 h-4 text-destructive/50 shrink-0 mt-0.5" />
        <span className="text-sm text-muted-foreground/60">{left}</span>
      </motion.div>
      <div className="hidden md:flex items-center justify-center">
        <ArrowRight className="w-4 h-4 text-primary/40" />
      </div>
      <motion.div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-primary/4 border border-primary/10" style={{ x: xRight }}>
        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <span className="text-sm text-foreground/80 font-medium">{right}</span>
      </motion.div>
    </motion.div>
  );
}

export function LandingTransformation() {
  return (
    <ScrollLinked className="relative z-10 px-6 md:px-12 py-28 md:py-40">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">A transformação</span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-light text-foreground tracking-tight leading-[1.1]">
            De improvisação para<br />
            <span className="text-primary">operação profissional</span>
          </h2>
          <p className="text-base text-muted-foreground mt-4 max-w-lg mx-auto">
            Veja o que muda quando você centraliza tudo em um sistema operacional integrado.
          </p>
        </div>

        <div className="space-y-3">
          {before.map((b, i) => (
            <TransformRow key={i} left={b} right={after[i]} index={i} />
          ))}
        </div>
      </div>
    </ScrollLinked>
  );
}
