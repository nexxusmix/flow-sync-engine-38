

## Plano: Refinar e Corrigir Fluxo de Prévia IA

### Bugs encontrados

1. **Regenerar não atualiza a prévia** — `TaskAIPreviewPanel` usa `useState(initialTasks)` que só roda na montagem. Quando `onRegenerate` gera novos resultados e `previewTasks` muda no pai, o componente ignora as novas props. Resultado: clicar "Regenerar" não faz nada visível.

2. **Ordem do drag-and-drop perdida ao confirmar** — As tarefas confirmadas não recebem `position` baseada na ordem do drag. A ordem que o usuário definiu arrastando é ignorada no banco.

3. **Sem feedback de loading ao confirmar** — Clicar "Confirmar" não mostra loading; se demorar, o usuário pode clicar de novo.

4. **Prévia não mostra estado vazio** — Se o usuário remover todas as tarefas manualmente, fica uma lista vazia sem feedback.

### Correções

**`TaskAIPreviewPanel.tsx`:**
- Adicionar `useEffect` que sincroniza `initialTasks` → `previewTasks` quando as props mudam (regeneração)
- Adicionar prop `isConfirming` e estado de loading no botão Confirmar
- Mapear `position` na ordem do array ao confirmar (index como position)
- Mostrar mensagem quando lista fica vazia após remoções
- Adicionar `key` baseado no array length para reset automático

**`TasksPage.tsx`:**
- Passar `isConfirming` state ao `TaskAIPreviewPanel`
- Adicionar estado `isConfirmingAI` com loading no `handleConfirmAITasks`

### Arquivos
- `src/components/tasks/TaskAIPreviewPanel.tsx`
- `src/pages/TasksPage.tsx`

