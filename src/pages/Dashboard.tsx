import { FileText, FileSignature, Wallet, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { UrgentActionsList } from "@/components/dashboard/UrgentActionsList";
import { RecentActivityTimeline } from "@/components/dashboard/RecentActivityTimeline";

export default function Dashboard() {
  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral do seu negócio
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Propostas Pendentes"
          value={5}
          subtitle="Aguardando resposta"
          icon={FileText}
          variant="warning"
        />
        <MetricCard
          title="Contratos Pendentes"
          value={3}
          subtitle="Aguardando assinatura"
          icon={FileSignature}
          variant="info"
        />
        <MetricCard
          title="A Receber"
          value="R$ 32.500"
          subtitle="Próximos 30 dias"
          icon={Wallet}
          variant="default"
        />
        <MetricCard
          title="Receita do Mês"
          value="R$ 48.000"
          icon={TrendingUp}
          trend={{ value: 12, isPositive: true }}
          variant="success"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UrgentActionsList />
        <RecentActivityTimeline />
      </div>
    </div>
  );
}
