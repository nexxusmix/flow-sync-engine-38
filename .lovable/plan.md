
# Plano: Finalizar Modulos Parciais - Integracao 100% Supabase

## Resumo Executivo

Finalizar Projetos (70% -> 100%), Dashboard (60% -> 100%), CRM (30% -> 100%) e Calendario (50% -> 100%) removendo mocks e integrando com dados reais no Supabase.

---

## FASE 1: MIGRACAO DE BANCO DE DADOS

### 1.1 Criar tabela `projects` (CORE)

```text
projects
+------------------+----------------------------------------+
| Campo            | Tipo                                   |
+------------------+----------------------------------------+
| id               | uuid pk default gen_random_uuid()      |
| workspace_id     | text default 'default'                 |
| name             | text not null                          |
| client_name      | text not null                          |
| description      | text null                              |
| template         | text null                              |
| status           | text check (active/paused/completed/   |
|                  | archived) default 'active'             |
| stage_current    | text not null default 'briefing'       |
| health_score     | int default 100                        |
| contract_value   | numeric default 0                      |
| has_payment_block| boolean default false                  |
| start_date       | date null                              |
| due_date         | date null                              |
| owner_id         | uuid references profiles(id)          |
| owner_name       | text null                              |
| created_by       | uuid references profiles(id)          |
| created_at       | timestamptz default now()              |
| updated_at       | timestamptz default now()              |
+------------------+----------------------------------------+
INDEXES: owner_id, status, stage_current
```

### 1.2 Criar tabela `project_stages` (Timeline detalhada)

```text
project_stages
+------------------+----------------------------------------+
| Campo            | Tipo                                   |
+------------------+----------------------------------------+
| id               | uuid pk default gen_random_uuid()      |
| project_id       | uuid references projects(id) CASCADE   |
| stage_key        | text not null                          |
| title            | text not null                          |
| order_index      | int not null                           |
| status           | text check (not_started/in_progress/   |
|                  | done/blocked) default 'not_started'    |
| planned_start    | date null                              |
| planned_end      | date null                              |
| actual_start     | date null                              |
| actual_end       | date null                              |
| created_at       | timestamptz default now()              |
+------------------+----------------------------------------+
UNIQUE: (project_id, stage_key)
```

### 1.3 Adicionar campos ao `calendar_events` (se necessario)

Tabela ja existe com campos adequados. Adicionar:
- `event_type` check in ('meeting','deadline','delivery','task','milestone')
- `project_id` uuid references projects(id) null
- `deal_id` uuid references prospect_opportunities(id) null

### 1.4 RLS Policies

```text
PROJETOS:
- SELECT: authenticated users
- INSERT: admin, operacao
- UPDATE: admin, operacao (own), financeiro (has_payment_block only)
- DELETE: admin only

PROJECT_STAGES:
- SELECT: authenticated users
- INSERT/UPDATE/DELETE: admin, operacao

PROSPECT_OPPORTUNITIES (CRM Deals):
- SELECT: authenticated users
- INSERT/UPDATE/DELETE: admin, comercial

PROSPECT_ACTIVITIES:
- SELECT: authenticated users
- INSERT/UPDATE/DELETE: admin, comercial

CALENDAR_EVENTS:
- SELECT: authenticated users
- INSERT/UPDATE/DELETE: all authenticated
```

---

## FASE 2: PROJETOS (70% -> 100%)

### 2.1 Criar hook `useProjects.tsx`

Novo hook React Query para CRUD completo:

```typescript
- fetchProjects() - lista com filtros
- getProject(id) - detalhe
- createProject(data) - cria + auto-cria stages
- updateProject(id, data) - atualiza
- archiveProject(id) - arquiva
- moveToStage(projectId, stageKey) - move etapa
```

### 2.2 Refatorar `projectsStore.ts`

Manter apenas como cache/UI state:
- selectedProject (para modais)
- filters (filtros ativos)
- viewMode (list/kanban/board/timeline)
- isModalOpen states

Remover:
- projects[] como fonte de verdade
- Todas as funcoes CRUD locais

### 2.3 Atualizar componentes

| Arquivo | Mudancas |
|---------|----------|
| `ProjectsListPage.tsx` | Usar useProjects() |
| `ProjectsDashboard.tsx` | Dados reais |
| `ProjectsTable.tsx` | Dados reais |
| `ProjectsKanban.tsx` | Dados reais + drag-drop |
| `NewProjectModal.tsx` | createProject mutation |
| `EditProjectModal.tsx` | updateProject mutation |

### 2.4 Auto-criar stages no projeto

Ao criar projeto:
1. Buscar stages de `project_stage_settings`
2. Criar registros em `project_stages` para o projeto
3. Criar evento em `calendar_events` para due_date

---

## FASE 3: DASHBOARD (60% -> 100%)

### 3.1 Remover dados hardcoded

Excluir `visualBoardData` completamente.

### 3.2 Criar hook `useDashboardMetrics.tsx`

```typescript
interface DashboardMetrics {
  // Cards
  totalProjectsActive: number;
  projectsAtRisk: number;
  projectsBlocked: number;
  upcomingDeadlines: number;
  
  // Pipeline
  dealsByStage: Record<string, { count: number; value: number }>;
  
  // Visual Board
  projectsByStage: ProjectStageGroup[];
  
  // Timeline 30D
  events30Days: CalendarEvent[];
  
  // Accounts
  projectFinancials: ProjectFinancialSummary[];
}
```

### 3.3 Atualizar Dashboard.tsx

| Secao | Fonte de Dados |
|-------|----------------|
| Metrics Cards | useDashboardMetrics() |
| Visual Board (Kanban) | projects agrupados por stage_current |
| Timeline 30D | calendar_events dos proximos 30 dias |
| Visao de Contas | revenues + contracts por projeto |
| Key Metrics | Calculos reais |

