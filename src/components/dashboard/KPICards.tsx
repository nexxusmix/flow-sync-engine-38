import { Users, MessageSquare, Phone, FileText, DollarSign, Package } from "lucide-react";
import { todayKPIs } from "@/data/mockData";

const kpis = [
  { label: "Leads novos hoje", value: todayKPIs.newLeads, icon: Users },
  { label: "Respostas recebidas", value: todayKPIs.responsesReceived, icon: MessageSquare },
  { label: "Calls agendadas", value: todayKPIs.callsScheduled, icon: Phone },
  { label: "Propostas enviadas", value: todayKPIs.proposalsSent, icon: FileText },
  { label: "Pagamentos previstos", value: `R$ ${todayKPIs.expectedPayments.toLocaleString()}`, icon: DollarSign, isCurrency: true },
  { label: "Entregas em 7 dias", value: todayKPIs.deliveriesIn7Days, icon: Package },
];

export function KPICards() {
  return (
    <section>
      <h2 className="section-label mb-3">KPIs do Dia</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="kpi-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="icon-box">
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <p className="kpi-value">{kpi.value}</p>
            <p className="kpi-label">{kpi.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
