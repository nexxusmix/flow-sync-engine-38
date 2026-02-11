
-- Add conversion tracking columns to proposals
ALTER TABLE public.proposals 
  ADD COLUMN IF NOT EXISTS converted_to_contract boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL;

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_proposals_contract_id ON public.proposals(contract_id);
