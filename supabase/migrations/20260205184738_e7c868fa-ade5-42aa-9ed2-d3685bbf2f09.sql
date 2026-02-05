-- Adicionar campos para integração gov.br na tabela contract_signatures
ALTER TABLE contract_signatures
  ADD COLUMN IF NOT EXISTS signer_cpf TEXT,
  ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS document_hash TEXT,
  ADD COLUMN IF NOT EXISTS proof_url TEXT,
  ADD COLUMN IF NOT EXISTS raw_payload JSONB;

-- Criar tabela para rastrear sessões de assinatura gov.br
CREATE TABLE IF NOT EXISTS govbr_signing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  state_token TEXT UNIQUE NOT NULL,
  document_hash TEXT NOT NULL,
  return_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '15 minutes'),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending'
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_govbr_sessions_state_token ON govbr_signing_sessions(state_token);
CREATE INDEX IF NOT EXISTS idx_govbr_sessions_contract_id ON govbr_signing_sessions(contract_id);
CREATE INDEX IF NOT EXISTS idx_govbr_sessions_status ON govbr_signing_sessions(status);

-- RLS policies para govbr_signing_sessions
ALTER TABLE govbr_signing_sessions ENABLE ROW LEVEL SECURITY;

-- Permitir que funções do sistema criem/atualizem sessões
CREATE POLICY "Service role can manage signing sessions"
ON govbr_signing_sessions
FOR ALL
USING (true)
WITH CHECK (true);

-- Comentários para documentação
COMMENT ON TABLE govbr_signing_sessions IS 'Rastreia sessões de assinatura digital via gov.br';
COMMENT ON COLUMN contract_signatures.provider IS 'Provedor de assinatura: internal, govbr';
COMMENT ON COLUMN contract_signatures.signer_cpf IS 'CPF do signatário (apenas para gov.br)';
COMMENT ON COLUMN contract_signatures.document_hash IS 'Hash SHA-256 do documento assinado';
COMMENT ON COLUMN contract_signatures.raw_payload IS 'Payload completo retornado pelo provedor';