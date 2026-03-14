import { motion } from "framer-motion";
import { Shield, Lock, RefreshCw } from "lucide-react";
import { ScrollLinked } from "./ScrollLinked";

const guarantees = [
  {
    icon: Shield,
    title: "Garantia de 14 dias",
    desc: "Teste tudo sem risco. Se não gostar, devolvemos 100% do valor.",
  },
  {
    icon: Lock,
    title: "Dados protegidos",
    desc: "Infraestrutura enterprise com criptografia e backups automáticos.",
  },
  {
    icon: RefreshCw,
    title: "Cancele a qualquer hora",
    desc: "Sem multa, sem burocracia. Seus dados ficam disponíveis por 30 dias.",
  },
];

export function LandingGuarantee() {
  return (
    <ScrollLinked className="relative z-10 px-6 md:px-12 py-5 md:py-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {guarantees.map((g, i) => (
            <motion.div
              key={i}
              className="text-center p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className="w-12 h-12 rounded-full bg-primary/8 flex items-center justify-center mx-auto mb-4">
                <g.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-2">{g.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{g.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </ScrollLinked>
  );
}
