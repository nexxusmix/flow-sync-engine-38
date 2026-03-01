import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { ScrollLinked } from "./ScrollLinked";

const faqs = [
  {
    q: "Preciso pagar por cada módulo separadamente?",
    a: "Não. O plano Hub Completo inclui todos os módulos (Produtora + Marketing) por um preço único. Você também pode contratar módulos individuais se preferir.",
  },
  {
    q: "Posso testar antes de assinar?",
    a: "Sim! Você pode começar sem cartão de crédito e explorar a plataforma. Sem compromisso.",
  },
  {
    q: "A IA realmente executa tarefas ou só sugere?",
    a: "Ela executa de verdade. Cria tarefas, gera roteiros, organiza entregáveis, preenche campos e muito mais — tudo por comando de texto ou voz.",
  },
  {
    q: "Funciona para equipes pequenas?",
    a: "Perfeitamente. O SQUAD Hub foi projetado tanto para freelancers solo quanto para equipes de até 50 pessoas. A estrutura escala com você.",
  },
  {
    q: "Meus dados estão seguros?",
    a: "Sim. Usamos infraestrutura enterprise com criptografia de ponta a ponta, backups automáticos e controle de acesso granular.",
  },
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim, sem multa e sem burocracia. Seus dados ficam disponíveis para exportação por 30 dias após o cancelamento.",
  },
  {
    q: "Tem app mobile?",
    a: "O SQUAD Hub é 100% responsivo e funciona como PWA no celular. Você pode instalar como app direto do navegador.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      className="border-b border-border/15 last:border-0"
      initial={false}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-5 text-left group"
      >
        <span className="text-sm md:text-base text-foreground font-medium pr-4 group-hover:text-primary transition-colors">{q}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="shrink-0"
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="text-sm text-muted-foreground pb-5 leading-relaxed pr-8">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function LandingFAQ() {
  return (
    <ScrollLinked id="faq" className="relative z-10 px-6 md:px-12 py-28 md:py-40">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <HelpCircle className="w-3 h-3 text-primary" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">FAQ</span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-light text-foreground tracking-tight leading-[1.1]">
            Perguntas <span className="text-primary">frequentes</span>
          </h2>
        </div>

        <div className="rounded-2xl border border-border/20 bg-card p-6 md:p-8">
          {faqs.map((faq, i) => (
            <FAQItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </ScrollLinked>
  );
}
