

# Quadro de Tarefas Unificado

## O que muda

O quadro de tarefas atual separa tudo em 4 colunas (Backlog, Esta Semana, Hoje, Concluído) como cards independentes. Isso vai ser substituído por uma **lista única unificada** onde todas as tarefas aparecem juntas, com badges de status e categoria visíveis em cada card, e filtros no topo.

O design vai seguir o estilo "Liquid Glass" usado nos PDFs exportados: fundo escuro translúcido, bordas sutis, tipografia leve com tracking, badges minimalistas.

## Alterações

### Arquivo: `src/components/tasks/TasksBoardView.tsx` (reescrita completa)

**Remover:**
- Grid de 4 colunas (backlog/week/today/done)
- Cards de coluna com gradientes e ícones separados
- Modal de coluna expandida
- Seletor de coluna mobile

**Novo layout:**
- **Barra de filtros** no topo: chips clicáveis para Status (Todos, Backlog, Esta Semana, Hoje, Concluído) e Categoria (Todos, Operação, Pessoal, Projeto)
- **Contador de resultados** abaixo dos filtros
- **Lista unificada** com todos os tasks em rows estilo "Liquid Glass":
  - Checkbox à esquerda
  - Título + descrição truncada
  - Badge de **status** (colorido conforme coluna antiga)
  - Badge de **categoria** (Operação/Pessoal/Projeto)
  - Tags
  - Data de vencimento (com destaque se vencida)
  - Menu de ações (editar/excluir)
- **Empty state** quando nenhuma tarefa encontrada
- Busca global + IA mantidos no topo

**Design Liquid Glass:**
- Cards: `bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl`
- Hover: `hover:bg-white/[0.05] hover:border-white/[0.12]`
- Badges de status com cores sutis (violet para backlog, blue para semana, amber para hoje, emerald para done)
- Tipografia: `font-light tracking-wider` nos labels, `text-xs uppercase` nos filtros
- Animações com framer-motion (fade-in sequencial)

### Visual dos filtros

```text
┌─────────────────────────────────────────────────────────┐
│ [🔍 Buscar tarefas...]                        [✨ IA]  │
├─────────────────────────────────────────────────────────┤
│ Status: [Todos] [Backlog] [Semana] [Hoje] [Concluído]  │
│ Tipo:   [Todos] [Operação] [Pessoal] [Projeto]         │
├─────────────────────────────────────────────────────────┤
│ 12 tarefas encontradas                                  │
├─────────────────────────────────────────────────────────┤
│ ☐ Criar briefing do cliente    │Semana│ │Operação│ 15mar│
│ ☐ Revisar contrato             │Hoje│   │Pessoal│  14mar│
│ ☑ Enviar proposta ~~riscado~~  │Done│   │Projeto│  ✓12m │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘
```

### Visual de cada task row

```text
┌──────────────────────────────────────────────────────────────┐
│ ☐  Criar briefing completo        [Semana] [Operação]  15mar│
│    Descrição truncada aqui...      #tag1 #tag2         ···  │
└──────────────────────────────────────────────────────────────┘
```

## Detalhes Técnicos

- Filtros controlados por `useState` (statusFilter, categoryFilter)
- `useMemo` para filtrar tasks por status + categoria + busca + IA
- Sorting mantido (recentes, por prazo, alfabética)
- Todas as callbacks existentes mantidas (onEditTask, onToggleComplete, onDeleteTask)
- Mobile: filtros em scroll horizontal, rows mais compactos
- Sem alteração em nenhum outro arquivo - apenas `TasksBoardView.tsx`

