/**
 * useAIGovernance - Hook for AI usage dashboard & governance
 * Fetches ai_runs + ai_usage_events + policies + limits + alerts
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AIUsageEvent {
  id: string;
  workspace_id: string;
  user_id: string | null;
  source_module: string;
  source_entity_type: string | null;
  source_entity_id: string | null;
  action_type: string;
  model_name: string | null;
  provider_name: string | null;
  tokens_input: number;
  tokens_output: number;
  estimated_cost: number;
  execution_time_ms: number | null;
  status: string;
  error_message: string | null;
  requires_approval: boolean;
  approved_by: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AIGovernancePolicy {
  id: string;
  name: string;
  description: string | null;
  policy_type: string;
  config_json: Record<string, any>;
  is_enabled: boolean;
  created_at: string;
}

export interface AIWorkspaceLimit {
  id: string;
  limit_type: string;
  max_value: number;
  current_value: number;
  reset_period: string;
  is_active: boolean;
}

export interface AIAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string | null;
  source_module: string | null;
  user_id: string | null;
  is_resolved: boolean;
  created_at: string;
}

// Also use ai_runs for backward compat
export interface AIRun {
  id: string;
  action_key: string;
  entity_type: string | null;
  entity_id: string | null;
  user_id: string;
  status: string;
  input_json: any;
  output_json: any;
  error_message: string | null;
  duration_ms: number | null;
  workspace_id: string | null;
  created_at: string;
}

export function useAIGovernance(dateRange: { from: Date; to: Date }) {
  const queryClient = useQueryClient();

  // Fetch ai_runs (legacy tracking)
  const aiRunsQuery = useQuery({
    queryKey: ["ai-runs-governance", dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_runs")
        .select("*")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data || []) as AIRun[];
    },
  });

  // Fetch ai_usage_events
  const usageEventsQuery = useQuery({
    queryKey: ["ai-usage-events", dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_usage_events")
        .select("*")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data || []) as AIUsageEvent[];
    },
  });

  // Fetch governance policies
  const policiesQuery = useQuery({
    queryKey: ["ai-governance-policies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_governance_policies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as AIGovernancePolicy[];
    },
  });

  // Fetch workspace limits
  const limitsQuery = useQuery({
    queryKey: ["ai-workspace-limits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_workspace_limits")
        .select("*");
      if (error) throw error;
      return (data || []) as AIWorkspaceLimit[];
    },
  });

  // Fetch alerts
  const alertsQuery = useQuery({
    queryKey: ["ai-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as AIAlert[];
    },
  });

  // Resolve alert
  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("ai_alerts")
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq("id", alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-alerts"] });
      toast.success("Alerta resolvido");
    },
  });

  // Toggle policy
  const togglePolicy = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("ai_governance_policies")
        .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-governance-policies"] });
      toast.success("Política atualizada");
    },
  });

  // Computed metrics from ai_runs
  const runs = aiRunsQuery.data || [];
  const events = usageEventsQuery.data || [];

  const totalCalls = runs.length + events.length;
  const successCount = runs.filter(r => r.status === "completed" || r.status === "success").length +
    events.filter(e => e.status === "success").length;
  const errorCount = runs.filter(r => r.status === "error" || r.status === "failed").length +
    events.filter(e => e.status === "error").length;
  const successRate = totalCalls > 0 ? Math.round((successCount / totalCalls) * 100) : 0;

  const totalTokens = events.reduce((s, e) => s + (e.tokens_input || 0) + (e.tokens_output || 0), 0);
  const totalCost = events.reduce((s, e) => s + Number(e.estimated_cost || 0), 0);
  const avgExecutionTime = (() => {
    const withTime = [...runs.filter(r => r.duration_ms), ...events.filter(e => e.execution_time_ms)];
    if (withTime.length === 0) return 0;
    const total = withTime.reduce((s, item) => s + ((item as any).duration_ms || (item as any).execution_time_ms || 0), 0);
    return Math.round(total / withTime.length);
  })();

  // Usage by module
  const byModule = (() => {
    const map = new Map<string, { calls: number; cost: number; errors: number }>();
    // from ai_runs: action_key as module proxy
    runs.forEach(r => {
      const mod = r.action_key?.split("_")[0] || "system";
      const prev = map.get(mod) || { calls: 0, cost: 0, errors: 0 };
      prev.calls++;
      if (r.status === "error" || r.status === "failed") prev.errors++;
      map.set(mod, prev);
    });
    // from events
    events.forEach(e => {
      const mod = e.source_module || "system";
      const prev = map.get(mod) || { calls: 0, cost: 0, errors: 0 };
      prev.calls++;
      prev.cost += Number(e.estimated_cost || 0);
      if (e.status === "error") prev.errors++;
      map.set(mod, prev);
    });
    return Array.from(map.entries())
      .map(([module, stats]) => ({ module, ...stats }))
      .sort((a, b) => b.calls - a.calls);
  })();

  // Usage by user
  const byUser = (() => {
    const map = new Map<string, { calls: number; cost: number }>();
    runs.forEach(r => {
      const uid = r.user_id || "unknown";
      const prev = map.get(uid) || { calls: 0, cost: 0 };
      prev.calls++;
      map.set(uid, prev);
    });
    events.forEach(e => {
      const uid = e.user_id || "unknown";
      const prev = map.get(uid) || { calls: 0, cost: 0 };
      prev.calls++;
      prev.cost += Number(e.estimated_cost || 0);
      map.set(uid, prev);
    });
    return Array.from(map.entries())
      .map(([userId, stats]) => ({ userId, ...stats }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 20);
  })();

  // Top action types
  const topActions = (() => {
    const map = new Map<string, number>();
    runs.forEach(r => map.set(r.action_key, (map.get(r.action_key) || 0) + 1));
    events.forEach(e => map.set(e.action_type, (map.get(e.action_type) || 0) + 1));
    return Array.from(map.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  })();

  // Daily usage for chart
  const dailyUsage = (() => {
    const map = new Map<string, { calls: number; cost: number; errors: number }>();
    const addToDay = (dateStr: string, cost: number, isError: boolean) => {
      const day = dateStr.slice(0, 10);
      const prev = map.get(day) || { calls: 0, cost: 0, errors: 0 };
      prev.calls++;
      prev.cost += cost;
      if (isError) prev.errors++;
      map.set(day, prev);
    };
    runs.forEach(r => addToDay(r.created_at, 0, r.status === "error" || r.status === "failed"));
    events.forEach(e => addToDay(e.created_at, Number(e.estimated_cost || 0), e.status === "error"));
    return Array.from(map.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
  })();

  const approvalCount = events.filter(e => e.requires_approval).length;

  return {
    // Raw data
    runs,
    events,
    policies: policiesQuery.data || [],
    limits: limitsQuery.data || [],
    alerts: alertsQuery.data || [],

    // Computed
    totalCalls,
    successRate,
    errorCount,
    totalTokens,
    totalCost,
    avgExecutionTime,
    approvalCount,
    byModule,
    byUser,
    topActions,
    dailyUsage,

    // Loading
    isLoading: aiRunsQuery.isLoading || usageEventsQuery.isLoading,

    // Mutations
    resolveAlert,
    togglePolicy,
  };
}
