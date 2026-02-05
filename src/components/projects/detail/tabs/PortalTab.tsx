import { Project } from "@/types/projects";
import { useProjectsStore } from "@/stores/projectsStore";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Link, 
  Copy, 
  RefreshCw, 
  ExternalLink, 
  Eye,
  Calendar,
  Activity
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PortalTabProps {
  project: Project;
}

export function PortalTab({ project }: PortalTabProps) {
  const { 
    generatePortalLink, 
    regeneratePortalToken, 
    togglePortalActive,
    updatePortalVisibleDeliverables 
  } = useProjectsStore();

  const portalLink = project.portalLink;
  const portalUrl = portalLink 
    ? `${window.location.origin}/client/${portalLink.shareToken}`
    : null;

  const handleGenerateLink = () => {
    generatePortalLink(project.id);
    toast({
      title: "Link gerado",
      description: "O link do portal do cliente foi criado com sucesso.",
    });
  };

  const handleRegenerateToken = () => {
    if (confirm("Tem certeza? O link atual será invalidado.")) {
      regeneratePortalToken(project.id);
      toast({
        title: "Token regenerado",
        description: "Um novo link foi gerado. O anterior não funciona mais.",
      });
    }
  };

  const handleCopyLink = () => {
    if (portalUrl) {
      navigator.clipboard.writeText(portalUrl);
      toast({
        title: "Link copiado",
        description: "O link foi copiado para a área de transferência.",
      });
    }
  };

  const handleToggleDeliverable = (deliverableId: string) => {
    const current = portalLink?.visibleDeliverables || [];
    const updated = current.includes(deliverableId)
      ? current.filter(id => id !== deliverableId)
      : [...current, deliverableId];
    updatePortalVisibleDeliverables(project.id, updated);
  };

  if (!portalLink) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <Link className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Portal do Cliente</h3>
        <p className="text-muted-foreground mb-6">
          Crie um link seguro para o cliente acompanhar o projeto, revisar entregas e aprovar versões.
        </p>
        <Button onClick={handleGenerateLink}>
          <Link className="w-4 h-4 mr-2" />
          Gerar Link do Portal
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portal Status Card */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-foreground">Portal do Cliente</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie o acesso do cliente ao projeto
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {portalLink.isActive ? 'Ativo' : 'Desativado'}
            </span>
            <Switch
              checked={portalLink.isActive}
              onCheckedChange={() => togglePortalActive(project.id)}
            />
          </div>
        </div>

        {/* Link Section */}
        <div className="space-y-4">
          <Label>Link do Portal</Label>
          <div className="flex gap-2">
            <Input 
              value={portalUrl || ''} 
              readOnly 
              className="font-mono text-sm"
            />
            <Button variant="outline" size="icon" onClick={handleCopyLink}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.open(portalUrl!, '_blank')}>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Criado em {format(new Date(portalLink.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
            {portalLink.expiresAt && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Expira em {format(new Date(portalLink.expiresAt), "dd/MM/yyyy", { locale: ptBR })}</span>
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={handleRegenerateToken}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Regenerar Token
          </Button>
        </div>
      </div>

      {/* Visible Deliverables */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-semibold text-foreground mb-4">Entregáveis Visíveis no Portal</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Selecione quais entregáveis o cliente pode visualizar no portal.
        </p>

        <div className="space-y-3">
          {project.deliverables.map((deliverable) => (
            <div 
              key={deliverable.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={portalLink.visibleDeliverables.includes(deliverable.id) || deliverable.visibleInPortal}
                  onCheckedChange={() => handleToggleDeliverable(deliverable.id)}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{deliverable.title}</p>
                  <p className="text-xs text-muted-foreground">
                    v{deliverable.currentVersion} • {deliverable.status}
                  </p>
                </div>
              </div>
              <Eye className={`w-4 h-4 ${
                portalLink.visibleDeliverables.includes(deliverable.id) || deliverable.visibleInPortal
                  ? 'text-primary' 
                  : 'text-muted-foreground'
              }`} />
            </div>
          ))}

          {project.deliverables.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              Nenhum entregável criado ainda.
            </p>
          )}
        </div>
      </div>

      {/* Client Activity */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-semibold text-foreground mb-4">Atividade do Cliente</h3>

        <div className="space-y-3">
          {portalLink.clientActivity.slice(-10).reverse().map((activity) => (
            <div 
              key={activity.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
            >
              <Activity className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            </div>
          ))}

          {portalLink.clientActivity.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              Nenhuma atividade registrada ainda.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
