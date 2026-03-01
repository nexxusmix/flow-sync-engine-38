

## Plano: Refinar Paleta de Cores para Azul, Branco e Preto

### Problema
A plataforma usa muitas cores diferentes (verde/emerald, amarelo/amber, roxo/purple, vermelho/red, laranja/orange, rosa/pink) espalhadas por ~280 arquivos, criando poluição visual que dificulta a experiência do usuário.

### Abordagem
Consolidar a paleta em variações de **azul (#009CCA)**, **branco** e **preto**, mantendo apenas vermelho para estados destrutivos/erro (necessário para acessibilidade). Status como "sucesso" e "aviso" passarão a usar tons de azul e cinza ao invés de verde e amarelo.

### Mudanças

**1. Tokens CSS (`src/index.css`)**
- `--success` → tom de azul claro (ex: `195 80% 45%`) ao invés de verde
- `--warning` → tom neutro/cinza quente (ex: `200 10% 55%`) ao invés de amarelo/amber
- `--info` → mesmo azul primário (já está correto no dark mode)
- Manter `--destructive` em vermelho (necessário para UX de erros)
- Light mode: mesmas mudanças

**2. Componentes com cores hardcoded (~280 arquivos)**
Substituições em massa nos componentes mais usados:
- `text-emerald-*` / `text-green-*` → `text-primary` ou `text-primary/70`
- `bg-emerald-*` / `bg-green-*` → `bg-primary/10`
- `text-amber-*` / `text-yellow-*` → `text-muted-foreground`
- `bg-amber-*` / `bg-yellow-*` → `bg-muted`
- `text-purple-*` / `bg-purple-*` → `text-primary` / `bg-primary/10`
- `text-orange-*` / `bg-orange-*` → `text-muted-foreground`
- `text-pink-*` / `bg-pink-*` → `text-primary`

Arquivos prioritários (mais impacto visual):
- `ExecutiveDashboardPage.tsx` — KPIs, trends, online users
- `TasksDashboardBI.tsx` — status badges do kanban
- `ReportsDashboard.tsx` — ícones de relatórios
- `ProposalDetailPage.tsx` — alertas amber
- `ReportMetricsBar.tsx` — health score
- Todos os badges em `index.css` (`.badge-success`, `.badge-warning`)
- Charts/Recharts: cores de gráficos nas configs

**3. CSS auxiliares**
- `squad-holo.css` — badges active/warning já usam verde/amarelo → azul/cinza
- `mk-holographic.css` — já usa azul, minimal changes

**4. Recharts / Gráficos**
- Substituir paletas multicoloridas por gradientes de azul + cinza
- Cores de fill/stroke em componentes de chart

### Resultado
Paleta limpa: azul primário para positivo/ativo, cinza para neutro/aviso, vermelho apenas para erro/destruição. Visual coeso e premium alinhado com a estética Sonance/Apple.

