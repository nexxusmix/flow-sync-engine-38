import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { TextRevealByChar, MagneticElement } from "@/components/landing/effects";

export function LandingHero() {
  const navigate = useNavigate();

  return (
    <section className="relative z-10 min-h-[100dvh] flex flex-col items-center justify-center px-4 md:px-6">
      {/* Text content */}
      <div className="text-center max-w-5xl mb-6 md:mb-10">
        <motion.div
          className="inline-flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-6 md:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <span className="text-[10px] md:text-xs text-white font-medium uppercase tracking-wider leading-tight text-center">
            CRM · Projetos · Financeiro · Portal · IA · Automacao — Tudo em um
          </span>
        </motion.div>

        <TextRevealByChar
          text="O sistema operacional da agencia moderna."
          as="h1"
          effect="rise"
          className="text-3xl sm:text-4xl md:text-6xl lg:text-[5.5rem] font-light text-white tracking-tight leading-[1.08]"
          highlightWords={["agencia moderna"]}
          highlightClassName="text-primary font-normal"
          delay={0.3}
        />

        <motion.p
          className="text-base md:text-xl text-white/60 font-light mt-5 md:mt-7 max-w-2xl mx-auto leading-relaxed px-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
        >
          Centralize operacao, clientes, projetos, financeiro e automacoes.
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
            <Button
              size="lg"
              onClick={() => navigate("/login")}
              className="gap-2 bg-primary hover:bg-primary/90 h-12 md:h-14 px-8 md:px-10 text-sm md:text-base pointer-events-auto hover-invert w-full sm:w-auto"
            >
              Agendar Demonstracao <ArrowRight className="w-4 h-4" />
            </Button>
          </MagneticElement>
          <MagneticElement strength={0.3}>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-white/20 text-white hover:bg-white/10 h-12 md:h-14 px-6 md:px-8 pointer-events-auto w-full sm:w-auto"
            >
              <Play className="w-3.5 h-3.5" /> Ver Como Funciona
            </Button>
          </MagneticElement>
        </motion.div>
      </div>

      {/* Video card */}
      <motion.div
        className="w-full max-w-5xl hidden md:block"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_80px_-20px_hsl(var(--primary)/0.25)] aspect-video bg-black">
          <video
            src="/videos/hero-demo.mp4"
            poster="/images/hero-poster.webp"
            autoPlay loop muted playsInline
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLVideoElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none" />
        </div>
      </motion.div>

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
    </section>
  );
}
