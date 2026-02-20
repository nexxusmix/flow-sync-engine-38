
# Plano Completo de Implementação — O Que Falta

## Diagnóstico Atual

Com base na exploração do código, identifiquei **4 grupos de trabalho**:

---

## Grupo 1 — Bugs Visuais (Glow/Dark/3D)

**Problema:** Os cards de KPI e outros elementos no Dashboard usam `transformStyle: "preserve-3d"` + `perspective: 800` em componentes Framer Motion. Isso cria artefatos visuais (glow escuro, sombras indevidas) em certos browsers e temas.

**Arquivos afetados:**
- `src/components/dashboard/KPICards.tsx` — linha 57
- `src/components/dashboard/MetricCard.tsx` — linha 30
- `src/pages/Dashboard.tsx` — linhas 150 e 214

**Correção:** Remover `transformStyle: "preserve-3d"` e `perspective` dos elementos. Manter o efeito visual usando apenas `y`, `scale` e `rotateX`/`rotateY` sem perspectiva fixa no estilo inline.

---

## Grupo 2 — KPI Cards com Dados Reais

**Problema:** O componente `KPICards.tsx` tem os 6 cards com valores completamente hardcoded em zero (Leads Novos: 0, Respostas: 0, Calls: 0, etc). Os dados existem no banco mas não são conectados.

**Solução:** Criar um hook `useKPIMetrics` que consulta:
- **Leads Novos:** `crm_deals` com `stage_key = 'lead'` criados nos últimos 7 dias
- **Respostas:** `inbox_messages` com `direction = 'inbound'` nos últimos 7 dias
- **Calls:** `calendar_events` com `event_type = 'meeting'` e `start_at > now()`
- **Propostas Enviadas:** `proposals` com `status = 'sent'` nos últimos 30 dias
- **Pagamentos Previstos:** `revenues` com `status = 'pending'` e `due_date <= now() + 7 dias` (soma em BRL)
- **Entregas nos 7 dias:** `calendar_events` com `event_type = 'delivery'` nos próximos 7 dias

O componente `KPICards.tsx` passa a consumir esse hook ao invés de valores fixos.

---

## Grupo 3 — Convite de Usuários por Email

**Problema:** A página `UsersSettingsPage.tsx` permite ver/editar/deletar usuários, mas não tem como convidar novos usuários. O botão "Convidar" não existe.

**Solução completa:**

### 3a. Edge Function `invite-user`
Nova edge function que:
1. Valida que quem está invitando é `admin`
2. Usa `supabase.auth.admin.generateLink({ type: 'invite', email })` para gerar o link de convite
3. Envia email via API de email do Supabase (built-in)

### 3b. UI na `UsersSettingsPage`
- Botão "Convidar Usuário" no header da página
- Dialog com campo de email + seleção de role (admin/comercial/operacao/financeiro)
- Ao confirmar: chama a edge function, toast de sucesso "Convite enviado para [email]"
- A role escolhida é armazenada em `user_role_assignments` quando o usuário aceitar o convite (via trigger existente `handle_new_user` ou pré-reserva)

---

## Grupo 4 — Onboarding Guiado para Novos Usuários

**Problema:** Não existe nenhum fluxo de onboarding. Um novo usuário que faz login pela primeira vez vê o Dashboard completamente vazio sem qualquer orientação.

**Solução:**

### 4a. Detecção de "primeiro acesso"
Hook `useOnboarding` que verifica se existe algum projeto do usuário. Se não houver projetos E o usuário foi criado há menos de 24h → mostra onboarding.

### 4b. Componente `OnboardingDialog`
Um Dialog/Sheet com **3 passos simples**:

**Passo 1 — Workspace**
- Nome da empresa
- Tipo de negócio (Produtora de Vídeo, Agência, Freelancer)
- Salva em `workspace_settings`

**Passo 2 — Primeiro Projeto Demo**
- Pergunta: "Deseja criar um projeto demo para explorar a plataforma?"
- Botão "Sim, criar demo" → chama `seed-demo-user` edge function (já existe)
- Botão "Não, começar do zero"

**Passo 3 — Conclusão**
- Lista as principais seções da plataforma com ícones
- Botão "Entrar na Plataforma"

### 4c. Integração no App
O `OnboardingDialog` é renderizado no `Dashboard.tsx` e controlado pelo hook `useOnboarding`.

---

## Arquivos a Criar/Modificar

### Novos arquivos:
- `supabase/functions/invite-user/index.ts` — Edge Function de convite
- `src/hooks/useKPIMetrics.ts` — Hook com dados reais dos KPIs
- `src/hooks/useOnboarding.ts` — Hook de detecção de primeiro acesso
- `src/components/onboarding/OnboardingDialog.tsx` — Dialog de onboarding

### Arquivos modificados:
- `src/components/dashboard/KPICards.tsx` — Conectar dados reais + remover bug 3D
- `src/components/dashboard/MetricCard.tsx` — Remover `transformStyle: "preserve-3d"`
- `src/pages/Dashboard.tsx` — Remover `transformStyle` + integrar OnboardingDialog
- `src/pages/settings/UsersSettingsPage.tsx` — Adicionar botão + dialog de convite

---

## Sequência de Implementação

```text
1. Corrigir bugs visuais (rápido, sem risco)
   ↓
2. Conectar KPI Cards com dados reais
   ↓
3. Criar edge function invite-user
   ↓
4. Adicionar UI de convite em UsersSettingsPage
   ↓
5. Criar hook useOnboarding + OnboardingDialog
   ↓
6. Integrar onboarding no Dashboard
```

---

## O Que NÃO Está Neste Plano

Os itens abaixo foram deixados de fora intencionalmente pois envolvem integrações externas que requerem credenciais/APIs de terceiros que o usuário ainda não configurou:
- **WhatsApp Business API oficial** — requer conta Meta Business verificada
- **Instagram OAuth real** — requer app aprovado no Meta
- **Stripe** — requer chave de API (existe integração nativa do Lovable mas precisa de decisão)
- **Automações com cron** — requer pg_cron ativado e decisão de frequência

Esses podem ser implementados em uma próxima rodada separada.
