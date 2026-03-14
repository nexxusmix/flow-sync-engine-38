import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ScrollLinked } from "./ScrollLinked";

const springCfg = { stiffness: 120, damping: 30 };

const steps = [
  { number: "01", title: "Centralize sua operação", desc: "Conecte CRM, projetos, financeiro e equipe em um só ambiente." },
  { number: "02", title: "Padronize processos", desc: "Use playbooks e templates para replicar o que funciona com consistência." },
  { number: "03", title: "Automatize fluxos", desc: "Configure gatilhos inteligentes que eliminam tarefas manuais e repetitivas." },
  { number: "04", title: "Acompanhe em tempo real", desc: "Dashboard executivo com visão clara de operação, finanças e equipe." },
  { number: "05", title: "Cresça com previsibilidade", desc: "Escale de 5 para 50 clientes mantendo qualidade, controle e margem." },
];

function StepCard({ number, title, desc }: { number: string; title: string; desc: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.5], [0, 1]), springCfg);
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [30, 0]), springCfg);

  return (
    <motion.div ref={ref} className="relative flex gap-6 items-start" style={{ opacity, y }}>
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-primary/8 border border-primary/15 flex items-center justify-center shrink-0">
          <span className="text-sm font-medium text-primary">{number}</span>
        </div>
        <div className="w-px h-full bg-border/15 mt-3" />
      </div>
      <div className="pb-12">
        <h3 className="text-base font-medium text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

export function LandingHowItWorks() {
  return (
    <ScrollLinked id="como-funciona" className="relative z-10 px-6 md:px-12 py-24 md:py-32">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14 md:mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-5"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Como funciona</span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-light text-foreground tracking-tight leading-[1.1]">
            Simples de começar.<br />
            <span className="text-primary">Poderoso para escalar.</span>
          </h2>
        </div>

        <div className="space-y-0">
          {steps.map((s, i) => (
            <StepCard key={i} number={s.number} title={s.title} desc={s.desc} />
          ))}
        </div>
      </div>
    </ScrollLinked>
  );
}
