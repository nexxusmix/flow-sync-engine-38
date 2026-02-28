

## Plano: Cirurgia de Hierarquia — Tela de Tarefas

### Diagnóstico aceito
A toolbar tem 11 botões primários competindo entre si. Vamos aplicar progressive disclosure e hierarquia clara.

### Mudanças na `TasksPage.tsx`

**Linha 1 — Navegação de visão** (manter como está)
```
Quadro | Kanban | Timeline | Calendário | Dashboard | Foco | Gantt
```

**Linha 2 — CTA único hero**
- Unir "Nova Tarefa" + "Criar com IA" em **um único botão azul**: `+ Nova Tarefa`
- Ao clicar, abre dropdown com 2 opções: "Criar manualmente" e "Criar com IA ✨"
- Esse é o **único botão azul** da tela

**Linha 3 — Busca + Filtros + Menu Ferramentas**
- Busca (já existe no `TasksBoardView`)
- Botão discreto `⚙ Ferramentas` (outline, canto direito) com dropdown:
  - Análise IA
  - Modo Foco  
  - Sugerir Prioridades
  - Sugerir Prazos
  - Duplicatas
  - Templates
  - Automações
  - Exportar PDF

**Barra contextual (já existe: `TaskBulkActions`)**
- Mover "Selecionar Tudo" para dentro da bulk bar ou como primeiro botão antes da lista (não no topo)
- Adicionar "Selecionar Tudo" como botão discreto na barra de contagem de tarefas (ex: "96 tarefas | Selecionar")
- A bulk bar flutuante já aparece ao selecionar — manter como está

**Resumo do Dia → widget colapsável**
- Reduzir altura/padding do `TaskAIDailySummary`
- Começar colapsado por padrão (mostrar apenas "Resumo do dia ✨" como uma linha clicável)
- Expandir ao clicar
- Cards de métricas (pendentes/atrasadas/vence hoje/concluídas) — reduzir 30% a altura, estilo chip compacto

### Arquivos impactados
- `src/pages/TasksPage.tsx` — remover 9 botões do topo, criar dropdown "Ferramentas", unificar CTA
- `src/components/tasks/TaskAIDailySummary.tsx` — tornar colapsável, reduzir visual

### Resultado visual esperado
```text
┌─────────────────────────────────────────────────────────────┐
│ Minhas Tarefas                                              │
│ 76 pendentes • 20 concluídas                                │
│                                                             │
│ [Quadro|Kanban|Timeline|Calendário|Dashboard|Foco|Gantt]    │
│                                                             │
│                              [⚙ Ferramentas]  [+ Nova Tarefa] │
│                                                             │
│ ✨ Resumo do dia ▸ (colapsado, 1 linha)                     │
│                                                             │
│ [Busca/Filtros — dentro do BoardView como já existe]        │
│                                                             │
│ 96 tarefas  Selecionar | Agrupar: Nenhum  Ordenar: Recentes│
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ □ Snowboard  #suíça #viagem            BACKLOG  PESSOAL│ │
│ │ □ Mountain bike  #suíça #viagem        BACKLOG  PESSOAL│ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

