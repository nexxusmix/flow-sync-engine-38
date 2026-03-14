
-- Billing Plans
CREATE TABLE public.billing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric NOT NULL DEFAULT 0,
  is_highlighted boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  trial_days integer NOT NULL DEFAULT 0,
  limits jsonb NOT NULL DEFAULT '{}',
  features jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Billing Addons
CREATE TABLE public.billing_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  billing_type text NOT NULL DEFAULT 'recurring',
  addon_type text NOT NULL DEFAULT 'generic',
  limit_key text,
  limit_amount integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Billing Subscriptions
CREATE TABLE public.billing_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  plan_id uuid REFERENCES public.billing_plans(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'trialing',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  trial_ends_at timestamptz,
  canceled_at timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Subscription Addons
CREATE TABLE public.billing_subscription_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.billing_subscriptions(id) ON DELETE CASCADE NOT NULL,
  addon_id uuid REFERENCES public.billing_addons(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Usage Events
CREATE TABLE public.billing_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  usage_key text NOT NULL,
  amount numeric NOT NULL DEFAULT 1,
  metadata jsonb DEFAULT '{}',
  recorded_at timestamptz NOT NULL DEFAULT now()
);

-- Invoices
CREATE TABLE public.billing_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  subscription_id uuid REFERENCES public.billing_subscriptions(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  description text,
  due_date timestamptz,
  paid_at timestamptz,
  period_start timestamptz,
  period_end timestamptz,
  line_items jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscription_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;

-- Plans and addons are readable by all authenticated users
CREATE POLICY "read_billing_plans" ON public.billing_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_billing_addons" ON public.billing_addons FOR SELECT TO authenticated USING (true);

-- Admin-only write for plans/addons
CREATE POLICY "admin_billing_plans" ON public.billing_plans FOR ALL TO authenticated USING (public.has_app_role(auth.uid(), 'admin')) WITH CHECK (public.has_app_role(auth.uid(), 'admin'));
CREATE POLICY "admin_billing_addons" ON public.billing_addons FOR ALL TO authenticated USING (public.has_app_role(auth.uid(), 'admin')) WITH CHECK (public.has_app_role(auth.uid(), 'admin'));

-- Subscriptions, usage, invoices: authenticated read/write (workspace-scoped in app)
CREATE POLICY "auth_billing_subs" ON public.billing_subscriptions FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_billing_sub_addons" ON public.billing_subscription_addons FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_billing_usage" ON public.billing_usage_events FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_billing_invoices" ON public.billing_invoices FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
