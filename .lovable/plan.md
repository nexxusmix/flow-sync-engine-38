
# Adicionar "Excluir" em Toda a Plataforma

## Mapeamento Completo

Auditei todo o codebase. Abaixo, a lista de **todos os locais que precisam de delete** e o status atual:

### JA TEM Delete (OK)
- Projetos (ProjectActionsMenu) -- OK
- Tarefas (TaskEditDrawer, TasksBoard, TasksBoardView) -- OK
- Parcelas financeiras (MilestonesList) -- OK
- Receitas (RevenuesPage) -- OK
- Despesas (ExpensesPage) -- OK
- Contratos financeiros (ContractsPage) -- OK
- Templates de contrato (ContractTemplatesPage) -- OK
- Pacotes criativos (CreativePackagesList) -- OK
- Referencias Instagram (ReferencesPage/ReferenceCard) -- OK
- Library/Assets marketing (LibraryPage) -- OK
- Artigos Knowledge Base (ArticleView) -- OK
- Entregas de proposta (ProposalDetailPage) -- OK
- Entregas do projeto (DeliverablesTab) -- OK
- Cadencia steps (CadencesPage) -- OK

### FALTA Delete (vai ser adicionado)

| # | Modulo | Componente | Entidade | Hook/Store ja tem funcao? |
|---|--------|-----------|----------|--------------------------|
| 1 | Portal Cliente (Admin) | PortalTab.tsx | portal_deliverables (materiais do portal) | Nao -- precisa criar |
| 2 | Portal Cliente (Publico) | PortalMaterialsSection.tsx / PortalDeliverablesPremium.tsx | Materiais (visao do cliente -- nao aplicavel, cliente nao exclui) | N/A |
| 3 | CRM | KanbanCard.tsx | Deals | Sim (useCRM.deleteDeal) -- falta conectar no UI |
| 4 | Calendario | ProjectsCalendar.tsx | Eventos | Sim (useCalendar.deleteEvent) -- falta conectar no UI |
| 5 | Marketing Hub - Conteudos | MkContentsPage.tsx / ContentCard | Content Items | Sim (marketingStore.deleteContentItem) -- falta no UI |
| 6 | Marketing Hub - Assets | MkAssetsPage.tsx | Marketing Assets | Nao -- precisa criar |
| 7 | Marketing Hub - Campanhas | MkCampaignsPage.tsx | Campanhas | Tem delete mas sem confirmacao (AlertDialog) |
| 8 | Portal Admin - Arquivos visiveis | PortalTab.tsx (secao arquivos) | project_files visibilidade | Ja pode tirar visibilidade, delete real nao aplicavel |

---

## Plano de Implementacao (autonomo, um por um)

### 1. Portal Cliente Admin -- Excluir Material (PortalTab.tsx)
- Adicionar botao "Excluir" nos cards de materiais/entregas do portal (secao "Arquivos Visiveis")
- Na secao "Adicionar Material", o material ja adicionado precisa ter opcao de excluir
- Criar funcao `deletePortalDeliverable` que remove de `portal_deliverables` via Supabase
- Adicionar AlertDialog de confirmacao

### 2. CRM -- Excluir Deal (KanbanCard.tsx)
- O botao `MoreVertical` ja existe mas nao abre menu
- Criar DropdownMenu no KanbanCard com opcoes: Editar, Excluir
- Receber `onDelete` prop do KanbanColumn que chama `deleteDeal` do hook useCRM
- Propagar props desde CRMPage -> KanbanColumn -> KanbanCard
- AlertDialog de confirmacao antes de excluir

### 3. Calendario -- Excluir Evento (ProjectsCalendar.tsx)
- Na visualizacao lateral de eventos do dia selecionado, adicionar botao Excluir
- Usar `deleteEvent` do hook useCalendar (ja existe)
- AlertDialog de confirmacao

### 4. Marketing Hub: Conteudos -- Excluir (MkContentsPage.tsx)
- Adicionar DropdownMenu no ContentCard com "Excluir"
- Usar `deleteContentItem` do marketingStore (ja existe)
- AlertDialog de confirmacao

### 5. Marketing Hub: Assets -- Excluir (MkAssetsPage.tsx)
- Adicionar DropdownMenu nos cards de assets com "Excluir"
- Criar handler que deleta do storage + tabela `marketing_assets`
- AlertDialog de confirmacao

### 6. Marketing Hub: Campanhas -- Melhorar UX (MkCampaignsPage.tsx)
- O botao `MoreVertical` ja chama `onDelete` direto sem confirmacao
- Substituir por DropdownMenu com AlertDialog de confirmacao

---

## Detalhes Tecnicos

### Padrao consistente para todos os deletes
Cada componente seguira o mesmo padrao ja usado na plataforma:
1. Icone `Trash2` do lucide-react
2. Texto "Excluir" em vermelho (`text-destructive`)
3. `AlertDialog` com titulo, descricao, botoes Cancelar/Excluir
4. Toast de sucesso apos exclusao
5. Invalidacao de query/refresh do estado

### Arquivos que serao editados
1. `src/components/projects/detail/tabs/PortalTab.tsx` -- adicionar delete nos materiais do portal
2. `src/components/crm/KanbanCard.tsx` -- adicionar DropdownMenu com delete
3. `src/components/crm/KanbanColumn.tsx` -- propagar onDelete
4. `src/pages/CRMPage.tsx` -- passar deleteDeal para o Kanban
5. `src/components/calendar/ProjectsCalendar.tsx` -- adicionar delete nos eventos
6. `src/pages/marketing-hub/MkContentsPage.tsx` -- adicionar delete no ContentCard
7. `src/pages/marketing-hub/MkAssetsPage.tsx` -- adicionar delete nos asset cards
8. `src/pages/marketing-hub/MkCampaignsPage.tsx` -- melhorar com AlertDialog de confirmacao
