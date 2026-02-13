
# Financeiro 100% Vinculado + Atualizado Automaticamente

## Problema Atual

1. **"Total Pago" mostra R$ 0,00** -- As receitas (revenues) existem no banco mas a maioria nao tem `project_id` preenchido, entao o componente `ProjectPaymentsSummary` nao encontra dados. Tambem nao existem `payment_milestones` cadastrados.
2. **Dados PIX hardcoded** -- `ReportAsidePanel` usa valores fixos (squadfilmeo@gmail.com, Matheus Filipe Alves, Nubank). Nao existem campos `pix_key`, `pix_bank`, `pix_holder` na tabela `contracts` ou `projects`.
3. **Portal do Cliente usa mock** -- `PortalPaymentsAside` usa dados ficticios em vez de buscar do banco.
4. **Sem realtime no financeiro do projeto** -- Alteracoes em receitas/parcelas nao atualizam a UI do projeto automaticamente.
5. **Receitas orfas** -- 3 das 4 receitas no banco nao tem `project_id`, quebrando toda a logica de vinculacao.

## Solucao

### Fase 1: Schema -- Adicionar campos financeiros ao contrato

Adicionar colunas na tabela `contracts`:
- `pix_key` (text, nullable)
- `pix_key_type` (text: email/phone/cpf/random)
- `bank_name` (text, nullable)
- `account_holder_name` (text, nullable)

Isso permite que cada contrato/projeto tenha suas proprias condicoes financeiras em vez de hardcoded.

### Fase 2: Corrigir dados orfaos

Atualizar as 3 receitas que estao sem `project_id` para vincula-las ao projeto correto (PORTO 153 = `62f54f75-ca2f-4083-b10e-ec2c6bcb1534`), e tambem vincular o `contract_id` correto.

### Fase 3: Refatorar `ReportAsidePanel`

Em vez de props hardcoded, buscar `pix_key`, `bank_name`, `account_holder_name` do contrato vinculado ao projeto via `useFinancialStore.getContractByProject()`.

### Fase 4: Refatorar `PortalPaymentsAside`

Remover mock data. Receber `projectId` como prop e buscar receitas reais do banco via `useFinancialStore`, mapeando status corretamente (`received` -> `paid`, overdue detection por data).

### Fase 5: Calculos corretos no `ProjectPaymentsSummary`

Atualmente o componente calcula "Total Pago" a partir de milestones, mas se nao existem milestones, usa revenues como fallback. O problema e que revenues sem `project_id` nao aparecem. Com os dados corrigidos (Fase 2), isso se resolve automaticamente.

Ajustar tambem: se o contrato tem `total_value` e receitas tem `status=received`, calcular:
- **Total Pago** = soma das receitas `received`
- **Falta Pagar** = `contract.total_value - Total Pago` (minimo 0)

### Fase 6: Realtime para financeiro no contexto do projeto

Adicionar `revenues` e `contracts` ao listener realtime (`useRealtimeSync`) para que mudancas financeiras invalidem os caches e atualizem a UI do projeto sem refresh.

### Fase 7: Botoes de acao no card financeiro

Adicionar ao `ProjectPaymentsSummary`:
- **"Adicionar Parcela"** -- abre modal para criar receita vinculada ao projeto
- **"Marcar como Pago"** -- ja existe, confirmar funcionamento

### Fase 8: Badge de Saude Financeira

Exibir no card financeiro:
- **OK** (verde): sem atrasos
- **Atencao** (amarelo): 1 parcela vencida
- **Critico** (vermelho): multiplas vencidas ou valor alto

---

## Detalhes Tecnicos

### Migracao SQL
```sql
ALTER TABLE contracts
  ADD COLUMN pix_key text,
  ADD COLUMN pix_key_type text DEFAULT 'email',
  ADD COLUMN bank_name text,
  ADD COLUMN account_holder_name text;
```

### Correcao de dados
```sql
UPDATE revenues SET project_id = '62f54f75-ca2f-4083-b10e-ec2c6bcb1534'
WHERE description LIKE '%PORTO 153%' AND project_id IS NULL;

UPDATE contracts SET pix_key = 'squadfilmeo@gmail.com',
  pix_key_type = 'email', bank_name = 'Nubank',
  account_holder_name = 'Matheus Filipe Alves'
WHERE project_id = '62f54f75-ca2f-4083-b10e-ec2c6bcb1534' AND id = '29f6c64b-655a-4b97-bce4-2f6785d64ac4';
```

### Arquivos modificados
1. **`src/components/projects/reporting/ReportAsidePanel.tsx`** -- Buscar dados do contrato em vez de props hardcoded
2. **`src/components/projects/reporting/ProjectPaymentsSummary.tsx`** -- Incluir receitas no calculo de Total Pago/Falta Pagar mesmo sem milestones; adicionar badge de saude; botao "Adicionar Parcela"
3. **`src/components/client-portal/PortalPaymentsAside.tsx`** -- Remover mocks, usar dados reais do banco via props ou store
4. **`src/hooks/useRealtimeSync.tsx`** -- Adicionar `revenues` e `contracts` ao canal realtime (ja existem como tables no mapping mas precisam invalidar caches do financeiro)
5. **`src/stores/financialStore.ts`** -- Adicionar campos `pix_key`, `bank_name`, `account_holder_name` ao tipo Contract e ao fetch

### Fluxo de dados (SSOT)
```text
contracts (DB) --> useFinancialStore.fetchContracts()
revenues  (DB) --> useFinancialStore.fetchRevenues()
                        |
          [Realtime: INSERT/UPDATE/DELETE]
                        |
                  invalidate cache
                        |
    ProjectPaymentsSummary  <--  ReportAsidePanel
    (Total Pago, Parcelas)       (PIX, Banco, Titular)
            |
    PortalPaymentsAside (somente leitura, mesmos dados)
```

### Nao incluido nesta fase (escopo futuro)
- Console de comandos texto/voz
- Jobs de IA para classificacao/anomalias
- Ledger de auditoria
- Geracao de recibo PDF
- Upload de comprovante

Esses itens dependem de infraestrutura adicional (edge functions de IA, storage policies) e serao implementados em iteracoes futuras.
