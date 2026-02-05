import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Settings, MessageSquare, FileSignature, CreditCard, Calendar, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const integrations = [
  { id: "whatsapp", name: "WhatsApp Business", description: "Integração com API oficial", icon: MessageSquare, connected: true },
  { id: "signature", name: "Assinatura Digital", description: "DocuSign / Clicksign", icon: FileSignature, connected: false },
  { id: "payments", name: "Gateway de Pagamento", description: "Asaas / Stripe", icon: CreditCard, connected: true },
  { id: "calendar", name: "Calendário", description: "Google Calendar / Cal.com", icon: Calendar, connected: false },
];

export default function SettingsPage() {
  return (
    <DashboardLayout title="Configurações">
      <div className="max-w-3xl">
        <h2 className="text-lg font-semibold text-foreground mb-6">Configurações Gerais</h2>

        {/* Profile Section */}
        <section className="card-flat mb-6">
          <h3 className="text-sm font-medium text-foreground mb-4">Perfil da Empresa</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Nome da Empresa</label>
              <input
                type="text"
                defaultValue="SQUAD Produções"
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Email</label>
              <input
                type="email"
                defaultValue="contato@squadproducoes.com"
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <section className="card-flat">
          <h3 className="text-sm font-medium text-foreground mb-4">Status das Integrações</h3>
          <div className="space-y-3">
            {integrations.map((integration) => (
              <div key={integration.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-3">
                  <div className="icon-box">
                    <integration.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{integration.name}</p>
                    <p className="text-xs text-muted-foreground">{integration.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {integration.connected ? (
                    <>
                      <span className="badge-success flex items-center gap-1">
                        <Check className="h-3 w-3" /> Conectado
                      </span>
                      <button className="btn-subtle text-xs">Configurar</button>
                    </>
                  ) : (
                    <>
                      <span className="badge-subtle flex items-center gap-1">
                        <X className="h-3 w-3" /> Não conectado
                      </span>
                      <button className="btn-action text-xs">Conectar</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
