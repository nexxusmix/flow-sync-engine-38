import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KPICards } from "@/components/dashboard/KPICards";
import { PipelineSection } from "@/components/dashboard/PipelineSection";
import { InboxPreview } from "@/components/dashboard/InboxPreview";
import { ProductionSection } from "@/components/dashboard/ProductionSection";
import { CashFlowSection } from "@/components/dashboard/CashFlowSection";
import { CriticalAlerts } from "@/components/dashboard/CriticalAlerts";
import { TodayActions } from "@/components/dashboard/TodayActions";
import { AuditFeed } from "@/components/dashboard/AuditFeed";

export default function Dashboard() {
  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* 1. KPIs do dia */}
        <KPICards />

        {/* 2. Vendas: Pipeline compacto */}
        <PipelineSection />

        {/* 3. Inbox unificada */}
        <InboxPreview />

        {/* 4. Produção: Risco e Entregas */}
        <ProductionSection />

        {/* 5. Caixa: Previsão e Inadimplência */}
        <CashFlowSection />

        {/* 6. Alertas críticos */}
        <CriticalAlerts />

        {/* Row: Today + Feed side by side */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* 7. Hoje: lista de ações priorizadas */}
          <TodayActions />

          {/* 8. Feed auditável */}
          <AuditFeed />
        </div>
      </div>
    </DashboardLayout>
  );
}
