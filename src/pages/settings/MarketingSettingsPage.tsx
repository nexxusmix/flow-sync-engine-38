import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { MarketingSettings } from "@/types/settings";
import { ArrowLeft, Megaphone, Save, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function MarketingSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<MarketingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPillar, setNewPillar] = useState("");
  const [newChannel, setNewChannel] = useState("");
  const [newFormat, setNewFormat] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('marketing_settings')
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
          .from('marketing_settings')
          .insert([{}])
          .select()
          .single();
        
        if (insertError) {
          console.error("Error creating settings:", insertError);
          toast.error("Erro ao criar configurações");
        } else {
          setSettings(newData as unknown as MarketingSettings);
        }
      } else {
        setSettings(data as unknown as MarketingSettings);
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
        .from('marketing_settings')
        .update({
          active_pillars: settings.active_pillars,
          active_channels: settings.active_channels,
          active_formats: settings.active_formats,
          default_tone: settings.default_tone,
          recommended_frequency: settings.recommended_frequency,
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

  const addItem = (field: 'active_pillars' | 'active_channels' | 'active_formats', value: string, setter: (v: string) => void) => {
    if (!value.trim() || !settings) return;
    const current = settings[field] || [];
    setSettings({ ...settings, [field]: [...current, value.trim()] });
    setter("");
  };

  const removeItem = (field: 'active_pillars' | 'active_channels' | 'active_formats', value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: settings[field].filter(v => v !== value) });
  };

  if (loading) {
    return (
      <DashboardLayout title="Marketing">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Marketing">
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/configuracoes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-light text-foreground">Marketing & Conteúdo</h1>
              <p className="text-sm text-muted-foreground">Pilares, canais e formatos</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

        {/* Pillars */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Pilares de Conteúdo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {settings?.active_pillars?.map((p) => (
                <Badge key={p} variant="secondary" className="flex items-center gap-1">
                  {p}
                  <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => removeItem('active_pillars', p)} />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newPillar} onChange={(e) => setNewPillar(e.target.value)} placeholder="Novo pilar" onKeyDown={(e) => e.key === 'Enter' && addItem('active_pillars', newPillar, setNewPillar)} />
              <Button variant="outline" onClick={() => addItem('active_pillars', newPillar, setNewPillar)}><Plus className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>

        {/* Channels */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Canais Ativos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {settings?.active_channels?.map((c) => (
                <Badge key={c} variant="secondary" className="flex items-center gap-1">
                  {c}
                  <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => removeItem('active_channels', c)} />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newChannel} onChange={(e) => setNewChannel(e.target.value)} placeholder="Novo canal" onKeyDown={(e) => e.key === 'Enter' && addItem('active_channels', newChannel, setNewChannel)} />
              <Button variant="outline" onClick={() => addItem('active_channels', newChannel, setNewChannel)}><Plus className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>

        {/* Formats */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Formatos Permitidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {settings?.active_formats?.map((f) => (
                <Badge key={f} variant="secondary" className="flex items-center gap-1">
                  {f}
                  <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => removeItem('active_formats', f)} />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newFormat} onChange={(e) => setNewFormat(e.target.value)} placeholder="Novo formato" onKeyDown={(e) => e.key === 'Enter' && addItem('active_formats', newFormat, setNewFormat)} />
              <Button variant="outline" onClick={() => addItem('active_formats', newFormat, setNewFormat)}><Plus className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>

        {/* Tone & Frequency */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Tom e Frequência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tom de Voz Default (usado pela IA)</Label>
              <Textarea
                value={settings?.default_tone || ''}
                onChange={(e) => settings && setSettings({ ...settings, default_tone: e.target.value })}
                placeholder="Profissional e acessível"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Frequência Recomendada</Label>
              <Input
                value={settings?.recommended_frequency || ''}
                onChange={(e) => settings && setSettings({ ...settings, recommended_frequency: e.target.value })}
                placeholder="3-5 posts por semana"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
