
# Plano: Polo AI com Persistencia, Memoria e Execucao Autonoma Total

## Diagnostico Atual

### O que existe:
- `AIAssistant.tsx`: Chat com streaming, parse de execution_plan, upload de arquivos
- `polo-ai-chat`: Edge function que faz streaming via Lovable AI Gateway
- `polo-ai-execute`: Edge function que executa planos (search, upsert, link, sync_financial, update_contract_status)
- `agent_runs` / `agent_actions`: Tabelas de auditoria de execucoes
- `ai_runs`: Tabela de auditoria de acoes de IA generica

### Problemas Criticos:
1. **Zero persistencia**: Mensagens vivem em `useState` - fechar o chat perde TUDO
2. **Zero memoria**: Cada conversa comeca do zero, sem contexto de conversas anteriores
3. **Sem conversas multiplas**: Nao existe conceito de "sessoes" ou "threads"
4. **Historico inacessivel**: `agent_runs` grava execucoes mas nao ha UI para consultar
5. **Execucao limitada**: Apenas 5 tools disponiveis (search, upsert, link, update_contract_status, sync_financial) - faltam create_tasks, update_status, attach_file
6. **Sem auto-execucao**: Planos low-risk ainda exigem clique manual em "EXECUTAR TUDO"

---

## Solucao Completa

### 1. Banco de Dados - Tabelas de Conversas

**Nova tabela: `agent_conversations`**
- `id` (uuid, PK)
- `user_id` (uuid, FK profiles)
- `workspace_id` (uuid)
- `title` (text) - gerado automaticamente do primeiro comando
- `summary` (text) - resumo da conversa para memoria
- `is_active` (boolean, default true)
- `created_at`, `updated_at` (timestamptz)

**Nova tabela: `agent_messages`**
- `id` (uuid, PK)
- `conversation_id` (uuid, FK agent_conversations)
- `role` (text: 'user' | 'assistant' | 'system')
- `content` (text)
- `attachments` (jsonb) - arquivos enviados
- `plan_json` (jsonb) - plano de execucao se houver
- `result_json` (jsonb) - resultado da execucao
- `run_id` (uuid, FK agent_runs, nullable)
- `created_at` (timestamptz)

**Nova tabela: `agent_memory`**
- `id` (uuid, PK)
- `user_id` (uuid, FK profiles)
- `workspace_id` (uuid)
- `key` (text) - ex: "preferred_client", "last_project"
- `value` (jsonb) - dado memorizado
- `source_conversation_id` (uuid, nullable)
- `created_at`, `updated_at` (timestamptz)

RLS: Todas restritas por `auth.uid() = user_id`.

### 2. Backend - Edge Function Atualizada

**`polo-ai-chat` atualizado:**
- Receber `conversation_id` (ou criar nova conversa)
- Carregar ultimas N mensagens da conversa do banco
- Carregar memorias relevantes do `agent_memory`
- Injetar contexto de memoria no system prompt
- Apos resposta completa, salvar mensagem do usuario + assistente no banco
- Gerar titulo automatico na primeira mensagem
- Extrair e salvar memorias importantes (nomes de clientes favoritos, preferencias)

**System prompt expandido com:**
- Dados de tabelas disponiveis (lista completa das 80+ tabelas)
- Instrucoes para auto-execucao em low-risk
- Instrucoes para extrair memorias

**`polo-ai-execute` expandido com novas tools:**
- `create_tasks`: Criar tarefas vinculadas a projeto
- `update_status`: Atualizar status de qualquer entidade
- `attach_file`: Upload de arquivo ao storage e vinculacao
- `create_content`: Criar item de conteudo
- `create_event`: Criar evento no calendario
- `send_notification`: Criar notificacao
- `generate_ai`: Disparar geracao de IA (scripts, captions, imagens)

### 3. Frontend - AIAssistant Redesenhado

**Sidebar de conversas:**
- Lista de conversas anteriores (ultimas 20) com titulo e data
- Botao "Nova Conversa"
- Indicador de conversa ativa
- Busca em conversas

**Chat principal:**
- Carrega mensagens da conversa selecionada do banco
- Scroll infinito para historico
- Auto-save de cada mensagem
- Indicador de memoria ativa ("Sei que voce prefere...")

**Auto-execucao:**
- Planos `risk_level: low` executam automaticamente apos streaming
- Planos `risk_level: medium` mostram plano + botao "Executar"
- Planos `risk_level: high` exigem confirmacao explicita

**Memoria visivel:**
- Chip no header mostrando "X memorias ativas"
- Opcao de limpar/editar memorias

### 4. Hook Atualizado

**`useAgentChat` (novo hook unificado):**
- Gerencia conversas (criar, listar, selecionar)
- Gerencia mensagens com persistencia
- Integra execucao automatica
- Carrega e salva memorias

---

## Arquivos a Criar/Modificar

### Banco de Dados
1. **Migracao**: Criar `agent_conversations`, `agent_messages`, `agent_memory` com RLS

### Backend
2. **`supabase/functions/polo-ai-chat/index.ts`**: Reescrever com persistencia, memoria, contexto expandido
3. **`supabase/functions/polo-ai-execute/index.ts`**: Adicionar tools faltantes (create_tasks, update_status, etc.)

### Frontend
4. **Criar `src/hooks/useAgentChat.tsx`**: Hook unificado com persistencia
5. **Reescrever `src/components/ai/AIAssistant.tsx`**: Layout com sidebar de conversas + chat persistido + auto-execucao
6. **Atualizar `src/components/ai/AICommandButton.tsx`**: Manter trigger, ajustar tamanho do painel

### Tipos
7. **Atualizar `src/types/agent.ts`**: Adicionar tipos para Conversation, AgentMessage persistido, Memory

---

## Fluxo Final

```text
Usuario abre Polo AI
  |
  +-- Ve conversas anteriores na sidebar
  |
  +-- Seleciona conversa ou cria nova
  |
  +-- Envia comando: "Crie projeto para Haus Arquitetura"
  |
  +-- Backend carrega:
  |     - Historico da conversa
  |     - Memorias: "Haus Arquitetura = cliente ID xxx"
  |     - Contexto: rota atual, tabelas disponiveis
  |
  +-- IA responde com plano (low-risk)
  |
  +-- Auto-execucao: projeto criado + tarefas + vinculacao
  |
  +-- Mensagens salvas no banco
  |
  +-- Memoria atualizada: "Ultimo projeto criado: Haus v2"
  |
  +-- Usuario fecha chat, abre depois → tudo la
```

## Resultado

- **Persistencia total**: Conversas e mensagens salvas no banco, nunca se perdem
- **Memoria**: Polo AI lembra preferencias, clientes, projetos anteriores
- **Multiplas conversas**: Historico organizado por threads
- **Execucao autonoma**: Low-risk executa sozinho, medium pede 1 clique, high pede confirmacao
- **Tools expandidas**: 12+ acoes disponiveis cobrindo todo o sistema
