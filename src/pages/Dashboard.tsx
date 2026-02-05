import { FileText, FileSignature, Wallet, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { UrgentActionsList } from "@/components/dashboard/UrgentActionsList";
import { RecentActivityTimeline } from "@/components/dashboard/RecentActivityTimeline";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";

export default function Dashboard() {
  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Bento Grid Layout */}
      <div className="grid gap-4 lg:grid-cols-4 lg:grid-rows-[auto_auto_1fr]">
        {/* Row 1: Welcome + 2 Metrics */}
        <div className="lg:col-span-2">
          <WelcomeCard />
        </div>
        <MetricCard
          title="Propostas Pendentes"
          value={5}
          subtitle="Aguardando resposta"
          icon={FileText}
        />
        <MetricCard
          title="Contratos Pendentes"
          value={3}
          subtitle="Aguardando assinatura"
          icon={FileSignature}
        />

        {/* Row 2: 2 More Metrics + Quick Stats */}
        <MetricCard
          title="A Receber"
          value="R$ 32.500"
          subtitle="Próximos 30 dias"
          icon={Wallet}
        />
        <MetricCard
          title="Receita do Mês"
          value="R$ 48.000"
          icon={TrendingUp}
          trend={{ value: 12, isPositive: true }}
        />
        <div className="lg:col-span-2">
          <QuickStats />
        </div>

        {/* Row 3: Urgent Actions + Activity Timeline */}
        <div className="lg:col-span-2">
          <UrgentActionsList />
        </div>
        <div className="lg:col-span-2">
          <RecentActivityTimeline />
        </div>
      </div>
    </div>
  );
}
