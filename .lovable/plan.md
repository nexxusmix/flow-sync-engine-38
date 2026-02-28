

## Diagnóstico

O sistema de **Automações de Tarefas** é 100% manual:
- O usuário configura regras preenchendo formulários (gatilho, condição, ação)
- Não há geração com IA, nem análise automática do fluxo de trabalho
- Não há execução autônoma das regras — elas apenas existem no banco sem serem processadas

## Plano: Automações com IA Autônoma

### 1. Nova Edge Function `generate-task-automations`
- Recebe prompt do usuário OU tarefas existentes para análise
- A IA analisa padrões de trabalho e gera regras de automação inteligentes
- Usa `google/gemini-2.5-flash` via Lovable AI Gateway com tool calling
- Retorna array de regras estruturadas (trigger_type, condition_json, action_json)
- Exemplo: se detecta muitas tarefas movidas manualmente para "done", sugere automação "ao concluir → adicionar tag #concluído"

### 2. Adicionar "Gerar com IA" ao TaskAutomationManager
- Seção no topo do dialog com input de prompt + botão "Gerar Automações com IA"
- Campo para descrever o tipo de automação (ex: "automações para gestão de prazos", "organizar tarefas por prioridade automaticamente")
- Loading state com Sparkles icon durante geração
- Salva as regras automaticamente no banco ao receber resultado

### 3. Adicionar "Analisar Minhas Tarefas"
- Botão que busca as últimas 50 tarefas do usuário
- Envia para a IA para identificar padrões recorrentes
- A IA gera automações relevantes baseadas no comportamento real do usuário
- Ex: detecta que tarefas com tag #urgente sempre são movidas para "em andamento" → cria regra automática

### 4. Manter formulário manual existente
- O formulário manual continua disponível como alternativa
- As regras geradas pela IA seguem o mesmo formato das manuais

### Detalhes Técnicos

**Edge Function `supabase/functions/generate-task-automations/index.ts`:**
- Mesma estrutura da `generate-task-templates` (já implementada e funcional)
- Tool calling com schema: `{ rules: [{ name, trigger_type, condition_json, action_json }] }`
- Trigger types válidos: `on_status_change`, `on_create`, `on_due_date`
- Action types válidos: `move_to_status`, `set_priority`, `add_tag`

**`src/components/tasks/TaskAutomationManager.tsx`:**
- Adicionar estados `aiPrompt`, `isGeneratingAI`
- Seção com input + botão "Gerar com IA" e botão "Analisar Tarefas"
- Ao receber resultado, salvar cada regra via `createRule`

**`src/hooks/useTaskAutomationRules.ts`:**
- Adicionar função `generateAutomationsAI` que invoca a edge function e salva resultados

**`supabase/config.toml`:**
- Registrar `generate-task-automations` com `verify_jwt = false`

