import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ScrollLinked } from "./ScrollLinked";
import { AnimatedCounter } from "./AnimatedCounter";

const tools = [
  { name: "Gestão de tarefas", price: "R$ 80" },
  { name: "CRM", price: "R$ 120" },
  { name: "Financeiro", price: "R$ 150" },
  { name: "Planejamento editorial", price: "R$ 100" },
  { name: "Storyboard / IA", price: "R$ 200" },
  { name: "Armazenamento", price: "R$ 50" },
  { name: "Portal do cliente", price: "R$ 100" },
  { name: "Automação", price: "R$ 200" },
];

const springCfg = { stiffness: 120, damping: 30 };

function ToolRow({ name, price, index }: { name: string; price: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const opacity = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1]), springCfg);
  const x = useSpring(useTransform(scrollYProgress, [0, 1], [-20, 0]), springCfg);

  return (
    <motion.div
      ref={ref}
      className="flex items-center justify-between py-3 border-b border-border/10 last:border-0"
      style={{ opacity, x }}
    >
      <span className="text-sm text-muted-foreground">{name}</span>
      <span className="text-sm text-destructive/60 line-through">{price}/mês</span>
    </motion.div>
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
        <div className="text-center mb-14 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-light text-foreground tracking-tight leading-[1.1]">
            Por que o preço é <span className="text-primary">justo</span>?
          </h2>
          <p className="text-base md:text-lg text-muted-foreground mt-5 leading-relaxed">Se você contratasse cada ferramenta separadamente:</p>
        </div>

        <div className="max-w-md mx-auto mb-12 rounded-2xl border border-border/20 bg-card p-6">
          {tools.map((t, i) => (
            <ToolRow key={i} name={t.name} price={t.price} index={i} />
          ))}
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-border/20">
            <span className="text-sm font-medium text-foreground">Total mensal</span>
            <span className="text-lg text-destructive font-medium line-through">R$ 1.000+</span>
          </div>
        </div>

        <motion.div
          ref={priceRef}
          className="text-center"
          style={{ scale: priceScale, opacity: priceOpacity }}
        >
          <div className="inline-flex flex-col items-center gap-2 px-12 py-8 rounded-2xl border border-primary/20 bg-primary/5">
            <p className="text-sm text-primary uppercase tracking-wider font-medium">Hub Completo</p>
            <p className="text-6xl md:text-7xl font-light text-primary tracking-tight">R$ 129</p>
            <p className="text-sm text-muted-foreground">por mês · tudo incluso</p>
          </div>

          <p className="text-sm text-muted-foreground/50 mt-10 max-w-md mx-auto">
            Sem truques. Sem taxa escondida. Sem pegadinha.<br />
            <span className="text-foreground/60 font-medium">Preço Brasil. Produto nível global.</span>
          </p>
        </motion.div>
      </div>
    </ScrollLinked>
  );
}
