import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import {
  Revenue,
  Expense,
  Contract,
  PaymentMilestone,
  FinancialAccount,
  RevenueStatus,
  ExpenseStatus,
  MilestoneStatus,
  ProjectFinancialSummary,
  CashflowEntry,
  FinancialStats,
} from '@/types/financial';

interface FinancialState {
  // Data
  revenues: Revenue[];
  expenses: Expense[];
  contracts: Contract[];
  accounts: FinancialAccount[];
  
  // Loading
  isLoading: boolean;
  
  // Actions - Revenues
  fetchRevenues: () => Promise<void>;
  createRevenue: (data: Partial<Revenue>) => Promise<Revenue | null>;
  updateRevenue: (id: string, data: Partial<Revenue>) => Promise<void>;
  deleteRevenue: (id: string) => Promise<void>;
  markRevenueReceived: (id: string, date?: string) => Promise<void>;
  
  // Actions - Expenses
  fetchExpenses: () => Promise<void>;
  createExpense: (data: Partial<Expense>) => Promise<Expense | null>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  markExpensePaid: (id: string, date?: string) => Promise<void>;
  
  // Actions - Contracts
  fetchContracts: () => Promise<void>;
  createContract: (data: Partial<Contract>, milestones?: Partial<PaymentMilestone>[]) => Promise<Contract | null>;
  updateContract: (id: string, data: Partial<Contract>) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
  
  // Actions - Milestones
  createMilestone: (contractId: string, data: Partial<PaymentMilestone>) => Promise<PaymentMilestone | null>;
  markMilestonePaid: (milestoneId: string, date?: string) => Promise<void>;
  
  // Getters
  getStats: () => FinancialStats;
  getCashflow: () => CashflowEntry[];
  getProjectFinancials: () => ProjectFinancialSummary[];
  getProjectHasBlock: (projectId: string) => boolean;
  getRevenuesByProject: (projectId: string) => Revenue[];
  getExpensesByProject: (projectId: string) => Expense[];
  getContractByProject: (projectId: string) => Contract | undefined;
}

