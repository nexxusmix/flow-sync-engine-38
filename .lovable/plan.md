
# Plano: Implementacao Real - Auth, Inbox, Knowledge Base, Portal do Cliente

## Visao Geral

Este plano implementa 4 modulos de producao:
1. Autenticacao real via Supabase Auth
2. Inbox unificada com estrutura de dados real
3. Knowledge Base com CRUD completo
4. Portal do Cliente com dados reais

---

## FASE 1: AUTENTICACAO REAL (Supabase Auth)

### 1.1 Migracao de Banco de Dados

```text
NOVAS TABELAS:
+------------------+     +----------------------+
| profiles         |     | user_role_assignments|
+------------------+     +----------------------+
| id (uuid PK)     |     | id (uuid PK)         |
| user_id (FK auth)|     | user_id (uuid FK)    |
| full_name        |     | role (enum)          |
| avatar_url       |     | created_at           |
| created_at       |     +----------------------+
| updated_at       |
+------------------+

ENUM app_role: 'admin' | 'comercial' | 'operacao' | 'financeiro'
```

**RLS Policies:**
- profiles: usuarios leem proprio perfil; admins leem todos
- user_role_assignments: apenas admins podem modificar

**Trigger:** Criar profile automaticamente no signup

### 1.2 Arquivos a Modificar/Criar

| Arquivo | Acao |
|---------|------|
| `src/hooks/useAuth.tsx` | Reescrever para Supabase Auth |
| `src/pages/LoginPage.tsx` | Implementar login/signup/reset |
| `src/pages/AuthPage.tsx` | Nova pagina unificada de auth |
| `src/hooks/useProfile.tsx` | Novo hook para perfil |
| `src/hooks/useUserRole.tsx` | Novo hook para RBAC |
| `src/App.tsx` | Atualizar ProtectedRoute |

### 1.3 Funcionalidades

- Login com email + senha
- Signup com email + senha
- Reset de senha (forgot password)
- Persistencia de sessao (refresh token automatico)
- Logout funcional
- Redirecionamento automatico

---

## FASE 2: INBOX UNIFICADA (MVP)

### 2.1 Migracao de Banco de Dados

```text
+------------------+     +------------------+
| inbox_threads    |     | inbox_messages   |
+------------------+     +------------------+
| id (uuid PK)     |     | id (uuid PK)     |
| workspace_id     |     | thread_id (FK)   |
| channel (enum)   |     | direction (enum) |
| external_thread  |     | text             |
| contact_name     |     | media_url        |
| contact_handle   |     | sent_at          |
| last_message_at  |     | meta (jsonb)     |
| status (enum)    |     +------------------+
| assigned_to (FK) |
| created_at       |
+------------------+

ENUM channel: 'instagram' | 'whatsapp' | 'email'
ENUM direction: 'in' | 'out'
ENUM status: 'open' | 'pending' | 'closed'
```

### 2.2 Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/pages/InboxPage.tsx` | Reescrever com UI real |
| `src/components/inbox/ThreadList.tsx` | Lista de conversas |
| `src/components/inbox/ThreadView.tsx` | Chat view |
| `src/components/inbox/MessageComposer.tsx` | Composer |
| `src/hooks/useInbox.tsx` | Hook para dados |

### 2.3 UI da Inbox

**Layout 2 colunas:**
- Esquerda: lista de conversas com filtros
- Direita: chat view com mensagens

**Funcionalidades:**
- Busca por contato
- Filtro por canal, status, responsavel
- Atribuir conversa
- Marcar pendente/fechar
- Empty state premium se nenhuma integracao

---

## FASE 3: KNOWLEDGE BASE

### 3.1 Migracao de Banco de Dados

```text
+--------------------+     +------------------+
| knowledge_articles |     | knowledge_files  |
+--------------------+     +------------------+
| id (uuid PK)       |     | id (uuid PK)     |
| workspace_id       |     | article_id (FK)  |
| title              |     | file_url         |
| category           |     | created_at       |
| content_md         |     +------------------+
| tags (text[])      |
| is_published       |
| created_by (FK)    |
| created_at         |
| updated_at         |
+--------------------+
```

### 3.2 Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/pages/KnowledgePage.tsx` | Reescrever completamente |
| `src/components/knowledge/ArticleList.tsx` | Lista com busca |
| `src/components/knowledge/ArticleView.tsx` | Visualizacao MD |
| `src/components/knowledge/ArticleEditor.tsx` | Editor MD |
| `src/hooks/useKnowledge.tsx` | Hook para CRUD |

### 3.3 Funcionalidades

- CRUD completo de artigos
- Busca por titulo/conteudo
- Filtro por categoria e tags
- Editor Markdown com preview
- Arquivar artigos (is_published=false)
- Empty state: "Criar primeiro playbook"

