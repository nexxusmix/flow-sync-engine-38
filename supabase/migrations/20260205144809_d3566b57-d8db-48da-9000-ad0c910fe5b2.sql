-- Financial accounts (contas de controle)
CREATE TABLE public.financial_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'bank' CHECK (type IN ('bank', 'cash', 'virtual')),
  balance numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Revenues (receitas)
CREATE TABLE public.revenues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id text NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  received_date date NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'overdue', 'cancelled')),
  payment_method text CHECK (payment_method IN ('pix', 'transfer', 'cash', 'other')),
  installment_group_id uuid NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Expenses (despesas)
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id text NULL,
  category text NOT NULL DEFAULT 'other',
  description text NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  paid_date date NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  supplier text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Contracts (contratos financeiros)
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  project_name text,
  client_name text,
  total_value numeric NOT NULL,
  payment_terms text,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Payment milestones (marcos de pagamento)
CREATE TABLE public.payment_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  revenue_id uuid NULL,
  title text NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  paid_date date NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Cashflow snapshots (visão agregada mensal)
CREATE TABLE public.cashflow_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT gen_random_uuid(),
  month date NOT NULL,
  total_revenue numeric DEFAULT 0,
  total_expense numeric DEFAULT 0,
  balance numeric DEFAULT 0,
  generated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashflow_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for financial_accounts
CREATE POLICY "Users can view all financial_accounts" ON public.financial_accounts FOR SELECT USING (true);
CREATE POLICY "Users can insert financial_accounts" ON public.financial_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update financial_accounts" ON public.financial_accounts FOR UPDATE USING (true);
CREATE POLICY "Users can delete financial_accounts" ON public.financial_accounts FOR DELETE USING (true);

-- RLS Policies for revenues
CREATE POLICY "Users can view all revenues" ON public.revenues FOR SELECT USING (true);
CREATE POLICY "Users can insert revenues" ON public.revenues FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update revenues" ON public.revenues FOR UPDATE USING (true);
CREATE POLICY "Users can delete revenues" ON public.revenues FOR DELETE USING (true);

-- RLS Policies for expenses
CREATE POLICY "Users can view all expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Users can insert expenses" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update expenses" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "Users can delete expenses" ON public.expenses FOR DELETE USING (true);

-- RLS Policies for contracts
CREATE POLICY "Users can view all contracts" ON public.contracts FOR SELECT USING (true);
CREATE POLICY "Users can insert contracts" ON public.contracts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update contracts" ON public.contracts FOR UPDATE USING (true);
CREATE POLICY "Users can delete contracts" ON public.contracts FOR DELETE USING (true);

-- RLS Policies for payment_milestones
CREATE POLICY "Users can view all payment_milestones" ON public.payment_milestones FOR SELECT USING (true);
CREATE POLICY "Users can insert payment_milestones" ON public.payment_milestones FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update payment_milestones" ON public.payment_milestones FOR UPDATE USING (true);
CREATE POLICY "Users can delete payment_milestones" ON public.payment_milestones FOR DELETE USING (true);

-- RLS Policies for cashflow_snapshots
CREATE POLICY "Users can view all cashflow_snapshots" ON public.cashflow_snapshots FOR SELECT USING (true);
CREATE POLICY "Users can insert cashflow_snapshots" ON public.cashflow_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update cashflow_snapshots" ON public.cashflow_snapshots FOR UPDATE USING (true);
CREATE POLICY "Users can delete cashflow_snapshots" ON public.cashflow_snapshots FOR DELETE USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_revenues_updated_at BEFORE UPDATE ON public.revenues FOR EACH ROW EXECUTE FUNCTION public.update_marketing_updated_at();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_marketing_updated_at();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_marketing_updated_at();