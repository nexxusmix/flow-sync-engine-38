import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { IntegrationSettings } from "@/types/settings";
import { ArrowLeft, Plug, Check, X, RefreshCw, ExternalLink, Instagram, MessageCircle, Brain, CreditCard, Calendar, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const INTEGRATIONS_CONFIG = [
  { provider: 'instagram', name: 'Instagram', icon: Instagram, description: 'Feed e stories preview', color: 'text-primary' },
  { provider: 'whatsapp', name: 'WhatsApp Business', icon: MessageCircle, description: 'API oficial (placeholder)', color: 'text-primary' },
  { provider: 'gemini', name: 'IA Gemini', icon: Brain, description: 'Geração de conteúdo', color: 'text-primary' },
  { provider: 'stripe', name: 'Stripe', icon: CreditCard, description: 'Pagamentos (placeholder)', color: 'text-primary' },
];

export default function IntegrationsSettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [integrations, setIntegrations] = useState<IntegrationSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarConnection, setCalendarConnection] = useState<any>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);

  useEffect(() => {
    loadIntegrations();
    loadCalendarConnection();
  }, []);

  // Handle OAuth callback code from Google
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      handleGoogleCalendarCallback(code);
      // Clean URL
      searchParams.delete("code");
      searchParams.delete("scope");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

  const loadCalendarConnection = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("calendar_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .maybeSingle();
    setCalendarConnection(data);
  };

  const handleAuthorizeCalendar = async () => {
    setCalendarLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado");
        return;
      }

      const redirectUri = window.location.origin + window.location.pathname;

      const { data, error } = await supabase.functions.invoke("google-calendar-sync", {
        body: {
          action: "oauth-url",
          user_id: user.id,
          redirect_uri: redirectUri,
          login_hint: user.email,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error("Error starting calendar auth:", err);
      toast.error("Erro ao iniciar autorização do Calendar");
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleGoogleCalendarCallback = useCallback(async (code: string) => {
    setCalendarLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado");
        return;
      }

      const redirectUri = window.location.origin + window.location.pathname;

      const { data, error } = await supabase.functions.invoke("google-calendar-sync", {
        body: {
          action: "callback",
          user_id: user.id,
          code,
          redirect_uri: redirectUri,
        },
      });

      if (error) throw error;
      if (data?.success) {
        toast.success(`Google Calendar conectado (${data.email})`);
        loadCalendarConnection();
      } else {
        throw new Error("Falha na troca de tokens");
      }
    } catch (err: any) {
      console.error("Calendar callback error:", err);
      toast.error("Erro ao conectar Google Calendar");
    } finally {
      setCalendarLoading(false);
    }
  }, []);

  const handleDisconnectCalendar = async () => {
    setCalendarLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.functions.invoke("google-calendar-sync", {
        body: { action: "disconnect", user_id: user.id },
      });

      if (error) throw error;
      toast.success("Google Calendar desconectado");
      setCalendarConnection(null);
    } catch (err: any) {
      console.error("Disconnect error:", err);
      toast.error("Erro ao desconectar");
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleSyncCalendar = async () => {
    setCalendarLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke("google-calendar-sync", {
        body: { action: "sync", user_id: user.id },
      });

      if (error) throw error;
      toast.success(`Sincronizado: ${data.pulled} importados, ${data.pushed} exportados`);
    } catch (err: any) {
      console.error("Sync error:", err);
      toast.error("Erro ao sincronizar");
    } finally {
      setCalendarLoading(false);
    }
  };

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

  const isCalendarConnected = !!calendarConnection;

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

        {/* Google Calendar Card */}
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Google Calendar</h3>
                  <p className="text-xs text-muted-foreground">
                    {isCalendarConnected
                      ? `Conectado: ${calendarConnection.email}`
                      : "Sincronize eventos com sua conta Google"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {calendarLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : isCalendarConnected ? (
                  <>
                     <Badge className="bg-primary/10 text-primary border-primary/30">
                      <Check className="w-3 h-3 mr-1" />
                      Conectado
                    </Badge>
                    <Button variant="outline" size="sm" onClick={handleSyncCalendar}>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Sincronizar
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDisconnectCalendar}>
                      Desconectar
                    </Button>
                  </>
                ) : (
                  <>
                    <Badge variant="outline" className="text-muted-foreground">
                      Não conectado
                    </Badge>
                    <Button size="sm" onClick={handleAuthorizeCalendar}>
                      Autorizar Calendar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Other integrations */}
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
                      <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
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
                          <Badge className="bg-primary/10 text-primary border-primary/30">
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
