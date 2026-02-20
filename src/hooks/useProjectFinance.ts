import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Contract, Revenue, Expense, ProjectFinancialSummary } from '@/types/financial';

export function useProjectFinance(projectId: string | undefined) {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['project-finance', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      // Fetch in parallel: contract, revenues, expenses
      const [contractRes, revenuesRes, expensesRes, projectRes] = await Promise.all([
        supabase
          .from('contracts')
          .select('*, payment_milestones(*)')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('revenues')
          .select('*')
          .eq('project_id', projectId)
          .order('due_date', { ascending: true }),
        supabase
          .from('expenses')
          .select('*')
          .eq('project_id', projectId)
          .order('due_date', { ascending: true }),
        supabase
          .from('projects')
          .select('id, name, client_name, contract_value')
          .eq('id', projectId)
          .single(),
      ]);

      const contract = contractRes.data?.[0] as Contract | undefined;
      const revenues = (revenuesRes.data || []) as Revenue[];
      const expenses = (expensesRes.data || []) as Revenue[];
      const project = projectRes.data;

      // Build financial summary
      const contractValue = Number(project?.contract_value) || 0;
      const received = revenues
        .filter(r => r.status === 'received')
        .reduce((sum, r) => sum + Number(r.amount), 0);
      const pending = revenues
        .filter(r => r.status === 'pending' || r.status === 'overdue')
        .reduce((sum, r) => sum + Number(r.amount), 0);
      const totalExpenses = expenses
        .reduce((sum, e) => sum + Number((e as any).amount), 0);
      const profit = received - totalExpenses;
      const today = new Date().toISOString().split('T')[0];
      const hasOverdue = revenues.some(r =>
        (r.status === 'pending' || r.status === 'overdue') && r.due_date < today
      );

      const summary: ProjectFinancialSummary = {
        project_id: projectId,
        project_name: project?.name || '',
        client_name: project?.client_name || undefined,
        contracted_value: contractValue,
        received,
        pending,
        expenses: totalExpenses,
        profit,
        status: hasOverdue ? 'blocked' : pending > 0 ? 'attention' : 'ok',
        has_overdue: hasOverdue,
      };

      return {
        contract,
        revenues,
        expenses: expenses as unknown as Expense[],
        summary,
      };
    },
    enabled: !!projectId,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['project-finance', projectId] });
    refetch();
  };

  return {
    contract: data?.contract,
    revenues: data?.revenues || [],
    expenses: data?.expenses || [],
    summary: data?.summary,
    isLoading,
    refresh,
  };
}
