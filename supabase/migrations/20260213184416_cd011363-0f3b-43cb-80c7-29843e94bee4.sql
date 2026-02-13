
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS pix_key text,
  ADD COLUMN IF NOT EXISTS pix_key_type text DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS account_holder_name text;