export const useFinancialStore = create<FinancialState>((set, get) => ({
  revenues: [],
  expenses: [],
  contracts: [],
  accounts: [],
  isLoading: false,

  // Revenues
  fetchRevenues: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('revenues')
      .select('*')
      .order('due_date', { ascending: true });
    
    if (!error && data) {
      // Auto-update overdue status
      const today = new Date().toISOString().split('T')[0];
      const updated = data.map(r => ({
        ...r,
        status: r.status === 'pending' && r.due_date < today ? 'overdue' : r.status,
      })) as Revenue[];
      set({ revenues: updated, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  createRevenue: async (data) => {
    const insertData = { description: data.description || 'Receita', amount: data.amount || 0, due_date: data.due_date, ...data };
    const { data: newRevenue, error } = await supabase
      .from('revenues')
      .insert([insertData as any])
      .select()
      .single();
    
    if (!error && newRevenue) {
      set((state) => ({ revenues: [...state.revenues, newRevenue as Revenue] }));
      return newRevenue as Revenue;
    }
    return null;
  },

  updateRevenue: async (id, data) => {
    await supabase.from('revenues').update(data as any).eq('id', id);
    set((state) => ({
      revenues: state.revenues.map((r) => (r.id === id ? { ...r, ...data } : r)),
    }));
  },

  deleteRevenue: async (id) => {
    await supabase.from('revenues').delete().eq('id', id);
    set((state) => ({ revenues: state.revenues.filter((r) => r.id !== id) }));
  },

  markRevenueReceived: async (id, date) => {
    const receivedDate = date || new Date().toISOString().split('T')[0];
    await get().updateRevenue(id, { status: 'received', received_date: receivedDate });
  },

  // Expenses
  fetchExpenses: async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('due_date', { ascending: true });
    
    if (!error && data) {
      const today = new Date().toISOString().split('T')[0];
      const updated = data.map(e => ({
        ...e,
        status: e.status === 'pending' && e.due_date < today ? 'overdue' : e.status,
      })) as Expense[];
      set({ expenses: updated });
    }
  },

  createExpense: async (data) => {
    const insertData = { description: data.description || 'Despesa', amount: data.amount || 0, due_date: data.due_date, category: data.category || 'other', ...data };
    const { data: newExpense, error } = await supabase
      .from('expenses')
      .insert([insertData as any])
      .select()
      .single();
    
    if (!error && newExpense) {
      set((state) => ({ expenses: [...state.expenses, newExpense as Expense] }));
      return newExpense as Expense;
    }
    return null;
  },

  updateExpense: async (id, data) => {
    await supabase.from('expenses').update(data as any).eq('id', id);
    set((state) => ({
      expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...data } : e)),
    }));
  },

  deleteExpense: async (id) => {
    await supabase.from('expenses').delete().eq('id', id);
    set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) }));
  },

  markExpensePaid: async (id, date) => {
    const paidDate = date || new Date().toISOString().split('T')[0];
    await get().updateExpense(id, { status: 'paid', paid_date: paidDate });
  },

  // Contracts
  fetchContracts: async () => {
    const { data, error } = await supabase
      .from('contracts')
      .select('*, payment_milestones(*)')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      set({ contracts: data as Contract[] });
    }
  },

  createContract: async (data, milestones) => {
    const insertData = { 
      project_id: data.project_id, 
      total_value: data.total_value || 0, 
      ...data 
    };
    const { data: newContract, error } = await supabase
      .from('contracts')
      .insert([insertData as any])
      .select()
      .single();
    
    if (!error && newContract) {
      // Create milestones if provided
      if (milestones && milestones.length > 0) {
        for (const m of milestones) {
          await get().createMilestone(newContract.id, m);
        }
      }
      
      // Refetch to get milestones
      await get().fetchContracts();
      return newContract as Contract;
    }
    return null;
  },

  updateContract: async (id, data) => {
    await supabase.from('contracts').update(data as any).eq('id', id);
    set((state) => ({
      contracts: state.contracts.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
  },

  deleteContract: async (id) => {
    await supabase.from('contracts').delete().eq('id', id);
    set((state) => ({ contracts: state.contracts.filter((c) => c.id !== id) }));
  },

  // Milestones
  createMilestone: async (contractId, data) => {
    const insertData = { 
      contract_id: contractId, 
      title: data.title || 'Marco', 
      amount: data.amount || 0,
      due_date: data.due_date,
      ...data 
    };
    
    const { data: newMilestone, error } = await supabase
      .from('payment_milestones')
      .insert([insertData as any])
      .select()
      .single();
    
    if (!error && newMilestone) {
      // Create corresponding revenue
      const contract = get().contracts.find(c => c.id === contractId);
      await get().createRevenue({
        project_id: contract?.project_id,
        description: `${contract?.project_name || 'Projeto'} - ${newMilestone.title}`,
        amount: newMilestone.amount,
        due_date: newMilestone.due_date,
      });
      
      return newMilestone as PaymentMilestone;
    }
    return null;
  },

  markMilestonePaid: async (milestoneId, date) => {
    const paidDate = date || new Date().toISOString().split('T')[0];
    await supabase.from('payment_milestones').update({ status: 'paid', paid_date: paidDate }).eq('id', milestoneId);
    
    // Update local state
    set((state) => ({
      contracts: state.contracts.map((c) => ({
        ...c,
        milestones: c.milestones?.map((m) => 
          m.id === milestoneId ? { ...m, status: 'paid' as MilestoneStatus, paid_date: paidDate } : m
        ),
      })),
    }));
  },

  // Getters
  getStats: () => {
    const { revenues, expenses } = get();
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const receivedRevenue = revenues
      .filter(r => r.status === 'received')
      .reduce((sum, r) => sum + Number(r.amount), 0);
    
    const paidExpenses = expenses
      .filter(e => e.status === 'paid')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    
    const pendingRevenue = revenues
      .filter(r => r.status === 'pending' || r.status === 'overdue')
      .reduce((sum, r) => sum + Number(r.amount), 0);
    
    const pendingExpenses = expenses
      .filter(e => e.status === 'pending' || e.status === 'overdue')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    
    const projected30Revenue = revenues
      .filter(r => (r.status === 'pending' || r.status === 'received') && r.due_date <= thirtyDaysFromNow)
      .reduce((sum, r) => sum + Number(r.amount), 0);
    
    const projected30Expenses = expenses
      .filter(e => (e.status === 'pending' || e.status === 'paid') && e.due_date <= thirtyDaysFromNow)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    
    const overdueRevenues = revenues.filter(r => r.status === 'overdue' || (r.status === 'pending' && r.due_date < today));
    const overdueExpenses = expenses.filter(e => e.status === 'overdue' || (e.status === 'pending' && e.due_date < today));
    
    // Get unique projects with overdue payments
    const blockedProjectIds = new Set(overdueRevenues.map(r => r.project_id).filter(Boolean));
    
    return {
      currentBalance: receivedRevenue - paidExpenses,
      pendingRevenue,
      pendingExpenses,
      projectedBalance30Days: (receivedRevenue + projected30Revenue) - (paidExpenses + projected30Expenses),
      blockedProjects: blockedProjectIds.size,
      overdueRevenues: overdueRevenues.length,
      overdueExpenses: overdueExpenses.length,
    };
  },

  getCashflow: () => {
    const { revenues, expenses } = get();
    const entries: CashflowEntry[] = [];
    
    // Add received revenues
    revenues
      .filter(r => r.status === 'received' && r.received_date)
      .forEach(r => {
        entries.push({
          id: r.id,
          date: r.received_date!,
          type: 'revenue',
          description: r.description,
          amount: Number(r.amount),
          project_id: r.project_id,
        });
      });
    
    // Add paid expenses
    expenses
      .filter(e => e.status === 'paid' && e.paid_date)
      .forEach(e => {
        entries.push({
          id: e.id,
          date: e.paid_date!,
          type: 'expense',
          description: e.description,
          amount: Number(e.amount),
          project_id: e.project_id,
          category: e.category,
        });
      });
    
    // Sort by date descending and calculate running balance
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let balance = 0;
    for (let i = entries.length - 1; i >= 0; i--) {
      balance += entries[i].type === 'revenue' ? entries[i].amount : -entries[i].amount;
      entries[i].running_balance = balance;
    }
    
    return entries;
  },

  getProjectFinancials: () => {
    const { revenues, expenses, contracts } = get();
    const projectMap = new Map<string, ProjectFinancialSummary>();
    const today = new Date().toISOString().split('T')[0];
    
    // Process revenues
    revenues.forEach(r => {
      if (!r.project_id) return;
      
      if (!projectMap.has(r.project_id)) {
        const contract = contracts.find(c => c.project_id === r.project_id);
        projectMap.set(r.project_id, {
          project_id: r.project_id,
          project_name: contract?.project_name || 'Projeto',
          client_name: contract?.client_name,
          contracted_value: contract ? Number(contract.total_value) : 0,
          received: 0,
          pending: 0,
          expenses: 0,
          profit: 0,
          status: 'ok',
          has_overdue: false,
        });
      }
      
      const summary = projectMap.get(r.project_id)!;
      if (r.status === 'received') {
        summary.received += Number(r.amount);
      } else if (r.status === 'pending' || r.status === 'overdue') {
        summary.pending += Number(r.amount);
        if (r.status === 'overdue' || r.due_date < today) {
          summary.has_overdue = true;
        }
      }
    });
    
    // Process expenses
    expenses.forEach(e => {
      if (!e.project_id) return;
      
      if (!projectMap.has(e.project_id)) {
        projectMap.set(e.project_id, {
          project_id: e.project_id,
          project_name: 'Projeto',
          contracted_value: 0,
          received: 0,
          pending: 0,
          expenses: 0,
          profit: 0,
          status: 'ok',
          has_overdue: false,
        });
      }
      
      const summary = projectMap.get(e.project_id)!;
      if (e.status === 'paid') {
        summary.expenses += Number(e.amount);
      }
    });
    
    // Calculate profit and status
    projectMap.forEach((summary) => {
      summary.profit = summary.received - summary.expenses;
      if (summary.has_overdue) {
        summary.status = 'blocked';
      } else if (summary.pending > summary.received) {
        summary.status = 'attention';
      } else {
        summary.status = 'ok';
      }
    });
    
    return Array.from(projectMap.values());
  },

  getProjectHasBlock: (projectId) => {
    const { revenues } = get();
    const today = new Date().toISOString().split('T')[0];
    return revenues.some(
      r => r.project_id === projectId && 
      (r.status === 'overdue' || (r.status === 'pending' && r.due_date < today))
    );
  },

  getRevenuesByProject: (projectId) => {
    return get().revenues.filter(r => r.project_id === projectId);
  },

  getExpensesByProject: (projectId) => {
    return get().expenses.filter(e => e.project_id === projectId);
  },

  getContractByProject: (projectId) => {
    return get().contracts.find(c => c.project_id === projectId);
  },
}));
