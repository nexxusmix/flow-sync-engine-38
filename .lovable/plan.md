

## Plano: Arquivar, Limpar Concluídas e Sugestões de Ações do Dia

### 1. Adicionar coluna `archived_at` na tabela `tasks`
- Migration: `ALTER TABLE tasks ADD COLUMN archived_at timestamptz DEFAULT NULL`
- Tarefas com `archived_at IS NOT NULL` ficam ocultas por padrão

### 2. Atualizar `useTasksUnified.tsx`
- Filtrar tarefas com `archived_at IS NULL` no fetch (ou filtrar client-side)
- Adicionar mutation `archiveTask(id)` → seta `archived_at = now()`
- Adicionar mutation `bulkArchiveDone()` → arquiva todas com `status = 'done'`
- Adicionar mutation `bulkDeleteDone()` → deleta todas com `status = 'done'`
- Expor `archivedTasks` separadamente (query com `archived_at IS NOT NULL`)

### 3. Adicionar botões no header da `TasksPage.tsx`
- No toolbar (seção de ferramentas colapsável), adicionar:
  - **"Arquivar Concluídas"** — move todas as `done` para arquivo
  - **"Apagar Concluídas"** — deleta permanentemente (com confirmação via Dialog)
- Ícones: `Archive` e `Trash2` do lucide

### 4. Criar botão "Sugestões do Dia" com IA
- Novo botão no toolbar: **"Plano do Dia"** com ícone `Lightbulb`
- Ao clicar, chama edge function `suggest-daily-plan`
- A edge function:
  - Recebe as tarefas pendentes (título, prioridade, due_date, category, status)
  - Usa Lovable AI (gemini-3-flash-preview) para analisar e sugerir ordem de execução
  - Retorna lista ordenada com justificativa curta para cada
- Exibe resultado em um Dialog/Sheet com as tarefas sugeridas na ordem ideal
- Cada sugestão mostra: posição, título da tarefa, motivo curto
- Botão "Aplicar" move as tarefas sugeridas para status `today` na ordem recomendada

### 5. Edge Function `suggest-daily-plan/index.ts`
- Recebe `{ tasks: [{id, title, priority, due_date, category, status, tags}] }`
- Prompt: analisa urgência, prazos, dependências lógicas e sugere sequência ideal para o dia
- Usa tool calling para retorno estruturado: `[{task_id, position, reason}]`
- Retorna max 8-10 tarefas para o dia

### Detalhes Técnicos
- A coluna `archived_at` permite restaurar tarefas no futuro
- O fetch principal filtra `archived_at IS NULL` para não poluir as views
- Bulk delete usa `supabase.from('tasks').delete().in('id', ids)` para eficiência
- A confirmação de delete usa `AlertDialog` existente no projeto

