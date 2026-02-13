
# Pipeline Comercial 100% Integrado e em Tempo Real

## Problema Atual

O Pipeline Comercial (CRM) esta desconectado do resto da plataforma em varios pontos criticos:

1. **Dashboard lendo tabela errada**: O `useDashboardMetrics` busca dados de CRM da tabela legada `prospect_opportunities` em vez de `crm_deals` (a fonte de verdade real)
2. **PipelineSection nao conectada**: O componente do dashboard usa arrays vazios hardcoded, sem buscar dados reais
3. **Sem realtime no CRM**: As tabelas `crm_deals`, `crm_contacts` e `crm_stages` nao estao no sistema de sincronizacao em tempo real
4. **Botao "Novo Deal" nao funciona**: Na CRMPage, o botao nao abre nenhum formulario
5. **Kanban filtra por stage errado**: O CRMPage filtra deals por `stage.id` (UUID) em vez de `stage.key` (string como 'lead', 'qualificacao')
6. **Sem dialog de criar deal no CRM**: So existe criacao de lead pelo Header global
7. **Deal fechado nao gera projeto/contrato**: O `closeDeal` ja existe no hook mas sem UI nem automacao financeira

---

## Plano de Implementacao

### 1. Corrigir fonte de dados do Dashboard

**Arquivo**: `src/hooks/useDashboardMetrics.tsx`

- Substituir a query `prospect_opportunities` por `crm_deals` com join em `crm_contacts`
- Ajustar calculo de `totalPipelineValue`, `forecast` e `dealsByStage` para usar `crm_deals.value`, `crm_deals.score` e `crm_deals.stage_key`
- Manter os nomes dos stages alinhados com `crm_stages` (lead, qualificacao, diagnostico, proposta, negociacao, fechado, onboarding, pos_venda)

### 2. Conectar PipelineSection ao banco

**Arquivo**: `src/components/dashboard/PipelineSection.tsx`

- Importar `useCRM` para buscar deals e metrics reais
- Gerar `pipelineSummary` dinamicamente a partir dos dados de `crm_deals` agrupados por stage
- Mostrar os 8 stages reais do banco (nao apenas 5)
- Exibir lista de deals "parados" (sem atividade ha 3+ dias) quando houver deals

### 3. Adicionar CRM ao Realtime Sync

**Arquivo**: `src/hooks/useRealtimeSync.tsx`

- Adicionar `crm_deals`, `crm_contacts` e `crm_stages` ao `TableName` type
- Adicionar mapeamentos em `TABLE_QUERY_MAPPINGS`:
  - `crm_deals` -> invalida `['crm-deals']`, `['dashboard-metrics']`
  - `crm_contacts` -> invalida `['crm-contacts']`
  - `crm_stages` -> invalida `['crm-stages']`

**Migracao SQL**: Habilitar realtime nas 3 tabelas CRM:
```text
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_deals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_stages;
```

### 4. Dialog "Novo Deal" na CRMPage

**Arquivo**: `src/pages/CRMPage.tsx`

- Criar dialog inline com formulario: Titulo, Contato (select de `crm_contacts` existentes ou criar novo), Valor, Temperatura, Origem
- Conectar ao `createDeal` do hook `useCRM`
- O botao "Novo Deal" e o botao "Criar Primeiro Deal" (empty state) ambos abrem o dialog
- Botao "Adicionar" nas colunas Kanban cria deal ja no stage correspondente

### 5. Corrigir filtro de stage no Kanban

**Arquivo**: `src/pages/CRMPage.tsx`

- Usar `stage.key` em vez de `stage.id` ao filtrar deals nas colunas
- Usar `stages` retornados pelo hook (do banco) em vez do fallback `CRM_STAGES`

### 6. Automacao: Deal Fechado gera Projeto + Contrato

**Arquivo**: `src/hooks/useCRM.tsx`

- No `closeDealMutation` com `won = true`, apos mover para 'fechado':
  - Criar projeto em `projects` com dados do deal (titulo, valor, contato)
  - Criar contrato em `contracts` vinculado ao projeto
  - Atualizar o deal com `project_id` do projeto criado
  - Toast com link para o projeto criado

---

## Detalhes Tecnicos

### Tabelas envolvidas
- `crm_deals` (stage_key, value, score, contact_id, project_id) - fonte unica de verdade
- `crm_contacts` (name, company, phone, email)
- `crm_stages` (key, title, color, order_index)
- `projects` (destino ao fechar deal)
- `contracts` (criado automaticamente)

### Queries React Query invalidadas em tempo real
- `crm-deals` -> qualquer mudanca em `crm_deals`
- `crm-contacts` -> qualquer mudanca em `crm_contacts`
- `dashboard-metrics` -> mudancas em `crm_deals` (pipeline, forecast, total deals)

### Fluxo de dados integrado
```text
crm_deals (realtime) 
  -> useCRM (React Query) 
  -> CRMPage (Kanban)
  -> useDashboardMetrics (metricas)
  -> Dashboard (cards, pipeline)
```

### Arquivos a modificar
1. `src/hooks/useDashboardMetrics.tsx` - trocar prospect_opportunities por crm_deals
2. `src/components/dashboard/PipelineSection.tsx` - conectar a dados reais
3. `src/hooks/useRealtimeSync.tsx` - adicionar tabelas CRM
4. `src/pages/CRMPage.tsx` - dialog novo deal + corrigir filtro stages
5. `src/hooks/useCRM.tsx` - automacao deal fechado -> projeto + contrato
6. Migracao SQL - habilitar realtime nas tabelas CRM