---

## FASE 4: PORTAL DO CLIENTE (Real)

### 4.1 Migracao de Banco de Dados

```text
+------------------+     +---------------------+
| portal_links     |     | portal_deliverables |
+------------------+     +---------------------+
| id (uuid PK)     |     | id (uuid PK)        |
| project_id       |     | portal_link_id (FK) |
| share_token      |     | title               |
| is_active        |     | type                |
| expires_at       |     | file_url            |
| created_at       |     | status              |
+------------------+     | visible_in_portal   |
                         | created_at          |
+------------------+     +---------------------+
| portal_comments  |
+------------------+     +------------------+
| id (uuid PK)     |     | portal_approvals |
| deliverable_id   |     +------------------+
| author_name      |     | id (uuid PK)     |
| author_email     |     | deliverable_id   |
| content          |     | approved_by_name |
| timecode         |     | approved_by_email|
| status           |     | approved_at      |
| created_at       |     | notes            |
+------------------+     +------------------+
```

### 4.2 Edge Functions (Acesso Publico Seguro)

| Edge Function | Descricao |
|---------------|-----------|
| `client-portal-access` | GET /shareToken - retorna dados publicos |
| `client-portal-comment` | POST /shareToken/comment |
| `client-portal-approve` | POST /shareToken/approve |

**Seguranca:**
- Cliente NUNCA acessa portal_links diretamente
- Validacao de is_active e expires_at
- Nao expor valores financeiros

### 4.3 Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/pages/ClientPortalPage.tsx` | Reescrever com dados reais |
| `src/components/client-portal/*` | Atualizar para usar API |
| `src/hooks/useClientPortal.tsx` | Hook para edge functions |
| `supabase/functions/client-portal-access/` | Nova edge function |
| `supabase/functions/client-portal-comment/` | Nova edge function |
| `supabase/functions/client-portal-approve/` | Nova edge function |

---

## FASE 5: LIMPEZA E INTEGRACAO

### 5.1 Remocoes

- Remover login hardcoded (matheus.filipe / Math@.13)
- Remover mensagens "Em desenvolvimento"
- Remover dependencias de mock data no projectsStore

### 5.2 Event Logs

Registrar em `event_logs`:
- `user_login`, `user_signup`, `password_reset`
- `thread_opened`, `message_sent`, `thread_assigned`, `thread_closed`
- `article_created`, `article_updated`, `article_archived`
- `portal_visited`, `comment_added`, `approval_granted`

---

## Resumo de Arquivos

### Novos Arquivos (18)
- `src/pages/AuthPage.tsx`
- `src/hooks/useProfile.tsx`
- `src/hooks/useUserRole.tsx`
- `src/hooks/useInbox.tsx`
- `src/components/inbox/ThreadList.tsx`
- `src/components/inbox/ThreadView.tsx`
- `src/components/inbox/MessageComposer.tsx`
- `src/hooks/useKnowledge.tsx`
- `src/components/knowledge/ArticleList.tsx`
- `src/components/knowledge/ArticleView.tsx`
- `src/components/knowledge/ArticleEditor.tsx`
- `src/hooks/useClientPortal.tsx`
- `supabase/functions/client-portal-access/index.ts`
- `supabase/functions/client-portal-comment/index.ts`
- `supabase/functions/client-portal-approve/index.ts`

### Arquivos Modificados (8)
- `src/hooks/useAuth.tsx` (reescrita completa)
- `src/pages/LoginPage.tsx` (substituir por redirect ou reescrita)
- `src/pages/InboxPage.tsx` (reescrita completa)
- `src/pages/KnowledgePage.tsx` (reescrita completa)
- `src/pages/ClientPortalPage.tsx` (reescrita completa)
- `src/App.tsx` (adicionar rotas, atualizar guards)
- `src/components/layout/Header.tsx` (usar perfil real)
- `supabase/config.toml` (novas edge functions)

### Migracoes SQL (1 grande ou multiplas)
- Criar profiles, user_role_assignments
- Criar inbox_threads, inbox_messages
- Criar knowledge_articles, knowledge_files
- Criar portal_links, portal_deliverables, portal_comments, portal_approvals
- Criar has_role() function para RLS
- RLS policies para todas as tabelas

---

## Ordem de Implementacao

1. **Autenticacao** - base para tudo
2. **Knowledge Base** - mais simples, sem dependencias
3. **Inbox** - estrutura pronta, integracao futura
4. **Portal do Cliente** - depende de projetos com dados

---

## Resultado Final

- Zero login hardcoded
- Zero placeholders "Em desenvolvimento"
- Auth real com RBAC
- Inbox estruturada (pronta para integracoes)
- Knowledge Base CRUD completo
- Portal do Cliente funcional com shareToken
- Todas as acoes auditaveis

