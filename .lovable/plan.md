

## Plano: Redesign Premium do RecentActivityFeed

### O que muda

Transformar a lista plana de "Recentes" em um feed visualmente rico, interativo e com profundidade 3D.

### Mudanças no `RecentActivityFeed.tsx`

**1. Cards individuais em vez de lista flat**
- Cada item vira um mini-card com borda sutil, `backdrop-blur`, e efeito 3D ao hover (rotação perspectiva leve usando `Card3D` do PortalAnimations)
- Ícone do módulo ganha um fundo com gradiente sutil e glow ao hover
- Status badge vira chip colorido com fundo semi-transparente (não só texto)

**2. Filtros premium**
- Chips de filtro ganham efeito `Magnetic` (atração magnética ao mouse)
- Chip ativo: borda animada com glow sutil + ícone animado
- Transição suave entre filtros com `AnimatePresence` (itens saem com fade + scale, entram com stagger)

**3. Efeitos 3D e interativos por card**
- Hover: rotação 3D leve (±5°) + elevação com sombra + glare reflexivo
- Cursor magnético no ícone do módulo
- Status badge pulsa sutilmente se urgente/atrasado (`PulseRing`)
- Shimmer effect no card ao hover

**4. Visual enriquecido**
- Header com `TextReveal` animado
- Contador animado de itens por módulo nos chips de filtro
- Linha de tempo visual sutil à esquerda (vertical line conectando os cards)
- Gradiente de fundo sutil no container principal
- Stagger animation nos cards ao entrar na viewport

**5. Detalhes premium**
- Tempo relativo com ícone de relógio micro
- Arrow de navegação com spring animation ao hover
- Footer CTA com efeito `Shimmer`

### Arquivo impactado
- `src/components/dashboard/RecentActivityFeed.tsx` — rewrite visual completo mantendo mesma lógica de dados

### Resultado visual esperado
```text
┌──────────────────────────────────────────────────────┐
│  Recentes                                      ⏱    │
│  ÚLTIMOS ITENS CRIADOS EM TODOS OS MÓDULOS           │
│                                                      │
│  ● TODOS  ✦ LEADS(5)  📁 PROJETOS(3)  ✓ TAREFAS(5) │
│                                                      │
│  ┌─ 3D Card ──────────────────────────────────────┐  │
│  │  🟢  Gerar RAPs com base...        [BACKLOG]   │  │
│  │      operacao                    há 5 horas →   │  │
│  └────────────────────────────────────────────────┘  │
│  │ (timeline line)                                   │
│  ┌─ 3D Card ──────────────────────────────────────┐  │
│  │  🟢  Fazer cartão Wilma           [BACKLOG]    │  │
│  │      operacao                    há 5 horas →   │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│              Ver mais →  (shimmer)                    │
└──────────────────────────────────────────────────────┘
```

