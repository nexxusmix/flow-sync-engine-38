import { motion } from "framer-motion";

const comparisons = [
  { them: "Enquanto outros usam 5 ferramentas…", us: "Você opera em um ecossistema inteligente." },
  { them: "Enquanto outros organizam manualmente…", us: "Sua IA executa." },
  { them: "Enquanto outros exportam PDFs feios…", us: "Você entrega documentos premium." },
];

export function LandingProof() {
  return (
    <section className="relative z-10 px-6 md:px-12 py-24 md:py-32">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Comparativo</span>
          <h2 className="text-3xl md:text-4xl font-light text-foreground mt-4 tracking-tight">
            Prova de <span className="text-primary">visão</span>
          </h2>
        </motion.div>

        <div className="space-y-4">
          {comparisons.map((c, i) => (
            <motion.div
              key={i}
              className="grid md:grid-cols-2 gap-3"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="px-5 py-4 rounded-xl bg-destructive/4 border border-destructive/8 text-sm text-muted-foreground/50 italic">
                {c.them}
              </div>
              <div className="px-5 py-4 rounded-xl bg-primary/4 border border-primary/8 text-sm text-foreground/80 font-medium">
                {c.us}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
