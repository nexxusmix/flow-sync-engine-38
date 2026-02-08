import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAutomation } from "@/hooks/useAutomation";
import { AutomationSuggestion, RULE_ICONS, RULE_COLORS } from "@/types/automation";
import {
  Zap, Play, Settings2, Clock, Check, X, ChevronRight,
  Loader2, RefreshCw, Lightbulb, AlertCircle, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AutomationsPage() {
  const {
    rules,
    pendingSuggestions,
    appliedSuggestions,
    ignoredSuggestions,
    isLoading,
    isRunning,
    isHandlingAction,
    toggleRule,
    runAutomations,
    handleAction,
    ignoreSuggestion,
  } = useAutomation();

  const [selectedSuggestion, setSelectedSuggestion] = useState<AutomationSuggestion | null>(null);
  const [actionResult, setActionResult] = useState<Record<string, unknown> | null>(null);

  const handleActionClick = async (suggestion: AutomationSuggestion, actionKey: string) => {
    const result = await handleAction(suggestion.id, actionKey);
    if (result) {
      setActionResult(result);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Automações Inteligentes">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Automações Inteligentes">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              A IA analisa seu conteúdo e sugere ações — você decide o que aplicar.
            </p>
          </div>
          <Button onClick={runAutomations} disabled={isRunning} className="gap-2">
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Executar Agora
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rules Panel */}
          <Card className="p-4 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Regras Inteligentes
              </h3>
              <Badge variant="secondary">{rules.filter(r => r.is_enabled).length} ativas</Badge>
            </div>

            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-start justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="flex items-center gap-2">
                      <span>{RULE_ICONS[rule.key] || '⚡'}</span>
                      <span className="font-medium text-sm truncate">{rule.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {rule.description}
                    </p>
                  </div>
                  <Switch
                    checked={rule.is_enabled}
                    onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Suggestions Feed */}
          <Card className="p-4 lg:col-span-2">
            <Tabs defaultValue="pending" className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Sugestões
                </h3>
                <TabsList className="h-8">
                  <TabsTrigger value="pending" className="text-xs px-3">
                    Pendentes ({pendingSuggestions.length})
                  </TabsTrigger>
                  <TabsTrigger value="applied" className="text-xs px-3">
                    Aplicadas ({appliedSuggestions.length})
                  </TabsTrigger>
                  <TabsTrigger value="ignored" className="text-xs px-3">
                    Ignoradas ({ignoredSuggestions.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 -mx-4 px-4">
                <TabsContent value="pending" className="mt-0 space-y-3">
                  {pendingSuggestions.length === 0 ? (
                    <EmptyState
                      icon={<Sparkles className="w-8 h-8" />}
                      title="Nenhuma sugestão pendente"
                      description="Execute as automações para gerar novas sugestões."
                    />
                  ) : (
                    pendingSuggestions.map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        isHandlingAction={isHandlingAction}
                        onAction={(actionKey) => handleActionClick(suggestion, actionKey)}
                        onIgnore={() => ignoreSuggestion(suggestion.id)}
                        onDetails={() => setSelectedSuggestion(suggestion)}
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="applied" className="mt-0 space-y-3">
                  {appliedSuggestions.length === 0 ? (
                    <EmptyState
                      icon={<Check className="w-8 h-8" />}
                      title="Nenhuma sugestão aplicada"
                      description="Aplique sugestões pendentes para vê-las aqui."
                    />
                  ) : (
                    appliedSuggestions.map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        isHandlingAction={null}
                        onAction={() => {}}
                        onIgnore={() => {}}
                        onDetails={() => setSelectedSuggestion(suggestion)}
                        readonly
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="ignored" className="mt-0 space-y-3">
                  {ignoredSuggestions.length === 0 ? (
                    <EmptyState
                      icon={<X className="w-8 h-8" />}
                      title="Nenhuma sugestão ignorada"
                      description="Sugestões ignoradas aparecerão aqui."
                    />
                  ) : (
                    ignoredSuggestions.map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        isHandlingAction={null}
                        onAction={() => {}}
                        onIgnore={() => {}}
                        onDetails={() => setSelectedSuggestion(suggestion)}
                        readonly
                      />
                    ))
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={!!selectedSuggestion} onOpenChange={() => setSelectedSuggestion(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{RULE_ICONS[selectedSuggestion?.rule_key || ''] || '💡'}</span>
              {selectedSuggestion?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedSuggestion?.message}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Context */}
            {selectedSuggestion?.suggestion_json?.context && (
              <div className="p-3 rounded-lg bg-muted/50">
                <h4 className="text-sm font-medium mb-2">Contexto</h4>
                <pre className="text-xs text-muted-foreground overflow-auto">
                  {JSON.stringify(selectedSuggestion.suggestion_json.context, null, 2)}
                </pre>
              </div>
            )}

            {/* Action Result */}
            {actionResult && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <h4 className="text-sm font-medium mb-2 text-emerald-600">Resultado</h4>
                <pre className="text-xs text-emerald-700 overflow-auto">
                  {JSON.stringify(actionResult, null, 2)}
                </pre>
              </div>
            )}

            {/* Actions */}
            {selectedSuggestion?.status === 'pending' && (
              <div className="flex flex-wrap gap-2">
                {selectedSuggestion.suggestion_json?.actions?.map((action) => (
                  <Button
                    key={action.key}
                    variant="outline"
                    size="sm"
                    onClick={() => handleActionClick(selectedSuggestion, action.key)}
                    disabled={isHandlingAction === `${selectedSuggestion.id}-${action.key}`}
                  >
                    {isHandlingAction === `${selectedSuggestion.id}-${action.key}` && (
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    )}
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function SuggestionCard({
  suggestion,
  isHandlingAction,
  onAction,
  onIgnore,
  onDetails,
  readonly = false,
}: {
  suggestion: AutomationSuggestion;
  isHandlingAction: string | null;
  onAction: (actionKey: string) => void;
  onIgnore: () => void;
  onDetails: () => void;
  readonly?: boolean;
}) {
  const ruleColor = RULE_COLORS[suggestion.rule_key] || 'bg-muted text-muted-foreground';
  const actions = suggestion.suggestion_json?.actions || [];

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all",
        suggestion.status === 'pending' 
          ? "bg-card hover:shadow-md" 
          : "bg-muted/30 opacity-70"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={cn("text-[10px]", ruleColor)}>
              {RULE_ICONS[suggestion.rule_key] || '💡'} {suggestion.rule_key.split('.').pop()}
            </Badge>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {formatDistanceToNow(new Date(suggestion.created_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
          </div>
          
          <h4 className="font-medium text-sm">{suggestion.title}</h4>
          
          {suggestion.message && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {suggestion.message}
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={onDetails}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {!readonly && actions.length > 0 && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
          {actions.slice(0, 2).map((action) => (
            <Button
              key={action.key}
              variant="secondary"
              size="sm"
              className="text-xs h-7"
              onClick={() => onAction(action.key)}
              disabled={isHandlingAction === `${suggestion.id}-${action.key}`}
            >
              {isHandlingAction === `${suggestion.id}-${action.key}` && (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              )}
              {action.label}
            </Button>
          ))}
          
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 ml-auto text-muted-foreground"
            onClick={onIgnore}
          >
            Ignorar
          </Button>
        </div>
      )}

      {suggestion.status === 'applied' && suggestion.applied_at && (
        <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 dark:text-emerald-400">
          <Check className="w-3 h-3" />
          Aplicada {formatDistanceToNow(new Date(suggestion.applied_at), { 
            addSuffix: true, 
            locale: ptBR 
          })}
        </div>
      )}

      {suggestion.status === 'ignored' && suggestion.ignored_at && (
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <X className="w-3 h-3" />
          Ignorada {formatDistanceToNow(new Date(suggestion.ignored_at), { 
            addSuffix: true, 
            locale: ptBR 
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-muted-foreground/50 mb-3">{icon}</div>
      <h4 className="font-medium text-muted-foreground">{title}</h4>
      <p className="text-sm text-muted-foreground/70">{description}</p>
    </div>
  );
}
