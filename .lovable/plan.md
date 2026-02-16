
# Efeitos 3D e Animacoes de Scroll na Plataforma Inteira

## Situacao Atual

A plataforma ja possui um sistema de animacoes robusto no CSS (`index.css`) com hover-3d, hover-lift, depth-in, blur-in, e componentes como `ScrollMotion` e `PortalAnimations`. Porem, esses efeitos nao estao aplicados consistentemente em todas as paginas e funcionalidades.

**O que falta:**
1. Transicoes animadas entre paginas (route transitions) -- ao navegar de uma pagina para outra, o conteudo simplesmente aparece sem efeito
2. Efeito 3D de scroll no conteudo principal -- conforme o usuario rola, os elementos nao reagem com perspectiva/profundidade
3. Cards, tabelas, tabs e menus nao usam consistentemente os efeitos 3D ja disponiveis no CSS

---

## Plano de Implementacao

### 1. Page Transition System (Transicao entre Paginas)

Criar um componente `PageTransition` que envolve o conteudo de cada pagina no `DashboardLayout`, aplicando animacao de entrada/saida com framer-motion `AnimatePresence` baseada na rota atual.

**Efeito:** Ao mudar de pagina, o conteudo atual sai com fade + scale-down + blur, e o novo entra com fade + scale-up + deblur, dando sensacao de profundidade 3D.

**Arquivo:** `src/components/layout/PageTransition.tsx` (novo)
**Modificar:** `src/components/layout/DashboardLayout.tsx` -- envolver `{children}` com `PageTransition`

### 2. Scroll-Linked 3D Perspective no Main Content

Adicionar um efeito sutil de perspectiva 3D vinculado ao scroll no container `<main>` do DashboardLayout. Conforme o usuario rola para baixo, o conteudo ganha uma leve inclinacao `rotateX` que volta ao normal, criando sensacao cinematografica de profundidade.

**Arquivo:** `src/components/layout/DashboardLayout.tsx` -- adicionar hook `useScroll` + `useTransform` no `<main>` para aplicar `rotateX` e `translateZ` sutis baseados na posicao do scroll

### 3. CSS Global: Aplicar 3D Auto em Todos os Elementos Comuns

Expandir a secao "GLOBAL AUTO-ANIMATIONS" no `index.css` para cobrir mais elementos:

- **Todos os `Card` (shadcn):** Adicionar `transform-style: preserve-3d` e hover com `translateZ` sutil
- **TabsTrigger:** Hover com scale + translateZ
- **Linhas de tabela:** Hover com translateZ sutil
- **Sidebar menu items:** Hover com translateX + translateZ (ja parcialmente implementado)
- **Inputs/Selects em foco:** Sutil scale + glow
- **Accordion items:** Abertura com `depthIn` animation
- **ScrollArea content:** `perspective` no container

### 4. Scroll Reveal Automatico nas Paginas Principais

Criar um componente `ScrollRevealSection` leve que aplica `whileInView` com fade+blur+translateZ em qualquer secao da plataforma. Aplicar nas paginas principais:

- Dashboard (KPIs, graficos, tabelas)
- CRM (pipeline stages, cards)
- Financeiro (KPIs, tabelas)
- Projetos (grid de projetos)
- Tarefas (board view, list view)

**Arquivo:** `src/components/layout/ScrollRevealSection.tsx` (novo) -- wrapper generico que aplica `whileInView` com `translateZ` e `blur`

### 5. Menu/Submenu 3D Effects

Aprimorar as transicoes dos submenus e dropdowns:
- Sidebar expand/collapse: ja tem spring animation (manter)
- Quick Actions Menu: adicionar `depthRotateIn` na abertura
- Role Switcher dropdown: ja tem scale animation (aprimorar com rotateX)
- Notification dropdown: adicionar `depthIn`

---

## Detalhes Tecnicos

### Arquivos a criar:
1. `src/components/layout/PageTransition.tsx` -- Wrapper AnimatePresence para transicoes de rota com efeito 3D
2. `src/components/layout/ScrollRevealSection.tsx` -- Wrapper whileInView generico com perspectiva 3D

### Arquivos a modificar:
1. `src/components/layout/DashboardLayout.tsx` -- Integrar PageTransition + scroll-linked perspective no main
2. `src/index.css` -- Expandir auto-animations para Card, TabsTrigger, table rows, inputs, accordion, scroll areas

### Dependencias:
- Nenhuma nova -- usa framer-motion (ja instalado) e CSS puro

### Performance:
- Todos os efeitos 3D desativados em mobile (via media query ja existente em `index.css`)
- `will-change: transform` apenas em elementos ativos
- `useReducedMotion` respeitado nos componentes framer-motion
- Transformacoes CSS puras para hover (sem JS)
