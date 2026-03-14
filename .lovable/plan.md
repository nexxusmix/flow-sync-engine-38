

# Correção de Bugs — Dependências, Store Zustand e `as any`

## Análise

1. **TaskDependenciesPanel** — já usa `text-primary` e `text-destructive` (linhas 56/58). O bug reportado de `text-amber-400`/`text-emerald-500` **não existe mais**. Porém, `TasksBoardView.tsx` linha 569 tem `border-amber-500/20` (due today) que deve ser `border-primary/20`.

2. **Zustand Store (`tasksStore.ts`)** — `useTasksStore` não é importado em nenhum outro arquivo. É código morto que duplica lógica do `useTasksUnified`. Deve ser removido.

3. **`as any` em hooks de tarefas** — Ocorrências focadas:
   - `useTaskDependencies.tsx` L33: insert cast
   - `useSmartTaskAI.ts` L113: upsert cast
   - `tasksStore.ts`: será deletado inteiramente

## Plano

### 1. Remover `src/stores/tasksStore.ts`
Arquivo inteiro é código morto — não é importado em lugar nenhum.

### 2. Corrigir `TasksBoardView.tsx` L569
`border-amber-500/20` → `border-primary/20`

### 3. Remover `as any` em `useTaskDependencies.tsx` L33
Substituir cast por tipo correto usando `{ task_id: string; depends_on_task_id: string }` sem `as any` — o insert aceita o tipo da tabela.

### 4. Remover `as any` em `useSmartTaskAI.ts` L113
Usar tipo explícito do upsert sem cast forçado — mapear campos para o tipo `Tables<'tasks'>['Insert']`.

### 5. Remover `src/types/tasks.ts` se for duplicação
Verificar se é usado; se duplica `tasksStore.ts` types e não é importado, remover também.

---

4-5 arquivos afetados. Mudanças mecânicas e seguras.

