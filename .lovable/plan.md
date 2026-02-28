

## Plano: Prévia de Tarefas Geradas por IA com Edição e Regeneração

### Problema Atual
Ao clicar "Gerar Tarefas", a IA processa e cria as tarefas diretamente no banco — sem prévia. O usuário não tem chance de revisar, editar, remover ou regenerar antes de confirmar.

### Solução

Adicionar um fluxo de 2 etapas: **Gerar → Prévia → Confirmar/Editar/Regenerar**.

### Mudanças

**1. Criar componente `TaskAIPreviewPanel.tsx`**
- Recebe array de tarefas geradas pela IA (ainda não salvas)
- Exibe cada tarefa como card editável: título (inline edit), descrição, categoria (select), status (select), tags
- Checkbox por tarefa para selecionar/desmarcar quais criar
- Botões: "✓ Confirmar Selecionadas", "↻ Regenerar", "← Voltar"
- Botão de remover individual (X)

**2. Adicionar campo "Prompt de orientação" no Sheet de IA (`TasksPage.tsx`)**
- Campo `guidancePrompt` (textarea pequena, opcional) acima dos selects de categoria/coluna
- Placeholder: "Ex: Priorize tarefas urgentes, ignore itens já feitos..."
- Enviado ao edge function como parâmetro extra

**3. Modificar fluxo em `TasksPage.tsx`**
- `handleGenerateFromAI` deixa de chamar `createTasksFromAI` diretamente
- Em vez disso, salva resultado em estado `previewTasks` e mostra o painel de prévia
- Novo handler `handleConfirmAITasks` cria apenas as tarefas selecionadas
- Botão "Regenerar" chama `handleGenerateFromAI` novamente (mantendo texto/arquivos)

**4. Edge function `generate-tasks-from-text` já aceita `guidancePrompt`**
- Já está implementado no prompt do sistema — só precisa passar do frontend

### Arquivos impactados
- `src/components/tasks/TaskAIPreviewPanel.tsx` — novo componente
- `src/pages/TasksPage.tsx` — adicionar estado de prévia, campo guidance, fluxo 2 etapas

