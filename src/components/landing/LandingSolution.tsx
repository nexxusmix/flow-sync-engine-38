import { motion } from "framer-motion";
import { Check, Clapperboard, Palette, Sparkles } from "lucide-react";

const filmFeatures = [
  "Pipeline visual de projetos",
  "Tarefas inteligentes com IA",
  "Entregáveis com preview automático",
  "Upload com IA",
  "Cronograma integrado",
  "Financeiro integrado",
  "Exportação profissional em PDF",
  "Portal do cliente",
  "IA que executa por comando de voz",
];

const marketingFeatures = [
  "Gestão de clientes",
  "Planejamento editorial",
  "Calendário de conteúdo",
  "Roteirização com IA",
  "Branding & Logomarca",
  "Biblioteca criativa",
  "Upload inteligente",
  "Correção gramatical automática",
  "Geração de storyboards",
  "Exportações premium",
];

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <motion.li
          key={i}
          className="flex items-start gap-2.5"
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.04 }}
        >
          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span className="text-sm text-muted-foreground">{item}</span>
        </motion.li>
      ))}
    </ul>
  );
}

export function LandingSolution() {
  return (
    <section className="relative z-10 px-6 md:px-12 py-24 md:py-32">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-primary font-medium uppercase tracking-wider">A solução</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-light text-foreground mb-4 tracking-tight">
            O HUB nasceu para <span className="text-primary">centralizar tudo</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Você escolhe como quer usar:
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Film Hub */}
          <motion.div
            className="rounded-2xl border border-border/30 overflow-hidden group hover:border-primary/20 transition-all duration-500 bg-card image-ease-in"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="p-8 border-b border-border/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clapperboard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <span className="text-xs text-primary/60 uppercase tracking-wider font-medium">🎬</span>
                  <h3 className="text-xl font-medium text-foreground">Hub Produtora</h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Gestão completa de projetos audiovisuais.</p>
            </div>
            <div className="p-8">
              <FeatureList items={filmFeatures} />
            </div>
          </motion.div>

          {/* Marketing Hub */}
          <motion.div
            className="rounded-2xl border border-border/30 overflow-hidden group hover:border-primary/20 transition-all duration-500 bg-card image-ease-in"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="p-8 border-b border-border/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Palette className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <span className="text-xs text-primary/60 uppercase tracking-wider font-medium">🎨</span>
                  <h3 className="text-xl font-medium text-foreground">Hub Marketing & Design</h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Plataforma dedicada para agências e social media.</p>
            </div>
            <div className="p-8">
              <FeatureList items={marketingFeatures} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
