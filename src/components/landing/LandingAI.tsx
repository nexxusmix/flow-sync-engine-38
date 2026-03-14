import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import {
  Brain, Zap, Bell, FileText, MessageSquare, Shield, BarChart3, Mic,
} from "lucide-react";
import { ScrollLinked } from "./ScrollLinked";

const springCfg = { stiffness: 120, damping: 30 };

const aiFeatures = [
  { icon: Zap, title: "Automações por gatilho", desc: "Fluxos disparados automaticamente com condições e ações configuráveis." },
  { icon: Shield, title: "Aprovação humana", desc: "Ações de risco passam por aprovação antes de executar. Velocidade com controle." },
  { icon: FileText, title: "Geração de briefing", desc: "IA cria briefings, roteiros e pautas a partir de contexto do projeto." },
  { icon: Bell, title: "Alertas automáticos", desc: "Notificações inteligentes para atrasos, gargalos e pendências críticas." },
  { icon: MessageSquare, title: "Cobrança assistida", desc: "Lembretes e comunicação financeira automatizada com tom profissional." },
  { icon: BarChart3, title: "Recomendações executivas", desc: "Insights operacionais baseados em dados reais da sua operação." },
  { icon: Mic, title: "Comandos por voz e texto", desc: "Peça para a IA criar tarefas, gerar conteúdo ou organizar projetos." },
  { icon: Brain, title: "Governança de IA", desc: "Controle de uso, limites, políticas e auditoria do que a IA faz na plataforma." },
];

function AICard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
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

export function LandingAI() {
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
            <Brain className="w-3 h-3 text-primary" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Automação & IA</span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-light text-foreground tracking-tight leading-[1.1]">
            Não é só um dashboard bonito.<br />
            É uma operação que <span className="text-primary">anda com inteligência.</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground mt-5 max-w-xl mx-auto leading-relaxed">
            Automações reais, IA assistiva integrada ao workflow e governança completa para uso seguro.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {aiFeatures.map((f, i) => (
            <AICard key={i} icon={f.icon} title={f.title} desc={f.desc} />
          ))}
        </div>
      </div>
    </ScrollLinked>
  );
}
