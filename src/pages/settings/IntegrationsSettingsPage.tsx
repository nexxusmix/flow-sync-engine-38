import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { IntegrationSettings } from "@/types/settings";
import { ArrowLeft, Plug, Check, X, RefreshCw, ExternalLink, Instagram, MessageCircle, Brain, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const INTEGRATIONS_CONFIG = [
  { provider: 'instagram', name: 'Instagram', icon: Instagram, description: 'Feed e stories preview', color: 'text-pink-500' },
  { provider: 'whatsapp', name: 'WhatsApp Business', icon: MessageCircle, description: 'API oficial (placeholder)', color: 'text-emerald-500' },
  { provider: 'gemini', name: 'IA Gemini', icon: Brain, description: 'Geração de conteúdo', color: 'text-blue-500' },
  { provider: 'stripe', name: 'Stripe', icon: CreditCard, description: 'Pagamentos (placeholder)', color: 'text-violet-500' },
];

export default function IntegrationsSettingsPage() {
  const navigate = useNavigate();
  const [integrations, setIntegrations] = useState<IntegrationSettings[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('integration_settings')
        .select('*');

      if (error) {
        console.error("Error loading integrations:", error);
        toast.error("Erro ao carregar integrações");
        setIntegrations([]);
      } else {
        setIntegrations((data || []) as unknown as IntegrationSettings[]);
      }
    } catch (error) {
      console.error("Error loading integrations:", error);
      toast.error("Erro inesperado");
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  };

  const getIntegrationStatus = (provider: string) => {
    const integration = integrations.find(i => i.provider === provider);
    return integration?.status || 'disconnected';
  };

  const handleConnect = async (provider: string) => {
    toast.info(`Conectando ${provider}...`);
    // Placeholder - implement OAuth flow per provider
  };

  const handleDisconnect = async (provider: string) => {
    const integration = integrations.find(i => i.provider === provider);
    if (!integration) return;

    try {
      const { error } = await supabase
        .from('integration_settings')
        .update({ status: 'disconnected', connected_at: null })
        .eq('id', integration.id);

      if (error) throw error;
      toast.success(`${provider} desconectado`);
      loadIntegrations();
    } catch (error) {
      console.error("Error disconnecting:", error);
      toast.error("Erro ao desconectar");
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Integrações">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Integrações">
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/configuracoes')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-light text-foreground">Integrações</h1>
            <p className="text-sm text-muted-foreground">Conecte serviços externos</p>
          </div>
        </div>

        <div className="grid gap-4">
          {INTEGRATIONS_CONFIG.map((config) => {
            const Icon = config.icon;
            const status = getIntegrationStatus(config.provider);
            const isConnected = status === 'connected';

            return (
              <Card key={config.provider} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${config.color}`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{config.name}</h3>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isConnected ? (
                        <>
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                            <Check className="w-3 h-3 mr-1" />
                            Conectado
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => handleDisconnect(config.provider)}>
                            Desconectar
                          </Button>
                        </>
                      ) : status === 'error' ? (
                        <>
                          <Badge variant="destructive">
                            <X className="w-3 h-3 mr-1" />
                            Erro
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => handleConnect(config.provider)}>
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Reconectar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Badge variant="outline" className="text-muted-foreground">
                            Não conectado
                          </Badge>
                          <Button size="sm" onClick={() => handleConnect(config.provider)}>
                            Conectar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="glass-card bg-muted/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              <strong>Nota:</strong> Falhas de integração não quebram a UI. 
              Dados são cacheados localmente quando possível.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
