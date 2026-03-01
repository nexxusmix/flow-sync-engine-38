import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ScrollLinked } from "./ScrollLinked";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "Antes eu usava 5 ferramentas diferentes. Agora tudo está em um lugar só. Minha produtividade triplicou.",
    name: "Lucas Ferreira",
    role: "Filmmaker, SP",
  },
  {
    quote: "O módulo de marketing mudou completamente como a gente planeja conteúdo. A IA é absurda.",
    name: "Mariana Costa",
    role: "Social Media Manager",
  },
  {
    quote: "Finalmente uma plataforma brasileira com qualidade internacional. O suporte é incrível.",
    name: "Rafael Santos",
    role: "Fundador, Estúdio Criativo",
  },
];

const comparisons = [
  { them: "Enquanto outros usam 5 ferramentas…", us: "Você opera em um ecossistema inteligente." },
  { them: "Enquanto outros organizam manualmente…", us: "Sua IA executa por você." },
  { them: "Enquanto outros exportam PDFs feios…", us: "Você entrega documentos premium." },
  { them: "Enquanto outros perdem tempo…", us: "Você foca no que importa: criar." },
];

const springCfg = { stiffness: 120, damping: 30 };

function TestimonialCard({ quote, name, role }: { quote: string; name: string; role: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.6], [0, 1]), springCfg);
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [30, 0]), springCfg);

  return (
    <motion.div
      ref={ref}
      className="p-6 rounded-2xl border border-border/15 bg-card"
      style={{ opacity, y }}
    >
      <Quote className="w-5 h-5 text-primary/30 mb-4" />
      <p className="text-sm text-foreground/80 leading-relaxed mb-4 italic">"{quote}"</p>
      <div>
        <p className="text-sm font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{role}</p>
      </div>
    </motion.div>
  );
}

function ComparisonRow({ them, us }: { them: string; us: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const xLeft = useSpring(useTransform(scrollYProgress, [0, 1], [-40, 0]), springCfg);
  const xRight = useSpring(useTransform(scrollYProgress, [0, 1], [40, 0]), springCfg);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.6], [0, 1]), springCfg);

  return (
    <motion.div ref={ref} className="grid md:grid-cols-2 gap-3" style={{ opacity }}>
      <motion.div className="px-5 py-4 rounded-xl bg-destructive/4 border border-destructive/8 text-sm text-muted-foreground/50 italic" style={{ x: xLeft }}>
        {them}
      </motion.div>
      <motion.div className="px-5 py-4 rounded-xl bg-primary/4 border border-primary/10 text-sm text-foreground/80 font-medium" style={{ x: xRight }}>
        {us}
      </motion.div>
    </motion.div>
  );
}

export function LandingProof() {
  return (
    <ScrollLinked className="relative z-10 px-6 md:px-12 py-28 md:py-40">
      <div className="max-w-5xl mx-auto">
        {/* Testimonials */}
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Depoimentos</span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-light text-foreground tracking-tight">
            Quem usa, <span className="text-primary">recomenda</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-28">
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} {...t} />
          ))}
        </div>

        {/* Comparisons */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-light text-foreground tracking-tight">
            Prova de <span className="text-primary">visão</span>
          </h2>
        </div>

        <div className="space-y-4">
          {comparisons.map((c, i) => (
            <ComparisonRow key={i} them={c.them} us={c.us} />
          ))}
        </div>
      </div>
    </ScrollLinked>
  );
}
