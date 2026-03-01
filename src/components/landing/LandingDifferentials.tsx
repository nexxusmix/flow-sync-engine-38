import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Sparkles, Upload, Video, Undo2, FileText, Eye, Moon, Shield, Gem } from "lucide-react";
import { ScrollLinked } from "./ScrollLinked";

const items = [
  { icon: Sparkles, text: "IA que executa tarefas" },
  { icon: Upload, text: "Upload automático com descrição" },
  { icon: Video, text: "Vídeos com autoplay preview" },
  { icon: Undo2, text: "Undo / Redo universal" },
  { icon: FileText, text: "PDF profissional" },
  { icon: Eye, text: "Entregáveis organizados" },
  { icon: Moon, text: "Dark / Light mode" },
  { icon: Shield, text: "Arquitetura robusta" },
  { icon: Gem, text: "Experiência premium" },
];

const springCfg = { stiffness: 80, damping: 30 };

function DiffCard({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-4 px-6 py-5 rounded-xl border border-border/15 bg-card group hover:border-primary/12 transition-all duration-400 shrink-0 min-w-[220px]">
      <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/12 transition-colors">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm text-foreground/80 whitespace-nowrap">{text}</span>
    </div>
  );
}

export function LandingDifferentials() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Row 1 moves left, Row 2 moves right as you scroll down
  const x1 = useSpring(useTransform(scrollYProgress, [0, 1], [100, -300]), springCfg);
  const x2 = useSpring(useTransform(scrollYProgress, [0, 1], [-300, 100]), springCfg);

  const row1 = items.slice(0, 5);
  const row2 = items.slice(5);

  return (
    <ScrollLinked className="relative z-10 py-24 md:py-32" yIn={40} yOut={-20}>
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Diferenciais</span>
          <h2 className="text-3xl md:text-5xl font-light text-foreground mt-4 tracking-tight">
            Não é só gestão. É <span className="text-primary">inteligência operacional</span>
          </h2>
        </div>
      </div>

      <div ref={sectionRef} className="overflow-hidden space-y-3">
        {/* Row 1 — slides left */}
        <motion.div className="flex gap-3" style={{ x: x1 }}>
          {[...row1, ...row1].map((item, i) => (
            <DiffCard key={`r1-${i}`} icon={item.icon} text={item.text} />
          ))}
        </motion.div>

        {/* Row 2 — slides right */}
        <motion.div className="flex gap-3" style={{ x: x2 }}>
          {[...row2, ...row2, ...row2].map((item, i) => (
            <DiffCard key={`r2-${i}`} icon={item.icon} text={item.text} />
          ))}
        </motion.div>
      </div>
    </ScrollLinked>
  );
}
