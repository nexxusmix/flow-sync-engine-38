

# Dados / Backend — RLS, Mock Migration, Meta API e Google Calendar

## 1. Auditoria RLS — Problemas Encontrados

### Tabelas com `USING (true)` — acesso aberto a qualquer autenticado (23 tabelas)
Essas tabelas usam `qual: true` o que significa que qualquer usuário logado vê TODOS os registros, sem filtro por workspace ou user_id:

| Tabela | Risco |
|--------|-------|
| `action_items`, `ai_outbox`, `alert_actions`, `alert_events`, `alert_rules`, `alerts` | Dados de alertas de outros usuários visíveis |
| `automation_rules`, `automation_suggestions` | Automações de outros workspaces visíveis |
| `client_onboardings`, `onboarding_*` (4 tabelas) | Dados de clientes expostos |
| `playbooks`, `playbook_*` (4 tabelas) | Templates de playbook compartilhados — pode ser intencional |
| `content_assets`, `project_media_items`, `reference_links` | Assets de projetos de outros usuários |
| `billing_addons`, `billing_plans` | OK se forem catálogos públicos |

### Tabelas Instagram com `auth.uid() IS NOT NULL` (sem filtro workspace)
Estas tabelas permitem que qualquer usuário autenticado veja dados de QUALQUER workspace:
- `instagram_automation_rules`, `instagram_campaign_tasks`, `instagram_competitors`, `instagram_connections`, `instagram_mood_items`, `instagram_personas`, `instagram_posts`

**Correção**: Alterar para `is_workspace_member(auth.uid(), workspace_id)` nas tabelas que têm coluna `workspace_id`, ou `auth.uid() = user_id` onde aplicável.

### Ação planejada
- Atualizar ~15 tabelas críticas de `USING (true)` para `is_workspace_member(auth.uid(), workspace_id)` ou `auth.uid() = created_by`
- Atualizar ~7 tabelas Instagram de `auth.uid() IS NOT NULL` para usar `is_workspace_member`
- Manter `billing_plans`/`billing_addons` e `playbooks` como públicas (catálogo)

## 2. Mock Data — Instagram Engine

Não há dados mock hardcoded nos componentes do Instagram Engine. Os componentes já usam tabelas reais (`instagram_campaigns`, `instagram_posts`, etc.). O único problema é o uso extensivo de `as any` (~32 arquivos) para tabelas que **existem** no banco mas **não estão no types.ts gerado** (`instagram_campaign_goals`, `instagram_campaign_templates`). Isso não requer migração de mock — requer apenas regeneração dos types.

**Ação**: Nenhuma migração de dados mock necessária. Forçar regeneração do `types.ts` para incluir tabelas faltantes e eliminar `as any`.

## 3. Instagram/Meta API — End-to-End

A Edge Function `publish-to-instagram` já existe e suporta IMAGE, CAROUSEL e REELS via Graph API v21.0. O hook `useInstagramEngine.ts` já chama `supabase.functions.invoke('publish-to-instagram')`.

**Gaps identificados**:
- **Sem OAuth real com Meta**: A conexão atual é manual (usuário digita username). Falta o fluxo OAuth com Facebook Login para obter `access_token` e `ig_user_id` reais.
- **Sem secrets configurados**: `FACEBOOK_APP_ID` e `FACEBOOK_APP_SECRET` não estão nos secrets.
- **Publish function hardcoda workspace**: Usa `'00000000-0000-0000-0000-000000000000'` fixo.

**Ação planejada**:
- Criar Edge Function `instagram-oauth` com fluxo OAuth Facebook/Instagram (gerar URL, callback, trocar code por token)
- Atualizar UI de conexão Instagram na página de integrações para usar OAuth real
- Solicitar secrets `FACEBOOK_APP_ID` e `FACEBOOK_APP_SECRET` ao usuário
- Corrigir query de workspace hardcoded no publish function

## 4. Google Calendar Sync — UI Incompleta

A Edge Function `google-calendar-sync` está **completa** (OAuth, callback, sync bidirecional, disconnect). A tabela `calendar_events` tem colunas `google_event_id`, `source`, `owner_user_id`. Os secrets `GOOGLE_CALENDAR_CLIENT_ID` e `GOOGLE_CALENDAR_CLIENT_SECRET` **não estão configurados**.

**Gaps na UI**:
- `IntegrationsSettingsPage.tsx` tem o fluxo completo (connect, sync, disconnect)
- `IntegrationsPage.tsx` (outra página) também tem fluxo duplicado
- O calendário principal (`useCalendar.tsx`) não mostra indicação visual de eventos vindos do Google
- Sem botão de "Sincronizar agora" na view do calendário (só na página de integrações)
- Sem auto-sync periódico

**Ação planejada**:
- Adicionar badge "Google" em eventos com `source = 'google'` no calendário
- Adicionar botão "Sincronizar Google" na toolbar do calendário
- Solicitar secrets `GOOGLE_CALENDAR_CLIENT_ID` e `GOOGLE_CALENDAR_CLIENT_SECRET`
- Consolidar as duas páginas de integração duplicadas

---

## Resumo de Execução

1. **Migration SQL**: ~25 políticas RLS a corrigir (15 tabelas `USING(true)` + 7 Instagram `auth.uid() IS NOT NULL`)
2. **Edge Function**: Nova `instagram-oauth` para fluxo Meta OAuth
3. **UI Calendar**: Badge Google + botão sync na toolbar
4. **Secrets necessários**: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`
5. **Consolidação**: Remover duplicação entre `IntegrationsPage` e `IntegrationsSettingsPage`

