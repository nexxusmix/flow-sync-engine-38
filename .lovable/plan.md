
# Pagina de Clientes

Criar uma pagina dedicada e completa para gestao de clientes, substituindo o link atual do sidebar que aponta para `/crm?tab=clients`.

## O que sera criado

### 1. Pagina principal `/clientes` (`src/pages/ClientesPage.tsx`)
- Header com titulo "Clientes", busca e botao "Novo Cliente"
- Cards de metricas no topo: Total de Clientes, Clientes Ativos (com projetos), Valor Total em Contratos, Novos no Mes
- Tabela com todos os contatos da `crm_contacts` mostrando: Nome, Empresa, Email, Telefone, Instagram, Projetos Ativos, Valor Total, Tags, Data de Criacao
- Filtros por busca textual e por tags
- Click na linha abre o detalhe do cliente

### 2. Drawer/Dialog de detalhe do cliente
- Informacoes de contato editaveis (nome, empresa, email, telefone, instagram, notas)
- Abas internas:
  - **Resumo**: dados do cliente e metricas agregadas
  - **Projetos**: lista de projetos vinculados ao cliente (via `projects.client_name`)
  - **Deals**: deals do CRM vinculados (via `crm_deals.contact_id`)
  - **Contratos**: contratos vinculados (via `contracts.client_name`)
  - **Financeiro**: receitas vinculadas aos projetos do cliente

### 3. Dialog de criacao/edicao de cliente
- Formulario com campos: nome, empresa, email, telefone, instagram, notas, tags
- Usa as mutations ja existentes do `useCRM` (createContact, updateContact, deleteContact)

### 4. Atualizacoes no Sidebar e Rotas

- **Sidebar**: Alterar o href de "Clientes" de `/crm?tab=clients` para `/clientes`
- **App.tsx**: Adicionar rota `/clientes` apontando para `ClientesPage`

## Detalhes tecnicos

### Arquivos a criar
- `src/pages/ClientesPage.tsx` - Pagina principal com tabela, metricas e dialogs
- `src/components/clients/ClientDetailDrawer.tsx` - Drawer lateral com abas de detalhe
- `src/components/clients/ClientFormDialog.tsx` - Dialog de criar/editar cliente

### Arquivos a editar
- `src/components/layout/Sidebar.tsx` - Linha 35: mudar href para `/clientes`
- `src/App.tsx` - Adicionar import e rota protegida para `/clientes`

### Dados utilizados (sem alteracoes no banco)
- `crm_contacts` - tabela principal de clientes (ja existe com RLS)
- `crm_deals` - deals vinculados via `contact_id`
- `projects` - projetos vinculados via `client_name` (match por nome)
- `contracts` - contratos vinculados via `client_name`
- `revenues` - receitas vinculadas via `project_id` dos projetos do cliente

### Hooks reutilizados
- `useCRM()` - contacts, createContact, updateContact, deleteContact ja implementados
- Queries adicionais inline para projetos, contratos e receitas do cliente selecionado

### Padrao visual
- Segue o padrao existente: `DashboardLayout`, `glass-card`, tabelas com componentes `Table/*`, badges, chips
- Estilo tipografico: titulos bold uppercase tracking-tighter, labels `font-light`
