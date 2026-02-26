

## Plano: Refinamento do Modo Foco, Planos Ativos e Execução

### Problemas Identificados

1. **TodayTasksPanel bug**: Filtra por `t.status === 'today'` mas depois verifica `t.status === 'done'` para contar completadas — tarefas completadas saem do filtro `today`, então `completedCount` é sempre 0 e o progresso nunca avança.

2. **Modo Foco (SavedFocusPlans)**: 
   - Planos salvos não permitem marcar tarefas como concluídas interativamente (só exibem estado salvo)
   - Sem forma de retomar/executar um plano ativo (abrir no modo de execução)
   - Timer Pomodoro desconectado dos planos — não sabe qual bloco está ativo

3. **TaskExecutionGuide (modal Modo Foco)**:
   - `completeTask` só marca visualmente (state local) mas não persiste no DB nem atualiza o plano salvo
   - Avanço de blocos automático não funciona (activeBlockIdx nunca muda)
   - Ao salvar plano, `completed_tasks` não é atualizado depois

4. **Planos de Execução individuais (ExecutionPlanPanel)**: Funcionam para gerar/visualizar, mas micro-steps não são checkáveis — sem tracking de progresso real

### Implementação

#### 1. Corrigir TodayTasksPanel (SavedFocusPlans.tsx)
- Usar `tasks.filter(t => t.status === 'today' || (t.status === 'done' && t.completed_at && isToday(parseISO(t.completed_at))))` para incluir tarefas completadas hoje
- Corrigir contagem: filtrar `done` dentro do conjunto correto

#### 2. Tornar planos salvos executáveis (SavedFocusPlans.tsx)
- Adicionar botão "Retomar" em cada plano ativo que abre o modo de execução (reutilizando a UI do TaskExecutionGuide)
- Permitir marcar tarefas como concluídas dentro do plano expandido (checkbox interativo)
- Persistir `completed_tasks` no banco ao marcar/desmarcar
- Sincronizar com `toggleComplete` do useTasksUnified para que a tarefa real também mude de status

#### 3. Corrigir execução no TaskExecutionGuide
- Ao `completeTask`, chamar `onComplete(taskId)` para persistir no DB (já faz) E avançar `activeTaskIdx`
- Quando todas as tarefas de um bloco são concluídas, avançar `activeBlockIdx` automaticamente
- Ao salvar plano, incluir o estado atual de `completedTasks`

#### 4. Tornar micro-steps checkáveis (ExecutionPlanPanel.tsx)
- Adicionar estado local de `checkedSteps: Set<number>` para os micro-steps
- Renderizar cada step com checkbox interativo
- Mostrar progresso visual (ex: 3/5 concluídos)

#### 5. Conectar Pomodoro ao plano ativo
- Quando há um plano em execução, o Pomodoro usa o `duration_minutes` do bloco ativo como duração de sessão (ao invés de fixo 25min)
- Mostrar nome do bloco/tarefa ativa no timer

### Arquivos a Modificar
- `src/components/tasks/SavedFocusPlans.tsx` — fix TodayTasksPanel, planos executáveis, Pomodoro conectado
- `src/components/tasks/TaskExecutionGuide.tsx` — fix avanço automático de blocos, persistência
- `src/components/tasks/ExecutionPlanPanel.tsx` — micro-steps checkáveis

