import { todayKPIs } from "@/data/mockData";

const kpis = [
  { label: "Leads Novos", value: todayKPIs.newLeads, icon: "person_add", detail: "HOT LEADS" },
  { label: "Respostas", value: todayKPIs.responsesReceived, icon: "mark_email_read", detail: "HOJE" },
  { label: "Calls", value: todayKPIs.callsScheduled, icon: "call", detail: "AGENDADAS" },
  { label: "Propostas", value: todayKPIs.proposalsSent, icon: "send", detail: "ENVIADAS" },
  { label: "Pagamentos", value: `R$ ${(todayKPIs.expectedPayments / 1000).toFixed(1)}k`, icon: "payments", detail: "PREVISTOS" },
  { label: "Entregas", value: todayKPIs.deliveriesIn7Days, icon: "local_shipping", detail: "7 DIAS" },
];

export function KPICards() {
  return (
    <section>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="glass-card p-8 rounded-[2rem] hover:border-primary/20 transition-all duration-700 group cursor-default">
            <div className="flex justify-between items-start mb-8">
              <span className="material-symbols-outlined text-primary text-3xl">{kpi.icon}</span>
              <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{kpi.detail}</span>
            </div>
            <h4 className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.4em] mb-2">{kpi.label}</h4>
            <span className="text-4xl font-bold text-foreground tracking-tighter">{kpi.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
