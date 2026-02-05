import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { FinanceSettings } from "@/types/settings";
import { ArrowLeft, DollarSign, Save, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function FinanceSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<FinanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newMethod, setNewMethod] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('finance_settings')
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
          .from('finance_settings')
          .insert([{}])
          .select()
          .single();
        
        if (insertError) {
          console.error("Error creating settings:", insertError);
          toast.error("Erro ao criar configurações");
        } else {
          setSettings(newData as unknown as FinanceSettings);
        }
      } else {
        setSettings(data as unknown as FinanceSettings);
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
        .from('finance_settings')
        .update({
          expense_categories: settings.expense_categories,
          payment_methods: settings.payment_methods,
          block_after_days: settings.block_after_days,
          block_message: settings.block_message,
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

  const addCategory = () => {
    if (!newCategory.trim() || !settings) return;
    setSettings({
      ...settings,
      expense_categories: [...(settings.expense_categories || []), newCategory.trim()],
    });
    setNewCategory("");
  };

  const removeCategory = (cat: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      expense_categories: settings.expense_categories.filter(c => c !== cat),
    });
  };

  const addMethod = () => {
    if (!newMethod.trim() || !settings) return;
    setSettings({
      ...settings,
      payment_methods: [...(settings.payment_methods || []), newMethod.trim()],
    });
    setNewMethod("");
  };

  const removeMethod = (method: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      payment_methods: settings.payment_methods.filter(m => m !== method),
    });
  };

  if (loading) {
    return (
      <DashboardLayout title="Financeiro">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Financeiro">
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/configuracoes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-light text-foreground">Financeiro</h1>
              <p className="text-sm text-muted-foreground">Categorias, métodos e regras</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

        {/* Categories */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Categorias de Despesas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {settings?.expense_categories?.map((cat) => (
                <Badge key={cat} variant="secondary" className="flex items-center gap-1">
                  {cat}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => removeCategory(cat)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nova categoria"
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              />
              <Button variant="outline" onClick={addCategory}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Métodos de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {settings?.payment_methods?.map((method) => (
                <Badge key={method} variant="secondary" className="flex items-center gap-1">
                  {method}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => removeMethod(method)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newMethod}
                onChange={(e) => setNewMethod(e.target.value)}
                placeholder="Novo método"
                onKeyDown={(e) => e.key === 'Enter' && addMethod()}
              />
              <Button variant="outline" onClick={addMethod}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Block Rules */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Regras de Bloqueio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Dias de atraso para bloquear projeto</Label>
              <Input
                type="number"
                min="1"
                value={settings?.block_after_days || 15}
                onChange={(e) => settings && setSettings({
                  ...settings,
                  block_after_days: parseInt(e.target.value) || 15,
                })}
                className="w-32"
              />
            </div>
            <div className="space-y-2">
              <Label>Mensagem de bloqueio (portal do cliente)</Label>
              <Textarea
                value={settings?.block_message || ''}
                onChange={(e) => settings && setSettings({
                  ...settings,
                  block_message: e.target.value,
                })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
