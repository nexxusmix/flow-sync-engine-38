
## Diagnóstico completo

### O que os logs mostram

A função `extract-project-from-document` tem **dois problemas críticos** que causam dados incompletos:

**Problema 1 — Processamento redundante e ineficiente de imagens**

O fluxo atual processa **tanto o PDF quanto 6 imagens das páginas** em sequência:
- PDF (18MB base64) → Gemini extrai 11.558 chars ✅
- Imagem 1 (10.7MB) → retorna apenas 674 chars
- Imagem 2 (11.1MB) → retorna apenas 535 chars
- Imagem 3 (11.4MB) → retorna apenas 463 chars
- Imagem 4 (12.5MB) → retorna apenas 652 chars
- Imagem 5 (10.3MB) → retorna apenas 451 chars
- Imagem 6 (70KB) → retorna apenas 1.337 chars

As imagens de página são imagens enormes (~10MB cada) sendo enviadas para o Gemini via gateway HTTP com o prompt de extração hiper-detalhado, mas o modelo retorna muito pouco por imagem — provavelmente porque cada imagem é tratada isoladamente sem contexto das demais.

**Resultado:** Total de apenas 15.784 chars extraídos, sendo que a maioria (11.558) vem do PDF. As imagens contribuem menos de 4.000 chars combinados apesar de consumirem enorme memória.

**Problema 2 — Chamada de estruturação sem `max_tokens`, usando modelo que trunca**

A segunda chamada de IA (estruturação do projeto) usa `gemini-3-flash-preview` com `tool_choice: function` mas sem `max_tokens` definido. O modelo tem limite padrão baixo para tool calls, causando truncamento do `fullScope` (resultado: apenas 1.194 chars para o escopo de todo o projeto).

---

### Solução

**Mudança 1 — Ignorar as imagens de página quando o PDF já foi extraído com sucesso**

Se o PDF foi processado e retornou conteúdo suficiente (>1.000 chars), as imagens das páginas são redundantes. A função deve pular o loop de imagens nesse caso. As imagens devem ser processadas SOMENTE como fallback quando o PDF falha.

**Mudança 2 — Quando processar imagens, limitar tamanho e usar streaming sequencial**

Para imagens grandes (>3MB base64), reduzir para escala antes de enviar. Imagens de página acima de 3MB devem ser ignoradas ou marcadas como "página visual sem texto detectável".

**Mudança 3 — Aumentar `max_tokens` na chamada de estruturação**

A segunda chamada deve usar `max_tokens: 16000` para garantir que o `fullScope`, `deliverables` e `paymentMilestones` não sejam truncados. Usar `gemini-2.5-flash` que tem maior janela de output para tool calls.

**Mudança 4 — Melhorar o prompt de extração de PDF**

O prompt atual é genérico. Deve incluir instrução explícita para extrair **todos os valores monetários, datas e nomes de entregáveis verbatim**, especialmente para documentos de identidade visual e contratos.

---

### Arquivos a modificar

**`supabase/functions/extract-project-from-document/index.ts`**:

1. Após extrair o PDF com sucesso (>1.000 chars), **pular completamente o loop de imagens**
2. No loop de imagens (fallback), **filtrar imagens >3MB** com aviso em log
3. Na chamada de estruturação: mudar modelo para `gemini-2.5-flash`, adicionar `max_tokens: 16000`
4. Adicionar log do `rawExtractedContent` length para rastrear truncamento

### Fluxo corrigido

```text
ANTES (sempre processa tudo):
PDF (18MB) → 11k chars
+ Imagem 1 (10MB) → 674 chars   ← desnecessário, OOM risk
+ Imagem 2 (11MB) → 535 chars   ← desnecessário
+ ... 4 imagens mais
= 15k chars total → estruturação truncada (max_tokens não definido)
→ fullScope: 1.194 chars ← INCOMPLETO

DEPOIS (PDF prioritário, imagens só como fallback):
PDF (18MB) → 11k chars → sucesso ✅
→ pula imagens (já temos conteúdo suficiente)
= 11k chars → estruturação com max_tokens: 16000
→ fullScope: completo, deliverables: completo ✅
```

Além disso, o log do `extract-visual-assets` ainda mostra OOM — esse arquivo foi reescrito mas pode não ter sido deployado corretamente. O plano inclui verificar e re-deployar.
