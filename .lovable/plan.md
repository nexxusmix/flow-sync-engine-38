

## Plano: Gestão Dinâmica de Planos no Modo Foco

O objetivo é permitir que um plano salvo seja **editável ao vivo** — acrescentar tarefas, marcar feitas, e regenerar o plano atualizado.

---

### Mudanças

**1. Novo componente `FocusPlanActions` (barra de ações no card expandido)**

Dentro de `SavedFocusPlans.tsx`, adicionar no card expandido (`isExpanded`) uma barra de ações com 3 botões:

- **"+ Adicionar Tarefas"** → abre um mini-modal com `TaskSelectionStep` filtrado (exclui tarefas já no plano). Ao confirmar, as novas tarefas são inseridas no `plan_data` e salvas no banco.
- **"Regenerar Plano"** → chama `generate-execution-blocks` com as tarefas atuais do plano (excluindo as já concluídas + incluindo as novas). Substitui `plan_data` no banco, mantém `completed_tasks`.
- **"Regenerar sem Concluídas"** → mesmo que acima mas remove as tarefas já marcadas como done do input da IA, gerando um plano limpo só com pendentes.

**2. Editar `SavedFocusPlans.tsx`**

- Importar `TaskSelectionStep` e `supabase.functions.invoke`
- Adicionar estados: `addingTasksToPlanId`, `regeneratingPlanId`
- Função `handleAddTasks(planId, newTaskIds)`:
  - Busca tarefas completas do hook `useTasksUnified`
  - Mescla no `plan_data` como um novo bloco temporário "Novas Tarefas"
  - Salva no banco via `supabase.from('saved_focus_plans').update()`
- Função `handleRegenerate(planId, excludeCompleted)`:
  - Coleta todas as tarefas do plano (dos blocos)
  - Se `excludeCompleted`, filtra as que estão em `completed_tasks`
  - Chama `generate-execution-blocks` com a lista atualizada
  - Atualiza `plan_data` no banco, preserva `completed_tasks` (ou limpa se excludeCompleted)
- No `renderPlanCard`, dentro do bloco expandido, renderizar a barra de ações antes dos blocos
- Modal inline (Dialog) para seleção de tarefas ao adicionar

**3. Editar `TaskSelectionStep.tsx`**

- Adicionar prop opcional `excludeIds?: string[]` para ocultar tarefas já presentes no plano
- Filtrar `tasks` no início removendo os IDs excluídos

**4. Nenhuma mudança no edge function** — já aceita qualquer array de tarefas

---

### Fluxo do Usuário

```text
Plano Salvo (expandido)
  ├── [+ Adicionar Tarefas] → modal seleção → tarefas adicionadas ao plano
  ├── [↻ Regenerar] → IA recria plano com todas as tarefas (novas + antigas pendentes)
  └── [↻ Só Pendentes] → IA recria plano ignorando as já concluídas
```

### Arquivos Editados
- `src/components/tasks/SavedFocusPlans.tsx` — lógica principal + UI dos botões
- `src/components/tasks/TaskSelectionStep.tsx` — prop `excludeIds`

