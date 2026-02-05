
# Plano: Integrar Contratos e Pagamentos ao Financeiro por Projetos

## Resumo
Aprimorar a tela `/financeiro/projetos` para integrar contratos, permitir confirmacao de pagamentos, gerenciar parcelas (milestones), editar e finalizar contratos diretamente da interface financeira.

## Cenario Atual
- A pagina `ProjectsFinancePage.tsx` exibe resumo financeiro por projeto
- Contratos sao gerenciados em `/financeiro/contratos` separadamente
- Nao ha integracao direta entre visualizacao de projeto e gestao de contrato
- Store financeiro ja possui metodos para CRUD de contratos e milestones

## Arquitetura da Solucao

```text
ProjectsFinancePage
    |
    +-- Listagem de Projetos (existente)
    |       |
    |       +-- Card de Projeto + Acoes
    |               +-- Ver Contrato
    |               +-- Criar Contrato (se nao existir)
    |
    +-- Painel de Detalhes (direita)
            |
            +-- Secao Contrato
            |       +-- Info do Contrato
            |       +-- Editar Contrato (modal)
            |       +-- Finalizar Contrato
            |
            +-- Secao Parcelas/Milestones
            |       +-- Lista de parcelas
            |       +-- Confirmar Pagamento
            |       +-- Editar Parcela (modal)
            |       +-- Adicionar Parcela
            |
            +-- Secao Receitas/Despesas (existente)
```

## Componentes a Criar/Modificar

### 1. Criar Modal de Contrato para Projeto
**Arquivo:** `src/components/finance/ProjectContractModal.tsx`

Funcionalidades:
- Criar novo contrato vinculado ao projeto
- Editar contrato existente
- Gerar parcelas automaticas (ex: 40/40/20)
- Campos: valor total, condicoes, datas

### 2. Criar Componente de Milestones Inline
**Arquivo:** `src/components/finance/MilestonesList.tsx`

Funcionalidades:
- Listar parcelas do contrato
- Botao "Confirmar Recebimento" por parcela
- Editar parcela (valor, data, titulo)
- Excluir parcela
- Adicionar nova parcela

### 3. Atualizar ProjectsFinancePage
**Arquivo:** `src/pages/finance/ProjectsFinancePage.tsx`

Alteracoes:
- Adicionar secao de contrato no painel de detalhes
- Integrar MilestonesList
- Botao para criar contrato quando nao existir
- Opcao de finalizar contrato
- Atualizar status do projeto (has_payment_block)

### 4. Expandir Financial Store
**Arquivo:** `src/stores/financialStore.ts`

Novos metodos:
- `updateMilestone(id, data)` - Editar milestone
- `deleteMilestone(id)` - Excluir milestone
- `finalizeContract(id)` - Marcar contrato como completed
- `createContractForProject(projectId, projectName, clientName, value)` - Criar contrato com projeto

## Fluxo de Usuario

### Criar Contrato para Projeto
1. Selecionar projeto na lista
2. No painel de detalhes, clicar "Criar Contrato"
3. Modal abre com dados do projeto pre-preenchidos
4. Definir valor e condicoes de pagamento
5. Gerar parcelas automaticamente ou manualmente
6. Salvar - contrato e receitas sao criados

### Confirmar Pagamento de Parcela
1. No painel de detalhes, ver lista de parcelas
2. Clicar "Confirmar" na parcela desejada
3. Sistema marca milestone e receita como pagos
4. Atualiza progresso do contrato

### Editar Parcela
1. Clicar no icone de edicao da parcela
2. Modal abre para alterar valor/data/titulo
3. Salvar atualiza milestone e receita vinculada

### Finalizar Contrato
1. Com todas parcelas pagas (ou manualmente)
2. Clicar "Finalizar Contrato"
3. Status muda para "completed"
4. Projeto pode ser finalizado

## Detalhes Tecnicos

### Sincronizacao Milestone-Revenue
Quando um milestone e marcado como pago:
```typescript
await markMilestonePaid(milestoneId);
// Tambem atualiza a receita vinculada se revenue_id existir
if (milestone.revenue_id) {
  await markRevenueReceived(milestone.revenue_id);
}
```

### Auto-geracao de Parcelas
```typescript
function generateInstallments(totalValue: number, terms: string) {
  // Ex: terms = "40/30/30"
  const percentages = terms.split('/').map(p => parseInt(p));
  return percentages.map((pct, index) => ({
    title: `Parcela ${index + 1}`,
    amount: totalValue * (pct / 100),
    due_date: addDays(new Date(), index * 30).toISOString().split('T')[0],
  }));
}
```

### Status de Bloqueio do Projeto
Quando houver parcela vencida > 7 dias:
```typescript
const overdueRevenues = revenues.filter(r => 
  r.project_id === projectId && 
  r.status === 'overdue' &&
  daysSince(r.due_date) > 7
);
if (overdueRevenues.length > 0) {
  await updateProject(projectId, { has_payment_block: true });
}
```

## Interface Visual

### Card de Projeto (Atualizado)
- Indicador visual de contrato vinculado
- Badge "Sem Contrato" se nao tiver
- Acoes rapidas no menu

### Painel de Detalhes (Expandido)
```text
+--------------------------------+
|  Projeto: Video ABC            |
|  Cliente: Empresa XYZ          |
+--------------------------------+
|  CONTRATO                      |
|  +--------------------------+  |
|  | Valor: R$ 15.000        |  |
|  | Status: Ativo           |  |
|  | [Editar] [Finalizar]    |  |
|  +--------------------------+  |
+--------------------------------+
|  PARCELAS                      |
|  +--------------------------+  |
|  | Entrada - R$ 6.000      |  |
|  | 01/02/2026 [V] Pago     |  |
|  +--------------------------+  |
|  | 2a Parcela - R$ 4.500   |  |
|  | 15/02/2026 [ ] Pendente |  |
|  |            [Confirmar]  |  |
|  +--------------------------+  |
|  | Final - R$ 4.500        |  |
|  | 01/03/2026 [ ] Pendente |  |
|  |            [Confirmar]  |  |
|  +--------------------------+  |
|  [+ Adicionar Parcela]         |
+--------------------------------+
```

## Arquivos a Modificar

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `src/pages/finance/ProjectsFinancePage.tsx` | Modificar | Adicionar integracao de contratos e milestones |
| `src/stores/financialStore.ts` | Modificar | Adicionar updateMilestone, deleteMilestone, finalizeContract |
| `src/components/finance/ProjectContractModal.tsx` | Criar | Modal de criacao/edicao de contrato |
| `src/components/finance/MilestonesList.tsx` | Criar | Componente de lista de parcelas com acoes |

## Ordem de Implementacao

1. Expandir `financialStore.ts` com novos metodos
2. Criar `MilestonesList.tsx` componente
3. Criar `ProjectContractModal.tsx` componente
4. Atualizar `ProjectsFinancePage.tsx` com integracao completa
5. Testar fluxo completo end-to-end

## Validacoes de Seguranca

- Verificar se usuario tem permissao para modificar financeiro
- Confirmar antes de excluir parcelas
- Nao permitir finalizar contrato com parcelas pendentes (opcional)
- Log de auditoria para mudancas financeiras
