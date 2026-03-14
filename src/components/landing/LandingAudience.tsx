import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Check, Users } from "lucide-react";
import { ScrollLinked } from "./ScrollLinked";

const audiences = [
  { title: "Agências de marketing", desc: "Gestão completa de clientes, campanhas e resultados" },
  { title: "Agências de tráfego pago", desc: "Pipeline comercial, projetos e financeiro integrados" },
  { title: "Social media managers", desc: "Planejamento editorial, conteúdo e aprovações" },
  { title: "Agências full service", desc: "Operação centralizada com múltiplos módulos e equipes" },
  { title: "Produtoras de vídeo", desc: "Do briefing à entrega, com pipeline visual e portal do cliente" },
  { title: "Estúdios de branding e design", desc: "Gestão criativa com biblioteca de assets e aprovações" },
  { title: "Consultorias com operação recorrente", desc: "Processos padronizados para escalar com previsibilidade" },
  { title: "Times que atendem múltiplos clientes", desc: "Visão por cliente, por projeto e por responsável" },
];

const springCfg = { stiffness: 120, damping: 30 };

function AudienceCard({ title, desc }: { title: string; desc: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useSpring(useTransform(scrollYProgress, [0, 1], [0.9, 1]), springCfg);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1]), springCfg);

  return (
    <motion.div
      ref={ref}
      className="flex items-start gap-4 p-5 rounded-xl border border-border/15 bg-card hover:border-primary/15 transition-all duration-300"
      style={{ scale, opacity }}
    >
      <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
        <Check className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </motion.div>
  );
}

export function LandingAudience() {
  return (
    <ScrollLinked id="para-quem" className="relative z-10 px-6 md:px-12 py-28 md:py-40">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Users className="w-3 h-3 text-primary" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Para quem</span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-light text-foreground tracking-tight leading-[1.1]">
            Feita para operações que<br />
            precisam de <span className="text-primary">escala sem perder controle.</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          {audiences.map((a, i) => (
            <AudienceCard key={i} title={a.title} desc={a.desc} />
          ))}
        </div>
      </div>
    </ScrollLinked>
  );
}
