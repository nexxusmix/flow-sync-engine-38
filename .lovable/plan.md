
# Task Cards: Modal Popup + IA + Uploads + Grid Backlog

## Resumo

Transformar os cards de tarefa para abrir em um popup modal com animacao premium (escala do card para o centro), adicionar botao "Gerar Plano com IA" no modal, suporte a upload/preview de arquivos, e layout grid 6 colunas para o Backlog.

---

## 1. Novo Componente: TaskDetailModal

Criar `src/components/tasks/TaskDetailModal.tsx` -- um Dialog/overlay customizado que substitui o Sheet lateral atual.

**Animacao:**
- Ao clicar no card, o modal aparece com `framer-motion` usando `scale` de 0.8 para 1.0 + fade-in + backdrop blur
- Ao fechar, anima de volta com scale 1.0 para 0.85 + fade-out
- Backdrop com `bg-black/60 backdrop-blur-md`
- Transicao: spring com stiffness ~300, damping ~25

**Conteudo do modal (tudo que ja existe no TaskEditDrawer, reorganizado):**
- Titulo editavel inline
- Status, Categoria, Prioridade, Datas
- Descricao com acoes de IA (gramatica, refinar, profissional, checklist, estimar %)
- Botao "Gerar Plano de Execucao com IA" (usa o ExecutionPlanPanel existente)
- Secao de Links
- Secao de Arquivos com upload e preview
- Botao Excluir

**Preview de arquivos:**
- Imagens: thumbnail inline com lightbox ao clicar
- PDFs: icone + link para abrir
- Videos: player embed inline com controles nativos
- Links: favicon + titulo clicavel

---

## 2. Secao de Arquivos no Modal

Reutilizar a logica existente do TaskEditDrawer (upload para bucket `project-files`, path `task-attachments/{taskId}/`).

Adicionar preview visual:
- Se `fileType` comeca com `image/`: mostrar `<img>` thumbnail (h-20 rounded)
- Se `fileType` e `video/`: mostrar `<video>` com controls (h-20)
- Se `fileType` e `application/pdf`: icone de PDF com link
- Demais: icone generico com nome do arquivo

---

## 3. IA: Gerar Plano e Acoes

O botao "Gerar Plano de Execucao" ja existe no ExecutionPlanPanel. Sera incluido dentro do modal.

Adicionar tambem um fluxo de "Atualizar com IA":
- Botao que chama a edge function `refine-task-ai` com action `refine`
- Mostra o resultado em um preview antes de aplicar
- Usuario ve o que a IA identificou/corrigiu e clica "Aplicar" ou "Cancelar"

---

## 4. Layout Grid 6 Colunas no Backlog

Quando o `expandedColumn === 'backlog'` no TasksBoardView, renderizar as tarefas em um grid de 6 colunas (`grid-cols-2 md:grid-cols-3 xl:grid-cols-6`) com cards individuais em vez da lista vertical atual.

Cada card no grid tera:
- Checkbox
- Titulo (2 linhas max)
- Descricao truncada
- Badge de categoria
- Tags (max 2)
- Data limite (se houver)

---

## 5. Integracao

**TasksPage.tsx:**
- Substituir `TaskEditDrawer` por `TaskDetailModal`
- Manter a mesma logica de `handleEditTask` / `onUpdate` / `onDelete`

**TasksBoardView.tsx:**
- Clicar em qualquer task row chama `onEditTask` (ja funciona assim)
- Adicionar renderizacao grid quando coluna expandida for `backlog`

**TasksBoard.tsx (kanban):**
- Clicar no card abre o modal em vez do drawer

---

## Detalhes Tecnicos

### Arquivos a criar:
1. `src/components/tasks/TaskDetailModal.tsx` -- Modal principal com animacao framer-motion

### Arquivos a modificar:
1. `src/pages/TasksPage.tsx` -- Trocar TaskEditDrawer por TaskDetailModal
2. `src/components/tasks/TasksBoardView.tsx` -- Grid 6 cols para backlog expandido
3. `src/components/tasks/TasksBoard.tsx` -- Click no card abre modal (ja conectado via onEditTask)

### Dependencias:
- Nenhuma nova -- usa framer-motion (ja instalado), lucide-react, componentes UI existentes

### Banco de dados:
- Nenhuma alteracao -- `attachments` e `links` ja existem como JSONB na tabela tasks

### Edge functions:
- Nenhuma alteracao -- `refine-task-ai` e `generate-execution-plan` ja existem e funcionam
