-- Workspace Settings
CREATE TABLE public.workspace_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'SQUAD Produções',
  company_document TEXT,
  default_timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  default_currency TEXT NOT NULL DEFAULT 'BRL',
  working_days JSONB NOT NULL DEFAULT '["mon","tue","wed","thu","fri"]'::jsonb,
  working_hours JSONB NOT NULL DEFAULT '{"start": "09:00", "end": "18:00"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- System Flags (Feature Flags)
CREATE TABLE public.system_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT 'true'::jsonb,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, key)
);

-- Event Logs (Audit)
CREATE TABLE public.event_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project Stage Settings
CREATE TABLE public.project_stage_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  stage_order INTEGER NOT NULL,
  stage_key TEXT NOT NULL,
  stage_label TEXT NOT NULL,
  sla_days INTEGER DEFAULT 3,
  blocks_delivery BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Finance Settings
CREATE TABLE public.finance_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  expense_categories JSONB DEFAULT '["Equipamento", "Software", "Freelancer", "Marketing", "Operacional", "Outro"]'::jsonb,
  payment_methods JSONB DEFAULT '["PIX", "Boleto", "Cartão", "Transferência"]'::jsonb,
  block_after_days INTEGER DEFAULT 15,
  block_message TEXT DEFAULT 'Projeto pausado por pendência financeira. Entre em contato para regularização.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Proposal Settings
CREATE TABLE public.proposal_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  validity_days INTEGER DEFAULT 15,
  prefix TEXT DEFAULT 'PROP',
  intro_text TEXT DEFAULT 'Obrigado pela oportunidade de apresentar nossa proposta.',
  terms_text TEXT DEFAULT 'Proposta válida por {{validity_days}} dias.',
  required_sections JSONB DEFAULT '["intro", "deliverables", "timeline", "investment"]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contract Settings
CREATE TABLE public.contract_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  default_revisions INTEGER DEFAULT 2,
  default_renewal_type TEXT DEFAULT 'none',
  default_renewal_notice_days INTEGER DEFAULT 30,
  breach_text TEXT DEFAULT 'O não pagamento das parcelas acordadas poderá resultar na suspensão dos serviços.',
  mandatory_clauses JSONB DEFAULT '["objeto", "valor", "prazo", "rescisao"]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Marketing Settings
CREATE TABLE public.marketing_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  active_pillars JSONB DEFAULT '["Educativo", "Entretenimento", "Institucional", "Vendas"]'::jsonb,
  active_channels JSONB DEFAULT '["Instagram", "YouTube", "TikTok", "LinkedIn"]'::jsonb,
  active_formats JSONB DEFAULT '["Reels", "Stories", "Carrossel", "Post", "Vídeo"]'::jsonb,
  default_tone TEXT DEFAULT 'Profissional e acessível',
  recommended_frequency TEXT DEFAULT '3-5 posts por semana',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prospecting Settings
CREATE TABLE public.prospecting_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  daily_activity_limit INTEGER DEFAULT 20,
  allowed_channels JSONB DEFAULT '["whatsapp", "instagram", "email", "call"]'::jsonb,
  min_followup_delay_hours INTEGER DEFAULT 24,
  optout_text TEXT DEFAULT 'Se não deseja mais receber contato, responda SAIR.',
  blacklist_rules JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Integration Settings
CREATE TABLE public.integration_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  status TEXT DEFAULT 'disconnected',
  config JSONB DEFAULT '{}'::jsonb,
  connected_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, provider)
);

-- Notification Settings
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  delays_enabled BOOLEAN DEFAULT true,
  blocks_enabled BOOLEAN DEFAULT true,
  proposals_enabled BOOLEAN DEFAULT true,
  contracts_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,
  inapp_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Branding Settings
CREATE TABLE public.branding_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  logo_url TEXT,
  logo_alt_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  accent_color TEXT DEFAULT '#8b5cf6',
  footer_text TEXT DEFAULT '© SQUAD Produções',
  pdf_signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_stage_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospecting_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding_settings ENABLE ROW LEVEL SECURITY;

-- Permissive policies for internal B2B tool
CREATE POLICY "Allow all for workspace_settings" ON public.workspace_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for user_roles" ON public.user_roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for system_flags" ON public.system_flags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for event_logs" ON public.event_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for project_stage_settings" ON public.project_stage_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for finance_settings" ON public.finance_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for proposal_settings" ON public.proposal_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for contract_settings" ON public.contract_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for marketing_settings" ON public.marketing_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for prospecting_settings" ON public.prospecting_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for integration_settings" ON public.integration_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for notification_settings" ON public.notification_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for branding_settings" ON public.branding_settings FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_event_logs_created ON public.event_logs(created_at DESC);
CREATE INDEX idx_event_logs_entity ON public.event_logs(entity_type, entity_id);
CREATE INDEX idx_event_logs_actor ON public.event_logs(actor_id);

-- Insert default roles
INSERT INTO public.user_roles (name, description, permissions, is_system) VALUES
('Admin', 'Acesso total ao sistema', '{"projects": ["read","write","delete","approve"], "finance": ["read","write","delete","sensitive"], "proposals": ["read","write","delete","send"], "contracts": ["read","write","delete","sign"], "marketing": ["read","write","delete"], "prospecting": ["read","write","delete"], "reports": ["read","export"], "settings": ["read","write"]}', true),
('Operacional', 'Gestão de projetos e entregas', '{"projects": ["read","write","approve"], "proposals": ["read"], "contracts": ["read"], "marketing": ["read","write"], "reports": ["read"]}', true),
('Comercial', 'Vendas e prospecção', '{"projects": ["read"], "proposals": ["read","write","send"], "contracts": ["read","write"], "prospecting": ["read","write","delete"], "reports": ["read"]}', true),
('Financeiro', 'Gestão financeira', '{"projects": ["read"], "finance": ["read","write","sensitive"], "contracts": ["read"], "reports": ["read","export"]}', true),
('Leitura', 'Apenas visualização', '{"projects": ["read"], "proposals": ["read"], "contracts": ["read"], "marketing": ["read"], "reports": ["read"]}', true);

-- Insert default project stages
INSERT INTO public.project_stage_settings (stage_order, stage_key, stage_label, sla_days, blocks_delivery) VALUES
(1, 'briefing', 'Briefing', 3, false),
(2, 'pre_production', 'Pré-produção', 5, false),
(3, 'production', 'Produção', 7, false),
(4, 'editing', 'Edição', 7, true),
(5, 'review', 'Revisão', 2, true),
(6, 'approval', 'Aprovação', 3, true),
(7, 'delivery', 'Entrega', 1, false);