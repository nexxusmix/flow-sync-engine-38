
# Criar Contrato com IA via Upload de Arquivo

## O que será construído

Uma nova opção **"Criar com IA"** nos dois lugares onde contratos são criados:
1. No modal de financeiro do projeto (`ProjectFinanceDetailPanel` → `ProjectContractModal`)
2. Na página de lista de contratos (`ContractsListPage`)

O fluxo: usuário sobe um arquivo (contrato existente em PDF/DOCX ou proposta comercial), a IA extrai todos os dados relevantes (valor, cliente, condições de pagamento, datas, escopo), preenche o contrato automaticamente e gera as parcelas financeiras no banco.

---

## Arquitetura do Fluxo

```text
Usuário faz upload do arquivo (PDF/DOCX/imagem)
        ↓
Frontend converte para base64
        ↓
Edge Function: extract-contract-from-file
  1. Recebe base64 + mimeType + project_id (opcional)
  2. Envia para Gemini 2.5 Flash com prompt especializado
  3. IA extrai dados estruturados via tool calling:
     - client_name, client_email, client_document
     - total_value
     - payment_terms (string descritiva)
     - start_date, end_date
     - notes (escopo resumido)
  4. Salva contrato na tabela contracts
  5. Gera parcelas (revenues) via lógica existente de parsePaymentTerms
  6. Retorna resumo do que foi extraído e criado
        ↓
Frontend exibe preview dos dados extraídos
Usuário confirma → dados salvos
```

---

## Detalhes Técnicos

### Nova Edge Function: `extract-contract-from-file`

```text
POST /functions/v1/extract-contract-from-file
Body: {
  fileBase64: string,        // arquivo em base64
  mimeType: string,          // "application/pdf", "image/jpeg", etc.
  fileName: string,          // nome do arquivo
  project_id?: string,       // se veio de dentro de um projeto
  workspace_id?: string
}

Resposta: {
  extracted: {
    client_name, client_email, total_value,
    payment_terms, start_date, end_date, notes
  },
  contract_id: string,
  created_revenues: number,
  message: string
}
```

**Prompt para a IA:** Especializado em extrair dados de contratos e propostas comerciais brasileiras. Usa **tool calling** (função `extract_contract_data`) para garantir output estruturado, sem alucinações de formato.

**Modelo:** `google/gemini-2.5-flash` — suporta multimodal (PDF como imagem de alta fidelidade).

### Reutilização da lógica existente

A função `parsePaymentTerms` já existe em `sync-project-finances/index.ts` e será **duplicada** na nova edge function (Deno não permite importação entre functions). Isso garante geração consistente de parcelas.

---

## Componentes de UI

### 1. Novo componente: `ContractAiUploadDialog`
Arquivo: `src/components/finance/ContractAiUploadDialog.tsx`

Um Dialog independente com:
- **Área de upload** (drag & drop ou clique) — aceita PDF, DOCX, PNG, JPG
- Limite de arquivo: 20MB
- **Estado de processamento** com spinner e texto "Analisando documento com IA..."
- **Preview dos dados extraídos** (antes de confirmar):
  - Cliente, email, valor, condições, datas, notas
  - Campos editáveis para correção manual antes de salvar
- **Botão Confirmar e Criar Contrato** → persiste e fecha

### 2. Modificação: `ProjectFinanceDetailPanel.tsx`

Onde hoje tem o botão "Criar Contrato", adicionar dois botões:
```
[ + Criar Contrato ]  [ ✨ Criar com IA ]
```
O botão "Criar com IA" abre o `ContractAiUploadDialog`.

### 3. Modificação: `ContractsListPage.tsx`

No modal "Novo Contrato", adicionar um tab ou botão alternativo:
```
[ Preencher Manualmente ]  [ ✨ Enviar Arquivo com IA ]
```
Ao clicar em "Enviar Arquivo com IA", substitui o conteúdo do dialog pelo `ContractAiUploadDialog`.

---

## Arquivos a Criar

- `supabase/functions/extract-contract-from-file/index.ts` — edge function principal
- `src/components/finance/ContractAiUploadDialog.tsx` — dialog de upload + preview

## Arquivos a Modificar

- `src/components/finance/ProjectFinanceDetailPanel.tsx` — adicionar botão "Criar com IA"
- `src/pages/contracts/ContractsListPage.tsx` — adicionar opção "Enviar Arquivo com IA" no modal
- `supabase/config.toml` — registrar nova edge function

---

## Tipos de Arquivo Suportados

| Formato | Como a IA processa |
|---|---|
| PDF | Via multimodal (renderizado como imagem de alta fidelidade pelo Gemini) |
| DOCX | Texto extraído e enviado como conteúdo |
| PNG / JPG | Diretamente como imagem |
| Proposta comercial (qualquer formato) | Idem — a IA identifica os campos financeiros relevantes |

---

## Sequência de Implementação

```text
1. Criar edge function extract-contract-from-file
   (upload → Gemini 2.5 Flash com tool calling → contrato + parcelas)
   ↓
2. Criar ContractAiUploadDialog
   (upload UI → loading → preview dos dados extraídos → confirmar)
   ↓
3. Modificar ProjectFinanceDetailPanel
   (botão "Criar com IA" ao lado de "Criar Contrato")
   ↓
4. Modificar ContractsListPage
   (opção "Enviar Arquivo com IA" no modal de novo contrato)
   ↓
5. Registrar function no config.toml
```

---

## Garantias de Qualidade

- **Idempotência:** se o projeto já tiver contrato, a function avisa sem duplicar
- **Fallback:** se a IA não conseguir extrair um campo (ex: email não mencionado), o campo fica vazio e editável no preview
- **Rate limit / créditos:** erros 429 e 402 são tratados com mensagens amigáveis
- **Limite de arquivo:** validado no frontend antes do upload (max 20MB)
- **Tipos inválidos:** validação frontend com mensagem de erro antes de enviar
