import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function LandingCTA() {
  const navigate = useNavigate();

  return (
    <section className="relative z-10 px-6 md:px-12 py-24 md:py-32">
      <motion.div
        className="max-w-4xl mx-auto text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <h2 className="text-3xl md:text-5xl font-light text-foreground mb-4 tracking-tight">
          Pare de <span className="text-primary">improvisar</span>
        </h2>
        <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
          Estruture sua operação como empresa de verdade.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Button
            size="lg"
            onClick={() => navigate('/login')}
            className="gap-2 bg-primary hover:bg-primary/90 h-14 px-10 text-lg hover-invert"
          >
            Começar Agora
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}
            className="gap-2 border-border/50 hover:border-primary/20 h-14 px-10"
          >
            Ver Planos Detalhados
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
