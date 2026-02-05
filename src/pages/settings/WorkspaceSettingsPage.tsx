import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { WorkspaceSettings, TIMEZONES, CURRENCIES, WEEKDAYS } from "@/types/settings";
import { ArrowLeft, Building2, Save, Clock, DollarSign, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function WorkspaceSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workspace_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code === 'PGRST116') {
        // No settings exist, create default
        const { data: newData, error: insertError } = await supabase
          .from('workspace_settings')
          .insert([{}])
          .select()
          .single();
        
        if (!insertError) {
          setSettings(newData as unknown as WorkspaceSettings);
        }
      } else if (data) {
        setSettings(data as unknown as WorkspaceSettings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('workspace_settings')
        .update({
          company_name: settings.company_name,
          company_document: settings.company_document,
          default_timezone: settings.default_timezone,
          default_currency: settings.default_currency,
          working_days: settings.working_days,
          working_hours: settings.working_hours,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);

      if (error) throw error;

      // Log event
      await supabase.from('event_logs').insert([{
        action: 'update',
        entity_type: 'workspace_settings',
        entity_id: settings.id,
        actor_name: 'Admin',
        payload: { updated_fields: ['company_name', 'timezone', 'currency', 'working_days', 'working_hours'] },
      }]);

      toast.success("Configurações salvas!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof WorkspaceSettings>(field: K, value: WorkspaceSettings[K]) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const toggleWorkingDay = (day: string) => {
    if (!settings) return;
    const currentDays = settings.working_days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    setSettings({ ...settings, working_days: newDays });
  };

  if (loading) {
    return (
      <DashboardLayout title="Workspace">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Workspace">
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/configuracoes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-light text-foreground">Workspace</h1>
              <p className="text-sm text-muted-foreground">Dados institucionais e operacionais</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

        {/* Company Info */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Dados da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Empresa</Label>
                <Input
                  value={settings?.company_name || ''}
                  onChange={(e) => updateField('company_name', e.target.value)}
                  placeholder="SQUAD Produções"
                />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input
                  value={settings?.company_document || ''}
                  onChange={(e) => updateField('company_document', e.target.value)}
                  placeholder="00.000.000/0001-00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regional */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Configurações Regionais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fuso Horário</Label>
                <Select
                  value={settings?.default_timezone || 'America/Sao_Paulo'}
                  onValueChange={(v) => updateField('default_timezone', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => (
                      <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Moeda Padrão</Label>
                <Select
                  value={settings?.default_currency || 'BRL'}
                  onValueChange={(v) => updateField('default_currency', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              Horário de Funcionamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Dias Úteis</Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map(day => (
                  <div
                    key={day.value}
                    className={`px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                      settings?.working_days?.includes(day.value)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/30 border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleWorkingDay(day.value)}
                  >
                    <span className="text-sm">{day.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Início do Expediente</Label>
                <Input
                  type="time"
                  value={settings?.working_hours?.start || '09:00'}
                  onChange={(e) => updateField('working_hours', { 
                    ...settings?.working_hours, 
                    start: e.target.value 
                  } as { start: string; end: string })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fim do Expediente</Label>
                <Input
                  type="time"
                  value={settings?.working_hours?.end || '18:00'}
                  onChange={(e) => updateField('working_hours', { 
                    ...settings?.working_hours, 
                    end: e.target.value 
                  } as { start: string; end: string })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
