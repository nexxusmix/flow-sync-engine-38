
# Pagina de Gerenciamento de Usuarios

## O que sera criado

Uma pagina em `/configuracoes/usuarios` onde o admin pode:
- Ver lista de todos os usuarios com nome, email, avatar, role atual e data de criacao
- Editar o role de cada usuario (admin, comercial, operacao, financeiro)
- Remover contas de usuarios (com confirmacao)

## Estrutura

### 1. Nova pagina: `src/pages/settings/UsersSettingsPage.tsx`

Seguindo o mesmo padrao visual das outras paginas de settings (ex: RolesSettingsPage):
- Header com botao "Voltar" para `/configuracoes`
- Tabela com colunas: Avatar + Nome, Email, Role (com Select editavel), Data de criacao, Acoes
- Botao de alterar role abre um Select inline com as 4 opcoes do enum `app_role`
- Botao de remover usuario com AlertDialog de confirmacao
- Admin nao pode remover a si mesmo
- Protecao: somente admin pode acessar (redirect se nao for admin)

### 2. Rota no App.tsx

Adicionar rota `/configuracoes/usuarios` apontando para `UsersSettingsPage`.

### 3. Edge Function: `delete-user`

Para deletar usuarios do `auth.users` e necessario usar o service role key, que so pode ser usado no backend. A edge function:
- Recebe `user_id` no body
- Valida que o chamador e admin (via `has_app_role`)
- Impede que o admin delete a si mesmo
- Usa `supabase.auth.admin.deleteUser(user_id)` para remover
- O cascade no profiles e user_role_assignments limpa automaticamente

### Detalhes tecnicos

**Consulta de usuarios:** Query em `profiles` com JOIN em `user_role_assignments` para montar a lista. Usa React Query.

**Edicao de role:** UPDATE direto em `user_role_assignments` via Supabase client. Se o usuario nao tem assignment, faz INSERT.

**Delecao:** Chama edge function `delete-user` que usa service role para `auth.admin.deleteUser()`.

**Componentes reutilizados:** DashboardLayout, Table, Select, AlertDialog, Avatar, Badge, Button, toast (sonner).
