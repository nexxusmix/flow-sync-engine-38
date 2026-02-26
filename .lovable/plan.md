

## Plano: Melhorar UX da Seleção de Tarefas no Modo Foco

### Contexto
O `TaskSelectionStep` já existe com funcionalidade básica (selecionar/deselecionar, agrupamento por categoria). Vamos enriquecer a experiência com mais informações visuais e filtros rápidos.

### Melhorias no `TaskSelectionStep.tsx`

1. **Filtros rápidos por status** — Botões para selecionar apenas tarefas "Hoje", "Semana" ou "Urgentes" com um clique
2. **Indicadores visuais de prioridade** — Dot colorido (vermelho=urgente, laranja=alta, azul=normal, cinza=baixa) ao lado de cada tarefa
3. **Data de vencimento visível** — Mostrar due_date quando existir, com destaque em vermelho se atrasada
4. **Busca/filtro por texto** — Campo de busca para encontrar tarefas rapidamente em listas longas
5. **Contagem por categoria** — Mostrar "2/5 selecionadas" no header de cada categoria
6. **Animação suave** — Transição ao marcar/desmarcar para feedback visual mais claro
7. **Botão "Inverter Seleção"** — Atalho para inverter todas as seleções rapidamente

### Arquivo modificado
- `src/components/tasks/TaskSelectionStep.tsx` — Refatorar com filtros, busca, indicadores de prioridade/due_date e contadores por categoria

### Detalhes técnicos
- Adicionar estado `searchQuery` e `statusFilter` para filtros
- Usar `useMemo` para filtrar tarefas por texto e status antes do agrupamento
- Indicador de prioridade via map `{ urgent: 'bg-red-500', high: 'bg-orange-400', normal: 'bg-blue-400', low: 'bg-slate-500' }`
- Comparar `due_date` com `new Date()` para highlight de atrasadas
- Manter compatibilidade total com a interface `TaskSelectionStepProps` existente

