
# Correcao Completa do Polo AI - Diagnostico e Plano

## PROBLEMAS ENCONTRADOS

### PROBLEMA 1 - CRITICO: Autenticacao quebrada no chat (401)
**Arquivo:** `src/hooks/useAgentChat.tsx` (linhas 247-252 e 512-517)
**Causa:** O frontend envia `Authorization: Bearer ${VITE_SUPABASE_PUBLISHABLE_KEY}` (a chave anonima publica) em vez do token JWT do usuario logado. A edge function `polo-ai-chat` chama `getUser()` que precisa do JWT real do usuario para autenticar.
**Impacto:** TODAS as chamadas ao Polo AI retornam 401, resultando na mensagem "Erro ao processar sua solicitacao."
**Correcao:** Trocar `VITE_SUPABASE_PUBLISHABLE_KEY` por `session.access_token` nas duas chamadas fetch (sendMessage e regeneratePlan).

### PROBLEMA 2 - CRITICO: Criacao de tarefas sempre falha
**Arquivo:** `supabase/functions/polo-ai-execute/index.ts` (funcao `toolCreateTasks`, linhas 241-260)
**Causa:** A funcao tenta inserir `workspace_id` e `project_id` na tabela `tasks`, mas essas colunas NAO EXISTEM. Alem disso, a coluna `user_id` (NOT NULL, sem default) nunca e preenchida.
**Esquema real da tabela `tasks`:**
- `user_id` (uuid, NOT NULL, SEM default) -- obrigatorio, nunca enviado
- `category` (text, NOT NULL, default 'operacao') -- ok, tem default
- `position` (integer, NOT NULL, default 0) -- ok, tem default
- `status` (text, NOT NULL, default 'backlog') -- ok, tem default
- `priority` (text, NOT NULL, default 'normal') -- ok, tem default
- NAO TEM: `workspace_id`, `project_id`
**Impacto:** Toda acao "Criar Tarefas" do Polo AI falha com erro de not-null constraint no `user_id`, e colunas inexistentes geram erro de schema.
**Correcao:** Remover `workspace_id` e `project_id` do insert, adicionar `user_id` (passado como parametro do userId autenticado).

### PROBLEMA 3 - CRITICO: userId nao e propagado ao executor
**Arquivo:** `supabase/functions/polo-ai-execute/index.ts`
**Causa:** O `userId` e recebido do body da requisicao (linha 330) mas nunca e passado para `toolCreateTasks`, `toolCreateContent`, `toolCreateEvent`. Essas funcoes precisam do userId para preencher campos obrigatorios.
**Correcao:** Passar `userId` para todas as funcoes tool que precisam dele.

### PROBLEMA 4 - MEDIO: CORS incompleto no polo-ai-execute
**Arquivo:** `supabase/functions/polo-ai-execute/index.ts` (linha 7)
**Causa:** Headers CORS tem apenas `"authorization, x-client-info, apikey, content-type"`, faltando os headers de plataforma que o cliente Supabase envia (`x-supabase-client-platform`, etc).
**Correcao:** Atualizar para o padrao completo de CORS usado em `polo-ai-chat`.

### PROBLEMA 5 - MEDIO: update_status em projetos usa campo errado
**Arquivo:** `supabase/functions/polo-ai-execute/index.ts` (funcao `toolUpdateStatus`)
**Causa:** A funcao atualiza `status`, mas projetos usam `stage_current` como campo de estágio. O AI pode gerar planos com `update_status` para projetos que nao funcionam corretamente.
**Correcao:** Quando a entidade for `project`, atualizar tambem `stage_current` junto com `status`.

### PROBLEMA 6 - BAIXO: Auto-execucao com indice errado
**Arquivo:** `src/hooks/useAgentChat.tsx` (funcao `autoExecutePlan`, linha 377)
**Causa:** `msgIndex` e `messages.length` no momento da chamada (antes de adicionar user+assistant), mas quando `autoExecutePlan` roda, ja existem 2 mensagens a mais. O `msgIndex + 1` pode apontar para a mensagem errada.
**Correcao:** Usar o indice correto baseado no estado atual das mensagens.

---

## PLANO DE CORRECAO

### Passo 1: Corrigir autenticacao no useAgentChat.tsx
Nas duas chamadas fetch (sendMessage linha 251 e regeneratePlan linha 517), trocar:
```typescript
// ANTES (quebrado):
Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,

// DEPOIS (correto):
Authorization: `Bearer ${session.access_token}`,
```

### Passo 2: Corrigir toolCreateTasks no polo-ai-execute
```typescript
// ANTES (quebrado):
async function toolCreateTasks(supabase, data, workspaceId) {
  const tasks = (data.tasks || []);
  for (const task of tasks) {
    await supabase.from('tasks').insert({
      workspace_id: workspaceId,     // NAO EXISTE
      project_id: data.project_id,   // NAO EXISTE
      title: task.title,
      status: 'todo',                // Default DB e 'backlog'
      // user_id FALTANDO (NOT NULL)
    });
  }
}

// DEPOIS (correto):
async function toolCreateTasks(supabase, data, userId) {
  const tasks = (data.tasks || []);
  for (const task of tasks) {
    await supabase.from('tasks').insert({
      user_id: userId,               // OBRIGATORIO
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'normal',
      due_date: task.due_date || null,
      category: task.category || 'operacao',
      status: task.status || 'backlog',
      tags: task.tags || [],
    });
  }
}
```

### Passo 3: Propagar userId para todas as funcoes tool
Atualizar as chamadas de `toolCreateTasks`, `toolCreateContent`, `toolCreateEvent` e `toolUpsert` para receberem e usarem o `userId` quando necessario.

### Passo 4: Corrigir CORS do polo-ai-execute
Atualizar os headers CORS para incluir todos os headers necessarios:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
```

### Passo 5: Corrigir update_status para projetos
Na funcao `toolUpdateStatus`, quando entity for `project`, atualizar `stage_current` junto com `status` para manter consistencia.

### Passo 6: Corrigir indice do auto-execute
Usar `setMessages` com callback para encontrar o indice correto da mensagem assistant baseado no conteudo/referencia.

---

## Detalhes Tecnicos - Arquivos a Modificar

1. **`src/hooks/useAgentChat.tsx`** - Corrigir Authorization header (2 locais) + corrigir auto-execute index
2. **`supabase/functions/polo-ai-execute/index.ts`** - Corrigir CORS + toolCreateTasks (remover workspace_id/project_id, adicionar user_id) + propagar userId + corrigir update_status para projetos

## Resultado Esperado
Apos as correcoes:
- Chat com Polo AI nao retornara mais 401
- Criacao de tarefas via agente funcionara corretamente
- Atualizacao de status de projetos funcionara
- Todas as acoes do plano de execucao serao executadas sem erros de schema
