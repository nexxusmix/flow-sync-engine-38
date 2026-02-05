import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { ProspectingSettings } from "@/types/settings";
import { ArrowLeft, Target, Save, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ProspectingSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<ProspectingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newChannel, setNewChannel] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prospecting_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error loading settings:", error);
        toast.error("Erro ao carregar configurações");
        setLoading(false);
        return;
      }

      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from('prospecting_settings')
          .insert([{}])
          .select()
          .single();
        
        if (insertError) {
          console.error("Error creating settings:", insertError);
          toast.error("Erro ao criar configurações");
        } else {
          setSettings(newData as unknown as ProspectingSettings);
        }
      } else {
        setSettings(data as unknown as ProspectingSettings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('prospecting_settings')
        .update({
          daily_activity_limit: settings.daily_activity_limit,
          allowed_channels: settings.allowed_channels,
          min_followup_delay_hours: settings.min_followup_delay_hours,
          optout_text: settings.optout_text,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);

      if (error) throw error;
      toast.success("Configurações salvas!");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const addChannel = () => {
    if (!newChannel.trim() || !settings) return;
    setSettings({ ...settings, allowed_channels: [...(settings.allowed_channels || []), newChannel.trim()] });
    setNewChannel("");
  };

  const removeChannel = (channel: string) => {
    if (!settings) return;
    setSettings({ ...settings, allowed_channels: settings.allowed_channels.filter(c => c !== channel) });
  };

  if (loading) {
    return (
      <DashboardLayout title="Prospecção">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Prospecção">
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/configuracoes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-light text-foreground">Prospecção</h1>
              <p className="text-sm text-muted-foreground">Limites, canais e opt-out</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

        {/* Limits */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Limites
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Limite diário de atividades por usuário</Label>
                <Input
                  type="number"
                  min="1"
                  value={settings?.daily_activity_limit || 20}
                  onChange={(e) => settings && setSettings({ ...settings, daily_activity_limit: parseInt(e.target.value) || 20 })}
                  className="w-32"
                />
              </div>
              <div className="space-y-2">
                <Label>Delay mínimo entre follow-ups (horas)</Label>
                <Input
                  type="number"
                  min="1"
                  value={settings?.min_followup_delay_hours || 24}
                  onChange={(e) => settings && setSettings({ ...settings, min_followup_delay_hours: parseInt(e.target.value) || 24 })}
                  className="w-32"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Channels */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Canais Permitidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {settings?.allowed_channels?.map((c) => (
                <Badge key={c} variant="secondary" className="flex items-center gap-1 capitalize">
                  {c}
                  <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => removeChannel(c)} />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newChannel} onChange={(e) => setNewChannel(e.target.value)} placeholder="Novo canal" onKeyDown={(e) => e.key === 'Enter' && addChannel()} />
              <Button variant="outline" onClick={addChannel}><Plus className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>

        {/* Opt-out */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Texto de Opt-out</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={settings?.optout_text || ''}
              onChange={(e) => settings && setSettings({ ...settings, optout_text: e.target.value })}
              placeholder="Se não deseja mais receber contato, responda SAIR."
              rows={2}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Este texto é incluído automaticamente nas mensagens de prospecção.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
