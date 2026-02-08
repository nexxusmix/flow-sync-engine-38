import { useState } from "react";
import { ProjectWithStages } from "@/hooks/useProjects";
import { usePortalLink } from "@/hooks/usePortalLink";
import { useProjectFiles } from "@/hooks/useProjectFiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Link, 
  Copy, 
  RefreshCw, 
  ExternalLink, 
  Eye, 
  EyeOff,
  Calendar,
  Lock,
  Unlock,
  Clock,
  User,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { AddMaterialDialog } from "@/components/client-portal/AddMaterialDialog";
import { ProjectLogoUpload } from "@/components/projects/ProjectLogoUpload";

interface PortalTabProps {
  project: ProjectWithStages;
}

export function PortalTab({ project }: PortalTabProps) {
  const { 
    portalLink, 
    portalUrl, 
    activities,
    isLoading, 
    createLink, 
    regenerateLink,
    toggleActive,
    setExpiration,
    setBlockIfUnpaid,
  } = usePortalLink(project.id);
  
  const { files } = useProjectFiles(project.id);
  const portalFiles = files.filter(f => f.visible_in_portal);
  
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [addMaterialOpen, setAddMaterialOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(project.logo_url || null);

  const handleLogoUpload = async (url: string | null) => {
    setLogoUrl(url);
    // Update project logo_url in database
    await supabase
      .from('projects')
      .update({ logo_url: url })
      .eq('id', project.id);
    toast.success(url ? 'Logo atualizado!' : 'Logo removido!');
  };

  const handleCopyLink = () => {
    if (portalUrl) {
      navigator.clipboard.writeText(portalUrl);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const handleCreateLink = () => {
    createLink.mutate();
  };

  const handleRegenerateLink = () => {
    if (confirm('Ao regenerar o link, o anterior será invalidado. Continuar?')) {
      regenerateLink.mutate();
    }
  };

  const handleToggleActive = (checked: boolean) => {
    toggleActive.mutate(checked);
  };

  const handleSetExpiration = () => {
    if (expirationDate) {
      setExpiration.mutate(new Date(expirationDate).toISOString());
    }
  };

  const handleClearExpiration = () => {
    setExpiration.mutate(null);
    setExpirationDate('');
  };

  const handleToggleBlockIfUnpaid = (checked: boolean) => {
    setBlockIfUnpaid.mutate(checked);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No portal link yet - show creation UI
  if (!portalLink) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <Link className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Portal do Cliente</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Crie um link seguro para o cliente acompanhar o projeto, visualizar arquivos marcados como visíveis e acompanhar o progresso.
        </p>
        <Button onClick={handleCreateLink} disabled={createLink.isPending}>
          {createLink.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Link className="w-4 h-4 mr-2" />
          )}
          Gerar Link do Portal
        </Button>
      </div>
    );
  }

  // Portal link exists - show management UI
  const isExpired = portalLink.expires_at && new Date(portalLink.expires_at) < new Date();
  const isAccessible = portalLink.is_active && !isExpired;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isAccessible ? "bg-emerald-500/20" : "bg-amber-500/20"
            )}>
              {isAccessible ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Portal do Cliente
              </h3>
              <p className="text-sm text-muted-foreground">
                {isAccessible ? 'Ativo e acessível' : isExpired ? 'Link expirado' : 'Portal desativado'}
              </p>
            </div>
          </div>
          <Badge variant={isAccessible ? "default" : "secondary"}>
            {isAccessible ? 'Online' : 'Offline'}
          </Badge>
        </div>

        {/* Link URL */}
        <div className="flex items-center gap-2 mb-4">
          <Input 
            value={portalUrl || ''} 
            readOnly 
            className="font-mono text-sm bg-muted/50"
          />
          <Button variant="outline" size="icon" onClick={handleCopyLink}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" asChild>
            <a href={portalUrl || '#'} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={() => setAddMaterialOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Material
          </Button>
          <Button variant="outline" size="sm" onClick={handleRegenerateLink} disabled={regenerateLink.isPending}>
            {regenerateLink.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Regenerar Link
          </Button>
        </div>
      </div>

      {/* Project Logo Section */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">Logo do Projeto</p>
              <p className="text-xs text-muted-foreground">
                Aparece no header do portal do cliente
              </p>
            </div>
          </div>
          <ProjectLogoUpload
            projectId={project.id}
            currentLogoUrl={logoUrl}
            onUpload={handleLogoUpload}
            compact
          />
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Toggle */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {portalLink.is_active ? (
                <Eye className="w-5 h-5 text-emerald-500" />
              ) : (
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium text-foreground">Portal Ativo</p>
                <p className="text-xs text-muted-foreground">
                  {portalLink.is_active ? 'Cliente pode acessar' : 'Acesso bloqueado'}
                </p>
              </div>
            </div>
            <Switch
              checked={portalLink.is_active}
              onCheckedChange={handleToggleActive}
            />
          </div>
        </div>

        {/* Block if Unpaid */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {portalLink.blocked_by_payment ? (
                <Lock className="w-5 h-5 text-amber-500" />
              ) : (
                <Unlock className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium text-foreground">Bloqueio por Inadimplência</p>
                <p className="text-xs text-muted-foreground">
                  {portalLink.blocked_by_payment ? 'Bloqueia se pagamento pendente' : 'Acesso livre'}
                </p>
              </div>
            </div>
            <Switch
              checked={portalLink.blocked_by_payment}
              onCheckedChange={handleToggleBlockIfUnpaid}
            />
          </div>
        </div>

        {/* Expiration Date */}
        <div className="glass-card rounded-xl p-4 md:col-span-2">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">Data de Expiração</p>
              <p className="text-xs text-muted-foreground">
                {portalLink.expires_at 
                  ? `Expira em ${format(new Date(portalLink.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                  : 'Sem data de expiração'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="datetime-local"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={handleSetExpiration} disabled={!expirationDate}>
              Definir
            </Button>
            {portalLink.expires_at && (
              <Button variant="ghost" size="sm" onClick={handleClearExpiration}>
                Remover
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Portal Files */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-5 h-5 text-muted-foreground" />
          <div>
            <h3 className="font-semibold text-foreground">Arquivos Visíveis no Portal</h3>
            <p className="text-sm text-muted-foreground">
              {portalFiles.length} arquivo{portalFiles.length !== 1 ? 's' : ''} visíve{portalFiles.length !== 1 ? 'is' : 'l'} para o cliente
            </p>
          </div>
        </div>

        {portalFiles.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum arquivo marcado como visível no portal. Vá na aba "Arquivos" e marque os arquivos que deseja compartilhar.
          </p>
        ) : (
          <div className="space-y-2">
            {portalFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{file.name}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {file.folder}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Log */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <div>
            <h3 className="font-semibold text-foreground">Atividade do Cliente</h3>
            <p className="text-sm text-muted-foreground">
              Últimas ações do cliente no portal
            </p>
          </div>
        </div>

        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma atividade registrada ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 text-sm">
                <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-foreground">{activity.description || activity.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(activity.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Material Dialog */}
      {portalLink && (
        <AddMaterialDialog
          portalLinkId={portalLink.id}
          open={addMaterialOpen}
          onOpenChange={setAddMaterialOpen}
        />
      )}
    </div>
  );
}
