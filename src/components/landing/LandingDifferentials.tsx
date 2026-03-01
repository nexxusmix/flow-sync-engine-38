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

const springCfg = { stiffness: 120, damping: 30 };

function DiffItem({ icon: Icon, text, index }: { icon: React.ElementType; text: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const opacity = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1]), springCfg);
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [20, 0]), springCfg);

  return (
    <motion.div
      ref={ref}
      className="flex items-center gap-4 px-5 py-4 rounded-xl border border-border/15 bg-card group hover:border-primary/12 transition-all duration-400"
      style={{ opacity, y }}
    >
      <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/12 transition-colors">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm text-foreground/80">{text}</span>
    </motion.div>
  );
}

export function LandingDifferentials() {
  return (
    <ScrollLinked className="relative z-10 px-6 md:px-12 py-24 md:py-32">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Diferenciais</span>
          <h2 className="text-3xl md:text-5xl font-light text-foreground mt-4 tracking-tight">
            Não é só gestão. É <span className="text-primary">inteligência operacional</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item, i) => (
            <DiffItem key={i} icon={item.icon} text={item.text} index={i} />
          ))}
        </div>
      </div>
    </ScrollLinked>
  );
}
