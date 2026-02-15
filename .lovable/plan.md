

# Correcao: `getClaims is not a function` em 23 Edge Functions

## Problema

Todas as Edge Functions que usam autenticacao estao quebrando com o erro:
```
TypeError: sbAuth.auth.getClaims is not a function
```

A funcao `getClaims()` nao existe na versao do `@supabase/supabase-js` instalada no edge runtime. Isso afeta **23 funcoes** e faz com que qualquer operacao autenticada retorne erro 500.

## Causa Raiz

O metodo `getClaims()` foi documentado mas nunca foi exposto publicamente na API do supabase-js v2. O metodo correto e `getUser()`, que valida o JWT e retorna os dados do usuario.

## Solucao

Substituir `getClaims()` por `getUser()` em todas as 23 funcoes. Existem dois padroes de codigo nas funcoes:

**Padrao A** (14 funcoes) - Usa `sbAuth` com verificacao simples:
```typescript
// ANTES (quebrado):
const { error: authErr } = await sbAuth.auth.getClaims(authHeader.replace("Bearer ", ""));
if (authErr) return ...

// DEPOIS (corrigido):
const { data: { user }, error: authErr } = await sbAuth.auth.getUser();
if (authErr || !user) return ...
```

**Padrao B** (9 funcoes) - Usa `claimsData` com acesso a `sub`:
```typescript
// ANTES (quebrado):
const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
if (claimsError || !claimsData?.claims) return ...
const userId = claimsData.claims.sub;

// DEPOIS (corrigido):
const { data: { user }, error: userError } = await supabase.auth.getUser();
if (userError || !user) return ...
const userId = user.id;
```

## Funcoes Afetadas (23 total)

### Padrao A — Substituicao simples (14 funcoes):
1. `generate-tasks-from-text` (erro confirmado nos logs)
2. `generate-client-message`
3. `generate-captions`
4. `generate-ideas`
5. `generate-30day-plan`
6. `generate-script`
7. `generate-image`
8. `generate-action-message`
9. `generate-proposal`
10. `creative-studio`
11. `repurpose-project`
12. `ai-fill-materials`
13. `process-project-update`
14. `studio-generate-block`

### Padrao B — Substituicao com userId (9 funcoes):
15. `ai-run`
16. `polo-ai-chat`
17. `polo-ai-execute`
18. `scout-generate-copy`
19. `scout-generate-audio`
20. `scout-approve-send`
21. `agent-approve-whatsapp-send`
22. `prospect-ai-generate`
23. `extract-project-from-document`

## Detalhes Tecnicos

- Nenhuma alteracao de logica de negocio — apenas a chamada de autenticacao muda
- `getUser()` ja usa o header `Authorization` passado na criacao do client, entao nao precisa do token como parametro
- Para funcoes que precisam do `userId`, trocar `claimsData.claims.sub` por `user.id`
- Todas as 23 funcoes serao redeployadas automaticamente apos a edicao

## Impacto

Apos a correcao, TODAS as funcoes de IA, automacao e processamento da plataforma voltarao a funcionar normalmente para usuarios autenticados.
