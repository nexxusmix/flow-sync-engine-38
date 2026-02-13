
# Corrigir Prospeccao 100% — Audio + Automacao + WhatsApp

## Diagnostico

### O que ja existe e funciona:
- **ProspectMessageGenerator**: gera 3 variantes de mensagem WhatsApp com IA (Lovable AI), copiar, enviar via wa.me com deteccao mobile/desktop
- **ProspectAutomations**: motor de regras com toggle, kill switch, aprovacao manual, timeline, notificacoes
- **ProspectCampaignEngine**: planejamento de campanha com IA (cadencia, abordagens A/B/C, risco de spam)
- **ProspectInbox**: lista de leads com dialog para gerar mensagens
- **Edge functions**: `prospect-ai-generate` (Lovable AI) e `prospect-tts` (ElevenLabs)
- **Tabelas**: `prospects`, `prospect_opportunities`, `prospect_activities`, `prospect_lists`, `cadences`, `cadence_steps`, `automation_rules`, `automation_suggestions`, `alerts`, `agent_scout_outputs`, `event_logs`

### Problemas reais encontrados:

1. **Audio ElevenLabs falhando**: o log mostra `401 missing_permissions — text_to_speech`. A API key configurada no secret `ELEVENLABS_API_KEY` nao tem permissao de TTS. Isso e um problema de configuracao da key, nao de codigo.

2. **Audio nao persiste**: o audio e gerado como blob em memoria e perdido ao fechar. Nao salva no storage nem no banco.

3. **Sem tabela `prospect_audio`**: nao existe historico de audios gerados. Precisa criar.

4. **Automacoes sao "locais"**: os toggles de regras (first_contact, silence_followup, etc.) sao hardcoded no frontend (`LOCAL_RULES`) e nao persistem configs como `approveFirst`, `autoSend`, `dailyLimit` no banco.

5. **Timeline incompleta**: mostra apenas `automation_suggestions`, nao inclui atividades, envios WhatsApp, audios gerados.

6. **WhatsApp funciona mas nao registra**: o botao abre wa.me corretamente mas nao grava evento em `event_logs` nem cria follow-up automatico.

---

## Plano de Implementacao

### Fase 1: Corrigir ElevenLabs + Persistencia de Audio

**1.1 Reconectar ElevenLabs**
- A API key atual nao tem permissao `text_to_speech`. O usuario precisara reconectar com uma key que tenha essa permissao via o conector ElevenLabs.

**1.2 Criar tabela `prospect_audio`**
- Colunas: `id`, `prospect_id`, `opportunity_id`, `campaign_id`, `script_text`, `voice_id`, `audio_url`, `duration_seconds`, `status` (processing/ready/error), `trace_id`, `error_message`, `idempotency_key`, `created_at`, `updated_at`
- RLS: usuario autenticado pode ler/inserir/atualizar

**1.3 Refatorar `prospect-tts` edge function**
- Apos gerar o audio com ElevenLabs, salvar o MP3 no bucket `scout-audio`
- Inserir registro em `prospect_audio` com `audio_url` e `status: ready`
- Retornar JSON `{ audio_url, duration, trace_id }` em vez de binary
- Adicionar `idempotency_key` para evitar duplicatas

**1.4 Refatorar `ProspectMessageGenerator` (audio section)**
- Gerar `idempotency_key` por clique (prospect_id + timestamp)
- Mostrar estados: idle -> gerando -> pronto/erro
- Ao receber `audio_url`, usar a URL publica do storage (nao blob)
- Historico de audios: listar audios anteriores do prospect
- Botao "Tentar Novamente" com retry real
- Botao "Baixar MP3" usa a URL do storage

### Fase 2: Automacao Persistente + Timeline Unificada

**2.1 Persistir configs de automacao**
- Salvar `approveFirst`, `autoSend`, `dailyLimit` na tabela `prospecting_settings` (ja existe)
- Carregar configs ao montar `ProspectAutomations`

**2.2 Timeline unificada**
- Criar query que une:
  - `prospect_activities` (atividades manuais)
  - `automation_suggestions` (acoes IA)
  - `event_logs` (envios, erros)
  - `prospect_audio` (audios gerados)
- Ordenar por data, mostrar com icones por tipo
- Filtros: Todas | Atividades | IA | Envios | Audios

**2.3 Notificacoes de prospeccao**
- Ao completar `runAutomations`, criar alertas em `alerts` para:
  - Follow-up vencido
  - Lead sem contato ha X dias
  - Mensagem pendente de aprovacao
- Badge no sidebar ja conectado ao sistema de alertas existente

### Fase 3: WhatsApp com Registro + Follow-up Automatico

**3.1 Registrar envio no `event_logs`**
- Ao clicar "Enviar WhatsApp", antes de abrir wa.me:
  - Inserir `event_logs` com action: `whatsapp.sent`, entity_type: `prospect`, entity_id
  - Toast confirmando registro

**3.2 Follow-up automatico**
- Apos registrar envio WhatsApp, criar `prospect_activity` tipo `followup`:
  - `due_at`: +3 dias
  - `title`: "Follow-up: [prospect_name]"
  - `description`: "Verificar resposta apos mensagem WhatsApp"

**3.3 Melhorar deteccao de dispositivo**
- Manter logica atual (ja funciona bem):
  - Mobile: `whatsapp://send?phone=...` com fallback `wa.me`
  - Desktop: `wa.me` (abre WhatsApp Web/Desktop)
- Adicionar botao "Copiar" sempre visivel como fallback principal

### Fase 4: Telemetria e Debug

**4.1 trace_id em tudo**
- Gerar `crypto.randomUUID()` no frontend antes de cada chamada
- Passar como header `X-Trace-Id` para edge functions
- Logar no backend com o trace_id
- Mostrar trace_id no toast de erro (copiavel)

**4.2 Estados de botao obrigatorios**
- Todo botao de acao tera: `disabled` quando loading, spinner + label, try/catch + toast erro

---

## Arquivos a criar:
- (nenhum novo componente — refatorar os existentes)

## Arquivos a modificar:
- `supabase/functions/prospect-tts/index.ts` — salvar no storage + retornar JSON
- `src/components/prospecting/ProspectMessageGenerator.tsx` — audio persistente + registro WhatsApp + follow-up
- `src/components/prospecting/ProspectAutomations.tsx` — persistir configs + timeline unificada
- `src/hooks/useProspectAI.ts` — ajustar `generateAudio` para novo formato de resposta
- `src/index.css` — nenhuma mudanca

## Migracao SQL:
- Criar tabela `prospect_audio`
- Habilitar RLS

## Pre-requisito critico:
- **Reconectar ElevenLabs**: a API key atual retorna 401 `missing_permissions` para `text_to_speech`. O usuario precisa gerar uma nova key com permissao TTS no painel ElevenLabs e reconectar.

## Sobre WhatsApp Web QR / API Oficial:
- **WhatsApp Cloud API** requer conta Meta Business verificada + numero empresarial dedicado. Isso esta fora do escopo de implementacao aqui (requer configuracao externa no Meta Business Suite).
- **QR/Session WhatsApp Web** nao sera implementado (instavel, viola ToS Meta, e o proprio usuario reconheceu preferir API oficial).
- O sistema usara **wa.me deep links** (funciona 100% em PC e mobile) + **botao Copiar** como fallback universal. O envio via n8n (ja configurado com `agent-approve-whatsapp-send`) continua disponivel para envios via API quando o webhook estiver ativo.
