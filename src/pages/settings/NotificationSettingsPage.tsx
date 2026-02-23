import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { NotificationSettings } from "@/types/settings";
import { ArrowLeft, Bell, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function NotificationSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code === 'PGRST116') {
        const { data: newData } = await supabase
          .from('notification_settings')
          .insert([{}])
          .select()
          .single();
        setSettings(newData as unknown as NotificationSettings);
      } else if (data) {
        setSettings(data as unknown as NotificationSettings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('notification_settings')
        .update({
          delays_enabled: settings.delays_enabled,
          blocks_enabled: settings.blocks_enabled,
          proposals_enabled: settings.proposals_enabled,
          contracts_enabled: settings.contracts_enabled,
          email_enabled: settings.email_enabled,
          inapp_enabled: settings.inapp_enabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);

      if (error) throw error;
      toast.success("Notificações salvas!");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof NotificationSettings>(field: K, value: boolean) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <DashboardLayout title="Notificações">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Notificações">
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/configuracoes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-light text-foreground">Notificações</h1>
              <p className="text-sm text-muted-foreground">Configure alertas e canais</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

        {/* Types */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Tipos de Notificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium text-foreground">Atrasos</p>
                <p className="text-xs text-muted-foreground">Alertas de projetos e entregas atrasadas</p>
              </div>
              <Switch
                checked={settings?.delays_enabled ?? true}
                onCheckedChange={(v) => updateField('delays_enabled', v)}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium text-foreground">Propostas Aceitas</p>
                <p className="text-xs text-muted-foreground">Quando cliente aceita proposta</p>
              </div>
              <Switch
                checked={settings?.proposals_enabled ?? true}
                onCheckedChange={(v) => updateField('proposals_enabled', v)}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium text-foreground">Contratos Assinados</p>
                <p className="text-xs text-muted-foreground">Quando cliente assina contrato</p>
              </div>
              <Switch
                checked={settings?.contracts_enabled ?? true}
                onCheckedChange={(v) => updateField('contracts_enabled', v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Channels */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Canais de Entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium text-foreground">In-App</p>
                <p className="text-xs text-muted-foreground">Notificações dentro do sistema</p>
              </div>
              <Switch
                checked={settings?.inapp_enabled ?? true}
                onCheckedChange={(v) => updateField('inapp_enabled', v)}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 opacity-60">
              <div>
                <p className="font-medium text-foreground">Email</p>
                <p className="text-xs text-muted-foreground">Envio por email (em breve)</p>
              </div>
              <Switch
                checked={settings?.email_enabled ?? false}
                onCheckedChange={(v) => updateField('email_enabled', v)}
                disabled
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
