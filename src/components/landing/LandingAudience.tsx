import { motion } from "framer-motion";
import { Check } from "lucide-react";

const audiences = [
  "Produtores independentes",
  "Agências criativas",
  "Social media",
  "Designers",
  "Estúdios audiovisuais",
  "Freelancers estruturados",
  "Equipes híbridas",
];

export function LandingAudience() {
  return (
    <section className="relative z-10 px-6 md:px-12 py-24">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Público</span>
          <h2 className="text-3xl md:text-4xl font-light text-foreground mt-4 mb-10 tracking-tight">
            Para quem é
          </h2>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-2.5 mb-10">
          {audiences.map((a, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-border/20 bg-card"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
            >
              <Check className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-sm text-foreground/80">{a}</span>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="text-lg text-muted-foreground font-light"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          Se você vive de criatividade, <span className="text-primary font-normal">isso é para você.</span>
        </motion.p>
      </div>
    </section>
  );
}
