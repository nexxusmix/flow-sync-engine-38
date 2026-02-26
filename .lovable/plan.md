
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
