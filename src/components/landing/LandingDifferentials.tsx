import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Sparkles, Upload, Video, Undo2, FileText, Eye, Moon, Shield, Gem, Mic } from "lucide-react";
import { ScrollLinked } from "./ScrollLinked";

const items = [
  { icon: Sparkles, text: "IA que executa tarefas" },
  { icon: Mic, text: "Comandos por voz" },
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
    <div className="flex items-center gap-4 px-6 py-5 rounded-xl border border-border/15 bg-card group hover:border-primary/15 transition-all duration-400 shrink-0 min-w-[240px]">
      <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/12 transition-colors">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm text-foreground/80 whitespace-nowrap font-medium">{text}</span>
    </div>
  );
}

export function LandingDifferentials() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const x1 = useSpring(useTransform(scrollYProgress, [0, 1], [100, -400]), springCfg);
  const x2 = useSpring(useTransform(scrollYProgress, [0, 1], [-400, 100]), springCfg);

  const row1 = items.slice(0, 5);
  const row2 = items.slice(5);

  return (
    <ScrollLinked className="relative z-10 py-28 md:py-40" yIn={40} yOut={-20}>
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Gem className="w-3 h-3 text-primary" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Diferenciais</span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-light text-foreground tracking-tight leading-[1.1]">
            Não é só gestão.<br />
            É <span className="text-primary">inteligência operacional</span>
          </h2>
        </div>
      </div>

      <div ref={sectionRef} className="overflow-hidden space-y-3">
        <motion.div className="flex gap-3" style={{ x: x1 }}>
          {[...row1, ...row1, ...row1].map((item, i) => (
            <DiffCard key={`r1-${i}`} icon={item.icon} text={item.text} />
          ))}
        </motion.div>
        <motion.div className="flex gap-3" style={{ x: x2 }}>
          {[...row2, ...row2, ...row2].map((item, i) => (
            <DiffCard key={`r2-${i}`} icon={item.icon} text={item.text} />
          ))}
        </motion.div>
      </div>
    </ScrollLinked>
  );
}
