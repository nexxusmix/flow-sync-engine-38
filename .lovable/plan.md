

# IA — Registry, Daily Summary Actions e Dashboard de Consumo

## Situação Atual

- **AI_ACTIONS_REGISTRY** tem apenas 3 ações (`marketing.generateCopy`, `marketing.generateIdeas`, `projects.generateBrief`), mas existem **~60 Edge Functions de IA** que chamam o shared `ai-client.ts` sem registro.
- **Daily Summary** é read-only — gera texto resumo mas não oferece ações executáveis.
- **Dashboard de Governança** (`/ai-governance`) já existe com métricas de `ai_runs` + `ai_usage_events`, mas é voltado para admin/auditoria, não para o usuário ver seus próprios créditos.

## Plano

### 1. Registrar Edge Functions no AI_ACTIONS_REGISTRY

Adicionar definições para as principais categorias de IA que ainda não estão no registry. Isso alimenta o dashboard de governança, histórico e auditoria.

**Novas ações a registrar em `src/ai/actions.ts`:**

| Key | Edge Function | Descrição |
|-----|--------------|-----------|
| `instagram.generateCampaign` | `instagram-ai` (action: generate_campaign) | Gerar estratégia de campanha |
| `instagram.generatePost` | `generate-content-ai` | Gerar conteúdo de post |
| `instagram.abTest` | `instagram-ai` (action: ab_test) | Teste A/B de copy |
| `tasks.dailySummary` | `daily-task-summary` | Resumo diário de tarefas |
| `tasks.suggestPlan` | `suggest-daily-plan` | Plano do dia IA |
| `tasks.refine` | `refine-task-ai` | Refinar tarefa com IA |
| `tasks.detectDuplicates` | `detect-duplicate-tasks` | Detectar duplicatas |
| `projects.extractDocument` | `extract-project-from-document` | Extrair projeto de documento |
| `projects.generateInsights` | `generate-project-insights` | Insights do projeto |
| `contracts.generateText` | `generate-contract-text` | Gerar texto de contrato |
| `contracts.extractFromFile` | `extract-contract-from-file` | Extrair contrato de arquivo |
| `crm.scoreLead` | `score-lead` | Scoring de lead |
| `crm.generateMessage` | `generate-client-message` | Gerar mensagem para cliente |
| `creative.studio` | `creative-studio` | Pacote criativo |
| `creative.storyboard` | `generate-storyboard-ai` | Gerar storyboard |
| `marketing.generate30DayPlan` | `generate-30day-plan` | Plano 30 dias |
| `marketing.generateFromTemplate` | `generate-from-template` | Gerar de template |
| `knowledge.assistant` | `knowledge-assistant` | Assistente de conhecimento |
| `prospecting.generate` | `prospect-ai-generate` | Gerar prospecção |

Também atualizar `ACTION_PROMPTS` e `ACTION_TOOLS` no `ai-run/index.ts` para as novas ações que devem ser roteadas pelo handler unificado.

### 2. Daily Summary — Ações Autônomas

Expandir o componente `TaskAIDailySummary` e a Edge Function `daily-task-summary` para retornar **ações sugeridas** além do texto resumo.

**Mudanças na Edge Function `daily-task-summary`:**
- Adicionar ao prompt que a IA deve retornar um array `suggested_actions` com tipo, label, e dados (ex: `{ type: 'send_message', label: 'Cobrar cliente X', data: { client_id, template } }`)
- Tipos de ações: `send_message` (WhatsApp), `schedule_meeting` (criar evento), `generate_proposal` (gerar proposta), `create_task` (criar tarefa), `mark_done` (concluir tarefa)

**Mudanças no componente `TaskAIDailySummary.tsx`:**
- Renderizar botões de ação abaixo do resumo
- Cada botão executa a ação correspondente (invocar edge function, navegar, ou abrir modal)
- Ícones contextuais por tipo de ação (MessageSquare, Calendar, FileText, CheckCircle)

**Novas Edge Functions / reutilização:**
- `send_message` → reutiliza `generate-alert-whatsapp`
- `schedule_meeting` → cria entrada na tabela de eventos/tarefas com tipo "reunião"
- `generate_proposal` → reutiliza `generate-proposal`
- `create_task` / `mark_done` → operações diretas no Supabase client

### 3. Dashboard de Consumo para o Usuário

Criar uma seção acessível em `/configuracoes` (ou dentro do painel de IA existente) com visão simplificada do consumo pessoal.

**Novo componente `AIUsageDashboardUser.tsx`:**
- Cards: total de chamadas no mês, tokens consumidos, custo estimado
- Gráfico de barras simples (uso diário nos últimos 30 dias)
- Lista das últimas 20 ações executadas com status
- Filtro por `user_id` do usuário logado (diferente do admin que vê tudo)

**Integração:** Adicionar como nova aba ou card na página de configurações ou como sub-rota `/configuracoes/meu-uso-ia`.

---

**Arquivos principais afetados:**
- `src/ai/actions.ts` — ~18 novas definições
- `supabase/functions/daily-task-summary/index.ts` — prompt expandido + actions
- `src/components/tasks/TaskAIDailySummary.tsx` — botões de ação
- Novo: `src/components/settings/AIUsageDashboardUser.tsx`
- `src/pages/settings/` — integração da nova view

