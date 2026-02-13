import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { BrandingSettings } from "@/types/settings";
import { ArrowLeft, Palette, Save, Image } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const COLOR_PRESETS = [
  { name: "Azul SQUAD", primary: "#00A3D3", accent: "#0077B6" },
  { name: "Roxo", primary: "#7C3AED", accent: "#8B5CF6" },
  { name: "Verde", primary: "#059669", accent: "#10B981" },
  { name: "Laranja", primary: "#EA580C", accent: "#F97316" },
  { name: "Rosa", primary: "#DB2777", accent: "#EC4899" },
  { name: "Índigo", primary: "#4F46E5", accent: "#6366F1" },
];

export default function BrandingSettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<BrandingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  // Live preview: apply colors as CSS vars while editing
  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    if (settings.primary_color) {
      const hsl = hexToHSL(settings.primary_color);
      if (hsl) {
        root.style.setProperty('--primary', hsl);
        root.style.setProperty('--ring', hsl);
      }
    }
    if (settings.accent_color) {
      const hsl = hexToHSL(settings.accent_color);
      if (hsl) root.style.setProperty('--accent', hsl);
    }
  }, [settings?.primary_color, settings?.accent_color]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('branding_settings')
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
          .from('branding_settings')
          .insert([{}])
          .select()
          .single();
        if (insertError) {
          console.error("Error creating settings:", insertError);
          toast.error("Erro ao criar configurações");
        } else {
          setSettings(newData as unknown as BrandingSettings);
        }
      } else {
        setSettings(data as unknown as BrandingSettings);
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
        .from('branding_settings')
        .update({
          logo_url: settings.logo_url,
          logo_alt_url: settings.logo_alt_url,
          favicon_url: settings.favicon_url,
          primary_color: settings.primary_color,
          accent_color: settings.accent_color,
          footer_text: settings.footer_text,
          pdf_signature: settings.pdf_signature,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['branding-colors'] });
      toast.success("Branding salvo!");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof BrandingSettings>(field: K, value: BrandingSettings[K]) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    if (!settings) return;
    setSettings({ ...settings, primary_color: preset.primary, accent_color: preset.accent });
    toast.info(`Preset "${preset.name}" aplicado — salve para confirmar`);
  };

  if (loading) {
    return (
      <DashboardLayout title="Branding">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Branding">
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/configuracoes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-light text-foreground">Branding</h1>
              <p className="text-sm text-muted-foreground">Logo, cores e identidade visual</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

        {/* Logos */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Image className="w-4 h-4 text-primary" />
              Logos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Logo Principal (URL)</Label>
                <Input
                  value={settings?.logo_url || ''}
                  onChange={(e) => updateField('logo_url', e.target.value)}
                  placeholder="https://..."
                />
                {settings?.logo_url && (
                  <div className="h-16 bg-muted/30 rounded-lg flex items-center justify-center p-2">
                    <img src={settings.logo_url} alt="Logo" className="max-h-full object-contain" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Logo Alternativa (URL)</Label>
                <Input
                  value={settings?.logo_alt_url || ''}
                  onChange={(e) => updateField('logo_alt_url', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Favicon (URL)</Label>
              <Input
                value={settings?.favicon_url || ''}
                onChange={(e) => updateField('favicon_url', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              Cores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Presets */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Presets rápidos</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border hover:border-primary/40 transition-colors text-xs"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ background: preset.primary }}
                    />
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ background: preset.accent }}
                    />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cor Primária</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings?.primary_color || '#6366f1'}
                    onChange={(e) => updateField('primary_color', e.target.value)}
                    className="w-14 h-10 p-1"
                  />
                  <Input
                    value={settings?.primary_color || '#6366f1'}
                    onChange={(e) => updateField('primary_color', e.target.value)}
                    placeholder="#6366f1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cor de Destaque</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings?.accent_color || '#8b5cf6'}
                    onChange={(e) => updateField('accent_color', e.target.value)}
                    className="w-14 h-10 p-1"
                  />
                  <Input
                    value={settings?.accent_color || '#8b5cf6'}
                    onChange={(e) => updateField('accent_color', e.target.value)}
                    placeholder="#8b5cf6"
                  />
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Preview ao vivo</Label>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background">
                <div className="w-10 h-10 rounded-xl" style={{ background: settings?.primary_color || '#6366f1' }} />
                <div className="w-10 h-10 rounded-xl" style={{ background: settings?.accent_color || '#8b5cf6' }} />
                <div className="flex-1 space-y-1">
                  <div className="h-2 rounded-full w-3/4" style={{ background: settings?.primary_color || '#6366f1' }} />
                  <div className="h-2 rounded-full w-1/2" style={{ background: settings?.accent_color || '#8b5cf6', opacity: 0.5 }} />
                </div>
                <Button size="sm" className="text-xs">Exemplo</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Texts */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Textos Padrão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Rodapé</Label>
              <Input
                value={settings?.footer_text || ''}
                onChange={(e) => updateField('footer_text', e.target.value)}
                placeholder="© SQUAD Produções"
              />
            </div>
            <div className="space-y-2">
              <Label>Assinatura em PDFs</Label>
              <Textarea
                value={settings?.pdf_signature || ''}
                onChange={(e) => updateField('pdf_signature', e.target.value)}
                placeholder="Texto exibido no rodapé de propostas e contratos em PDF"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card bg-muted/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              Estas configurações são usadas em: Propostas, Contratos, Relatórios e Portal do Cliente.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function hexToHSL(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
