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
      <div className="space-y-10 animate-fade-in">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <h1 className="text-5xl md:text-7xl font-extrabold uppercase tracking-tighter text-foreground">
              Overview <span className="squad-logo-text font-normal text-muted-foreground">Central</span>
            </h1>
          </div>
          
          <div className="glass-card px-6 py-4 rounded-2xl flex items-center gap-4">
            <span className="material-symbols-outlined text-primary">calendar_today</span>
            <div>
              <p className="text-[9px] text-muted-foreground font-black uppercase">Data Atual</p>
              <p className="text-xs text-foreground font-bold">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</p>
            </div>
          </div>
        </div>

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
