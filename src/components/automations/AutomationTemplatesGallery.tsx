import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Zap, ArrowRight } from "lucide-react";
import { AUTOMATION_TEMPLATES, MODULE_OPTIONS, TRIGGER_TYPES, ACTION_TYPES, useSaveAutomation } from "@/hooks/useAutomations";
import { sc } from "@/lib/colors";

interface Props {
  onCreated: () => void;
}

export function AutomationTemplatesGallery({ onCreated }: Props) {
  const saveAutomation = useSaveAutomation();

  const activateTemplate = (template: typeof AUTOMATION_TEMPLATES[number]) => {
    saveAutomation.mutate({
      automation: {
        name: template.name,
        description: template.description,
        module: template.module,
        trigger_type: template.trigger_type,
        trigger_config: template.trigger_config,
        conditions: template.conditions,
        require_approval: template.actions.some((a) => a.require_approval),
        status: "draft",
        is_template: false,
        template_key: template.template_key,
      },
      actions: template.actions.map((a) => ({
        ...a,
        action_config: {},
      })),
    }, {
      onSuccess: () => onCreated(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-sm text-muted-foreground">Templates prontos para ativação. Duplique e personalize.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AUTOMATION_TEMPLATES.map((tpl) => {
          const moduleDef = MODULE_OPTIONS.find((m) => m.key === tpl.module);
          const triggerDef = TRIGGER_TYPES.find((t) => t.key === tpl.trigger_type);

          return (
            <div key={tpl.template_key} className="glass-card rounded-xl p-5 hover:border-primary/20 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{tpl.name}</h3>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 mt-0.5">
                      {moduleDef?.label}
                    </Badge>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-4">{tpl.description}</p>

              {/* Flow visualization */}
              <div className="space-y-1.5 mb-4">
                {/* Trigger */}
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-5 h-5 rounded bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-rounded text-[12px] text-primary">{triggerDef?.icon || "bolt"}</span>
                  </div>
                  <span className="text-muted-foreground">Quando:</span>
                  <span className="text-foreground font-medium">{triggerDef?.label}</span>
                </div>

                {/* Actions */}
                {tpl.actions.map((action, i) => {
                  const actionDef = ACTION_TYPES.find((a) => a.key === action.action_type);
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs pl-2">
                      <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
                      <div className="w-5 h-5 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-rounded text-[12px] text-muted-foreground">{actionDef?.icon || "bolt"}</span>
                      </div>
                      <span className="text-foreground">{action.action_label}</span>
                      {action.require_approval && (
                        <Badge variant="outline" className="text-[9px] py-0 px-1 text-primary border-primary/30">🛡️</Badge>
                      )}
                    </div>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 group-hover:border-primary/30 group-hover:text-primary"
                onClick={() => activateTemplate(tpl)}
                disabled={saveAutomation.isPending}
              >
                <Copy className="w-3.5 h-3.5" />
                Usar Template
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
