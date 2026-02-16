import { RefObject } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Clapperboard, Palette } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";

interface LandingHeroProps {
  scrollContainerRef?: RefObject<HTMLDivElement>;
}

export function LandingHero({ scrollContainerRef }: LandingHeroProps) {
  const navigate = useNavigate();

  const wordVariants = {
    hidden: { opacity: 0, y: 40, filter: "blur(4px)" },
    visible: (i: number) => ({
      opacity: 1, y: 0, filter: "blur(0px)",
      transition: { delay: 0.3 + i * 0.12, type: "spring" as const, damping: 12, stiffness: 100 },
    }),
  };

  const words = ["Construa.", "Gerencie.", "Execute.", "Venda."];

  return (
    <section
      className="relative z-10 px-6 md:px-12 pt-32 pb-12 md:pt-44 md:pb-28 min-h-screen flex items-center"
    >
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div className="space-y-8">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 neon-badge"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="text-sm text-primary font-medium">Duas plataformas. Um ecossistema.</span>
            </motion.div>

            {/* Animated headline */}
            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-light text-foreground tracking-tight leading-[1.1]"
              initial="hidden"
              animate="visible"
              style={{ perspective: "1000px" }}
            >
              {words.map((word, i) => (
                <motion.span
                  key={i}
                  custom={i}
                  variants={wordVariants}
                  className={`inline-block mr-[0.25em] ${i === words.length - 1 ? "text-primary neon-text font-normal" : ""}`}
                >
                  {word}
                </motion.span>
              ))}
              <br />
              <motion.span
                className="text-2xl md:text-3xl text-muted-foreground font-light block mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
              >
                Tudo em um único Hub inteligente.
              </motion.span>
            </motion.h1>

            {/* Sub */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <p className="text-base text-muted-foreground max-w-lg leading-relaxed">
                O primeiro ecossistema brasileiro que une:
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Clapperboard className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-sm text-foreground/80">Produtora Cinematográfica</span>
                </div>
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-sm text-foreground/80">Marketing & Design</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground/60 pt-2">
                Separadas. Integradas. Poderosas.
              </p>
            </motion.div>

            {/* CTA */}
            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" onClick={() => navigate('/login')} className="gap-2 neon-button bg-primary hover:bg-primary/90 text-lg px-8 h-14">
                  Começar Agora
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="outline" className="gap-2 border-border/50 hover:border-primary/30 hover:bg-primary/5 h-14 px-8">
                  <Play className="w-4 h-4" />
                  Ver Planos
                </Button>
              </motion.div>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="flex gap-8 pt-8 border-t border-border/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.6 }}
            >
              <div>
                <p className="text-3xl font-light text-foreground">+<AnimatedCounter value={500} /></p>
                <p className="text-sm text-muted-foreground">Projetos gerenciados</p>
              </div>
              <div>
                <p className="text-3xl font-light text-foreground"><AnimatedCounter value={98} suffix="%" /></p>
                <p className="text-sm text-muted-foreground">Satisfação</p>
              </div>
            </motion.div>
          </div>

          {/* Hero visual */}
          <motion.div
            className="relative floating-video"
            initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ perspective: "1000px" }}
          >
            <div className="video-aura" />
            <div className="aspect-video rounded-2xl overflow-hidden border border-border/30 shadow-2xl bg-black relative">
              <video
                src="/videos/hero-demo.mp4"
                autoPlay loop muted playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
            </div>
            <motion.div
              className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-primary/20 blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-primary/15 blur-2xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
