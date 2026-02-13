import { motion } from "framer-motion";
import { Sparkles, Upload, Video, Undo2, FileText, Eye, Moon, Shield, Gem } from "lucide-react";

const items = [
  { icon: Sparkles, text: "IA que executa tarefas" },
  { icon: Upload, text: "Upload automático com descrição gerada" },
  { icon: Video, text: "Vídeos com autoplay preview" },
  { icon: Undo2, text: "Undo / Redo universal" },
  { icon: FileText, text: "PDF profissional no layout do sistema" },
  { icon: Eye, text: "Entregáveis organizados visualmente" },
  { icon: Moon, text: "Dark / Light mode" },
  { icon: Shield, text: "Arquitetura robusta" },
  { icon: Gem, text: "Experiência premium" },
];

export function LandingDifferentials() {
  return (
    <section className="relative z-10 px-6 md:px-12 py-24 md:py-32">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <h2 className="text-3xl md:text-5xl font-light text-foreground mb-4 tracking-tight">
            Não é só gestão. É <span className="text-primary neon-text">inteligência operacional</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-4 px-6 py-5 rounded-xl glass-card border border-border/30 group hover:border-primary/20 transition-colors duration-500"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-foreground/80 font-medium">{item.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
