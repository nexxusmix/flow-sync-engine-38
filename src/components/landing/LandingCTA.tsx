import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const springCfg = { stiffness: 120, damping: 30 };

export function LandingCTA() {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useSpring(useTransform(scrollYProgress, [0, 1], [0.88, 1]), springCfg);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.5], [0, 1]), springCfg);

  return (
    <section className="relative z-10 px-6 md:px-12 py-24 md:py-32">
      <motion.div
        ref={ref}
        className="max-w-4xl mx-auto text-center"
        style={{ scale, opacity }}
      >
        <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Próximo passo</span>
        <h2 className="text-3xl md:text-5xl font-light text-foreground mt-4 mb-4 tracking-tight">
          Pare de <span className="text-primary">improvisar</span>
        </h2>
        <p className="text-sm text-muted-foreground mb-10 max-w-xl mx-auto">
          Estruture sua operação como empresa de verdade.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" onClick={() => navigate('/login')} className="gap-2 bg-primary hover:bg-primary/90 h-12 px-10 hover-invert">
            Começar Agora <ArrowRight className="w-4 h-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })} className="gap-2 border-border/40 hover:border-primary/15 h-12 px-10">
            Ver Planos Detalhados
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
