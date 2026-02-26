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
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <h2 className="text-3xl md:text-4xl font-light text-foreground tracking-tight">
            Prova de <span className="text-primary">visão</span>
          </h2>
        </motion.div>

        <div className="space-y-6">
          {comparisons.map((c, i) => (
            <motion.div
              key={i}
              className="grid md:grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="px-6 py-5 rounded-xl bg-destructive/5 border border-destructive/10 text-sm text-muted-foreground/60 italic">
                {c.them}
              </div>
              <div className="px-6 py-5 rounded-xl bg-primary/5 border border-primary/10 text-sm text-foreground/80 font-medium">
                {c.us}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
