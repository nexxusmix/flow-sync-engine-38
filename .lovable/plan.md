

## Melhorias de UX para Tarefas - Desktop e Mobile

### Problemas Encontrados

A pagina de tarefas funciona bem no desktop, mas tem pontos de melhoria no mobile e em interacoes touch:

1. **Mobile sem otimizacao**: Todos os 4 cards de coluna empilham verticalmente no mobile, forçando muito scroll. O componente Kanban (`TasksBoard`) ja tem um seletor de coluna mobile, mas o Quadro (`TasksBoardView`) nao.
2. **Acoes invisiveis em touch**: Botoes de acao (editar/excluir) usam hover para aparecer, que nao funciona em dispositivos touch.
3. **Modal apertado no mobile**: Header do modal com busca + ordenar fica comprimido em telas menores.
4. **Toolbar com overflow**: Botoes de acao na toolbar podem transbordar em telas entre 768px e 1024px.

### Correcoes Propostas

#### 1. Adicionar seletor de coluna mobile no TasksBoardView

Importar `useIsMobile()` e, quando em mobile, mostrar um seletor horizontal de colunas (igual ao Kanban) em vez de empilhar os 4 cards.

**Arquivo**: `src/components/tasks/TasksBoardView.tsx`
- Importar `useIsMobile` de `@/hooks/use-mobile`
- No mobile: mostrar tabs/botoes horizontais para selecionar coluna, exibindo apenas 1 card por vez
- Manter a funcionalidade de clicar para abrir o modal

#### 2. Corrigir visibilidade de acoes em touch

Trocar `opacity-0 group-hover:opacity-100` para `sm:opacity-0 sm:group-hover:opacity-100` nos botoes de acao, garantindo que fiquem visiveis no mobile.

**Arquivo**: `src/components/tasks/TasksBoardView.tsx`
- `ExpandedTaskRow`: Ajustar classe do botao de acao
- Ou usar `@media (hover: hover)` para detectar suporte a hover

#### 3. Layout responsivo do header do modal

Ajustar o header do modal expandido para empilhar busca e ordenar verticalmente em telas pequenas.

**Arquivo**: `src/components/tasks/TasksBoardView.tsx`
- Trocar `flex items-center` no header por `flex flex-col sm:flex-row`
- Busca e ordenar em linha separada no mobile

#### 4. Toolbar responsiva

Ajustar a toolbar de acoes para esconder botoes menos usados em telas medias.

**Arquivo**: `src/pages/TasksPage.tsx`
- Agrupar botoes secundarios em um dropdown "Mais" em telas menores
- Ou usar `overflow-x-auto` com scroll horizontal

### Resumo de Arquivos

| Arquivo | Mudanca |
|---|---|
| `src/components/tasks/TasksBoardView.tsx` | Seletor de coluna mobile, acoes touch, header responsivo do modal |
| `src/pages/TasksPage.tsx` | Toolbar responsiva |

