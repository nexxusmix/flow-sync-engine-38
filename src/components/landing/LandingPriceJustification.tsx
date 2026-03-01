import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ScrollLinked } from "./ScrollLinked";

const tools = [
  "Gestão de tarefas", "CRM", "Financeiro", "Planejamento editorial",
  "Storyboard", "IA", "Armazenamento", "Portal cliente",
];

const springCfg = { stiffness: 120, damping: 30 };

function ToolTag({ text, index }: { text: string; index: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useSpring(useTransform(scrollYProgress, [0, 1], [0.8, 1]), springCfg);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1]), springCfg);

  return (
    <motion.span
      ref={ref}
      className="px-3 py-1.5 rounded-full text-xs border border-border/30 text-muted-foreground bg-muted/30"
      style={{ scale, opacity }}
    >
      {text}
    </motion.span>
  );
}

export function LandingPriceJustification() {
  const priceRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: priceRef, offset: ["start end", "center center"] });
  const priceScale = useSpring(useTransform(scrollYProgress, [0, 1], [0.85, 1]), springCfg);
  const priceOpacity = useSpring(useTransform(scrollYProgress, [0, 0.5], [0, 1]), springCfg);

  return (
    <ScrollLinked className="relative z-10 px-6 md:px-12 py-24 md:py-32">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-light text-foreground mb-8 tracking-tight">
            Por que o preço é <span className="text-primary">justo</span>?
          </h2>
          <p className="text-muted-foreground mb-8">Ferramentas separadas custariam:</p>

          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {tools.map((t, i) => (
              <ToolTag key={i} text={t} index={i} />
            ))}
          </div>

          <motion.div
            ref={priceRef}
            className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12"
            style={{ scale: priceScale, opacity: priceOpacity }}
          >
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">Separadas</p>
              <p className="text-4xl font-light text-destructive line-through">R$ 600 – R$ 1.200</p>
              <p className="text-xs text-muted-foreground/60 mt-1">/ mês</p>
            </div>
            <div className="text-4xl text-muted-foreground/30 hidden md:block">→</div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">Hub Completo</p>
              <p className="text-5xl font-light text-primary">R$ 149,90</p>
              <p className="text-xs text-muted-foreground/60 mt-1">/ mês</p>
            </div>
          </motion.div>

          <p className="text-sm text-muted-foreground/50 mt-10">
            Sem truques. Sem taxa escondida. Sem pegadinha.<br />
            <span className="text-foreground/60 font-medium">Preço Brasil. Produto nível global.</span>
          </p>
        </div>
      </div>
    </ScrollLinked>
  );
}
