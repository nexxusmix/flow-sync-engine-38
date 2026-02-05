
# Plano: Integração de Assinatura Digital via gov.br

## Contexto
O modelo atual de assinatura (click-to-accept + upload PDF) é juridicamente frágil. A solução correta é integrar com gov.br (ICP-Brasil), delegando a autenticação e assinatura digital para o sistema oficial do governo brasileiro.

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE ASSINATURA                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. SQUAD Hub                    2. gov.br                          │
│  ┌──────────────┐               ┌──────────────┐                   │
│  │ Gera PDF     │──────────────▶│ Autenticação │                   │
│  │ + Hash       │  redirect     │ ICP-Brasil   │                   │
│  └──────────────┘               └──────┬───────┘                   │
│         ▲                              │                            │
│         │                              ▼                            │
│         │                       ┌──────────────┐                   │
│         │                       │ Assinatura   │                   │
│         │                       │ Digital      │                   │
│         │                       └──────┬───────┘                   │
│         │                              │                            │
│  3. Callback                           │ redirect + dados           │
│  ┌──────────────┐                      │                            │
│  │ Edge Function│◀─────────────────────┘                            │
│  │ processa     │                                                   │
│  │ assinatura   │                                                   │
│  └──────┬───────┘                                                   │
│         │                                                           │
│         ▼                                                           │
│  4. Atualiza DB + Libera Projeto/Financeiro                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Alterações no Banco de Dados

### 1. Modificar tabela `contract_signatures`

```sql
-- Adicionar campos para gov.br
ALTER TABLE contract_signatures
  ADD COLUMN IF NOT EXISTS signer_cpf TEXT,
  ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS document_hash TEXT,
  ADD COLUMN IF NOT EXISTS proof_url TEXT,
  ADD COLUMN IF NOT EXISTS raw_payload JSONB;

-- Atualizar constraint de signature_type
-- De: 'accept_click' | 'upload_signed_pdf'
-- Para: 'accept_click' | 'upload_signed_pdf' | 'govbr'
```

### 2. Criar tabela `govbr_signing_sessions` (rastrear tentativas)

```sql
CREATE TABLE govbr_signing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  state_token TEXT UNIQUE NOT NULL,
  document_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '15 minutes'),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' -- pending, completed, expired, failed
);
```

## Edge Functions

### 1. `govbr-initiate-signing`
Responsável por:
- Gerar PDF final do contrato
- Calcular hash SHA-256 do documento
- Criar sessão de assinatura
- Retornar URL de redirect para gov.br

### 2. `govbr-callback`
Responsável por:
- Validar state token
- Processar dados retornados pelo gov.br
- Salvar assinatura no banco
- Atualizar status do contrato
- Disparar eventos (liberar projeto, financeiro)

## Alterações no Frontend

### 1. `ContractClientPage.tsx`
- **Remover**: Modal de "Aceitar Contrato" (click-to-accept)
- **Remover**: Modal de "Upload PDF Assinado"
- **Adicionar**: Botão único "Assinar via gov.br"
- **Adicionar**: Estados de loading durante redirect
- **Adicionar**: Tela de sucesso pós-assinatura

### 2. `ContractDetailPage.tsx` (admin)
- Atualizar aba "Assinaturas" para mostrar dados do gov.br
- Exibir CPF, hash do documento, proof_url
- Badge indicando provedor (gov.br vs interno)

### 3. Tipos TypeScript
- Atualizar `SignatureType` para incluir `'govbr'`
- Atualizar interface `ContractSignature` com novos campos

## Fluxo Detalhado

### Passo 1: Usuário clica "Assinar via gov.br"
```typescript
// ContractClientPage.tsx
const handleGovBrSign = async () => {
  setLoading(true);
  
  // Chama edge function
  const { data, error } = await supabase.functions.invoke('govbr-initiate-signing', {
    body: { contractId, returnUrl: window.location.href }
  });
  
  if (data?.redirectUrl) {
    window.location.href = data.redirectUrl;
  }
};
```

### Passo 2: Edge Function prepara assinatura
```typescript
// govbr-initiate-signing/index.ts
- Busca contrato + última versão
- Gera PDF (ou usa existente)
- Calcula SHA-256 hash
- Cria govbr_signing_sessions com state_token
- Retorna URL gov.br com parâmetros
```

### Passo 3: Callback do gov.br
```typescript
// govbr-callback/index.ts
- Valida state_token
- Extrai: CPF, nome, timestamp, hash assinado
- Insere em contract_signatures (provider: 'govbr')
- Atualiza contracts.status = 'signed'
- Retorna redirect para página do contrato
```

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/types/contracts.ts` | Modificar | Novos campos e tipos |
| `src/pages/contracts/ContractClientPage.tsx` | Modificar | Remover click-accept, add gov.br |
| `src/pages/contracts/ContractDetailPage.tsx` | Modificar | Exibir dados gov.br |
| `supabase/functions/govbr-initiate-signing/index.ts` | Criar | Iniciar fluxo |
| `supabase/functions/govbr-callback/index.ts` | Criar | Processar retorno |
| Migração SQL | Criar | Novos campos e tabela |

## Considerações Técnicas

### Integração gov.br
A API gov.br requer credenciais de integrador. O fluxo completo depende de:
1. **Client ID / Client Secret**: Obtidos via Portal de Serviços gov.br
2. **Certificado digital**: Para comunicação segura
3. **Homologação**: Ambiente de testes antes de produção

### MVP Simplificado
Como a integração completa com gov.br requer credenciais oficiais, o plano inclui:
1. Estrutura de banco pronta para gov.br
2. Frontend preparado para o fluxo
3. Edge functions com stubs para simular
4. Documentação de como conectar quando credenciais estiverem disponíveis

### Opção de Fallback (Temporário)
Manter opção de upload de PDF assinado externamente (cliente assina via gov.br no celular, faz upload do PDF assinado), mas com indicação clara de que não é o fluxo ideal.

## Ordem de Execução

1. **Migração SQL**: Adicionar campos e criar tabela de sessões
2. **Tipos TypeScript**: Atualizar interfaces
3. **Edge Functions**: Criar estrutura base
4. **ContractClientPage**: Reformular UI de assinatura
5. **ContractDetailPage**: Atualizar visualização admin

## Resultado Esperado

- Contratos com validade jurídica plena (ICP-Brasil)
- Registro auditável com CPF, timestamp, hash
- Fluxo integrado que não reinventa assinatura digital
- Sistema preparado para ativar gov.br quando credenciais estiverem disponíveis
