import { RefObject } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Clapperboard, Palette } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";

interface LandingHeroProps {
  scrollContainerRef?: RefObject<HTMLDivElement>;
}

const maskContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
};

const maskChild = {
  hidden: { y: "100%", opacity: 0 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function LandingHero({ scrollContainerRef }: LandingHeroProps) {
  const navigate = useNavigate();
  const words = ["Construa.", "Gerencie.", "Execute.", "Venda."];

  return (
    <section className="relative z-10 px-6 md:px-12 pt-32 pb-12 md:pt-44 md:pb-28 min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div className="space-y-8">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span className="text-xs text-primary font-medium uppercase tracking-wider">Duas plataformas · Um ecossistema</span>
            </motion.div>

            {/* Text mask headline */}
            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-light text-foreground tracking-tight leading-[1.08]"
              variants={maskContainer}
              initial="hidden"
              animate="visible"
            >
              <span className="flex flex-wrap">
                {words.map((word, i) => (
                  <span key={i} className="overflow-hidden mr-[0.25em]">
                    <motion.span
                      variants={maskChild}
                      className={`inline-block ${i === words.length - 1 ? "text-primary font-normal" : ""}`}
                    >
                      {word}
                    </motion.span>
                  </span>
                ))}
              </span>
              <motion.span
                className="text-xl md:text-2xl text-muted-foreground font-light block mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.6 }}
              >
                Tudo em um único Hub inteligente.
              </motion.span>
            </motion.h1>

            {/* Sub */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            >
              <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                O primeiro ecossistema brasileiro que une:
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Clapperboard className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground/80">Produtora Cinematográfica</span>
                </div>
                <div className="flex items-center gap-3">
                  <Palette className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground/80">Marketing & Design</span>
                </div>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.4 }}
            >
              <Button
                size="lg"
                onClick={() => navigate('/login')}
                className="gap-2 bg-primary hover:bg-primary/90 px-8 h-12 hover-invert"
              >
                Começar Agora
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-border/50 hover:border-primary/20 hover:bg-primary/5 h-12 px-8"
              >
                <Play className="w-3.5 h-3.5" />
                Ver Planos
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="flex gap-10 pt-8 border-t border-border/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.6 }}
            >
              <div>
                <p className="text-3xl font-light text-foreground tracking-tight">+<AnimatedCounter value={500} /></p>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">Projetos</p>
              </div>
              <div>
                <p className="text-3xl font-light text-foreground tracking-tight"><AnimatedCounter value={98} suffix="%" /></p>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">Satisfação</p>
              </div>
            </motion.div>
          </div>

          {/* Hero visual */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="aspect-video rounded-2xl overflow-hidden border border-border/20 shadow-2xl bg-black relative">
              <video
                src="/videos/hero-demo.mp4"
                autoPlay loop muted playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/10 to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
