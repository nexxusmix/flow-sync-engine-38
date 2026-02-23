

## Migrar toda a plataforma para suas APIs (Gemini + OpenAI)

### Problema
Atualmente, ~16 edge functions chamam diretamente `https://ai.gateway.lovable.dev` usando `LOVABLE_API_KEY`, gastando seus creditos Lovable. Enquanto isso, ~29 outras funcoes ja usam o `_shared/ai-client.ts` que faz fallback Gemini -> OpenAI -> Lovable.

### Solucao
Duas mudancas principais:

**1. Remover Lovable como fallback no ai-client.ts**
- Alterar a ordem dos providers para: Gemini -> OpenAI (sem Lovable)
- Manter Lovable apenas como ultimo recurso opcional (se as duas falharem)
- Isso garante que as 29 funcoes que ja usam o client compartilhado nunca gastem creditos Lovable

**2. Migrar as ~16 funcoes que chamam o gateway diretamente**
Substituir as chamadas diretas a `ai.gateway.lovable.dev` pelo `chatCompletion()` do `_shared/ai-client.ts`.

Funcoes a migrar:

| Funcao | Complexidade |
|---|---|
| `ai-run/index.ts` | Media - tem tools/structured output |
| `transcribe-media/index.ts` | Baixa - chamada simples com multimodal |
| `extract-project-from-document/index.ts` | Alta - multiplas chamadas, multimodal |
| `extract-contract-from-file/index.ts` | Media - multimodal |
| `generate-image/index.ts` | Especial - usa modelo de imagem com modalities |
| `generate-project-art/index.ts` | Especial - geracao de imagem |
| `generate-logo-variations/index.ts` | Especial - geracao de imagem |
| `generate-alert-whatsapp/index.ts` | Baixa |
| `sync-project-finances/index.ts` | Baixa |
| `auto-update-project/index.ts` | Media - 2 chamadas |
| `prospect-ai-generate/index.ts` | Baixa |
| `scan-contract-signatures/index.ts` | Media - multimodal |
| `scout-generate-copy/index.ts` | Baixa |
| `process-asset/index.ts` | Media - multimodal |
| `generate-action-message/index.ts` | Baixa |
| `creative-studio/index.ts` | A verificar |

### Detalhes tecnicos

**Mudanca no `_shared/ai-client.ts`:**
- Remover `tryLovable` da lista padrao de providers
- Adicionar flag opcional `includeLovableFallback` para casos especificos (ex: geracao de imagem que so funciona no Lovable gateway)

**Padrao de migracao para cada funcao:**
```typescript
// ANTES (direto no gateway)
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
  body: JSON.stringify({ model: "...", messages: [...] })
});

// DEPOIS (via client compartilhado)
import { chatCompletion } from "../_shared/ai-client.ts";
const result = await chatCompletion({
  model: "google/gemini-2.5-flash",
  messages: [...]
});
```

**Caso especial - Geracao de imagem:**
As funcoes `generate-image`, `generate-project-art` e `generate-logo-variations` usam o modelo `google/gemini-3-pro-image-preview` com `modalities: ["image", "text"]`. Esse recurso pode nao estar disponivel na API direta do Gemini da mesma forma. Para esses casos, manteremos o Lovable gateway como fallback especifico.

### Ordem de implementacao
1. Atualizar `_shared/ai-client.ts` - remover Lovable do fallback padrao
2. Migrar funcoes simples (7 funcoes de baixa complexidade)
3. Migrar funcoes multimodais (transcribe, extract, scan - 5 funcoes)
4. Migrar ai-run e auto-update (2 funcoes medias)
5. Tratar funcoes de imagem (3 funcoes - manter gateway como opcao)
6. Deploy de todas as funcoes

### Resultado
- Todas as chamadas de IA usarao suas APIs Gemini/OpenAI diretamente
- Zero consumo de creditos Lovable para funcionalidades de IA
- Lovable gateway so sera usado para geracao de imagem (se necessario)
- Fallback automatico: se Gemini falhar, tenta OpenAI
