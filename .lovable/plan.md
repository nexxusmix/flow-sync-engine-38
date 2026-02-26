

## Agenda Integrada — Plano de Implementação

### Escopo
Criar uma agenda completa e unificada que merges todos os calendários existentes (projetos, marketing, tarefas, CRM) + permite criação manual de eventos + sync bidirecional com Google Calendar + lembretes automáticos via WhatsApp, email e notificações in-app.

### Arquitetura

```text
┌─────────────────────────────────────────────────────┐
│                  AGENDA UNIFICADA                    │
│  (views: dia / semana / mês + filtros por fonte)     │
├──────────┬──────────┬──────────┬────────────────────┤
│ Projetos │Marketing │ Tarefas  │ Eventos manuais    │
│(existing)│(existing)│(existing)│ (calendar_events)  │
└──────┬───┴──────────┴──────────┴────────┬───────────┘
       │                                  │
       ▼                                  ▼
  Google Calendar Sync              Lembretes Auto
  (Edge Function OAuth)         ┌─────┬──────┬──────┐
  - push events to GCal        │InApp│WhatsApp│Email│
  - pull GCal events            │(DB) │(n8n)  │(EF) │
  └─────────────────────        └─────┴──────┴──────┘
```

### 1. Tabela: event_reminders

Nova tabela para configurar lembretes por evento:
- `id`, `event_id` (FK calendar_events), `remind_at` (timestamp), `channel` (in_app | whatsapp | email), `status` (pending | sent | failed), `sent_at`, `workspace_id`
- RLS: membros do workspace

### 2. Coluna extra em calendar_events

- `google_event_id` (text, nullable) — para sync bidirecional
- `source` (text, default 'manual') — 'manual' | 'project' | 'marketing' | 'task' | 'google'
- `reminder_minutes` (int[], default '{30}') — minutos antes do evento para lembrar

### 3. Edge Function: google-calendar-sync

- OAuth2 flow com Google Calendar API
- Armazena `google_refresh_token` e `google_access_token` na tabela `integration_settings`
- Push: quando um evento é criado/atualizado no Squad Hub, cria/atualiza no Google Calendar
- Pull: busca eventos do Google Calendar e insere no Squad Hub com `source = 'google'`
- Chamada via cron (a cada 15min) ou manual

### 4. Edge Function: send-event-reminders

- Cron job (a cada 5min) que busca lembretes pendentes com `remind_at <= now()`
- Para cada lembrete:
  - `in_app`: insere na tabela `notifications`
  - `whatsapp`: chama webhook n8n (já existente `N8N_WHATSAPP_WEBHOOK_URL`)
  - `email`: usa Lovable AI para gerar email de lembrete e envia via edge function
- Marca como `sent` após envio

### 5. Nova página: /agenda

- Views: Dia, Semana, Mês (toggle)
- Fontes unificadas: merge `useCalendarEvents` + `useCalendar` + eventos Google
- Filtros: por tipo (projeto, tarefa, marketing, reunião, google), por projeto
- Criação rápida de evento com formulário: título, data/hora, tipo, lembrete (minutos antes + canal)
- Detalhes do evento em sidebar/modal com opções de editar, excluir, configurar lembretes
- Badge de sync Google Calendar no header

### 6. UI de Configuração Google Calendar

- Na página de Integrações, transformar card "Em breve" em funcional
- Botão "Conectar Google Calendar" → inicia OAuth flow
- Status de sync + botão "Sincronizar agora"

### Arquivos a Criar
- `src/pages/AgendaPage.tsx` — página principal da agenda unificada
- `src/components/agenda/AgendaWeekView.tsx` — view semanal
- `src/components/agenda/AgendaDayView.tsx` — view diária
- `src/components/agenda/AgendaMonthView.tsx` — view mensal (reutiliza lógica existente)
- `src/components/agenda/EventFormDialog.tsx` — formulário de criação/edição com lembretes
- `src/components/agenda/ReminderConfig.tsx` — configuração de lembretes por canal
- `supabase/functions/google-calendar-sync/index.ts` — sync bidirecional
- `supabase/functions/send-event-reminders/index.ts` — disparo de lembretes

### Arquivos a Modificar
- `src/App.tsx` — rota /agenda
- `src/hooks/useCalendar.tsx` — adicionar suporte a source/google_event_id
- `src/pages/settings/IntegrationsPage.tsx` — ativar card Google Calendar
- `supabase/config.toml` — registrar novas edge functions

### Migrações DB
1. ALTER calendar_events ADD `google_event_id`, `source`, `reminder_minutes`
2. CREATE TABLE `event_reminders`
3. Cron job para `send-event-reminders` (a cada 5min)

### Pré-requisitos
- O Google Calendar OAuth requer credenciais Google Cloud (Client ID + Secret). Será necessário configurar os secrets `GOOGLE_CALENDAR_CLIENT_ID` e `GOOGLE_CALENDAR_CLIENT_SECRET`.

