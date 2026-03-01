

## Diagnóstico Completo do Pipeline de Conteúdo

Existem **duas versões** do Pipeline: a versão legada (`/marketing/pipeline`) e a versão holográfica do Marketing Hub (`/m/conteudos`). Ambas compartilham o mesmo store e banco de dados.

---

### O que FUNCIONA

| Componente | Status |
|---|---|
| **Store Zustand** (`marketingStore`) | CRUD completo, filtros, getters por status |
| **Criar conteúdo** (ambas versões) | Funcional, persiste no banco |
| **Mover status via dropdown** (ambas) | Funcional |
| **Drag & drop** (versão legada) | Funcional |
| **Dialogs de agendamento e publicação** (legada) | Funcionais, salvam `scheduled_at` e `post_url` |
| **Filtro por status** (Hub) | Funcional com pílulas de contagem |
| **Busca** (ambas) | Funcional |
| **Toggle grid/kanban** (Hub) | Funcional |
| **Geração IA via dropdown** (Hub) | Funcional via `generate-content-ai` edge function |
| **Excluir conteúdo** (Hub) | Funcional com confirmação |
| **ContentDetailPage** | Edição completa com tabs, checklist, comentários, assets, IA |

---

### O que está QUEBRADO ou INCOMPLETO

#### 1. Navegação para detalhe do item — ROTA ERRADA (CRÍTICO)
**5 arquivos** navegam para `/marketing/item/${id}`, mas a rota registrada é `/marketing/content/:contentItemId`. Resultado: **clicar em qualquer card do Pipeline leva a página 404**.

Arquivos afetados:
- `PipelinePage.tsx` (linha 383)
- `CalendarPage.tsx` (linha 158)
- `MarketingPage.tsx` (linha 114)
- `IdeasPage.tsx` (linha 263)
- `MarketingDashboard.tsx` (linhas 214, 294, 318, 340)

**Correção**: Trocar todas as ocorrências de `/marketing/item/` para `/marketing/content/`.

#### 2. Kanban do Hub — SEM drag & drop
A versão holográfica (`MkContentsPage`) renderiza cards sem `draggable`. Mover conteúdo entre colunas só é possível via dropdown do menu contextual.

**Correção**: Adicionar `draggable` + `onDragStart`/`onDragEnd` nos cards do Hub e `onDragOver`/`onDrop` nas colunas, similar ao que já funciona na versão legada.

#### 3. Pipeline legado — SEM opção de excluir conteúdo
O `ContentCard` e `KanbanColumn` da versão legada não têm botão de excluir nem passam `onDelete`. Único jeito de deletar é pelo Hub.

**Correção**: Adicionar item "Excluir" no `DropdownMenu` do `ContentCard` com `AlertDialog` de confirmação.

#### 4. Pipeline legado — SEM filtros de canal/pilar/campanha
A UI tem campo de busca mas não expõe filtros visuais por canal, pilar ou campanha (o store suporta todos).

**Correção**: Adicionar barra de filtros com Select para canal, pilar e campanha.

#### 5. Hub Pipeline — Cards não clicáveis para detalhe
Os `PipelineContentCard` não têm `onClick` para navegar ao detalhe do conteúdo. O único jeito de ver/editar é pelo menu contextual.

**Correção**: Adicionar prop `onClick` ao `PipelineContentCard` e navegar para `/marketing/content/${item.id}`.

#### 6. Cores dos stages — Fora da paleta no CONTENT_ITEM_STAGES
`CONTENT_ITEM_STAGES` usa `bg-slate-500`, `bg-purple-500`, `bg-orange-500`, `bg-amber-500`, `bg-emerald-500`, `bg-cyan-500` — cores legadas fora da paleta azul/branco/vermelho.

**Correção**: Padronizar para paleta do sistema (primary, muted, destructive).

#### 7. ContentDetailPage — Cores legadas no badge "Publicado"
Linha 560: `bg-emerald-500/10 border-emerald-500/20 text-emerald-500` hardcoded.

**Correção**: Substituir por `bg-primary/10 border-primary/20 text-primary`.

---

### Plano de Implementação

**Arquivo 1 — Corrigir rotas em 5 arquivos**
Trocar `/marketing/item/` → `/marketing/content/` em: `PipelinePage.tsx`, `CalendarPage.tsx`, `MarketingPage.tsx`, `IdeasPage.tsx`, `MarketingDashboard.tsx`

**Arquivo 2 — `PipelinePage.tsx`**
- Adicionar filtros visuais (canal, pilar, campanha) na toolbar
- Adicionar item "Excluir" no dropdown do ContentCard com AlertDialog

**Arquivo 3 — `MkContentsPage.tsx`**
- Adicionar drag & drop nas colunas kanban (onDragOver/onDrop) e nos cards (draggable)
- Tornar cards clicáveis para navegar ao detalhe

**Arquivo 4 — `PipelineContentCard.tsx`**
- Adicionar prop `onClick` para navegação
- Adicionar `draggable` + handlers de drag

**Arquivo 5 — `src/types/marketing.ts`**
- Padronizar cores do `CONTENT_ITEM_STAGES` para paleta do sistema

**Arquivo 6 — `ContentDetailPage.tsx`**
- Corrigir cor do badge "Publicado" (emerald → primary)

