import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ScrollLinked } from "./ScrollLinked";

const comparisons = [
  { them: "Enquanto outros usam 5 ferramentas…", us: "Você opera em um ecossistema inteligente." },
  { them: "Enquanto outros organizam manualmente…", us: "Sua IA executa." },
  { them: "Enquanto outros exportam PDFs feios…", us: "Você entrega documentos premium." },
];

const springCfg = { stiffness: 120, damping: 30 };

function ComparisonRow({ them, us, index }: { them: string; us: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const xLeft = useSpring(useTransform(scrollYProgress, [0, 1], [-40, 0]), springCfg);
  const xRight = useSpring(useTransform(scrollYProgress, [0, 1], [40, 0]), springCfg);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.6], [0, 1]), springCfg);

  return (
    <motion.div ref={ref} className="grid md:grid-cols-2 gap-3" style={{ opacity }}>
      <motion.div className="px-5 py-4 rounded-xl bg-destructive/4 border border-destructive/8 text-sm text-muted-foreground/50 italic" style={{ x: xLeft }}>
        {them}
      </motion.div>
      <motion.div className="px-5 py-4 rounded-xl bg-primary/4 border border-primary/8 text-sm text-foreground/80 font-medium" style={{ x: xRight }}>
        {us}
      </motion.div>
    </motion.div>
  );
}

export function LandingProof() {
  return (
    <ScrollLinked className="relative z-10 px-6 md:px-12 py-24 md:py-32">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-mono uppercase tracking-[0.2em] text-primary font-medium">Comparativo</span>
          <h2 className="text-3xl md:text-4xl font-light text-foreground mt-4 tracking-tight">
            Prova de <span className="text-primary">visão</span>
          </h2>
        </div>

        <div className="space-y-4">
          {comparisons.map((c, i) => (
            <ComparisonRow key={i} them={c.them} us={c.us} index={i} />
          ))}
        </div>
      </div>
    </ScrollLinked>
  );
}
