

# Quadro de Tarefas - Mostrar todas as tarefas individuais

## Problema Atual
Na view "Quadro" (`TasksBoardView`), cada coluna mostra apenas 3 tarefas como preview e um link "+N mais" que expande uma secao abaixo. O usuario quer que **todas** as tarefas aparecam diretamente nos cards das colunas, sem precisar expandir.

## Mudancas

**Arquivo:** `src/components/tasks/TasksBoardView.tsx`

### 1. Mostrar todas as tarefas no card (nao apenas 3)
- Remover o `slice(0, 3)` da lista de tarefas dentro de cada coluna
- Remover o texto "+N mais" 
- Adicionar `max-h` com scroll interno para colunas com muitas tarefas
- Manter os checkboxes, badges de categoria e interacao de click para editar

### 2. Manter header visual (preview area + count circle)
- Manter o header gradient com label colorido (BACKLOG, ESTA SEMANA, etc.)
- Manter os 2 mini-previews no header e o circulo com contagem
- Manter titulo, descricao e CTA no footer do card

### 3. Area de tarefas com scroll
- A lista de tarefas tera `max-h-[200px] overflow-y-auto` para nao estourar o layout
- Cada tarefa mantem: checkbox + titulo + badge de categoria
- Estilo identico ao da referencia

### Detalhes Tecnicos

Na secao de "Mini task list preview" (linha ~232):
- Trocar `preview.slice(0, 3)` por todas as tarefas daquele status
- Remover o bloco `{count > 3 && ...}` que mostra "+N mais"
- Adicionar scroll container: `max-h-[180px] overflow-y-auto custom-scrollbar`
- Usar `tasks.filter(t => t.status === col.key)` em vez de `preview`

