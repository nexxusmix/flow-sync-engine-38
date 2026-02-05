import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { ContractSettings } from "@/types/settings";
import { ArrowLeft, FileSignature, Save, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function ContractSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<ContractSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newClause, setNewClause] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contract_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code === 'PGRST116') {
        const { data: newData } = await supabase
          .from('contract_settings')
          .insert([{}])
          .select()
          .single();
        setSettings(newData as unknown as ContractSettings);
      } else if (data) {
        setSettings(data as unknown as ContractSettings);
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
        .from('contract_settings')
        .update({
          default_revisions: settings.default_revisions,
          default_renewal_type: settings.default_renewal_type,
          default_renewal_notice_days: settings.default_renewal_notice_days,
          breach_text: settings.breach_text,
          mandatory_clauses: settings.mandatory_clauses,
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

  const addClause = () => {
    if (!newClause.trim() || !settings) return;
    setSettings({ ...settings, mandatory_clauses: [...(settings.mandatory_clauses || []), newClause.trim()] });
    setNewClause("");
  };

  const removeClause = (clause: string) => {
    if (!settings) return;
    setSettings({ ...settings, mandatory_clauses: settings.mandatory_clauses.filter(c => c !== clause) });
  };

  if (loading) {
    return (
      <DashboardLayout title="Contratos">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Contratos">
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/configuracoes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-light text-foreground">Contratos</h1>
              <p className="text-sm text-muted-foreground">Templates, cláusulas e revisões</p>
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
              <FileSignature className="w-4 h-4 text-primary" />
              Padrões do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Revisões Incluídas</Label>
                <Input
                  type="number"
                  min="0"
                  value={settings?.default_revisions || 2}
                  onChange={(e) => settings && setSettings({ ...settings, default_revisions: parseInt(e.target.value) || 2 })}
                  className="w-24"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Renovação</Label>
                <Select
                  value={settings?.default_renewal_type || 'none'}
                  onValueChange={(v) => settings && setSettings({ ...settings, default_renewal_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem renovação</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="auto">Automática</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Aviso de Renovação (dias)</Label>
                <Input
                  type="number"
                  min="1"
                  value={settings?.default_renewal_notice_days || 30}
                  onChange={(e) => settings && setSettings({ ...settings, default_renewal_notice_days: parseInt(e.target.value) || 30 })}
                  className="w-24"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mandatory Clauses */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Cláusulas Obrigatórias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {settings?.mandatory_clauses?.map((c) => (
                <Badge key={c} variant="secondary" className="flex items-center gap-1 capitalize">
                  {c}
                  <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => removeClause(c)} />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newClause} onChange={(e) => setNewClause(e.target.value)} placeholder="Nova cláusula" onKeyDown={(e) => e.key === 'Enter' && addClause()} />
              <Button variant="outline" onClick={addClause}><Plus className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>

        {/* Breach Text */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Texto de Inadimplência</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={settings?.breach_text || ''}
              onChange={(e) => settings && setSettings({ ...settings, breach_text: e.target.value })}
              placeholder="O não pagamento das parcelas acordadas poderá resultar na suspensão dos serviços."
              rows={3}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
