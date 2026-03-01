import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Star, Clapperboard, Palette, Zap } from "lucide-react";
import { ScrollLinked } from "./ScrollLinked";

interface PlanCardProps {
  icon: React.ElementType;
  emoji: string;
  name: string;
  ideal: string;
  price: string;
  features: string[];
  recommended?: boolean;
  accent?: string;
  parallaxSpeed?: number;
}

const springCfg = { stiffness: 120, damping: 30 };

function PlanCard({ icon: Icon, emoji, name, ideal, price, features, recommended, accent = "hsl(var(--primary))", parallaxSpeed = 0 }: PlanCardProps) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [parallaxSpeed * 40, parallaxSpeed * -40]), springCfg);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0.6]), springCfg);

  return (
    <motion.div
      ref={ref}
      className={`relative rounded-2xl border overflow-hidden flex flex-col bg-card transition-all duration-500 ${
        recommended ? "border-primary/30 shadow-[0_0_40px_-20px_hsl(var(--primary)/0.2)]" : "border-border/30 hover:border-primary/15"
      }`}
      style={{ y, opacity }}
    >
      {recommended && (
        <div className="bg-primary text-primary-foreground text-center py-2 text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-1.5">
          <Star className="w-3 h-3" /> Recomendado
        </div>
      )}
      <div className="p-8 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}15` }}>
            <Icon className="w-5 h-5" style={{ color: accent }} />
          </div>
          <span className="text-lg font-medium text-foreground">{emoji} {name}</span>
        </div>
        <p className="text-xs text-muted-foreground mb-6">{ideal}</p>
        <div className="mb-6">
          <span className="text-4xl font-light text-foreground tracking-tight">{price}</span>
          <span className="text-sm text-muted-foreground"> / mês</span>
        </div>
        <ul className="space-y-2.5 flex-1 mb-8">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{f}</span>
            </li>
          ))}
        </ul>
        <Button
          className={`w-full gap-2 h-12 hover-invert ${recommended ? "bg-primary hover:bg-primary/90" : ""}`}
          variant={recommended ? "default" : "outline"}
          onClick={() => navigate('/login')}
        >
          Começar Agora <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

export function LandingPricing() {
  return (
    <ScrollLinked className="relative z-10 px-6 md:px-12 py-24 md:py-32" yIn={40} yOut={-20}>
      <div className="max-w-6xl mx-auto" id="planos">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-light text-foreground mb-4 tracking-tight">
            Você escolhe o <span className="text-primary">plano</span>
          </h2>
          <p className="text-muted-foreground">Preço justo Brasil. Produto nível global.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
          <PlanCard icon={Clapperboard} emoji="🎬" name="Produtora" ideal="Ideal para produtoras, filmmakers e equipes audiovisuais." price="R$ 57" features={["Gestão completa de projetos", "Controle financeiro", "Entregáveis com preview", "IA de automação", "PDF premium"]} parallaxSpeed={1} />
          <PlanCard icon={Zap} emoji="⚡" name="Hub Completo" ideal="Produtora + Marketing integrados. Fluxo completo." price="R$ 129" recommended features={["Todos os módulos inclusos", "Fluxo completo do projeto à entrega", "Gestão criativa + execução", "Inteligência artificial total", "Automação completa"]} parallaxSpeed={-0.5} />
          <PlanCard icon={Palette} emoji="🎨" name="Marketing & Design" ideal="Ideal para agências, social media e designers." price="R$ 99" accent="hsl(var(--primary))" features={["Planejamento de conteúdo", "Branding", "Roteiros com IA", "Gestão de clientes", "Organização criativa", "Exportações profissionais"]} parallaxSpeed={0.8} />
        </div>
      </div>
    </ScrollLinked>
  );
}
