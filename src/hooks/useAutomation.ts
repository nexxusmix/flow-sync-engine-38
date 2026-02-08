import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AutomationRule, AutomationSuggestion } from '@/types/automation';
import { toast } from 'sonner';

export function useAutomation() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [suggestions, setSuggestions] = useState<AutomationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isHandlingAction, setIsHandlingAction] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching rules:', error);
      return;
    }

    setRules(data as unknown as AutomationRule[]);
  }, []);

  const fetchSuggestions = useCallback(async () => {
    const { data, error } = await supabase
      .from('automation_suggestions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching suggestions:', error);
      return;
    }

    setSuggestions(data as unknown as AutomationSuggestion[]);
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchRules(), fetchSuggestions()]);
      setIsLoading(false);
    };
    load();
  }, [fetchRules, fetchSuggestions]);

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    const { error } = await supabase
      .from('automation_rules')
      .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
      .eq('id', ruleId);

    if (error) {
      toast.error('Erro ao atualizar regra');
      return;
    }

    setRules(prev => prev.map(r => 
      r.id === ruleId ? { ...r, is_enabled: enabled } : r
    ));
    
    toast.success(enabled ? 'Regra ativada' : 'Regra desativada');
  };

  const runAutomations = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('automation-runner');
      
      if (error) throw error;

      toast.success(`Automações executadas! ${data?.suggestions_created || 0} sugestões criadas.`);
      await fetchSuggestions();
    } catch (err: unknown) {
      console.error('Error running automations:', err);
      toast.error('Erro ao executar automações');
    } finally {
      setIsRunning(false);
    }
  };

  const handleAction = async (suggestionId: string, actionKey: string) => {
    setIsHandlingAction(`${suggestionId}-${actionKey}`);
    try {
      const { data, error } = await supabase.functions.invoke('automation-handle-action', {
        body: { suggestion_id: suggestionId, action_key: actionKey }
      });

      if (error) throw error;

      toast.success('Ação executada com sucesso!');
      await fetchSuggestions();

      return data?.result;
    } catch (err: unknown) {
      console.error('Error handling action:', err);
      toast.error('Erro ao executar ação');
      return null;
    } finally {
      setIsHandlingAction(null);
    }
  };

  const ignoreSuggestion = async (suggestionId: string) => {
    const { error } = await supabase
      .from('automation_suggestions')
      .update({ 
        status: 'ignored', 
        ignored_at: new Date().toISOString() 
      })
      .eq('id', suggestionId);

    if (error) {
      toast.error('Erro ao ignorar sugestão');
      return;
    }

    setSuggestions(prev => prev.map(s => 
      s.id === suggestionId 
        ? { ...s, status: 'ignored' as const, ignored_at: new Date().toISOString() } 
        : s
    ));
    
    toast.success('Sugestão ignorada');
  };

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const appliedSuggestions = suggestions.filter(s => s.status === 'applied');
  const ignoredSuggestions = suggestions.filter(s => s.status === 'ignored');

  return {
    rules,
    suggestions,
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
    refresh: () => Promise.all([fetchRules(), fetchSuggestions()]),
  };
}
