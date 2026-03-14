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
  originalPrice?: string;
  features: string[];
  recommended?: boolean;
  parallaxSpeed?: number;
}

const springCfg = { stiffness: 120, damping: 30 };

function PlanCard({ icon: Icon, emoji, name, ideal, price, originalPrice, features, recommended, parallaxSpeed = 0 }: PlanCardProps) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [parallaxSpeed * 40, parallaxSpeed * -40]), springCfg);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0.6]), springCfg);

  return (
    <motion.div
      ref={ref}
      className={`relative rounded-2xl border overflow-hidden flex flex-col bg-card transition-all duration-500 ${
        recommended ? "border-primary/30 shadow-[0_0_60px_-20px_hsl(var(--primary)/0.25)] scale-[1.02]" : "border-border/30 hover:border-primary/15"
      }`}
      style={{ y, opacity }}
    >
      {recommended && (
        <div className="bg-primary text-primary-foreground text-center py-2.5 text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-1.5">
          <Star className="w-3 h-3" /> Mais Popular
        </div>
      )}
      <div className="p-8 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/8">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <span className="text-lg font-medium text-foreground">{emoji} {name}</span>
        </div>
        <p className="text-xs text-muted-foreground mb-6 leading-relaxed">{ideal}</p>
        <div className="mb-6">
          {originalPrice && (
            <span className="text-sm text-muted-foreground/50 line-through mr-2">{originalPrice}</span>
          )}
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
          onClick={() => navigate("/login")}
        >
          Começar Agora <ArrowRight className="w-4 h-4" />
        </Button>
        <p className="text-[10px] text-muted-foreground/40 text-center mt-3">Sem cartão. Cancele quando quiser.</p>
      </div>
    </motion.div>
  );
}

export function LandingPricing() {
  return (
    <ScrollLinked className="relative z-10 px-6 md:px-12 py-7 md:py-10" yIn={40} yOut={-20}>
      <div className="max-w-6xl mx-auto" id="planos">
        <div className="text-center mb-14 md:mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-5"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Planos</span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-light text-foreground tracking-tight leading-[1.1]">
            Escolha o plano ideal<br />
            para o seu <span className="text-primary">momento</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground mt-5 leading-relaxed">Preço justo Brasil. Produto nível global.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
          <PlanCard
            icon={Clapperboard}
            emoji="🎬"
            name="Produtora"
            ideal="Ideal para produtoras, filmmakers e equipes audiovisuais."
            price="R$ 57"
            features={["Gestão completa de projetos", "Controle financeiro por projeto", "Entregáveis com preview", "IA de automação", "PDF premium", "Portal do cliente"]}
            parallaxSpeed={1}
          />
          <PlanCard
            icon={Zap}
            emoji="⚡"
            name="Hub Completo"
            ideal="Produtora + Marketing integrados. Operação unificada."
            price="R$ 129"
            originalPrice="R$ 156"
            recommended
            features={["Todos os módulos inclusos", "Fluxo completo: projeto → entrega", "Gestão criativa + execução", "Inteligência artificial total", "Automação completa", "Suporte prioritário"]}
            parallaxSpeed={-0.5}
          />
          <PlanCard
            icon={Palette}
            emoji="🎨"
            name="Marketing & Design"
            ideal="Ideal para agências, social media e designers."
            price="R$ 99"
            features={["Planejamento de conteúdo", "Branding & Identidade visual", "Roteiros com IA", "Gestão de clientes", "Biblioteca criativa", "Exportações profissionais"]}
            parallaxSpeed={0.8}
          />
        </div>
      </div>
    </ScrollLinked>
  );
}
