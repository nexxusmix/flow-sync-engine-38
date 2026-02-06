
# Plano: Sincronizar Financeiro com Valor do Contrato do Projeto

## Problema Identificado

O sistema atual tem uma desconexao entre os dados:

```text
projects (contract_value: R$ 15.590)
         |
         v
contracts (VAZIO - nenhum registro)
         |
         v
revenues (VAZIO - nenhum registro)
         |
         v
Dashboard Financeiro (R$ 0)
```

O projeto "PORTO 153" tem `contract_value = 15590` salvo na tabela `projects`, porem:
1. Nao existe contrato na tabela `contracts`
2. Nao existem receitas na tabela `revenues`
3. Os dashboards financeiros buscam dessas tabelas, nao de `projects.contract_value`

## Solucao

Implementar sincronizacao automatica entre projetos e financeiro:

### 1. Criar Contrato Automaticamente ao Criar/Atualizar Projeto

Quando um projeto for criado ou atualizado com `contract_value > 0`:
- Verificar se ja existe contrato para o projeto
- Se nao existir, criar contrato na tabela `contracts`
- Criar milestones de pagamento padrao (50% entrada + 50% entrega)
- Os milestones criam automaticamente as revenues correspondentes

### 2. Atualizar Hook useProjects

Modificar `createProjectMutation` para criar contrato automaticamente.
Modificar `updateProjectMutation` para sincronizar contrato quando contract_value mudar.

### 3. Invalidar Cache do React Query

Garantir que ao criar/atualizar projeto, os caches financeiros sejam invalidados:
- `dashboard-metrics`
- Stores do Zustand (revenues, contracts)

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useProjects.tsx` | Adicionar criacao automatica de contrato |
| `src/stores/financialStore.ts` | Adicionar funcao para criar contrato com milestones padrao |
| `src/hooks/useDashboardMetrics.tsx` | Incluir contract_value dos projetos nas metricas |

## Detalhes Tecnicos

### useProjects.tsx - createProjectMutation

```typescript
// Apos criar projeto, criar contrato se contract_value > 0
if (project && (input.contract_value || 0) > 0) {
  // Criar contrato na tabela contracts
  await supabase.from('contracts').insert({
    project_id: project.id,
    project_name: input.name,
    client_name: input.client_name,
    total_value: input.contract_value,
    payment_terms: '50/50',
    status: 'active',
    start_date: input.start_date || new Date().toISOString().split('T')[0],
  });
  
  // Criar milestones de pagamento (50% entrada + 50% entrega)
  const entryAmount = (input.contract_value || 0) * 0.5;
  const deliveryAmount = (input.contract_value || 0) * 0.5;
  
  // Criar revenue para entrada (hoje)
  await supabase.from('revenues').insert({
    project_id: project.id,
    description: `${input.name} - Entrada (50%)`,
    amount: entryAmount,
    due_date: new Date().toISOString().split('T')[0],
    status: 'pending',
  });
  
  // Criar revenue para entrega (data de entrega)
  await supabase.from('revenues').insert({
    project_id: project.id,
    description: `${input.name} - Entrega (50%)`,
    amount: deliveryAmount,
    due_date: input.due_date || new Date().toISOString().split('T')[0],
    status: 'pending',
  });
}
```

### useDashboardMetrics.tsx - Incluir Pipeline de Projetos

```typescript
// Adicionar ao calculo de metricas
const projectsPipelineValue = (projects || [])
  .filter(p => p.status === 'active')
  .reduce((sum, p) => sum + (p.contract_value || 0), 0);

// Usar no totalPipelineValue ou criar metrica separada
```

### financialStore.ts - getProjectFinancials Melhorado

```typescript
// Buscar projetos que tem contract_value mas nao tem contrato
// Para exibir no dashboard financeiro mesmo sem contrato formal
```

## Fluxo Corrigido

```text
Criar Projeto (contract_value: R$ 15.590)
         |
         v
Criar Contrato Automatico (total_value: R$ 15.590)
         |
         v
Criar Milestones (50% + 50%)
         |
         v
Criar Revenues Pendentes
         |
         v
Dashboard Financeiro Atualizado
```

## Projeto Existente - Sincronizacao

Para o projeto "PORTO 153" que ja existe sem contrato, a solucao pode:

1. Criar contrato manualmente via SQL (mais simples)
2. Adicionar botao "Sincronizar Financeiro" na UI do projeto
3. Rodar migracao que cria contratos para projetos existentes

### SQL para Sincronizar Projeto Existente

```sql
-- Criar contrato para projeto existente
INSERT INTO contracts (project_id, project_name, client_name, total_value, status, start_date)
SELECT id, name, client_name, contract_value, 'active', COALESCE(start_date, CURRENT_DATE)
FROM projects
WHERE id = '62f54f75-ca2f-4083-b10e-ec2c6bcb1534'
  AND contract_value > 0;

-- Criar revenue para entrada (50%)
INSERT INTO revenues (project_id, description, amount, due_date, status)
SELECT id, name || ' - Entrada (50%)', contract_value * 0.5, CURRENT_DATE, 'pending'
FROM projects
WHERE id = '62f54f75-ca2f-4083-b10e-ec2c6bcb1534';

-- Criar revenue para entrega (50%)
INSERT INTO revenues (project_id, description, amount, due_date, status)
SELECT id, name || ' - Entrega (50%)', contract_value * 0.5, COALESCE(due_date, CURRENT_DATE), 'pending'
FROM projects
WHERE id = '62f54f75-ca2f-4083-b10e-ec2c6bcb1534';
```

## Sequencia de Implementacao

1. Criar SQL para sincronizar projeto existente
2. Modificar `useProjects.tsx` para criar contrato automaticamente
3. Invalidar caches do React Query apos criacao
4. Testar fluxo completo de criacao de projeto
5. Verificar dashboards atualizados

## Resultado Esperado

Apos implementacao:
- Receita do Mes: valores de revenues recebidas
- Pipeline Ativo: soma de contracts ativos
- Dashboard Financeiro: exibira projetos com valores corretos
- Overview: metricas refletindo dados reais
