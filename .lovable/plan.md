
# Implementar Checklist de Etapas no Projeto

Atualmente, ao clicar no checkbox de uma etapa na aba "Tarefas", aparece apenas um toast "em breve". A infraestrutura ja existe: a tabela `project_stages` tem campo `status` e o hook `useProjects` ja tem `updateStageMutation`.

## O que sera feito

Conectar o checkbox ao mutation existente para alternar o status da etapa entre `completed` e `not_started` (ou `in_progress`).

---

## Detalhes tecnicos

### Arquivo a editar
- `src/components/projects/detail/tabs/TasksTab.tsx`

### Mudancas
1. Importar `useUpdateStage` (ou usar `updateStageMutation`) do hook `useProjects`
2. Substituir o `handleToggleItem` que exibe toast por uma funcao que chama o mutation:
   - Se status atual = `completed` -> muda para `not_started`
   - Se status atual != `completed` -> muda para `completed` (e preenche `actual_end` com data atual)
3. Adicionar feedback visual com toast de sucesso/erro
4. Adicionar indicadores visuais de datas (planned_start, planned_end) e progresso por etapa
5. Adicionar botao para alternar entre status intermediarios (not_started, in_progress, blocked, completed) via dropdown ou cycle
