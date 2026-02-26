
# Plano Ciclo 2 — Evolução do Quadro de Tarefas

## Fase 6 — Drag-and-Drop Vertical + Atribuição a Membros

### 6A. Drag-and-Drop Vertical (reordenar tarefas na lista)
- Instalar `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`
- Refatorar `TasksBoardView.tsx` para usar `SortableContext` + `useSortable`
- Atualizar campo `position` no banco ao soltar
- Animação suave com CSS transforms

### 6B. Atribuição a Membros
- Migração: adicionar `assignee_id UUID REFERENCES profiles(user_id)` na tabela `tasks`
- Componente `TaskAssigneeSelect` com avatar + nome dos membros do workspace
- Integrar no formulário de criação e no `TaskEditDrawer`
- Filtro por responsável no `TasksBoardView`
- Avatar do assignee no card da tarefa

## Fase 7 — Templates de Tarefa

### 7A. Tabela `task_templates`
- Migração: criar tabela com `id, user_id, title, description, category, priority, tags, checklist_items (jsonb), created_at`
- RLS por `user_id`

### 7B. UI de Templates
- Componente `TaskTemplateManager` — listar, criar, editar, excluir templates
- Botão "Criar a partir de template" no dialog de nova tarefa
- Ao aplicar template: preenche campos + cria checklist items automaticamente

## Fase 8 — Dependências entre Tarefas

### 8A. Tabela `task_dependencies`
- Migração: `id, task_id (FK), depends_on_task_id (FK), created_at`
- RLS via join com tasks.user_id
- Constraint: task_id ≠ depends_on_task_id

### 8B. UI de Dependências
- No `TaskEditDrawer`: seção "Depende de" com autocomplete de tarefas
- Indicador visual no card: ícone 🔗 + "Bloqueada por X"
- Alerta ao tentar concluir tarefa com dependências pendentes
- Visualização de cadeia no modal de detalhes

---

## Ordem: Fase 6 → Fase 7 → Fase 8

---

# Plano Ciclo 3 — Subtarefas, Automações, Gantt e Comentários

## Fase 9 — Subtarefas Aninhadas
- Migração: criar tabela `subtasks` (id, task_id FK, title, completed, position, created_at)
- RLS via join com tasks.user_id
- Componente `SubtaskList` com checkbox, reordenação, progresso (ex: 3/5)
- Integrar no `TaskEditDrawer`
- Barra de progresso no card da tarefa

## Fase 10 — Comentários e Atividade
- Migração: criar tabela `task_comments` (id, task_id FK, user_id, content, created_at)
- RLS por user_id do workspace
- Componente `TaskActivityFeed` com comentários + histórico de mudanças
- Integrar no `TaskEditDrawer` como aba ou seção
- Avatar + nome do autor via profiles

## Fase 11 — Visão Gantt / Timeline
- Componente `TaskGanttView` com barras horizontais por tarefa
- Eixo X = dias, Eixo Y = tarefas com due_date
- Linhas de dependência visual (task_dependencies)
- Toggle entre Board / Gantt na TasksPage

## Fase 12 — Automações / Regras
- Migração: criar tabela `task_automation_rules` (id, user_id, trigger_type, condition_json, action_json, enabled, created_at)
- Triggers: on_status_change, on_due_date, on_create
- Actions: move_to_status, set_priority, add_tag, notify
- UI `TaskAutomationManager` para criar/gerenciar regras
- Engine de execução via hook ou edge function

---

## Ordem: Fase 9 → Fase 10 → Fase 11 → Fase 12
