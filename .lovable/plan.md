

## Seleção de Tarefas antes do Modo Foco

### O que muda
Adicionar uma etapa intermediária no fluxo do Modo Foco: ao clicar "Modo Foco", em vez de gerar o plano imediatamente, mostrar uma lista de tarefas pendentes com checkboxes para o usuário selecionar quais quer incluir. Só após confirmar a seleção, a IA gera o plano.

### Fluxo
1. Usuário clica "Modo Foco" → abre o modal com lista de tarefas pendentes (todas selecionadas por padrão)
2. Usuário desmarca as que não quer executar agora
3. Clica "Gerar Plano" → envia apenas as selecionadas para a edge function
4. Plano é exibido normalmente

### Implementação

**Arquivo: `src/components/tasks/TaskExecutionGuide.tsx`**

- Adicionar estado `selectedTaskIds: Set<string>` (inicializado com todos os IDs de `pendingTasks`)
- Adicionar estado `showSelection: boolean` para controlar a etapa de seleção
- Quando `showSelection = true`, renderizar lista com checkboxes, botões "Selecionar Todos" / "Limpar" e botão "Gerar Plano (N tarefas)"
- Ao confirmar, chamar `generatePlan` filtrando apenas as tarefas selecionadas
- Agrupar tarefas por categoria para facilitar a seleção
- Mostrar contador de selecionadas vs total

Nenhuma alteração em edge functions ou banco de dados necessária.

