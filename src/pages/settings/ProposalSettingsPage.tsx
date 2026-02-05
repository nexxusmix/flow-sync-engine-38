import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { ProposalSettings } from "@/types/settings";
import { ArrowLeft, FileText, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ProposalSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<ProposalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('proposal_settings')
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
        // No settings exist, create default
        const { data: newData, error: insertError } = await supabase
          .from('proposal_settings')
          .insert([{}])
          .select()
          .single();
        
        if (insertError) {
          console.error("Error creating settings:", insertError);
          toast.error("Erro ao criar configurações");
        } else {
          setSettings(newData as unknown as ProposalSettings);
        }
      } else {
        setSettings(data as unknown as ProposalSettings);
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
        .from('proposal_settings')
        .update({
          validity_days: settings.validity_days,
          prefix: settings.prefix,
          intro_text: settings.intro_text,
          terms_text: settings.terms_text,
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

  if (loading) {
    return (
      <DashboardLayout title="Propostas">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Propostas">
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/configuracoes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-light text-foreground">Propostas</h1>
              <p className="text-sm text-muted-foreground">Validade, textos e numeração</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

        {/* Basic */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Configurações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Validade Padrão (dias)</Label>
                <Input
                  type="number"
                  min="1"
                  value={settings?.validity_days || 15}
                  onChange={(e) => settings && setSettings({ ...settings, validity_days: parseInt(e.target.value) || 15 })}
                  className="w-32"
                />
              </div>
              <div className="space-y-2">
                <Label>Prefixo de Numeração</Label>
                <Input
                  value={settings?.prefix || ''}
                  onChange={(e) => settings && setSettings({ ...settings, prefix: e.target.value })}
                  placeholder="PROP"
                  className="w-32"
                />
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
              <Label>Texto de Introdução</Label>
              <Textarea
                value={settings?.intro_text || ''}
                onChange={(e) => settings && setSettings({ ...settings, intro_text: e.target.value })}
                placeholder="Obrigado pela oportunidade de apresentar nossa proposta."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Texto de Termos</Label>
              <Textarea
                value={settings?.terms_text || ''}
                onChange={(e) => settings && setSettings({ ...settings, terms_text: e.target.value })}
                placeholder="Proposta válida por {{validity_days}} dias."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Use {"{{validity_days}}"} para inserir a validade dinamicamente.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
