import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Check } from "lucide-react";
import { ScrollLinked } from "./ScrollLinked";

const audiences = [
  "Produtores independentes", "Agências criativas", "Social media",
  "Designers", "Estúdios audiovisuais", "Freelancers estruturados", "Equipes híbridas",
];

const springCfg = { stiffness: 120, damping: 30 };

function AudienceTag({ text, index }: { text: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useSpring(useTransform(scrollYProgress, [0, 1], [0.9, 1]), springCfg);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1]), springCfg);

  return (
    <motion.div
      ref={ref}
      className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-border/20 bg-card"
      style={{ scale, opacity }}
    >
      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
      <span className="text-sm text-foreground/80">{text}</span>
    </motion.div>
  );
}

export function LandingAudience() {
  return (
    <ScrollLinked className="relative z-10 px-6 md:px-12 py-24">
      <div className="max-w-4xl mx-auto text-center">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Público</span>
          <h2 className="text-3xl md:text-4xl font-light text-foreground mt-4 mb-10 tracking-tight">
            Para quem é
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-2.5 mb-10">
          {audiences.map((a, i) => (
            <AudienceTag key={i} text={a} index={i} />
          ))}
        </div>

        <p className="text-lg text-muted-foreground font-light">
          Se você vive de criatividade, <span className="text-primary font-normal">isso é para você.</span>
        </p>
      </div>
    </ScrollLinked>
  );
}
