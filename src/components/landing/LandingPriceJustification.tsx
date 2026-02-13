import { motion } from "framer-motion";

const tools = [
  "Gestão de tarefas",
  "CRM",
  "Financeiro",
  "Planejamento editorial",
  "Storyboard",
  "IA",
  "Armazenamento",
  "Portal cliente",
];

export function LandingPriceJustification() {
  return (
    <section className="relative z-10 px-6 md:px-12 py-24 md:py-32">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <h2 className="text-3xl md:text-4xl font-light text-foreground mb-8 tracking-tight">
            Por que o preço é <span className="text-primary neon-text">justo</span>?
          </h2>
          <p className="text-muted-foreground mb-8">Ferramentas separadas custariam:</p>

          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {tools.map((t, i) => (
              <motion.span
                key={i}
                className="px-3 py-1.5 rounded-full text-xs border border-border/50 text-muted-foreground bg-muted/30"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                {t}
              </motion.span>
            ))}
          </div>

          <motion.div
            className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">Separadas</p>
              <p className="text-4xl font-light text-destructive line-through">R$ 600 – R$ 1.200</p>
              <p className="text-xs text-muted-foreground/60 mt-1">/ mês</p>
            </div>
            <div className="text-4xl text-muted-foreground/30 hidden md:block">→</div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">Hub Completo</p>
              <p className="text-5xl font-light text-primary neon-text">R$ 149,90</p>
              <p className="text-xs text-muted-foreground/60 mt-1">/ mês</p>
            </div>
          </motion.div>

          <motion.p
            className="text-sm text-muted-foreground/50 mt-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            Sem truques. Sem taxa escondida. Sem pegadinha.<br />
            <span className="text-foreground/60 font-medium">Preço Brasil. Produto nível global.</span>
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
