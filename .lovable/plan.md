

# Refinamento Ultra-Premium — Plataforma Inteira

Escopo imenso. Dividido em **6 fases incrementais**, cada uma entregável independentemente.

---

## Fase 1 — Fundação: Smooth Scroll + CSS Primitivos Globais

**Arquivos:** `src/index.css`, `tailwind.config.ts`, novo `src/hooks/useSmoothScroll.ts`

1. Criar hook `useSmoothScroll` com inertial smoothing usando `requestAnimationFrame` + lerp (interpolação linear) para todos os containers scrolláveis (`h-screen overflow-y-auto`)
2. Adicionar CSS primitivos globais em `index.css`:
   - `.text-mask-reveal` — clip-path + translateY animation para títulos
   - `.image-ease-in` — opacity 0→1 + scale 1.1→1.0 com stagger
   - `.hover-invert` — inversão preto↔branco para botões
   - `.hover-underline-sweep` — sublinhado animado da esquerda para a direita
   - `.marquee` — rolagem horizontal contínua via CSS keyframes
   - `.accordion-spring` — transição spring não-linear para expand/collapse
3. Atualizar `tailwind.config.ts` com keyframes `marquee`, `textReveal`, `imageReveal`
4. Scrollbar ultra-thin (3px) com fade automático

---

## Fase 2 — Landing Page Sonance

**Arquivos:** Todos em `src/components/landing/`, `src/pages/LandingPage.tsx`

1. **LandingHero**: Text masking nos títulos (linhas deslizam Y:100%→0%), remover neon badges, tipografia mais editorial
2. **LandingNav**: Hover com opacidade 60% nos links, logo sem glow excessivo
3. **LandingProblem/Solution**: Entrada com text-mask-reveal, image-ease-in nos cards
4. **LandingPricing**: Cards com hover-invert nos botões, bordas mais finas
5. **LandingFooter**: Marquee horizontal contínuo no copyright/featured
6. Aplicar `useSmoothScroll` no container principal do LandingPage
7. Remover `ParticlesBackground`, `AnimatedGradientOrbs`, `CyberpunkGrid` — substituir por ambient glow sutil único

---

## Fase 3 — ScrollMotion System Upgrade

**Arquivos:** `src/components/squad-ui/ScrollMotion.tsx`, `src/components/layout/ScrollRevealSection.tsx`

1. Adicionar variante `textMask` ao `ScrollMotion` — clip-path reveal
2. Adicionar variante `imageReveal` — scale 1.1→1 + opacity com stagger
3. Criar `ScrollMotionAccordion` — expand com spring physics (stiffness/damping custom)
4. Criar `StickyLabel` component — labels de seção que fixam no topo e são empurradas pela próxima

---

## Fase 4 — Hover System Global

**Arquivos:** `src/index.css`, componentes de card (`GlassCard`, `MkCard`)

1. **Links de texto**: Estado normal sólido, hover com opacity 0.6 + underline sweep
2. **Cards de projeto**: Hover com zoom lento (scale 1.03), cursor customizado "VIEW" via pseudo-element
3. **Botões**: `.btn-action` e `.btn-primary` com inversão de cores no hover (sem glow neon)
4. **GlassCard/MkCard**: Reduzir intensidade do 3D hover, mais sutil (translateZ máx 5px)
5. Remover efeitos excessivos: `neon-text`, `neon-button`, `neon-badge`, `data-glow-strong`

---

## Fase 5 — Área Logada (Dashboard + Páginas Internas)

**Arquivos:** `src/pages/Dashboard.tsx`, sidebar, componentes internos

1. Aplicar smooth scroll em todos os containers scrolláveis das páginas internas
2. Cards KPI com entrada text-mask nos valores numéricos
3. Sidebar links com hover opacity + underline sweep
4. Tabelas com row hover mais sutil (bg-white/3 em vez de /5)
5. Modais/dialogs com entrada mais suave (scale 0.98→1 + blur)

---

## Fase 6 — Marketing Hub + Finance

**Arquivos:** `src/pages/marketing-hub/*`, `src/pages/finance/*`

1. Aplicar os mesmos primitivos de hover, scroll e reveal nas páginas do Marketing Hub
2. Pipeline kanban com drag mais suave
3. Cards holográficos com hover reduzido (mais editorial, menos sci-fi)
4. Finance KPIs com text-mask reveal nos valores

---

## Detalhes Técnicos

- **Smooth scroll**: Implementado via `requestAnimationFrame` com lerp factor ~0.08 para sensação de inércia/peso
- **Text masking**: `overflow: hidden` no container + `translateY(100%)→translateY(0)` no texto interno, duração 0.6s com easing `cubic-bezier(0.16, 1, 0.3, 1)`
- **Sticky labels**: `position: sticky; top: 0` com z-index escalonado para efeito de "empurrar"
- **Marquee**: CSS puro com `@keyframes marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }` e conteúdo duplicado
- **Spring accordion**: Framer Motion `type: "spring"` com `stiffness: 120, damping: 14` no height transition

**Recomendação**: Começar pela **Fase 1** (fundação CSS) + **Fase 2** (Landing Page) juntas, pois a Landing é a vitrine e os primitivos são necessários para tudo.

