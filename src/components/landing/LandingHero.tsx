import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";
import { TextRevealByChar, MagneticElement, HoverSound, DepthBlur, ParallaxLayer } from "@/components/landing/effects";

const sp = { stiffness: 100, damping: 30 };

export function LandingHero() {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const videoY = useSpring(useTransform(scrollYProgress, [0, 0.4], [0, -60]), sp);
  const videoOpacity = useSpring(useTransform(scrollYProgress, [0.25, 0.4], [1, 0]), sp);

  const textOpacity = useSpring(useTransform(scrollYProgress, [0.3, 0.45], [0, 1]), sp);
  const textY = useSpring(useTransform(scrollYProgress, [0.3, 0.45], [60, 0]), sp);
  const textExitOpacity = useSpring(useTransform(scrollYProgress, [0.75, 1], [1, 0]), sp);
  const textExitY = useSpring(useTransform(scrollYProgress, [0.75, 1], [0, -80]), sp);

  return (
    <section ref={sectionRef} className="relative z-10 min-h-[150vh] md:min-h-[180vh]">
      {/* Hero with video card */}
      <motion.div
        className="sticky top-0 left-0 w-full h-[100dvh] flex flex-col items-center justify-center z-20 px-4 md:px-6"
        style={{ opacity: videoOpacity }}
      >
        {/* Text content */}
        <motion.div
          className="text-center max-w-5xl mb-6 md:mb-10"
          style={{ y: videoY }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-6 md:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <span className="text-[10px] md:text-xs text-white font-medium uppercase tracking-wider leading-tight text-center">
              CRM · Projetos · Financeiro · Portal · IA · Automação — Tudo em um
            </span>
          </motion.div>

          <TextRevealByChar
            text="O sistema operacional da agência moderna."
            as="h1"
            effect="rise"
            className="text-3xl sm:text-4xl md:text-6xl lg:text-[5.5rem] font-light text-white tracking-tight leading-[1.08]"
            highlightWords={["agência moderna"]}
            highlightClassName="text-primary font-normal"
            delay={0.3}
          />

          <motion.p
            className="text-base md:text-xl text-white/60 font-light mt-5 md:mt-7 max-w-2xl mx-auto leading-relaxed px-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
          >
            Centralize operação, clientes, projetos, financeiro e automações.
            <br className="hidden md:block" />
            Menos caos. Mais controle e crescimento.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 md:gap-4 mt-8 md:mt-9 px-4 sm:px-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.6 }}
          >
            <MagneticElement strength={0.3}>
              <HoverSound pitch={800}>
                <Button
                  size="lg"
                  onClick={() => navigate("/login")}
                  className="gap-2 bg-primary hover:bg-primary/90 h-12 md:h-14 px-8 md:px-10 text-sm md:text-base pointer-events-auto hover-invert w-full sm:w-auto"
                >
                  Agendar Demonstração <ArrowRight className="w-4 h-4" />
                </Button>
              </HoverSound>
            </MagneticElement>
            <MagneticElement strength={0.3}>
              <HoverSound pitch={600}>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 border-white/20 text-white hover:bg-white/10 h-12 md:h-14 px-6 md:px-8 pointer-events-auto w-full sm:w-auto"
                >
                  <Play className="w-3.5 h-3.5" /> Ver Como Funciona
                </Button>
              </HoverSound>
            </MagneticElement>
          </motion.div>
        </motion.div>

        {/* Video card */}
        <DepthBlur depth={0.3}>
          <motion.div
            className="w-full max-w-5xl hidden md:block"
            style={{ y: videoY }}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_80px_-20px_hsl(var(--primary)/0.25)] aspect-video bg-black">
              <video
                src="/videos/hero-demo.mp4"
                autoPlay loop muted playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none" />
            </div>
          </motion.div>
        </DepthBlur>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-6 md:bottom-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4 }}
        >
          <motion.div
            className="w-5 h-8 rounded-full border-2 border-white/30 flex items-start justify-center p-1"
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
      </motion.div>

      {/* Content revealed behind the video */}
      <div className="relative z-10 pt-[70dvh] md:pt-[75vh]">
        <motion.div
          className="sticky top-0 min-h-[100dvh] flex items-center px-4 md:px-12"
          style={{ opacity: textExitOpacity, y: textExitY }}
        >
          <motion.div
            className="max-w-7xl mx-auto w-full"
            style={{ opacity: textOpacity, y: textY }}
          >
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="space-y-6 md:space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15">
                  <span className="text-[10px] md:text-xs text-primary font-medium uppercase tracking-wider">Sistema Operacional para Agências</span>
                </div>

                <h2 className="text-3xl md:text-5xl lg:text-6xl font-light text-foreground tracking-tight leading-[1.08]">
                  Sua agência ainda opera<br className="hidden sm:block" />
                  em <span className="text-primary font-normal">mil ferramentas?</span>
                  <span className="text-base md:text-xl text-muted-foreground font-light block mt-4 md:mt-5">
                    Centralize tudo em uma única plataforma inteligente.
                  </span>
                </h2>

                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                    Uma plataforma completa com módulos integrados para toda a operação da agência:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["CRM", "Projetos", "Financeiro", "Contratos", "Portal do Cliente", "Automações", "IA", "Marketing OS"].map((mod) => (
                      <span key={mod} className="px-3 py-1.5 rounded-full bg-primary/6 border border-primary/10 text-xs text-foreground/70">
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4">
                  <Button size="lg" onClick={() => navigate('/login')} className="gap-2 bg-primary hover:bg-primary/90 px-8 h-12 hover-invert pointer-events-auto w-full sm:w-auto">
                    Agendar Demo <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2 border-border/50 hover:border-primary/20 hover:bg-primary/5 h-12 px-8 pointer-events-auto w-full sm:w-auto">
                    <Play className="w-3.5 h-3.5" /> Ver Planos
                  </Button>
                </div>

                <div className="flex gap-6 md:gap-10 pt-6 md:pt-8 border-t border-border/20">
                  <div>
                    <p className="text-2xl md:text-3xl font-light text-foreground tracking-tight">+<AnimatedCounter value={500} /></p>
                    <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider mt-1">Agências</p>
                  </div>
                  <div>
                    <p className="text-2xl md:text-3xl font-light text-foreground tracking-tight"><AnimatedCounter value={98} suffix="%" /></p>
                    <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider mt-1">Satisfação</p>
                  </div>
                  <div>
                    <p className="text-2xl md:text-3xl font-light text-foreground tracking-tight"><AnimatedCounter value={40} suffix="%" /></p>
                    <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider mt-1">+ Produtividade</p>
                  </div>
                </div>
              </div>

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
