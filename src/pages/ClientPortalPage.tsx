import { useParams } from "react-router-dom";
import { useProjectsStore } from "@/stores/projectsStore";
import { PortalHeader } from "@/components/client-portal/PortalHeader";
import { PortalProgress } from "@/components/client-portal/PortalProgress";
import { PortalDeliverables } from "@/components/client-portal/PortalDeliverables";
import { PortalChecklist } from "@/components/client-portal/PortalChecklist";
import { AlertTriangle, Lock } from "lucide-react";

export default function ClientPortalPage() {
  const { shareToken } = useParams();
  const { getProjectByShareToken } = useProjectsStore();

  const project = shareToken ? getProjectByShareToken(shareToken) : undefined;

  // Invalid or expired link
  if (!project || !project.portalLink) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl p-8 max-w-md text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Link Inválido</h1>
          <p className="text-muted-foreground">
            Este link não é válido ou expirou. Por favor, entre em contato com a equipe SQUAD Film para obter um novo link de acesso.
          </p>
        </div>
      </div>
    );
  }

  // Portal inactive
  if (!project.portalLink.isActive) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl p-8 max-w-md text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Portal Desativado</h1>
          <p className="text-muted-foreground">
            O acesso ao portal deste projeto está temporariamente desativado. Entre em contato com a equipe para mais informações.
          </p>
        </div>
      </div>
    );
  }

  // Check expiration
  if (project.portalLink.expiresAt && new Date(project.portalLink.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl p-8 max-w-md text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Link Expirado</h1>
          <p className="text-muted-foreground">
            O link de acesso a este projeto expirou. Por favor, solicite um novo link à equipe SQUAD Film.
          </p>
        </div>
      </div>
    );
  }

  // Filter deliverables visible in portal
  const visibleDeliverables = project.deliverables.filter(d => 
    d.visibleInPortal || project.portalLink?.visibleDeliverables.includes(d.id)
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PortalHeader project={project} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Blocked by payment alert */}
        {project.blockedByPayment && (
          <div className="glass-card rounded-2xl p-6 border-amber-500/30 bg-amber-500/5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Entrega Pendente</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Existe uma pendência financeira que precisa ser regularizada para liberação da entrega final. 
                  Entre em contato com nossa equipe para mais informações.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Timeline */}
        <PortalProgress project={project} />

        {/* Deliverables */}
        <PortalDeliverables 
          project={project} 
          deliverables={visibleDeliverables} 
        />

        {/* Client Checklist */}
        <PortalChecklist project={project} />

        {/* Footer */}
        <footer className="text-center py-8 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Portal do Cliente • SQUAD Film © {new Date().getFullYear()}
          </p>
        </footer>
      </main>
    </div>
  );
}
