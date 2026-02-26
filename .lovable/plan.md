

## Refinar Modo Foco — Layout Compacto, Premium, com Mais Funcionalidades

### Problema
O layout atual tem muito espaço vazio — o Pomodoro e o painel de tarefas ocupam uma grid 2 colunas mas são pequenos, deixando grande área morta (como na screenshot). Faltam funcionalidades extras e efeitos premium.

### Plano de Implementação

**1. Reestruturar layout para preencher o espaço**
- Trocar grid `md:grid-cols-2` por layout de 3 colunas: Timer | Tarefas Hoje | Stats/Métodos
- Timer fica compacto à esquerda com visual 3D (perspective + rotateX hover)
- Tarefas no centro com scroll area
- Nova coluna direita com widgets úteis

**2. Adicionar novos widgets no card (coluna direita)**
- **Método de Foco** — seletor entre Pomodoro, Deep Work (90min), Flowtime (sem timer fixo), 52/17 (técnica alternativa)
- **Streak counter** — dias consecutivos de foco (animação de fogo)
- **Ambient Sound toggle** — botões para ativar sons (chuva, lo-fi, silêncio) via label visual
- **Mini stats** — tempo total focado hoje, sessões completadas, tarefas concluídas

**3. Efeitos visuais premium**
- Cards com `perspective: 1000px` e `rotateX/rotateY` suave no hover (3D tilt)
- Glassmorphism mais forte: `backdrop-blur-2xl`, gradientes multi-layer
- Timer ring com glow animado pulsante via SVG filter + gradient stroke
- Partículas sutis flutuando no background do card quando timer está rodando
- Border gradient animado (conic-gradient rotate) nos cards ativos
- Hover states com `translateZ` e shadow depth progression

**4. Compactar seções existentes**
- Reduzir padding do timer de `p-5` para `p-4`
- Tarefas com `max-h` e `overflow-y-auto` via ScrollArea
- Stats row inline mais denso
- Remover espaçamento vertical excessivo (`space-y-8` → `space-y-5`)

**5. Animações melhoradas**
- Entry: cards com `spring` + `rotateX: -8deg → 0` (3D flip-in)
- Timer digits: morphing transition com `layoutId`
- Progress bars com gradient shimmer contínuo
- Checkbox completion: ripple effect + scale bounce
- Floating particles (pequenos dots) no background quando em modo foco ativo

### Arquivos modificados
- `src/components/tasks/SavedFocusPlans.tsx` — rewrite do layout principal e adição dos novos widgets

