import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WebhookManager } from "@/components/integrations/WebhookManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MessageSquare, Webhook, Calendar, Plug, RefreshCw, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function IntegrationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [googleConnected, setGoogleConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);

  // Check Google Calendar connection status
  useEffect(() => {
    if (!user) return;
    supabase.from("calendar_connections").select("email").eq("user_id", user.id).eq("provider", "google").single()
      .then(({ data }) => {
        if (data) { setGoogleConnected(true); setGoogleEmail(data.email); }
      });
  }, [user]);

  const handleGoogleConnect = async () => {
    if (!user) return;
    const redirectUri = `${window.location.origin}/configuracoes/integracoes`;
    const { data, error } = await supabase.functions.invoke("google-calendar-sync", {
      body: { action: "oauth-url", user_id: user.id, redirect_uri: redirectUri },
    });
    if (data?.url) window.location.href = data.url;
    else toast.error("Erro ao iniciar conexão Google");
  };

  const handleGoogleSync = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-sync", {
        body: { action: "sync", user_id: user.id },
      });
      if (error) throw error;
      toast.success(`Sincronizado: ${data.pulled} importados, ${data.pushed} exportados`);
    } catch { toast.error("Erro na sincronização"); }
    finally { setIsSyncing(false); }
  };

  const handleGoogleDisconnect = async () => {
    if (!user) return;
    await supabase.functions.invoke("google-calendar-sync", {
      body: { action: "disconnect", user_id: user.id },
    });
    setGoogleConnected(false);
    setGoogleEmail(null);
    toast.success("Google Calendar desconectado");
  };

  return (
    <DashboardLayout title="Integrações">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/configuracoes")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-light tracking-wide">Integrações</h1>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Slack */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#4A154B]/10 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-[#4A154B]" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-medium">Slack</CardTitle>
                      <p className="text-xs text-muted-foreground">Notificações em tempo real nos seus canais</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                    Disponível
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Receba notificações de projetos, tarefas, deals e financeiro diretamente no Slack.
                  A integração usa o conector Lovable — sem necessidade de app customizado.
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Para ativar, conecte o Slack em <strong>Configurações → Integrações</strong> no painel principal.
                </p>
              </CardContent>
            </Card>

            {/* Google Calendar */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-medium">Google Calendar</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {googleConnected ? `Conectado: ${googleEmail}` : "Sync bidirecional de eventos"}
                      </p>
                    </div>
                  </div>
                  {googleConnected ? (
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px]">
                      <Check className="w-3 h-3 mr-1" /> Conectado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                      Disponível
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Sincronize deadlines de projetos, reuniões com clientes e eventos do calendário interno com o Google Calendar.
                </p>
                <div className="flex gap-2">
                  {googleConnected ? (
                    <>
                      <Button size="sm" variant="outline" onClick={handleGoogleSync} disabled={isSyncing}>
                        <RefreshCw className={`w-4 h-4 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
                        Sincronizar agora
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleGoogleDisconnect}>
                        Desconectar
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={handleGoogleConnect}>
                      <Calendar className="w-4 h-4 mr-1" />
                      Conectar Google Calendar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Webhooks */}
            <Card className="glass-card cursor-pointer hover:border-primary/20 transition-colors" onClick={() => setTab("webhooks")}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Webhook className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-medium">Webhooks</CardTitle>
                      <p className="text-xs text-muted-foreground">Conecte com n8n, Zapier e mais</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-emerald-500 border-emerald-500/20">
                    Ativo
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Envie eventos para URLs externas (saída) ou receba dados de sistemas externos (entrada) com assinatura HMAC.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="mt-4">
            <WebhookManager />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
