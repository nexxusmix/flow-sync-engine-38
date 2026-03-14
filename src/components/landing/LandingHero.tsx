import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";

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

export function LandingHero() {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const videoY = useSpring(useTransform(scrollYProgress, [0, 0.5], [0, -60]), sp);
  const videoOpacity = useSpring(useTransform(scrollYProgress, [0.4, 0.6], [1, 0]), sp);

  const textOpacity = useSpring(useTransform(scrollYProgress, [0.25, 0.45], [0, 1]), sp);
  const textY = useSpring(useTransform(scrollYProgress, [0.25, 0.5], [60, 0]), sp);
  const textExitOpacity = useSpring(useTransform(scrollYProgress, [0.7, 1], [1, 0]), sp);
  const textExitY = useSpring(useTransform(scrollYProgress, [0.7, 1], [0, -80]), sp);

  return (
    <section ref={sectionRef} className="relative z-10 min-h-[250vh]">
      {/* Hero with video card */}
      <motion.div
        className="sticky top-0 left-0 w-full h-screen flex flex-col items-center justify-center z-20 px-6"
        style={{ opacity: videoOpacity }}
      >
        {/* Text content */}
        <motion.div
          className="text-center max-w-5xl mb-10"
          style={{ y: videoY }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <span className="text-xs text-white font-medium uppercase tracking-wider">
              CRM · Projetos · Financeiro · Portal · IA · Automação — Tudo em um
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl lg:text-[5.5rem] font-light text-white tracking-tight leading-[1.08]"
            variants={maskContainer}
            initial="hidden"
            animate="visible"
          >
            <span className="overflow-hidden block">
              <motion.span variants={maskChild} className="inline-block">
                O sistema operacional
              </motion.span>
            </span>
            <span className="overflow-hidden block">
              <motion.span variants={maskChild} className="inline-block">
                da <span className="text-primary font-normal">agência moderna.</span>
              </motion.span>
            </span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-white/60 font-light mt-6 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
          >
            Centralize operação, clientes, projetos, financeiro e automações.
            <br className="hidden md:block" />
            Menos caos. Mais controle e crescimento.
          </motion.p>

          <motion.div
            className="flex flex-wrap justify-center gap-4 mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.6 }}
          >
            <Button
              size="lg"
              onClick={() => navigate("/login")}
              className="gap-2 bg-primary hover:bg-primary/90 h-14 px-10 text-base pointer-events-auto hover-invert"
            >
              Agendar Demonstração <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-white/20 text-white hover:bg-white/10 h-14 px-8 pointer-events-auto"
            >
              <Play className="w-3.5 h-3.5" /> Ver Como Funciona
            </Button>
          </motion.div>
        </motion.div>

        {/* Video card with rounded borders */}
        <motion.div
          className="w-full max-w-5xl"
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

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8"
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
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15">
                  <span className="text-xs text-primary font-medium uppercase tracking-wider">Sistema Operacional para Agências</span>
                </div>

                <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-foreground tracking-tight leading-[1.08]">
                  Sua agência ainda opera<br />
                  em <span className="text-primary font-normal">mil ferramentas?</span>
                  <span className="text-lg md:text-xl text-muted-foreground font-light block mt-4">
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

                <div className="flex flex-wrap gap-4">
                  <Button size="lg" onClick={() => navigate('/login')} className="gap-2 bg-primary hover:bg-primary/90 px-8 h-12 hover-invert pointer-events-auto">
                    Agendar Demo <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2 border-border/50 hover:border-primary/20 hover:bg-primary/5 h-12 px-8 pointer-events-auto">
                    <Play className="w-3.5 h-3.5" /> Ver Planos
                  </Button>
                </div>

                <div className="flex gap-10 pt-8 border-t border-border/20">
                  <div>
                    <p className="text-3xl font-light text-foreground tracking-tight">+<AnimatedCounter value={500} /></p>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">Agências</p>
                  </div>
                  <div>
                    <p className="text-3xl font-light text-foreground tracking-tight"><AnimatedCounter value={98} suffix="%" /></p>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">Satisfação</p>
                  </div>
                  <div>
                    <p className="text-3xl font-light text-foreground tracking-tight"><AnimatedCounter value={40} suffix="%" /></p>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">+ Produtividade</p>
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
