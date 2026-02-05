import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { ProjectStageSettings } from "@/types/settings";
import { ArrowLeft, FolderKanban, Save, Plus, GripVertical, Trash2, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ProjectStagesSettingsPage() {
  const navigate = useNavigate();
  const [stages, setStages] = useState<ProjectStageSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStages();
  }, []);

  const loadStages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_stage_settings')
        .select('*')
        .order('stage_order');

      if (error) throw error;
      setStages((data || []) as unknown as ProjectStageSettings[]);
    } catch (error) {
      console.error("Error loading stages:", error);
      toast.error("Erro ao carregar etapas");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const stage of stages) {
        await supabase
          .from('project_stage_settings')
          .update({
            stage_label: stage.stage_label,
            sla_days: stage.sla_days,
            blocks_delivery: stage.blocks_delivery,
            is_active: stage.is_active,
          })
          .eq('id', stage.id);
      }

      await supabase.from('event_logs').insert([{
        action: 'update',
        entity_type: 'project_stage_settings',
        actor_name: 'Admin',
        payload: { stages_count: stages.length },
      }]);

      toast.success("Etapas salvas!");
    } catch (error) {
      console.error("Error saving stages:", error);
      toast.error("Erro ao salvar etapas");
    } finally {
      setSaving(false);
    }
  };

  const addStage = async () => {
    const newOrder = stages.length + 1;
    try {
      const { data, error } = await supabase
        .from('project_stage_settings')
        .insert([{
          stage_order: newOrder,
          stage_key: `custom_${newOrder}`,
          stage_label: `Etapa ${newOrder}`,
          sla_days: 3,
          blocks_delivery: false,
          is_active: true,
        }])
        .select()
        .single();

      if (error) throw error;
      setStages([...stages, data as unknown as ProjectStageSettings]);
      toast.success("Etapa adicionada!");
    } catch (error) {
      console.error("Error adding stage:", error);
      toast.error("Erro ao adicionar etapa");
    }
  };

  const deleteStage = async (stage: ProjectStageSettings) => {
    if (!confirm(`Excluir etapa "${stage.stage_label}"?`)) return;

    try {
      const { error } = await supabase
        .from('project_stage_settings')
        .delete()
        .eq('id', stage.id);

      if (error) throw error;
      setStages(stages.filter(s => s.id !== stage.id));
      toast.success("Etapa excluída!");
    } catch (error) {
      console.error("Error deleting stage:", error);
      toast.error("Erro ao excluir etapa");
    }
  };

  const updateStage = (id: string, field: keyof ProjectStageSettings, value: unknown) => {
    setStages(stages.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  if (loading) {
    return (
      <DashboardLayout title="Etapas de Projeto">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Etapas de Projeto">
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/configuracoes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-light text-foreground">Etapas de Projeto</h1>
              <p className="text-sm text-muted-foreground">Configure etapas padrão e SLAs</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={addStage}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        {/* Stages List */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-primary" />
              Etapas do Fluxo de Projeto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stages.map((stage, index) => (
              <div
                key={stage.id}
                className={`p-4 rounded-lg border ${stage.is_active ? 'bg-card' : 'bg-muted/30 opacity-60'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GripVertical className="w-4 h-4" />
                    <span className="text-sm font-mono w-6">{index + 1}</span>
                  </div>

                  <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                    <Input
                      value={stage.stage_label}
                      onChange={(e) => updateStage(stage.id, 'stage_label', e.target.value)}
                      placeholder="Nome da etapa"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={stage.sla_days}
                        onChange={(e) => updateStage(stage.id, 'sla_days', parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                      <span className="text-xs text-muted-foreground">dias SLA</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={stage.blocks_delivery}
                        onCheckedChange={(v) => updateStage(stage.id, 'blocks_delivery', v)}
                      />
                      <Label className="text-xs">
                        {stage.blocks_delivery && <Lock className="w-3 h-3 inline mr-1" />}
                        Bloqueia entrega
                      </Label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={stage.is_active}
                          onCheckedChange={(v) => updateStage(stage.id, 'is_active', v)}
                        />
                        <Label className="text-xs">{stage.is_active ? 'Ativa' : 'Inativa'}</Label>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteStage(stage)}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {stages.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma etapa configurada. Clique em "Adicionar" para começar.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="glass-card bg-muted/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              <strong>SLA:</strong> Tempo máximo esperado para cada etapa. Usado em relatórios de atraso.<br/>
              <strong>Bloqueia entrega:</strong> Etapas que precisam ser concluídas antes da entrega final.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
