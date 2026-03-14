import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { X, Check } from "lucide-react";
import { ScrollLinked } from "./ScrollLinked";

const springCfg = { stiffness: 120, damping: 30 };

const rows = [
  { without: "Planilhas, WhatsApp, Trello, Notion — tudo separado", with: "Um sistema central que conecta tudo" },
  { without: "Informações dispersas e difíceis de encontrar", with: "Uma única fonte de verdade para a operação" },
  { without: "Cliente cobrando por WhatsApp sem contexto", with: "Portal premium com visão de progresso e aprovação" },
  { without: "Aprovações lentas que travam entregas", with: "Fluxo de aprovação integrado com inbox unificada" },
  { without: "Sem visão executiva real da operação", with: "Dashboard em tempo real com métricas de toda a agência" },
  { without: "Automação zero ou dependente de integrações externas", with: "Automações nativas com governança e aprovação humana" },
];

function ComparisonRow({ without, withText }: { without: string; withText: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.6], [0, 1]), springCfg);

  return (
    <motion.div ref={ref} className="grid md:grid-cols-2 gap-px" style={{ opacity }}>
      <div className="flex items-start gap-3 px-5 py-4 bg-destructive/3 first:rounded-tl-xl">
        <X className="w-4 h-4 text-destructive/40 shrink-0 mt-0.5" />
        <span className="text-sm text-muted-foreground/60">{without}</span>
      </div>
      <div className="flex items-start gap-3 px-5 py-4 bg-primary/3">
        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <span className="text-sm text-foreground/80 font-medium">{withText}</span>
      </div>
    </motion.div>
  );
}

export function LandingComparison() {
  return (
    <ScrollLinked className="relative z-10 px-6 md:px-12 py-7 md:py-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14 md:mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-5"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Comparativo</span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-light text-foreground tracking-tight leading-[1.1]">
            Stack improvisada vs.<br />
            <span className="text-primary">plataforma operacional</span>
          </h2>
        </div>

        <div className="rounded-2xl border border-border/20 overflow-hidden">
          {/* Header */}
          <div className="grid md:grid-cols-2 gap-px">
            <div className="px-5 py-3 bg-destructive/5">
              <span className="text-xs uppercase tracking-wider text-destructive/50 font-medium">Sem a plataforma</span>
            </div>
            <div className="px-5 py-3 bg-primary/5">
              <span className="text-xs uppercase tracking-wider text-primary font-medium">Com SQUAD Hub</span>
            </div>
          </div>
          {/* Rows */}
          <div className="divide-y divide-border/10">
            {rows.map((r, i) => (
              <ComparisonRow key={i} without={r.without} withText={r.with} />
            ))}
          </div>
        </div>
      </div>
    </ScrollLinked>
  );
}
