import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const springCfg = { stiffness: 120, damping: 30 };

export function LandingCTA() {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useSpring(useTransform(scrollYProgress, [0, 1], [0.88, 1]), springCfg);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.5], [0, 1]), springCfg);

  return (
    <section className="relative z-10 px-6 md:px-12 py-7 md:py-10">
      <motion.div
        ref={ref}
        className="max-w-4xl mx-auto text-center"
        style={{ scale, opacity }}
      >
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-5"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Próximo passo</span>
        </motion.div>

        <h2 className="text-4xl md:text-6xl lg:text-7xl font-light text-foreground tracking-tight leading-[1.1]">
          Estruture sua agência<br />
          como uma <span className="text-primary font-normal">operação de verdade.</span>
        </h2>
        <p className="text-base md:text-lg text-muted-foreground mt-5 mb-10 max-w-xl mx-auto leading-relaxed">
          Centralize operação, automatize processos e ganhe escala.<br className="hidden md:block" />
          Comece em menos de 2 minutos.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Button
            size="lg"
            onClick={() => navigate("/login")}
            className="gap-2 bg-primary hover:bg-primary/90 h-14 px-12 text-base hover-invert"
          >
            Agendar Demonstração <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/login")}
            className="gap-2 h-14 px-10 text-base border-border/50 hover:border-primary/20 hover:bg-primary/5"
          >
            Solicitar Acesso
          </Button>
        </div>

        <p className="text-xs text-muted-foreground/40 mt-6">
          Sem cartão de crédito · Sem compromisso · Cancele quando quiser
        </p>
      </motion.div>
    </section>
  );
}
