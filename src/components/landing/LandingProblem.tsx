import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { X } from "lucide-react";
import { ScrollLinked } from "./ScrollLinked";

const painPoints = [
  "Tarefas espalhadas",
  "Projetos sem controle",
  "Arquivos perdidos",
  "Financeiro desconectado",
  "Cliente cobrando no WhatsApp",
  "Marketing em outra ferramenta",
  "Produtora em outra",
  "CRM em outra",
];

const springCfg = { stiffness: 120, damping: 30 };

function PainItem({ text, index, total }: { text: string; index: number; total: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const opacity = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1]), springCfg);
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [20, 0]), springCfg);

  return (
    <motion.div
      ref={ref}
      className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-destructive/5 border border-destructive/8"
      style={{ opacity, y }}
    >
      <X className="w-3 h-3 text-destructive/50 shrink-0" />
      <span className="text-sm text-foreground/70">{text}</span>
    </motion.div>
  );
}

export function LandingProblem() {
  return (
    <ScrollLinked className="relative z-10 px-6 md:px-12 py-24 md:py-32">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[10px] uppercase tracking-[0.2em] text-destructive font-medium">O problema</span>
          <h2 className="text-3xl md:text-5xl font-light text-foreground mt-4 tracking-tight">
            Agências e produtoras vivem o <span className="text-destructive">mesmo drama</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-16">
          {painPoints.map((point, i) => (
            <PainItem key={i} text={point} index={i} total={painPoints.length} />
          ))}
        </div>

        <p className="text-center text-xl md:text-2xl text-foreground/60 font-light">
          Resultado? <span className="text-destructive font-normal">Caos operacional.</span> Retrabalho. <span className="text-destructive font-normal">Perda de dinheiro.</span>
        </p>
      </div>
    </ScrollLinked>
  );
}
