import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import {
  Users, FolderKanban, DollarSign, FileText, Globe, Inbox,
  Zap, Brain, Megaphone, LayoutDashboard, BookOpen, Compass,
} from "lucide-react";
import { ScrollLinked } from "./ScrollLinked";

const springCfg = { stiffness: 120, damping: 30 };

const modules = [
  { icon: Users, name: "CRM", desc: "Gestão completa de clientes, leads e pipeline comercial", color: "primary" },
  { icon: FolderKanban, name: "Projetos", desc: "Pipeline visual com tarefas, entregas, cronogramas e equipe", color: "primary" },
  { icon: DollarSign, name: "Financeiro", desc: "Faturamento, cobranças, fluxo de caixa e controle por projeto", color: "primary" },
  { icon: FileText, name: "Contratos", desc: "Propostas, contratos e documentos com assinatura digital", color: "primary" },
  { icon: Globe, name: "Portal do Cliente", desc: "Área premium para o cliente acompanhar e aprovar entregas", color: "primary" },
  { icon: Inbox, name: "Inbox Unificada", desc: "Todas as pendências, aprovações e alertas em um só lugar", color: "primary" },
  { icon: Zap, name: "Automações", desc: "Gatilhos inteligentes com aprovação humana quando necessário", color: "primary" },
  { icon: Brain, name: "IA + Governança", desc: "Assistente de IA com limites, políticas e controle de uso", color: "primary" },
  { icon: Megaphone, name: "Marketing OS", desc: "Planejamento editorial, conteúdo, assets e performance", color: "primary" },
  { icon: LayoutDashboard, name: "Command Center", desc: "Visão executiva em tempo real da operação inteira", color: "primary" },
  { icon: BookOpen, name: "Playbooks", desc: "Templates e processos padronizados para escalar a operação", color: "primary" },
  { icon: Compass, name: "Onboarding", desc: "Configuração guiada para novos clientes e projetos", color: "primary" },
];

function ModuleCard({ icon: Icon, name, desc, index }: {
  icon: React.ElementType; name: string; desc: string; index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useSpring(useTransform(scrollYProgress, [0, 1], [0.9, 1]), springCfg);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.6], [0, 1]), springCfg);

  return (
    <motion.div
      ref={ref}
      className="rounded-2xl border border-border/15 bg-card p-6 group hover:border-primary/20 transition-all duration-500"
      style={{ scale, opacity }}
    >
      <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/12 transition-colors">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1.5">{name}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </motion.div>
  );
}

export function LandingModules() {
  return (
    <ScrollLinked id="produto" className="relative z-10 px-6 md:px-12 py-24 md:py-32">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14 md:mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-5"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Plataforma completa</span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-light text-foreground tracking-tight leading-[1.1]">
            Não são ferramentas soltas.<br />
            É um <span className="text-primary">sistema operacional integrado.</span>
          </h2>
          <p className="text-base text-muted-foreground mt-4 max-w-2xl mx-auto">
            12 módulos que conversam entre si para criar uma operação previsível, escalável e inteligente.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {modules.map((mod, i) => (
            <ModuleCard key={i} icon={mod.icon} name={mod.name} desc={mod.desc} index={i} />
          ))}
        </div>

        <motion.p
          className="text-center text-sm text-muted-foreground/50 mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Todos os módulos integrados · Dados compartilhados · Uma única fonte de verdade
        </motion.p>
      </div>
    </ScrollLinked>
  );
}
