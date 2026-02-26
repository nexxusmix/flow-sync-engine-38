import { motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

const painPoints = [
  "Tarefas espalhadas",
  "Projetos sem controle",
  "Arquivos perdidos",
  "Financeiro desconectado",
  "Cliente cobrando no WhatsApp",
  "Marketing em outra ferramenta",
  "Produtora em outra",
  "CRM em outra",
];

/* Text mask for the title */
const maskContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const maskChild = {
  hidden: { y: "100%", opacity: 0 },
  visible: { y: "0%", opacity: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

export function LandingProblem() {
  const titleWords = "Agências e produtoras vivem o mesmo drama".split(" ");

  return (
    <section className="relative z-10 px-6 md:px-12 py-24 md:py-32">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 mb-6">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            <span className="text-xs text-destructive font-medium uppercase tracking-wider">O problema</span>
          </div>
          <motion.h2
            className="text-3xl md:text-5xl font-light text-foreground mb-4 tracking-tight flex flex-wrap justify-center"
            variants={maskContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {titleWords.map((word, i) => (
              <span key={i} className="overflow-hidden mr-[0.25em]">
                <motion.span
                  variants={maskChild}
                  className={`inline-block ${["mesmo", "drama"].includes(word) ? "text-destructive" : ""}`}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </motion.h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-16">
          {painPoints.map((point, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-destructive/5 border border-destructive/10 image-ease-in"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
            >
              <X className="w-3.5 h-3.5 text-destructive/60 shrink-0" />
              <span className="text-sm text-foreground/70">{point}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xl md:text-2xl text-foreground/60 font-light">
            Resultado? <span className="text-destructive font-normal">Caos operacional.</span> Retrabalho. <span className="text-destructive font-normal">Perda de dinheiro.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
