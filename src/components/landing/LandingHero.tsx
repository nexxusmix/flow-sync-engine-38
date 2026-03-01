import { RefObject, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Clapperboard, Palette } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";

interface LandingHeroProps {
  scrollContainerRef?: RefObject<HTMLDivElement>;
}

const maskContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.8 } },
};

const maskChild = {
  hidden: { y: "100%", opacity: 0 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const sp = { stiffness: 100, damping: 30 };

export function LandingHero({ scrollContainerRef }: LandingHeroProps) {
  const navigate = useNavigate();
  const words = ["Construa.", "Gerencie.", "Execute.", "Venda."];
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Fullscreen video: starts full, shrinks to card as you scroll
  const videoScale = useSpring(useTransform(scrollYProgress, [0, 0.45], [1, 0.55]), sp);
  const videoBorderRadius = useTransform(scrollYProgress, [0, 0.45], [0, 24]);
  const videoOpacity = useSpring(useTransform(scrollYProgress, [0.35, 0.55], [1, 0.15]), sp);

  // Text content: hidden behind video, reveals as video shrinks
  const textOpacity = useSpring(useTransform(scrollYProgress, [0.2, 0.45], [0, 1]), sp);
  const textY = useSpring(useTransform(scrollYProgress, [0.2, 0.5], [60, 0]), sp);

  // Parallax for text going up on further scroll
  const textExitOpacity = useSpring(useTransform(scrollYProgress, [0.7, 1], [1, 0]), sp);
  const textExitY = useSpring(useTransform(scrollYProgress, [0.7, 1], [0, -80]), sp);

  return (
    <section ref={sectionRef} className="relative z-10 min-h-[250vh]">
      {/* Fullscreen video overlay — sticky */}
      <motion.div
        className="sticky top-0 left-0 w-full h-screen flex items-center justify-center overflow-hidden pointer-events-none z-20"
        style={{ opacity: videoOpacity }}
      >
        <motion.div
          className="w-full h-full overflow-hidden"
          style={{ scale: videoScale, borderRadius: videoBorderRadius }}
        >
          <video
            src="/videos/hero-demo.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for text readability at start */}
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />

          {/* Initial headline on top of video */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            style={{ opacity: useTransform(scrollYProgress, [0, 0.2], [1, 0]) }}
          >
            <div className="text-center px-6">
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <span className="text-xs text-white font-medium uppercase tracking-wider">Uma plataforma · Todos os módulos</span>
              </motion.div>

              <motion.h1
                className="text-5xl md:text-7xl lg:text-8xl font-light text-white tracking-tight leading-[1.08]"
                variants={maskContainer}
                initial="hidden"
                animate="visible"
              >
                <span className="flex flex-wrap justify-center">
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
              </motion.h1>

              <motion.p
                className="text-lg md:text-xl text-white/60 font-light mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
              >
                Tudo em um único Hub inteligente.
              </motion.p>

              {/* Scroll indicator */}
              <motion.div
                className="mt-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
              >
                <motion.div
                  className="w-5 h-8 rounded-full border-2 border-white/30 mx-auto flex items-start justify-center p-1"
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div
                    className="w-1 h-2 bg-white/60 rounded-full"
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Content revealed behind the video */}
      <div className="relative z-10 pt-[110vh]">
        <motion.div
          className="sticky top-0 min-h-screen flex items-center px-6 md:px-12"
          style={{ opacity: textExitOpacity, y: textExitY }}
        >
          <motion.div
            className="max-w-7xl mx-auto w-full"
            style={{ opacity: textOpacity, y: textY }}
          >
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Text */}
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15">
                  <span className="text-xs text-primary font-medium uppercase tracking-wider">Uma plataforma · Todos os módulos</span>
                </div>

                <h2 className="text-4xl md:text-6xl lg:text-7xl font-light text-foreground tracking-tight leading-[1.08]">
                  <span className="flex flex-wrap">
                    {words.map((word, i) => (
                      <span key={i} className="mr-[0.25em]">
                        <span className={i === words.length - 1 ? "text-primary font-normal" : ""}>
                          {word}
                        </span>
                      </span>
                    ))}
                  </span>
                  <span className="text-xl md:text-2xl text-muted-foreground font-light block mt-4">
                    Tudo em um único Hub inteligente.
                  </span>
                </h2>

                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                    Uma plataforma com módulos integrados:
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <Clapperboard className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm text-foreground/80">Módulo Produtora</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Palette className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm text-foreground/80">Módulo Marketing & Design</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Button size="lg" onClick={() => navigate('/login')} className="gap-2 bg-primary hover:bg-primary/90 px-8 h-12 hover-invert pointer-events-auto">
                    Começar Agora <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2 border-border/50 hover:border-primary/20 hover:bg-primary/5 h-12 px-8 pointer-events-auto">
                    <Play className="w-3.5 h-3.5" /> Ver Planos
                  </Button>
                </div>

                <div className="flex gap-10 pt-8 border-t border-border/20">
                  <div>
                    <p className="text-3xl font-light text-foreground tracking-tight">+<AnimatedCounter value={500} /></p>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">Projetos</p>
                  </div>
                  <div>
                    <p className="text-3xl font-light text-foreground tracking-tight"><AnimatedCounter value={98} suffix="%" /></p>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">Satisfação</p>
                  </div>
                </div>
              </div>

              {/* Mini video card — the shrunken video lands here visually */}
              <div className="relative hidden lg:block">
                <div className="aspect-video rounded-2xl overflow-hidden border border-border/20 shadow-2xl bg-black relative">
                  <video src="/videos/hero-demo.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/10 to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
