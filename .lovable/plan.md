

## Plano: Google Calendar via Login Google Direto

### Situação Atual
- O login com Google já funciona via Lovable Cloud (`lovable.auth.signInWithOAuth("google")`)
- O login gerenciado pelo Lovable Cloud concede apenas escopos básicos (perfil/email) — **não inclui acesso ao Google Calendar**
- Para acessar a API do Google Calendar, é necessário solicitar o escopo `calendar` separadamente

### Abordagem Proposta

Como o OAuth gerenciado do Lovable Cloud não permite adicionar escopos customizados (como Calendar), a solução é:

1. **Login normal** continua via Lovable Cloud (já funciona)
2. **Autorização do Calendar** — um passo adicional transparente:
   - Botão "Autorizar Google Calendar" na página de Integrações
   - Usa `login_hint` com o email do usuário logado para pré-selecionar a mesma conta Google
   - O usuário apenas confirma a permissão de Calendar (1 clique)
   - Tokens são salvos na tabela `calendar_connections`

### O que muda vs. implementação atual

Quase nada na edge function — a lógica já está correta. O que falta:

1. **Secrets**: Adicionar `GOOGLE_CALENDAR_CLIENT_ID` e `GOOGLE_CALENDAR_CLIENT_SECRET` (credenciais do Google Cloud Console)
2. **Callback handler**: Adicionar tratamento do `code` na URL de retorno na IntegrationsPage (receber o código OAuth e trocar por tokens)
3. **Login hint**: Passar o email do usuário logado no fluxo OAuth para ele não precisar escolher a conta novamente

### Pré-requisito obrigatório

Você precisa criar credenciais no [Google Cloud Console](https://console.cloud.google.com):

1. Criar projeto (ou usar existente)
2. Ativar **Google Calendar API**
3. Criar **OAuth Client ID** (tipo: Web Application)
4. Adicionar redirect URI: `https://id-preview--9d65864c-7b5e-4189-b4ef-db2f4852f433.lovable.app/configuracoes/integracoes`
5. Copiar **Client ID** e **Client Secret**

Após criar, eu solicito os secrets e implemento o callback handler + login_hint na edge function e na UI.

### Arquivos a modificar
- `supabase/functions/google-calendar-sync/index.ts` — adicionar `login_hint` no OAuth URL
- `src/pages/settings/IntegrationsPage.tsx` — adicionar handler de callback (captura `code` da URL e troca por tokens)

### Resumo
O fluxo do usuário será: Login com Google (automático) → vai em Integrações → clica "Autorizar Calendar" → confirma permissão (mesma conta, 1 clique) → sync ativo.

