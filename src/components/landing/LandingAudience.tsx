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
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <h2 className="text-3xl md:text-4xl font-light text-foreground mb-10 tracking-tight">
            Para quem é
          </h2>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {audiences.map((a, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-2 px-5 py-3 rounded-full glass-card border border-border/30"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <Check className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm text-foreground/80">{a}</span>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="text-lg text-muted-foreground font-light"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          Se você vive de criatividade, <span className="text-primary font-normal">isso é para você.</span>
        </motion.p>
      </div>
    </section>
  );
}
