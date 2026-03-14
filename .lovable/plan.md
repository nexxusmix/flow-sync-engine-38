

# Correção de Bugs Conhecidos

## Bug 1 — extractEntities e "PORTO 153"

**Arquivo:** `src/components/dashboard/AIDailySummary.tsx` (linhas 91-107)

Verificando o código atual, `STOP_WORDS` já não contém "PORTO" (contém apenas TODO, ASAP, CRM, ROI, KPI). No entanto, há um risco residual: se o texto contiver "PORTO" isolado (sem número), ele será extraído como entidade e não fará match com o projeto "PORTO 153". A correção adiciona lógica para, quando uma entidade upper-case for seguida de número no texto original, capturá-la como entidade composta.

**Ação:** Revisar a regex `upperRegex` para garantir que "PORTO 153" seja capturado como entidade única. A regex atual `(?:\s+\d+)?` deveria fazer isso, mas o `\b` final pode quebrar em certos contextos. Ajustar para usar lookahead ou captura explícita.

---

## Bug 2 — PortalIntelligenceBlock com yellow hardcoded

**Arquivo:** `src/components/client-portal/PortalIntelligenceBlock.tsx` (linhas 152-161)

Os cards já usam `sc.risk()` e `sc.score()` corretamente. Porém o **alert banner** (linhas 155-161) ainda usa `bg-yellow-500/10`, `border-yellow-500/30` e `text-yellow-600` para o estado de "atenção". Isso viola a paleta Sonance.

**Ação:** Substituir as referências yellow por tokens semânticos:
- `bg-yellow-500/10` → `bg-muted`
- `border-yellow-500/30` → `border-border`
- `text-yellow-600` → `text-muted-foreground`

---

## Bug 3 — Cores inconsistentes (152 arquivos, 2.423 ocorrências)

Este é o bug de maior escopo. A padronização será feita em lotes seguindo o mapeamento do `plan.md` existente, aplicando as regras de substituição já definidas:

```text
emerald-*  → primary (azul)
green-*    → primary (azul)
amber-*    → muted-foreground / muted
yellow-*   → muted-foreground / muted
orange-*   → muted-foreground / muted
purple-*   → primary/70
pink-*     → primary/50
teal-*     → primary
red-* (sucesso) → primary
red-* (erro)    → destructive (manter)
```

Dado o volume massivo, a implementação será feita em **lotes por área funcional**, priorizando:

1. **Lote 1 — Páginas principais:** ClientesPage, Report360Page, ProjectsFinancePage
2. **Lote 2 — Instagram Engine:** CampaignCompare, e demais sub-componentes
3. **Lote 3 — Marketing Hub:** MkContentsPage, StudioCreativoPage
4. **Lote 4 — Restante** (batches de ~20 arquivos por mensagem)

Cada arquivo será tratado individualmente, distinguindo usos de vermelho como erro real (manter `destructive`) vs. vermelho decorativo (migrar para `primary`).

---

### Detalhes Técnicos

- Nenhuma dependência nova
- Todas as cores de substituição já existem como CSS variables
- O utilitário `sc` de `src/lib/colors.ts` será usado onde aplicável (scores, risks, statuses)
- Badges com variantes como `"amber" | "emerald"` serão migradas para variantes existentes no design system

