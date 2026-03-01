

## Plano: Landing Page com Efeitos de Scroll Contínuos + Correção "Uma Plataforma"

### Dois problemas identificados

**1. Animações atuais são "once: true"** — aparecem uma vez e param. O usuário quer efeitos que reagem ao scroll em tempo real (ida e volta).

**2. Texto menciona "duas plataformas"** — o hero diz "Duas plataformas · Um ecossistema", a solution mostra dois cards separados (Produtora / Marketing). Precisa refletir que é UMA plataforma com múltiplos módulos.

---

### Mudanças planejadas

#### A. Efeitos de Scroll Contínuos (scroll-linked)

Usar `useScroll` + `useTransform` do Framer Motion para criar animações vinculadas à posição do scroll, não ao viewport entry. Os elementos animam conforme o usuário scrolla — e revertem ao voltar.

**Componentes afetados:**
- **LandingHero**: Parallax no vídeo, fade-out do texto conforme scrolla para baixo
- **LandingProblem**: Pain points entram com translateY + opacity vinculados ao scroll progress da seção
- **LandingSolution**: Cards com scale + opacity scroll-driven (crescem conforme se aproximam do centro)
- **LandingDifferentials**: Grid items com stagger baseado em scroll progress
- **LandingPricing**: Cards com parallax vertical sutil (velocidades diferentes)
- **LandingPriceJustification**: Números de preço com scale animado pelo scroll
- **LandingProof**: Comparativos deslizam dos lados (esquerda/direita) baseado no scroll
- **LandingCTA**: Scale up dramático conforme scrolla até lá

**Implementação técnica:**
- Criar um wrapper `ScrollLinked` que usa `useScroll({ target, offset })` + `useTransform` para mapear `scrollYProgress` em `opacity`, `y`, `scale`, `x`
- Remover todos os `once: true` das seções
- Substituir `whileInView` por `style={{ opacity, y, scale }}` com valores derivados do scroll
- Manter o `useSmoothScroll` (lerp) existente para o feel suave

#### B. Correção de Messaging — Uma Plataforma

**LandingHero:**
- Badge: "Duas plataformas · Um ecossistema" → "Uma plataforma · Todos os módulos"
- Sub-texto: remover a separação Produtora/Marketing como entidades distintas, apresentar como módulos integrados
- Manter os ícones Clapperboard e Palette mas como "módulos" de uma plataforma

**LandingSolution:**
- Manter os dois cards (Produtora / Marketing) mas apresentar como "módulos" da mesma plataforma
- Título: "O HUB nasceu para centralizar tudo" (manter) + subtítulo: "Módulos integrados em uma única plataforma"

**LandingPricing:**
- O card "Hub Completo" já está correto, mas ajustar texto do feature "Acesso às duas plataformas" → "Todos os módulos inclusos"

**LandingFooter:**
- "Produtora + Marketing" → "Hub Criativo Completo"

---

### Detalhes Técnicos

```text
Scroll-linked animation flow:

  scrollYProgress: 0 ──────────────────── 1
                   │                      │
  Section enters   │   Center of viewport │   Section exits
  (opacity: 0)     │   (opacity: 1)       │   (opacity: 0)
  (y: 60px)        │   (y: 0)             │   (y: -30px)
  (scale: 0.95)    │   (scale: 1)         │   (scale: 0.98)
```

- `useScroll({ target: ref, offset: ["start end", "end start"] })` para cada seção
- `useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [...values])` para fade-in e fade-out
- `useSpring` para suavizar os valores transformados
- Hero terá parallax negativo no vídeo (speed -0.3)
- Nav terá `backdropFilter` que intensifica com scroll

