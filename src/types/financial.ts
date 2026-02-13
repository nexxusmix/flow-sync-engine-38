// Financial Types

export type AccountType = 'bank' | 'cash' | 'virtual';
export type RevenueStatus = 'pending' | 'received' | 'overdue' | 'cancelled';
export type ExpenseStatus = 'pending' | 'paid' | 'overdue';
export type PaymentMethod = 'pix' | 'transfer' | 'cash' | 'other';
export type ContractStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type MilestoneStatus = 'pending' | 'paid' | 'overdue';

export interface FinancialAccount {
  id: string;
  workspace_id: string;
  name: string;
  type: AccountType;
  balance: number;
  created_at: string;
}

export interface Revenue {
  id: string;
  workspace_id: string;
  project_id?: string;
  description: string;
  amount: number;
  due_date: string;
  received_date?: string;
  status: RevenueStatus;
  payment_method?: PaymentMethod;
  installment_group_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  workspace_id: string;
  project_id?: string;
  category: string;
  description: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: ExpenseStatus;
  supplier?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  workspace_id: string;
  project_id: string;
  project_name?: string;
  client_name?: string;
  total_value: number;
  payment_terms?: string;
  start_date?: string;
  end_date?: string;
  status: ContractStatus;
  notes?: string;
  pix_key?: string;
  pix_key_type?: string;
  bank_name?: string;
  account_holder_name?: string;
  created_at: string;
  updated_at: string;
  // Relations
  milestones?: PaymentMilestone[];
}

export interface PaymentMilestone {
  id: string;
  contract_id: string;
  revenue_id?: string;
  title: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: MilestoneStatus;
  created_at: string;
}

export interface CashflowSnapshot {
  id: string;
  workspace_id: string;
  month: string;
  total_revenue: number;
  total_expense: number;
  balance: number;
  generated_at: string;
}

// Expense categories
export const EXPENSE_CATEGORIES = [
  { value: 'equipe', label: 'Equipe', icon: 'users' },
  { value: 'equipamento', label: 'Equipamento', icon: 'camera' },
  { value: 'deslocamento', label: 'Deslocamento', icon: 'car' },
  { value: 'aluguel', label: 'Aluguel', icon: 'home' },
  { value: 'software', label: 'Software', icon: 'laptop' },
  { value: 'locacao', label: 'Locação', icon: 'box' },
  { value: 'alimentacao', label: 'Alimentação', icon: 'coffee' },
  { value: 'marketing', label: 'Marketing', icon: 'megaphone' },
  { value: 'impostos', label: 'Impostos', icon: 'receipt' },
  { value: 'other', label: 'Outros', icon: 'circle' },
] as const;

export const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX' },
  { value: 'transfer', label: 'Transferência' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'other', label: 'Outro' },
] as const;

// Financial status helpers
export const FINANCIAL_STATUS_CONFIG = {
  ok: { label: 'OK', color: 'bg-emerald-500', textColor: 'text-emerald-500' },
  attention: { label: 'Atenção', color: 'bg-amber-500', textColor: 'text-amber-500' },
  blocked: { label: 'Bloqueado', color: 'bg-red-500', textColor: 'text-red-500' },
} as const;

export type FinancialStatusType = keyof typeof FINANCIAL_STATUS_CONFIG;

// Project financial summary
export interface ProjectFinancialSummary {
  project_id: string;
  project_name: string;
  client_name?: string;
  contracted_value: number;
  received: number;
  pending: number;
  expenses: number;
  profit: number;
  status: FinancialStatusType;
  has_overdue: boolean;
}

// Cash flow entry for timeline
export interface CashflowEntry {
  id: string;
  date: string;
  type: 'revenue' | 'expense';
  description: string;
  amount: number;
  project_id?: string;
  project_name?: string;
  category?: string;
  running_balance?: number;
}

// Dashboard stats
export interface FinancialStats {
  currentBalance: number;
  pendingRevenue: number;
  pendingExpenses: number;
  projectedBalance30Days: number;
  blockedProjects: number;
  overdueRevenues: number;
  overdueExpenses: number;
}
