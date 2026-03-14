import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Globe, CheckCircle, Eye, FileText, DollarSign, MessageSquare } from "lucide-react";
import { ScrollLinked } from "./ScrollLinked";

const springCfg = { stiffness: 120, damping: 30 };

const features = [
  { icon: Globe, title: "Portal exclusivo", desc: "Área premium onde o cliente acompanha projetos, entregas e documentos." },
  { icon: CheckCircle, title: "Aprovações simplificadas", desc: "Fluxo claro de aprovação com comentários, versões e histórico completo." },
  { icon: Eye, title: "Visão de progresso", desc: "Timeline e milestones para o cliente entender exatamente onde está cada projeto." },
  { icon: FileText, title: "Documentos centralizados", desc: "Contratos, propostas e entregáveis organizados em um só lugar." },
  { icon: DollarSign, title: "Financeiro acessível", desc: "Faturas, pagamentos e histórico financeiro com visão clara e profissional." },
  { icon: MessageSquare, title: "Comunicação organizada", desc: "Mensagens, feedbacks e atualizações no contexto certo, sem WhatsApp solto." },
];

function FeatureItem({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.5], [0, 1]), springCfg);
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [20, 0]), springCfg);

  return (
    <motion.div
      ref={ref}
      className="flex items-start gap-4 p-5 rounded-xl border border-border/15 bg-card hover:border-primary/15 transition-all duration-300"
      style={{ opacity, y }}
    >
      <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

export function LandingClientExperience() {
  return (
    <ScrollLinked className="relative z-10 px-6 md:px-12 py-28 md:py-40">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Globe className="w-3 h-3 text-primary" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Experiência do cliente</span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-light text-foreground tracking-tight leading-[1.1]">
            Seu cliente também<br />
            <span className="text-primary">percebe a diferença.</span>
          </h2>
          <p className="text-base text-muted-foreground mt-4 max-w-xl mx-auto">
            Mais transparência, mais confiança, mais percepção de valor.
            O portal do cliente transforma como sua agência é vista.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((f, i) => (
            <FeatureItem key={i} icon={f.icon} title={f.title} desc={f.desc} />
          ))}
        </div>
      </div>
    </ScrollLinked>
  );
}