### 3.4 Empty States

Se nenhum projeto: mostrar CTA "Criar Primeiro Projeto"
Se nenhum deal: mostrar CTA "Criar Primeiro Deal"

---

## FASE 4: CRM (30% -> 100%)

### 4.1 Usar tabelas existentes

O Supabase ja tem:
- `prospects` -> Contatos
- `prospect_opportunities` -> Deals
- `prospect_activities` -> Atividades

### 4.2 Criar hook `useCRM.tsx`

```typescript
// Deals (prospect_opportunities)
- fetchDeals(filters) 
- createDeal(data)
- updateDeal(id, data)
- moveDealToStage(dealId, stage) // para drag-drop
- closeDeal(dealId, won: boolean, linkedProjectId?)

// Contacts (prospects)
- fetchContacts(filters)
- createContact(data)
- updateContact(id, data)

// Activities (prospect_activities)
- fetchActivities(dealId)
- createActivity(dealId, data)
- completeActivity(activityId)
```

### 4.3 Reescrever CRMPage.tsx

| Funcionalidade | Implementacao |
|----------------|---------------|
| Pipeline Kanban | prospect_opportunities por stage |
| Drag & Drop | updateDeal para mudar stage |
| Filtros | search, stage, owner |
| Modal Novo Deal | Form completo |
| Vista Lista | Tabela alternativa |
| Forecast | SUM(estimated_value) por stage |

### 4.4 Ao fechar deal como "ganho"

Modal pergunta:
- "Criar novo projeto?" -> Abre NewProjectModal
- "Vincular projeto existente?" -> Select de projetos

Atualiza `linked_project_id` no deal.

---

## FASE 5: CALENDARIO UNIFICADO (50% -> 100%)

### 5.1 Criar hook `useCalendar.tsx`

```typescript
// CRUD calendar_events
- fetchEvents(month, year, filters)
- createEvent(data)
- updateEvent(id, data)
- deleteEvent(id)

// Auto-create from projects
- syncProjectDeadlines(projectId)
```

### 5.2 Integracao automatica

Ao criar/atualizar projeto:
- Criar evento tipo 'deadline' para due_date
- Criar eventos tipo 'milestone' para cada stage planned_end

Ao criar reuniao no CRM:
- Criar evento tipo 'meeting' vinculado ao deal_id

### 5.3 Atualizar CalendarPage.tsx

| Feature | Implementacao |
|---------|---------------|
| Vista Mensal | calendar_events real |
| Vista Semanal | Simplificada |
| Lista Proximos | getUpcomingEvents() |
| Filtros | Por tipo, projeto |
| Criar Evento | Modal com form |
| Alertas | Badges hoje/atrasado/em 3d |

### 5.4 Notificacoes MVP

Ao abrir app:
- Se eventos atrasados: toast de alerta
- Badge count no menu

---

## FASE 6: LIMPEZA E MIGRACAO

### 6.1 Arquivos a modificar

| Arquivo | Acao |
|---------|------|
| `projectsStore.ts` | Manter so UI state |
| `projectsMockData.ts` | Remover ou esvaziar |
| `useCalendarEvents.ts` | Reescrever para Supabase |
| `Dashboard.tsx` | Remover visualBoardData |
| `CRMPage.tsx` | Reescrever completo |

### 6.2 Novos arquivos

| Arquivo | Descricao |
|---------|-----------|
| `src/hooks/useProjects.tsx` | CRUD projetos |
| `src/hooks/useCRM.tsx` | CRUD deals/contacts |
| `src/hooks/useCalendar.tsx` | CRUD eventos |
| `src/hooks/useDashboardMetrics.tsx` | Metricas agregadas |
| `src/components/crm/DealModal.tsx` | Modal criar/editar deal |
| `src/components/crm/ContactModal.tsx` | Modal criar/editar contato |

### 6.3 Trigger para updated_at

```sql
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## RESUMO TECNICO

### Migracao SQL (1 grande)

1. Criar `projects` com RLS
2. Criar `project_stages` com RLS
3. Adicionar campos ao `calendar_events`
4. Ajustar RLS em `prospect_opportunities`, `prospect_activities`
5. Criar indexes de performance
6. Criar trigger updated_at

### Arquivos novos (6)

- `useProjects.tsx`
- `useCRM.tsx`
- `useCalendar.tsx`
- `useDashboardMetrics.tsx`
- `DealModal.tsx`
- `ContactModal.tsx`

### Arquivos modificados (10+)

- `projectsStore.ts` (simplificar)
- `Dashboard.tsx` (remover mocks)
- `CRMPage.tsx` (reescrever)
- `CalendarPage.tsx` (integrar)
- `ProjectsListPage.tsx` (integrar)
- `ProjectsDashboard.tsx` (integrar)
- `ProjectsKanban.tsx` (integrar)
- `ProjectsTable.tsx` (integrar)
- `NewProjectModal.tsx` (integrar)
- `useCalendarEvents.ts` (reescrever)

---

## ORDEM DE IMPLEMENTACAO

1. **Migracao DB** - Criar tabelas e RLS
2. **useProjects** - Hook base
3. **Projetos UI** - Integrar componentes
4. **useCRM** - Hook CRM
5. **CRM UI** - Reescrever pagina
6. **useCalendar** - Hook calendario
7. **Calendario UI** - Integrar
8. **Dashboard** - Metricas reais
9. **Limpeza** - Remover mocks

---

## RESULTADO FINAL

- Zero mocks/hardcoded
- Zustand apenas como cache UI
- CRUD real com Supabase
- RLS por role (admin/comercial/operacao/financeiro)
- Empty states premium
- Pronto para producao
