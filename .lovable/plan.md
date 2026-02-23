

## Migrar IA para Gemini Direto + OpenAI com Fallback Automático

### Problema
O saldo do Lovable AI Gateway esgotou, pausando todas as funcionalidades de IA do app (42 edge functions afetadas).

### Solução
Criar um **módulo compartilhado** (`_shared/ai-client.ts`) que roteia chamadas de IA para Gemini direto ou OpenAI, com fallback automático. Todas as 42 edge functions passam a importar desse módulo em vez de chamar `ai.gateway.lovable.dev` diretamente.

### Segredos necessários

Antes de implementar, você precisará adicionar 2 chaves de API:

1. **GEMINI_API_KEY** - Chave do Google AI Studio (https://aistudio.google.com/apikey)
2. **OPENAI_API_KEY** - Chave da OpenAI (https://platform.openai.com/api-keys)

### Arquitetura do Roteamento

```text
Edge Function chama aiClient.chat(...)
        |
        v
  Tenta GEMINI primeiro (gratuito/barato)
        |
   Sucesso? --> retorna resultado
        |
   Falha (429/500/timeout)?
        |
        v
  Tenta OPENAI como fallback
        |
   Sucesso? --> retorna resultado
        |
   Falha? --> retorna erro
```

### Mudanças Técnicas

#### 1. Criar `supabase/functions/_shared/ai-client.ts`

Módulo compartilhado com:
- Mapeamento de modelos Lovable para equivalentes nativos
  - `google/gemini-2.5-flash` --> `gemini-2.5-flash` (API direta Google)
  - `google/gemini-2.5-pro` --> `gemini-2.5-pro`
  - `google/gemini-3-flash-preview` --> `gemini-2.5-flash` (fallback mais próximo)
  - `openai/gpt-5` --> `gpt-4o` (OpenAI)
  - `openai/gpt-5-mini` --> `gpt-4o-mini`
- Função `chatCompletion({ messages, model, tools?, tool_choice?, temperature?, max_tokens? })` que:
  1. Tenta Gemini (via `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`)
  2. Se falhar, tenta OpenAI (`https://api.openai.com/v1/chat/completions`)
  3. Se ambos falharem, tenta Lovable AI como último recurso (caso o saldo volte)
- Logs de qual provedor foi usado

#### 2. Atualizar todas as 42 edge functions

Substituir o padrão atual:
```typescript
// ANTES
const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [...] }),
});
```

Por:
```typescript
// DEPOIS
import { chatCompletion } from "../_shared/ai-client.ts";

const response = await chatCompletion({
  messages: [...],
  model: "gemini-2.5-flash",
  temperature: 0.3,
});
```

A função retorna o mesmo formato de resposta (`choices[0].message.content` ou `tool_calls`), mantendo compatibilidade total.

#### 3. Mapeamento de modelos (Gemini API direta)

A API do Google AI Studio aceita o formato OpenAI-compatible via endpoint `/v1beta/openai/chat/completions`, o que permite manter a mesma estrutura de request/response sem adaptação.

### Arquivos a criar/modificar

| Arquivo | Acao |
|---|---|
| `supabase/functions/_shared/ai-client.ts` | **Criar** -- Modulo de roteamento |
| 42 edge functions em `supabase/functions/*/index.ts` | **Editar** -- Trocar fetch direto por import do ai-client |

### Beneficios

- **Resiliencia**: Se um provedor cair, o outro assume automaticamente
- **Custo otimizado**: Gemini como primario (mais barato), OpenAI como fallback
- **Manutencao centralizada**: Trocar provedor ou adicionar novo exige mudar apenas 1 arquivo
- **Zero breaking changes**: O formato de resposta permanece identico para todo o app

### Ordem de execucao

1. Adicionar segredos `GEMINI_API_KEY` e `OPENAI_API_KEY`
2. Criar `_shared/ai-client.ts`
3. Atualizar as edge functions em lotes (mais criticas primeiro: `ai-run`, `generate-ideas`, `generate-captions`, `creative-studio`, etc.)

