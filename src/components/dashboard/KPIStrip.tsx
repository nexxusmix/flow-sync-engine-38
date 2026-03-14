import { motion } from "framer-motion";
import { useKPIMetrics } from "@/hooks/useKPIMetrics";
import { formatCurrencyBRL } from "@/utils/format";
import {
  UserPlus,
  MessageSquare,
  Phone,
  FileText,
  DollarSign,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Tilt3DCard } from "@/components/ui/tilt-3d-card";

interface KPICardData {
  label: string;
  sublabel: string;
  value: string | number;
  icon: React.ElementType;
  href: string;
  accent: string;
  bgAccent: string;
}

const maskContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.3 } },
};

const maskChild = {
  hidden: { y: "100%", opacity: 0 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function KPIStrip() {
  const kpi = useKPIMetrics();

  const cards: KPICardData[] = [
    {
      label: "Leads Novos",
      sublabel: "Este mês",
      value: kpi.newLeads,
      icon: UserPlus,
      href: "/crm",
      accent: "text-primary",
      bgAccent: "bg-primary/10",
    },
    {
      label: "Respostas",
      sublabel: "Últimos 7 dias",
      value: kpi.inboundReplies,
      icon: MessageSquare,
      href: "/inbox",
      accent: "text-primary",
      bgAccent: "bg-primary/10",
    },
    {
      label: "Calls",
      sublabel: "Próximos 7 dias",
      value: kpi.upcomingMeetings,
      icon: Phone,
      href: "/calendario",
      accent: "text-primary",
      bgAccent: "bg-primary/10",
    },
    {
      label: "Propostas",
      sublabel: "Enviadas no mês",
      value: kpi.sentProposals,
      icon: FileText,
      href: "/propostas",
      accent: "text-muted-foreground",
      bgAccent: "bg-muted",
    },
    {
      label: "Pgto Previsto",
      sublabel: "Próximos 7 dias",
      value: formatCurrencyBRL(kpi.pendingPaymentsTotal),
      icon: DollarSign,
      href: "/financeiro",
      accent: "text-primary",
      bgAccent: "bg-primary/10",
    },
    {
      label: "Entregas",
      sublabel: "Próximos 7 dias",
      value: kpi.upcomingDeliveries,
      icon: Truck,
      href: "/calendario",
      accent: "text-destructive",
      bgAccent: "bg-destructive/10",
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      variants={maskContainer}
      initial="hidden"
      animate="visible"
    >
      {cards.map((card, idx) => (
        <Tilt3DCard key={card.label} variants={maskChild} intensity={4}>
          <Link to={card.href} className="block h-full">
            <div className="glass-card rounded-xl p-4 flex flex-col gap-3 h-full hover:border-primary/15 hover:bg-muted/30 transition-all group cursor-pointer">
              {/* Icon + label row */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg ${card.bgAccent} flex items-center justify-center flex-shrink-0`}
                >
                  <card.icon className={`w-3.5 h-3.5 ${card.accent}`} />
                </div>
                <span className="text-mono font-light text-muted-foreground leading-tight group-hover:text-foreground transition-colors">
                  {card.label}
                </span>
              </div>

              {/* Value — text mask reveal */}
              <div>
                {kpi.isLoading ? (
                  <div className="h-6 w-12 bg-muted/50 rounded animate-pulse" />
                ) : (
                  <span className="overflow-hidden inline-block">
                    <motion.p
                      className={`text-xl font-normal ${card.accent} leading-none`}
                      initial={{ y: "100%", opacity: 0 }}
                      animate={{ y: "0%", opacity: 1 }}
                      transition={{ delay: 0.4 + idx * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {card.value}
                    </motion.p>
                  </span>
                )}
                <p className="text-caption text-muted-foreground/60 font-light mt-1 uppercase tracking-wider">
                  {card.sublabel}
                </p>
              </div>
            </div>
          </Link>
        </Tilt3DCard>
      ))}
    </motion.div>
  );
}
