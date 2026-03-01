import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";
import { ScrollLinked } from "./ScrollLinked";

const painPoints = [
  { text: "Tarefas espalhadas em 5 apps", icon: "📋" },
  { text: "Projetos sem visão geral", icon: "📊" },
  { text: "Arquivos perdidos em pastas", icon: "📁" },
  { text: "Financeiro na planilha", icon: "💸" },
  { text: "Cliente cobrando no WhatsApp", icon: "📱" },
  { text: "Marketing em uma ferramenta", icon: "📣" },
  { text: "Produtora em outra", icon: "🎬" },
  { text: "Nenhuma integração real", icon: "🔌" },
];

const springCfg = { stiffness: 120, damping: 30 };

function PainItem({ text, emoji, index }: { text: string; emoji: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const opacity = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1]), springCfg);
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [20, 0]), springCfg);
  const scale = useSpring(useTransform(scrollYProgress, [0, 1], [0.95, 1]), springCfg);

  return (
    <motion.div
      ref={ref}
      className="flex items-center gap-3 px-5 py-4 rounded-xl bg-destructive/5 border border-destructive/10 group hover:border-destructive/20 transition-colors duration-300"
      style={{ opacity, y, scale }}
    >
      <span className="text-base">{emoji}</span>
      <span className="text-sm text-foreground/70 group-hover:text-foreground/90 transition-colors">{text}</span>
    </motion.div>
  );
}

export function LandingProblem() {
  return (
    <ScrollLinked className="relative z-10 px-6 md:px-12 py-28 md:py-40">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/8 border border-destructive/15 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <AlertTriangle className="w-3 h-3 text-destructive" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-destructive font-medium">O problema</span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-light text-foreground tracking-tight leading-[1.1]">
            Agências e produtoras vivem<br />
            o <span className="text-destructive font-normal">mesmo drama</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-20">
          {painPoints.map((point, i) => (
            <PainItem key={i} text={point.text} emoji={point.icon} index={i} />
          ))}
        </div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <p className="text-xl md:text-3xl text-foreground/60 font-light leading-relaxed">
            Resultado? <span className="text-destructive font-normal">Caos operacional.</span><br className="hidden md:block" />
            Retrabalho. <span className="text-destructive font-normal">Perda de dinheiro.</span> Burnout.
          </p>
        </motion.div>
      </div>
    </ScrollLinked>
  );
}
