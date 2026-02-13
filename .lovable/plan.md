
# Corrigir Animacoes de Blur + Motion por Scroll na Plataforma Toda

## Problema Diagnosticado

Foram encontradas **261 ocorrencias** de `filter: "blur(Xpx)"` em animacoes `initial/animate` em **14 arquivos**. O problema:

1. **Animacoes com `animate` disparam no mount** -- elementos fora da viewport animam antes de serem vistos. Quando o usuario faz scroll, a animacao ja terminou (ou pior, o browser nao completa o `filter: blur(0px)` corretamente por questoes de compositing)
2. **Blur pesado (15px-25px) causa stuttering** no scroll em GPUs fracas
3. **Nao ha scroll-triggered animations** -- tudo anima de uma vez no carregamento da pagina

## Solucao

### 1. Criar componente utilitario `ScrollMotion` (reutilizavel)

Criar `src/components/squad-ui/ScrollMotion.tsx` com variantes pre-definidas:

```
ScrollMotion         -- wrapper generico (fade + slide + optional blur leve)
ScrollMotionWord     -- anima palavra por palavra (split text)
ScrollMotionStagger  -- container com stagger para grids/listas de cards
ScrollMotionItem     -- item filho do stagger
```

Regras:
- Usar `whileInView` com `viewport={{ once: true, margin: "-80px" }}`
- **Blur maximo: 4px** (nao 15-25px que trava)
- Duracao curta: 0.4-0.6s (nao 0.8-1s)
- `will-change: "opacity, transform"` (NUNCA `filter` -- blur via transform e opacity)
- `once: true` sempre -- anima 1x e para

### 2. Arquivos a modificar (14 arquivos, ~261 ocorrencias)

| Arquivo | O que mudar |
|---------|-------------|
| `src/pages/Dashboard.tsx` | Trocar `initial/animate` blur por `ScrollMotion` em secoes, `whileInView` nos cards abaixo do fold |
| `src/components/dashboard/MetricCard.tsx` | Manter `animate` (esta acima do fold) mas reduzir blur de 12-15px para 4px |
| `src/components/dashboard/KPICards.tsx` | Idem -- reduzir blur, manter animate por estar no topo |
| `src/components/layout/DashboardLayout.tsx` | Blobs decorativos -- manter blur alto (e decorativo, nao afeta UX). Content wrapper: reduzir de 12px para 4px |
| `src/components/layout/Header.tsx` | Header e fixo -- manter `animate` mas reduzir blur de 10px para 4px |
| `src/components/marketing-hub/MkAppShell.tsx` | Reduzir blur de 8px para 4px no content wrapper |
| `src/components/landing/LandingHero.tsx` | Manter word-by-word com `animate` (hero e a primeira coisa visivel) -- reduzir blur de 10px para 6px |
| `src/components/landing/NeonTitle.tsx` | Idem -- reduzir blur |
| `src/components/landing/AnimatedGradientOrbs.tsx` | Orbs decorativos -- manter (blur e o efeito visual desejado, nao e animacao de entrada) |
| `src/components/client-portal/animations/PortalAnimations.tsx` | TextReveal ja usa `useInView` -- OK. Demais componentes ja corretos |
| `src/components/client-portal/PortalAnimatedSection.tsx` | Ja usa `useReducedMotion` -- OK, sem blur |
| `src/components/client-portal/PortalHeaderPremium.tsx` | Parallax scroll -- manter. Badges: trocar `animate` por `whileInView` |
| Paginas do Marketing Hub (5 arquivos) | Trocar `animate` nos grids de cards por `ScrollMotionStagger` |

### 3. Regras globais aplicadas

**Blur reduzido globalmente:**
- Animacoes de entrada: maximo 4px (era 8-25px)
- Blobs/decorativos: manter blur alto (e o proposito)
- `defocus-idle` no CSS: manter 1px (e hover, nao entrada)

**Scroll-triggered para tudo abaixo do fold:**
- Secoes do Dashboard (Visual Board, Key Metrics, Action Hub): `whileInView`
- Grids de cards em todas as paginas: `ScrollMotionStagger` + `ScrollMotionItem`
- Titulos de secao: `ScrollMotion` com word split opcional

**Motion individual:**
- Palavras: titulos de secao animam palavra por palavra via `ScrollMotionWord`
- Cards: cada card anima individualmente com stagger delay (0.05s entre cards)
- Secoes: cada secao inteira tem fade-in + slide-up ao entrar na viewport
- Badges/tags: scale-in com micro delay
- Numeros/KPIs: counter animation triggered por `useInView`

### 4. Arquivos criados

- `src/components/squad-ui/ScrollMotion.tsx` -- componentes de motion por scroll

### 5. Arquivos modificados (ordenados por impacto)

1. `src/pages/Dashboard.tsx` -- secoes abaixo do fold usam `whileInView`, blur reduzido
2. `src/components/dashboard/MetricCard.tsx` -- blur reduzido de 12-15px para 4px
3. `src/components/dashboard/KPICards.tsx` -- blur reduzido
4. `src/components/layout/DashboardLayout.tsx` -- content wrapper blur reduzido
5. `src/components/layout/Header.tsx` -- blur reduzido
6. `src/components/marketing-hub/MkAppShell.tsx` -- blur reduzido
7. `src/pages/marketing-hub/MkAssetsPage.tsx` -- `ScrollMotionStagger` nos grids
8. `src/pages/marketing-hub/MkContentsPage.tsx` -- idem
9. `src/pages/marketing-hub/MkReportsPage.tsx` -- idem
10. `src/pages/marketing-hub/MkAutomationsPage.tsx` -- idem
11. `src/pages/marketing-hub/MkBrandingPage.tsx` -- idem
12. `src/pages/marketing-hub/MkApprovalsPage.tsx` -- idem
13. `src/components/landing/LandingHero.tsx` -- blur reduzido
14. `src/components/landing/NeonTitle.tsx` -- blur reduzido
15. `src/components/client-portal/PortalHeaderPremium.tsx` -- badges com `whileInView`
16. `src/components/squad-ui/index.ts` -- exportar novos componentes

### Resultado esperado

- Animacoes de blur **sempre completam** e ficam nitidas
- Elementos animam **quando entram na viewport** (nao no mount da pagina)
- Motion individual por palavras, cards e secoes
- Performance melhor (blur max 4px em vez de 25px)
- Mesmo DNA cinematografico SQUAD Film, so que funcional
