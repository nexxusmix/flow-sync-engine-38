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

interface KPICardData {
  label: string;
  sublabel: string;
  value: string | number;
  icon: React.ElementType;
  href: string;
  accent: string; // tailwind text color class
  bgAccent: string; // tailwind bg color class
}

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
      accent: "text-violet-400",
      bgAccent: "bg-violet-400/10",
    },
    {
      label: "Calls",
      sublabel: "Próximos 7 dias",
      value: kpi.upcomingMeetings,
      icon: Phone,
      href: "/calendario",
      accent: "text-emerald-400",
      bgAccent: "bg-emerald-400/10",
    },
    {
      label: "Propostas",
      sublabel: "Enviadas no mês",
      value: kpi.sentProposals,
      icon: FileText,
      href: "/propostas",
      accent: "text-amber-400",
      bgAccent: "bg-amber-400/10",
    },
    {
      label: "Pgto Previsto",
      sublabel: "Próximos 7 dias",
      value: formatCurrencyBRL(kpi.pendingPaymentsTotal),
      icon: DollarSign,
      href: "/financeiro",
      accent: "text-emerald-400",
      bgAccent: "bg-emerald-400/10",
    },
    {
      label: "Entregas",
      sublabel: "Próximos 7 dias",
      value: kpi.upcomingDeliveries,
      icon: Truck,
      href: "/calendario",
      accent: "text-red-400",
      bgAccent: "bg-red-400/10",
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay: 0.3, type: "spring", stiffness: 80, damping: 18 }}
    >
      {cards.map((card, idx) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            delay: 0.32 + idx * 0.05,
            type: "spring",
            stiffness: 120,
            damping: 20,
          }}
        >
          <Link to={card.href} className="block h-full">
            <div className="glass-card rounded-xl p-4 flex flex-col gap-3 h-full hover:border-primary/30 hover:bg-muted/40 transition-all group cursor-pointer">
              {/* Icon + label row */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg ${card.bgAccent} flex items-center justify-center flex-shrink-0`}
                >
                  <card.icon className={`w-3.5 h-3.5 ${card.accent}`} />
                </div>
                <span className="text-[10px] font-light text-muted-foreground leading-tight group-hover:text-foreground transition-colors">
                  {card.label}
                </span>
              </div>

              {/* Value */}
              <div>
                {kpi.isLoading ? (
                  <div className="h-6 w-12 bg-muted/50 rounded animate-pulse" />
                ) : (
                  <p className={`text-xl font-normal ${card.accent} leading-none`}>
                    {card.value}
                  </p>
                )}
                <p className="text-[9px] text-muted-foreground/60 font-light mt-1 uppercase tracking-wider">
                  {card.sublabel}
                </p>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
