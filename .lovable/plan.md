

## Plan: Add pillar constraint and dependency rules to Polo AI system prompt

### What changed and why

Two errors persist in generated plans:
- The AI invents pillar values (e.g. "Institucional", "Expectativa") that violate the `content_items_pillar_check` database constraint.
- The AI uses literal placeholder strings like `"CONTRACT_UUID_FROM_STEP_1"` in `contractId`, which fail because the executor does not resolve cross-step references.

### Changes (single file)

**File:** `supabase/functions/polo-ai-chat/index.ts`

Two blocks will be **appended** to the existing `REGRAS CRITICAS PARA GERACAO DE PLANOS` section (after the `create_tasks` rule, around line 142). Nothing will be removed.

---

**Block 1 -- Pillar whitelist (after line ~142)**

```
### Valores validos para content_items.pillar (OBRIGATORIO)
O campo "pillar" SO aceita estes valores: autoridade, bastidores, cases, oferta, prova_social, educacional.
NUNCA use variantes como "Institucional", "Expectativa", "Branding", "Relacionamento" ou qualquer outro valor inventado.
Se nao tiver certeza do pilar correto, use "educacional" como fallback seguro.
```

**Block 2 -- Dependency / placeholder prohibition (after Block 1)**

```
### Proibicao de placeholders entre steps (OBRIGATORIO)
E PROIBIDO usar placeholders literais no JSON (ex.: "CONTRACT_UUID_FROM_STEP_1", "ID_DO_STEP_ANTERIOR", "uuid-aqui").
O executor NAO resolve referencias entre steps.
- Se o plano incluir upsert contract E sync_financial no mesmo run: OMITA o step sync_financial.
  Em vez disso, adicione ao step create_tasks uma task extra com title "Sincronizar financeiro do contrato (executar apos contrato criado)" e priority "high".
- SOMENTE inclua sync_financial se o usuario fornecer explicitamente um contracts.id (UUID real) ja existente.
```

**Update to existing sync_financial section (lines 122-128):** Replace the current instruction "Se nao for possivel referenciar, omita o step sync_financial e instrua o usuario a executar depois" with clearer language that points to the new rule above, reinforcing that the replacement is a task, not a placeholder.

---

### What stays unchanged
- `polo-ai-execute` -- no changes
- Frontend (`AIAssistant.tsx`, `useAgentChat.tsx`) -- no changes
- Database schema/constraints -- no changes
- All other edge functions -- no changes

### Expected outcome
- New plans will never include invalid `pillar` values
- New plans will never contain placeholder strings in `contractId`
- When a contract is created in the same plan, `sync_financial` is replaced by a follow-up task

