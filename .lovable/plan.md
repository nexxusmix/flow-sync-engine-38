
## Expandir o Botão "Novo" com Todas as Funcionalidades da Plataforma

### Contexto atual

O botão "Novo" no topo da aplicação (`QuickActionsMenu.tsx`) atualmente oferece apenas 2 ações:
- Novo Lead
- Nova Proposta

A plataforma possui muito mais fluxos de criação espalhados pelos módulos. O objetivo é centralizar todos eles no botão "Novo" para acesso rápido de qualquer página.

---

### Inventário completo de criações na plataforma

Mapeamento de todas as ações de criação encontradas na base de código:

| Módulo | Ação | Rota de destino |
|---|---|---|
| CRM | Novo Lead (Deal) | `/crm` |
| Comercial | Nova Proposta | `/propostas/:id` |
| Projetos | Novo Projeto (manual) | Abre modal `NewProjectModal` |
| Projetos | Novo Projeto com IA | Abre modal `AIProjectModal` |
| Contratos | Novo Contrato | `/contratos` |
| Tarefas | Nova Tarefa | `/tarefas` |
| Marketing | Novo Conteúdo | `/marketing/pipeline` |
| Marketing | Nova Campanha | `/marketing/campanhas` |
| Studio | Novo Trabalho Criativo | `/marketing/studio` |
| Financeiro | Nova Receita | `/financeiro/receitas` |
| Financeiro | Nova Despesa | `/financeiro/despesas` |

---

### Solução: Menu "Novo" expandido com grupos temáticos

O menu será reorganizado em **grupos visuais** para manter a clareza mesmo com mais itens:

```text
┌─────────────────────────────────┐
│  + NOVO                         │
├─────────────────────────────────┤
│  COMERCIAL                      │
│  👤  Novo Lead                  │
│  📄  Nova Proposta              │
│  📝  Novo Contrato              │
├─────────────────────────────────┤
│  PRODUÇÃO                       │
│  🗂️  Novo Projeto               │
│  ✨  Projeto com IA             │
│  ✅  Nova Tarefa                 │
├─────────────────────────────────┤
│  CONTEÚDO & CRIATIVO            │
│  🎬  Novo Trabalho Criativo     │
│  📱  Novo Conteúdo              │
│  🚀  Nova Campanha              │
├─────────────────────────────────┤
│  FINANCEIRO                     │
│  💰  Nova Receita               │
│  🧾  Nova Despesa               │
└─────────────────────────────────┘
```

---

### Arquitetura da implementação

#### 1. Refatoração de `QuickActionsMenu.tsx`

O componente será expandido para:
- Receber callbacks de criação de projetos (novo e com IA) via props adicionais
- Usar `DropdownMenuLabel` + `DropdownMenuSeparator` para criar grupos visuais
- Usar `useNavigate` internamente para as ações que redirecionam para páginas com estado de modal (ex: `/tarefas?new=true`)
- Manter os modais de Lead e Proposta como estão (inline no Header), pois já funcionam bem

#### 2. Atualização de `Header.tsx`

Passará os novos callbacks para o `QuickActionsMenu`:
- `onNewProject` → abre `NewProjectModal`
- `onNewAIProject` → abre `AIProjectModal`
- Estado dos modais `isNewProjectModalOpen` / `isAIProjectModalOpen` gerenciados localmente no Header ou via `useProjectsStore`

#### 3. Estratégia por tipo de ação

Algumas criações abrem modais inline, outras navegam para a página do módulo e disparam o modal via query param (`?new=true`), pois os modais de criação estão acoplados nas páginas dos módulos:

| Ação | Estratégia |
|---|---|
| Novo Lead | Modal inline no Header (já existe) |
| Nova Proposta | Modal inline no Header (já existe) |
| Novo Projeto | Modal do `useProjectsStore` via `setNewProjectModalOpen(true)` + navegar para `/projetos` |
| Novo Projeto IA | Modal do `useProjectsStore` via `setAIProjectModalOpen(true)` + navegar para `/projetos` |
| Novo Contrato | Navegar para `/contratos?new=true` |
| Nova Tarefa | Navegar para `/tarefas?new=true` |
| Novo Conteúdo | Navegar para `/marketing/pipeline?new=true` |
| Nova Campanha | Navegar para `/marketing/campanhas?new=true` |
| Novo Trabalho Criativo | Navegar para `/marketing/studio` (a página já cria automaticamente) |
| Nova Receita | Navegar para `/financeiro/receitas?new=true` |
| Nova Despesa | Navegar para `/financeiro/despesas?new=true` |

Para as páginas que usam query param `?new=true`, será adicionado um `useEffect` que verifica esse param e abre o dialog de criação automaticamente.

---

### Arquivos a modificar

1. **`src/components/layout/QuickActionsMenu.tsx`** — Expandir com todos os grupos e ações, adicionar `useNavigate`, usar `DropdownMenuLabel` e `DropdownMenuSeparator`, ajustar as props com os novos callbacks
2. **`src/components/layout/Header.tsx`** — Adicionar estado e handlers para os modais de Projeto e Projeto IA, atualizar props passadas ao `QuickActionsMenu`, incluir os componentes `NewProjectModal` e `AIProjectModal`
3. **`src/pages/contracts/ContractsListPage.tsx`** — Adicionar `useEffect` para ler `?new=true` e abrir o modal de novo contrato
4. **`src/pages/TasksPage.tsx`** — Adicionar `useEffect` para ler `?new=true` e abrir o dialog de nova tarefa
5. **`src/pages/marketing/PipelinePage.tsx`** — Adicionar `useEffect` para ler `?new=true` e abrir o dialog de novo conteúdo
6. **`src/pages/marketing/CampaignsPage.tsx`** — Adicionar `useEffect` para ler `?new=true` e abrir o dialog de nova campanha
7. **`src/pages/finance/RevenuesPage.tsx`** — Adicionar `useEffect` para ler `?new=true` e abrir o dialog de nova receita
8. **`src/pages/finance/ExpensesPage.tsx`** — Adicionar `useEffect` para ler `?new=true` e abrir o dialog de nova despesa

---

### Detalhes técnicos do componente expandido

O `QuickActionsMenu` usará:
- `DropdownMenuLabel` para os cabeçalhos de grupo (COMERCIAL, PRODUÇÃO, etc.)
- `DropdownMenuSeparator` entre os grupos
- Ícones específicos por ação (ex: `UserPlus`, `FileText`, `FolderPlus`, `Sparkles`, `CheckSquare`, `Clapperboard`, `Newspaper`, `Megaphone`, `TrendingUp`, `Receipt`)
- Largura do dropdown expandida para `w-56`
- Textos em português, maiúsculas com tracking para manter o visual atual

O menu terá aproximadamente 11 ações organizadas em 4 grupos, com separadores visuais claros entre eles.
