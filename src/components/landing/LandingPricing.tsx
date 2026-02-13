import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Star, Clapperboard, Palette, Zap } from "lucide-react";

interface PlanCardProps {
  icon: React.ElementType;
  emoji: string;
  name: string;
  ideal: string;
  price: string;
  features: string[];
  recommended?: boolean;
  accent?: string;
  delay?: number;
}

function PlanCard({ icon: Icon, emoji, name, ideal, price, features, recommended, accent = "hsl(var(--primary))", delay = 0 }: PlanCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      className={`relative glass-card rounded-2xl border overflow-hidden flex flex-col ${
        recommended
          ? "border-primary/40 shadow-[0_0_60px_-20px_hsl(var(--primary)/0.3)]"
          : "border-border/50"
      }`}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
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

        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            className={`w-full gap-2 h-12 ${recommended ? "neon-button bg-primary hover:bg-primary/90" : ""}`}
            variant={recommended ? "default" : "outline"}
            onClick={() => navigate('/login')}
          >
            Começar Agora
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function LandingPricing() {
  return (
    <section className="relative z-10 px-6 md:px-12 py-24 md:py-32" id="planos">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <h2 className="text-3xl md:text-5xl font-light text-foreground mb-4 tracking-tight">
            Você escolhe o <span className="text-primary neon-text">plano</span>
          </h2>
          <p className="text-muted-foreground">Preço justo Brasil. Produto nível global.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
          <PlanCard
            icon={Clapperboard}
            emoji="🎬"
            name="Produtora"
            ideal="Ideal para produtoras, filmmakers e equipes audiovisuais."
            price="R$ 57"
            features={[
              "Gestão completa de projetos",
              "Controle financeiro",
              "Entregáveis com preview",
              "IA de automação",
              "PDF premium",
            ]}
            delay={0}
          />

          <PlanCard
            icon={Zap}
            emoji="⚡"
            name="Hub Completo"
            ideal="Produtora + Marketing integrados. Fluxo completo."
            price="R$ 149,90"
            recommended
            features={[
              "Acesso às duas plataformas",
              "Fluxo completo do projeto à entrega",
              "Gestão criativa + execução",
              "Inteligência artificial total",
              "Automação completa",
            ]}
            delay={0.1}
          />

          <PlanCard
            icon={Palette}
            emoji="🎨"
            name="Marketing & Design"
            ideal="Ideal para agências, social media e designers."
            price="R$ 97,90"
            accent="hsl(210,100%,55%)"
            features={[
              "Planejamento de conteúdo",
              "Branding",
              "Roteiros com IA",
              "Gestão de clientes",
              "Organização criativa",
              "Exportações profissionais",
            ]}
            delay={0.2}
          />
        </div>
      </div>
    </section>
  );
}
