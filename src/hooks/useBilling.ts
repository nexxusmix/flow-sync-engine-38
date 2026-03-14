import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BillingPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  is_highlighted: boolean;
  sort_order: number;
  status: string;
  trial_days: number;
  limits: Record<string, number>;
  features: string[];
  created_at: string;
}

export interface BillingAddon {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_type: string;
  addon_type: string;
  limit_key: string | null;
  limit_amount: number;
  status: string;
}

export interface BillingSubscription {
  id: string;
  workspace_id: string;
  plan_id: string | null;
  status: string;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  trial_ends_at: string | null;
  canceled_at: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
}

export interface BillingInvoice {
  id: string;
  workspace_id: string;
  subscription_id: string | null;
  amount: number;
  status: string;
  description: string | null;
  due_date: string | null;
  paid_at: string | null;
  period_start: string | null;
  period_end: string | null;
  line_items: any[];
  created_at: string;
}

export interface BillingUsageEvent {
  id: string;
  workspace_id: string;
  usage_key: string;
  amount: number;
  recorded_at: string;
}

const QKEY = {
  plans: ['billing-plans'],
  addons: ['billing-addons'],
  subs: ['billing-subscriptions'],
  invoices: ['billing-invoices'],
  usage: ['billing-usage'],
};

export function useBillingPlans() {
  return useQuery({
    queryKey: QKEY.plans,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_plans')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return (data as unknown as BillingPlan[]) || [];
    },
  });
}

export function useBillingAddons() {
  return useQuery({
    queryKey: QKEY.addons,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_addons')
        .select('*')
        .order('created_at');
      if (error) throw error;
      return (data as unknown as BillingAddon[]) || [];
    },
  });
}

export function useBillingSubscriptions() {
  return useQuery({
    queryKey: QKEY.subs,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as BillingSubscription[]) || [];
    },
  });
}

export function useBillingInvoices() {
  return useQuery({
    queryKey: QKEY.invoices,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_invoices')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as BillingInvoice[]) || [];
    },
  });
}

export function useBillingUsage(period?: { start: string; end: string }) {
  return useQuery({
    queryKey: [...QKEY.usage, period],
    queryFn: async () => {
      let q = supabase.from('billing_usage_events').select('*');
      if (period) {
        q = q.gte('recorded_at', period.start).lte('recorded_at', period.end);
      }
      const { data, error } = await q.order('recorded_at', { ascending: false }).limit(500);
      if (error) throw error;
      return (data as unknown as BillingUsageEvent[]) || [];
    },
  });
}

export function useSavePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: Partial<BillingPlan> & { name: string; slug: string }) => {
      if (plan.id) {
        const { id, created_at, ...rest } = plan as any;
        const { error } = await supabase.from('billing_plans').update({ ...rest, updated_at: new Date().toISOString() } as any).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('billing_plans').insert([plan] as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: QKEY.plans }); toast.success('Plano salvo!'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('billing_plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: QKEY.plans }); toast.success('Plano removido'); },
  });
}

export function useSaveAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (addon: Partial<BillingAddon> & { name: string }) => {
      if (addon.id) {
        const { id, ...rest } = addon as any;
        const { error } = await supabase.from('billing_addons').update({ ...rest, updated_at: new Date().toISOString() } as any).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('billing_addons').insert([addon] as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: QKEY.addons }); toast.success('Addon salvo!'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('billing_addons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: QKEY.addons }); toast.success('Addon removido'); },
  });
}

// Revenue metrics computed client-side from subscriptions + invoices
export function useBillingMetrics() {
  const { data: subs = [] } = useBillingSubscriptions();
  const { data: invoices = [] } = useBillingInvoices();
  const { data: plans = [] } = useBillingPlans();

  const activeSubs = subs.filter(s => s.status === 'active');
  const trialSubs = subs.filter(s => s.status === 'trialing');
  const canceledSubs = subs.filter(s => s.status === 'canceled');

  const mrr = activeSubs.reduce((sum, s) => {
    const plan = plans.find(p => p.id === s.plan_id);
    if (!plan) return sum;
    return sum + (s.billing_cycle === 'yearly' ? plan.price_yearly / 12 : plan.price_monthly);
  }, 0);

  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const overdueInvoices = invoices.filter(i => i.status === 'overdue' || (i.status === 'pending' && i.due_date && new Date(i.due_date) < new Date()));
  const revenueThisMonth = paidInvoices
    .filter(i => new Date(i.paid_at || i.created_at).getMonth() === new Date().getMonth())
    .reduce((s, i) => s + Number(i.amount), 0);

  return {
    activeSubs: activeSubs.length,
    trialSubs: trialSubs.length,
    canceledSubs: canceledSubs.length,
    totalSubs: subs.length,
    mrr,
    arr: mrr * 12,
    revenueThisMonth,
    overdueCount: overdueInvoices.length,
    overdueAmount: overdueInvoices.reduce((s, i) => s + Number(i.amount), 0),
  };
}
