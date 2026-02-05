-- Contract Templates
CREATE TABLE public.contract_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  service_type TEXT CHECK (service_type IN ('filme','reels','foto','drone','tour360','motion','landing','trafego','pacote','outro')),
  version INT NOT NULL DEFAULT 1,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contract Versions (immutable snapshots)
CREATE TABLE public.contract_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL,
  version INT NOT NULL,
  body_rendered TEXT NOT NULL,
  variables_filled JSONB NOT NULL DEFAULT '{}',
  checksum TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contract Addendums
CREATE TABLE public.contract_addendums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','signed')),
  signed_at TIMESTAMPTZ,
  signed_by_name TEXT,
  signed_by_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contract Signatures
CREATE TABLE public.contract_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL,
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  signature_type TEXT NOT NULL CHECK (signature_type IN ('accept_click','upload_signed_pdf')),
  signed_file_url TEXT
);

-- Contract Links (public share)
CREATE TABLE public.contract_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL,
  share_token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  view_count INT DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contract Alerts (renewal, expiry)
CREATE TABLE public.contract_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('renewal_30','renewal_15','renewal_7','expired','breach')),
  due_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','done')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add new columns to existing contracts table for legal contract features
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS client_document TEXT,
ADD COLUMN IF NOT EXISTS template_id UUID,
ADD COLUMN IF NOT EXISTS renewal_type TEXT CHECK (renewal_type IN ('none','monthly','quarterly','yearly')),
ADD COLUMN IF NOT EXISTS renewal_notice_days INT DEFAULT 30,
ADD COLUMN IF NOT EXISTS payment_block_on_breach BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS public_summary JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS current_version INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS created_by UUID;

-- Update status check constraint to include new statuses
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_status_check;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_status_check 
  CHECK (status IN ('draft','active','sent','viewed','signed','completed','cancelled','expired'));

-- Add foreign keys
ALTER TABLE public.contract_versions ADD CONSTRAINT contract_versions_contract_id_fkey 
  FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

ALTER TABLE public.contract_addendums ADD CONSTRAINT contract_addendums_contract_id_fkey 
  FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

ALTER TABLE public.contract_signatures ADD CONSTRAINT contract_signatures_contract_id_fkey 
  FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

ALTER TABLE public.contract_links ADD CONSTRAINT contract_links_contract_id_fkey 
  FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

ALTER TABLE public.contract_alerts ADD CONSTRAINT contract_alerts_contract_id_fkey 
  FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX idx_contract_templates_service ON public.contract_templates(service_type);
CREATE INDEX idx_contract_versions_contract ON public.contract_versions(contract_id);
CREATE INDEX idx_contract_addendums_contract ON public.contract_addendums(contract_id);
CREATE INDEX idx_contract_signatures_contract ON public.contract_signatures(contract_id);
CREATE INDEX idx_contract_links_token ON public.contract_links(share_token);
CREATE INDEX idx_contract_alerts_due ON public.contract_alerts(due_at) WHERE status = 'open';

-- RLS Policies
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_addendums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_alerts ENABLE ROW LEVEL SECURITY;

-- Permissive policies for MVP (internal tool)
CREATE POLICY "Allow all for contract_templates" ON public.contract_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for contract_versions" ON public.contract_versions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for contract_addendums" ON public.contract_addendums FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for contract_signatures" ON public.contract_signatures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for contract_links" ON public.contract_links FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for contract_alerts" ON public.contract_alerts FOR ALL USING (true) WITH CHECK (true);