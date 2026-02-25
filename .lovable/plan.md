

# Plano MVP — Tarefas Completas (5 Fases)

Cada fase entrega valor independente e pode ser testada antes de avançar.

---

## Fase 1 — Fundação: Subtarefas + Prioridade no Form

**Objetivo:** Completar as duas funcionalidades mais pedidas — checklist visual dentro da tarefa e seletor de prioridade no formulário de criação/edição.

### 1A. Componente `TaskChecklistPanel.tsx` (novo arquivo)

- Consulta `task_checklist_items` por `task_id`
- Lista de itens com checkbox, título editável inline, botão excluir
- Input na base para adicionar novo item (Enter para confirmar)
- Barra de progresso visual: "3/5 concluídas"
- Reordenação por campo `position` (drag opcional, inicialmente manual com setas)
- Realtime via canal Supabase para sincronização

### 1B. Integrar no `TaskEditDrawer.tsx`

- Inserir `TaskChecklistPanel` entre a seção de Descrição e os botões de IA
- Seção colapsável com header "Subtarefas (3/5)"

### 1C. Prioridade no formulário de criação

- No `Dialog` de "Nova Tarefa" em `TasksPage.tsx`, adicionar `Select` de prioridade (Urgente, Alta, Normal, Baixa)
- Mapear para os valores do `TasksBoardView`: `urgent`, `high`, `normal`, `low`
- Alinhar o `TaskEditDrawer` com os mesmos 4 níveis (hoje usa `normal/alta/urgente` — unificar para `urgent/high/normal/low`)

### 1D. Indicador de subtarefas no card do quadro

- No `TasksBoardView.tsx`, exibir mini-barra ou texto "2/4" ao lado do título quando a tarefa tem checklist items
- Requer fetch adicional ou join (avaliar performance)

### Hook `useTaskChecklist.ts` (novo arquivo)

- CRUD para `task_checklist_items`
- Mutations com optimistic updates
- Realtime subscription por `task_id`

---

## Fase 2 — Comentários + Atividade

**Objetivo:** Histórico de contexto e decisões dentro de cada tarefa.

### 2A. Componente `TaskCommentsPanel.tsx` (novo arquivo)

- Lista cronológica de comentários (mais recente embaixo)
- Avatar + nome do autor (via `profiles` table join)
- Timestamps relativos ("há 2h") com `date-fns/formatDistanceToNow`
- Input de texto com botão Enviar
- Design Liquid Glass consistente

### 2B. Integrar no `TaskEditDrawer.tsx`

- Inserir após Subtarefas, seção colapsável "Comentários (4)"
- Auto-scroll para o último comentário

### 2C. Indicador de atividade no card

- Ícone de balão + contador no `TasksBoardView` quando há comentários

### Hook `useTaskComments.ts` (novo arquivo)

- CRUD para `task_comments`
- Join com `profiles` para nome/avatar
- Realtime subscription

---

## Fase 3 — Recorrência + Bulk Actions

**Objetivo:** Eliminar trabalho repetitivo e permitir operações em massa.

### 3A. UI de Recorrência no `TaskEditDrawer.tsx`

- Select: "Repetir: Nunca / Diário / Semanal / Mensal"
- Salva em `recurrence_rule` como string (`daily`, `weekly`, `monthly`)
- Ícone 🔄 no card do quadro quando `recurrence_rule` não é null

### 3B. Edge Function `handle-task-recurrence` (novo)

- Trigger: chamada quando uma tarefa recorrente é marcada como `done`
- Lógica: cria nova tarefa com `due_date` calculada, mesmo título/categoria/tags
- Seta `recurrence_parent_id` para rastrear a cadeia
- Chamada a partir do hook `toggleComplete` no `useTasksUnified`

### 3C. Bulk Actions aprimoradas

- Já existe `TaskBulkActions.tsx` — adicionar:
  - Mover em massa para status
  - Alterar categoria em massa
  - Alterar prioridade em massa
  - Excluir em massa com confirmação
- Checkbox de seleção visível em cada row do `TasksBoardView`

---

## Fase 4 — Vista Calendário + Filtro por Tags + Modo Foco

**Objetivo:** Novas formas de visualizar e interagir com tarefas.

### 4A. Componente `TasksCalendarView.tsx` (novo arquivo)

- Grid mensal com dias
- Tarefas posicionadas no dia do `due_date`
- Click no dia para ver tarefas / criar nova
- Navegação entre meses
- Adicionar como nova tab no `TasksPage` (ícone Calendário já existe mas aponta para Timeline — separar)

### 4B. Filtro por Tags

- No `TasksBoardView`, terceira linha de filtros: chips dinâmicos gerados a partir das tags existentes
- Click para filtrar, click novamente para remover
- Múltiplas tags selecionáveis (AND)

### 4C. Modo Foco refinado

- Já existe `SavedFocusPlans` — adicionar:
  - Fullscreen toggle
  - Timer Pomodoro integrado (já existe `TaskTimer.tsx`)
  - Mostra apenas tarefas de "Hoje" filtradas
  - Celebração (confetti) ao completar todas do dia

---

## Fase 5 — IA Avançada + Integrações

**Objetivo:** Automação inteligente e conexão com outros módulos.

### 5A. Resumo diário por IA

- Edge function `daily-task-summary` usando Lovable AI (Gemini Flash)
- Input: tarefas pendentes, atrasadas, vencendo hoje
- Output: texto resumo em português
- Widget no topo do quadro (dismissable, atualiza 1x por sessão)

### 5B. Auto-priorização por IA

- Botão "Sugerir prioridades" no quadro
- Envia tarefas sem prioridade para IA
- Retorna sugestões que o usuário aceita/rejeita

### 5C. Widget no Dashboard principal

- Mini-lista das 5 tarefas mais urgentes
- Link para a página de tarefas
- Contadores de atrasadas/hoje

### 5D. Vinculação com Projetos

- Adicionar campo opcional `project_id` na tabela `tasks` (migração)
- Select de projeto no formulário de criação
- Filtro por projeto no quadro

---

## Resumo Visual das Fases

```text
Fase 1 ─ Subtarefas UI + Prioridade (4 níveis) ─── [Core]
Fase 2 ─ Comentários + Atividade ───────────────── [Core]
Fase 3 ─ Recorrência + Bulk Actions ────────────── [Automação]
Fase 4 ─ Calendário + Tags + Foco ──────────────── [Visual/UX]
Fase 5 ─ IA Avançada + Integrações ─────────────── [Inteligência]
```

---

## Detalhes Técnicos Transversais

- **Unificação de prioridade:** O `TaskEditDrawer` usa `normal/alta/urgente` e o `TasksBoardView` usa `urgent/high/normal/low`. Fase 1 unifica para `urgent/high/normal/low` em todos os componentes.
- **Limpeza de dados:** Executar `UPDATE tasks SET priority = 'normal' WHERE priority IS NULL` para consistência.
- **Tabelas existentes:** `task_checklist_items` e `task_comments` já estão criadas com RLS e realtime — não precisa migração.
- **Campos de recorrência:** `recurrence_rule` e `recurrence_parent_id` já existem na tabela `tasks`.
- **Edge functions:** Usar Lovable AI (Gemini 2.5 Flash) para resumo diário e auto-priorização — sem necessidade de API key adicional.

---

## Ordem de Implementação Recomendada

Começar pela **Fase 1** (subtarefas + prioridade unificada) pois resolve os gaps mais visíveis com menor risco. Cada fase subsequente pode ser implementada em uma única conversa.

