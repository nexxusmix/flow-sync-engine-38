import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Plug, MessageSquare, FileSignature, CreditCard, Calendar, Check, X, ExternalLink } from "lucide-react";

const integrations = [
  {
    id: "whatsapp",
    name: "WhatsApp Business API",
    description: "Integração oficial para envio e recebimento de mensagens",
    icon: MessageSquare,
    status: "connected",
    lastSync: "Há 5 minutos",
  },
  {
    id: "docusign",
    name: "DocuSign",
    description: "Assinatura digital de contratos",
    icon: FileSignature,
    status: "disconnected",
    lastSync: null,
  },
  {
    id: "asaas",
    name: "Asaas",
    description: "Gateway de pagamento e cobranças automáticas",
    icon: CreditCard,
    status: "connected",
    lastSync: "Há 10 minutos",
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    description: "Sincronização de agendamentos e calls",
    icon: Calendar,
    status: "disconnected",
    lastSync: null,
  },
];

export default function IntegrationsPage() {
  return (
    <DashboardLayout title="Integrações">
      <div className="max-w-4xl">
        <p className="text-sm text-muted-foreground mb-6">
          Conecte suas ferramentas favoritas para automatizar processos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((integration) => (
            <div key={integration.id} className="card-flat">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="icon-box">
                    <integration.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">{integration.name}</h3>
                    <p className="text-xs text-muted-foreground">{integration.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  {integration.status === "connected" ? (
                    <span className="badge-success flex items-center gap-1">
                      <Check className="h-3 w-3" /> Conectado
                    </span>
                  ) : (
                    <span className="badge-subtle flex items-center gap-1">
                      <X className="h-3 w-3" /> Não conectado
                    </span>
                  )}
                  {integration.lastSync && (
                    <p className="text-[10px] text-muted-foreground mt-1">Última sync: {integration.lastSync}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {integration.status === "connected" ? (
                    <>
                      <button className="btn-subtle text-xs">Configurar</button>
                      <button className="btn-subtle text-xs text-destructive">Desconectar</button>
                    </>
                  ) : (
                    <button className="btn-action text-xs flex items-center gap-1">
                      Conectar <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
