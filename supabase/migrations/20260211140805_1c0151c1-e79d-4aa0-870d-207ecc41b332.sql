
-- Add contract_id column to revenues for milestone linking
ALTER TABLE public.revenues ADD COLUMN contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL;

-- Index for fast lookups by contract
CREATE INDEX idx_revenues_contract_id ON public.revenues(contract_id);
