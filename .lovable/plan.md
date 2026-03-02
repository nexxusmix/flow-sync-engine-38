

## Refinamento de Layout, Design e Cores -- Campanhas Instagram

### Problemas Identificados

1. **Navegacao catastrofica**: 60+ botoes planos espalhados em 4 linhas sem categorias. Impossivel encontrar algo rapido.
2. **Header sobrecarregado**: 7 botoes de acao (Relatorio Final, Relatorio, Automacoes, IA Avancada, Duplicar, Template, PDF) todos amontoados.
3. **Ausencia de hierarquia visual**: Todos os botoes tem o mesmo peso visual -- nao ha distincao entre funcoes primarias (Dashboard, Kanban, Calendario) e funcoes avancadas (DNA, Autopsia, Shadow).
4. **Cards da lista de campanhas**: Funcionais mas sem a estetica premium do resto da plataforma (sem Tilt3D, sem glow).
5. **Cores inconsistentes**: Badges usam vermelho/emerald enquanto o padrao Sonance e azul/branco/cinza.

---

### Solucao: Mega-Menu Categorizado + Header Premium

#### 1. Navegacao Categorizada (substituir os 60+ botoes)

Agrupar os 60+ botoes em 8 categorias com um sistema de dropdown/popover:

```text
[Dashboard] [Producao v] [Calendario v] [Analytics v] [Estrategia v] [IA Tools v] [Colaboracao v] [Exportar v]
```

**Categorias:**
- **Producao**: Kanban, Aprovacao, Workflow, Publicacao, Feed, Timeline
- **Calendario**: Calendario, Cal. Unificado, Gantt, Timing, Feriados, Sazonal
- **Analytics**: Analytics, ROI, Heatmap, Health, Velocity, Sentimento, Mood Tracker
- **Estrategia**: Metas, Funil, Content Funnel, Content Map, Personas, Jornada, Story Arc, DNA
- **IA Tools**: Alertas IA, Simulador, Auto-Planner, Briefing, Ads Copy, Spin, Hashtags, Hashtag Intel, A/B Test, A/B Framework, Risk Score, Gap Analysis, Pitch Deck, Budget
- **Colaboracao**: Colaboracao, Tarefas, Revisao, War Room, Audiencia
- **Exportar**: Relatorio, PDF Report, Comparar, Cross-Compare, Post-Mortem, Autopsia, Cloner, Swipe Files, Repost, Reciclagem, Repurpose, Concorrentes, Shadow, Blitz 24h, Mood Board

#### 2. Header Refinado

- Mover acoes secundarias (Duplicar, Template, PDF) para um menu "..." (DropdownMenu)
- Manter apenas 2-3 acoes primarias visiveis (IA Avancada, Automacoes)
- Adicionar indicadores visuais de progresso (ring animado) no header

#### 3. Cards da Lista de Campanhas

- Aplicar `glass-card` com borda sutil animada no hover
- Adicionar micro-sparkline de progresso
- Usar paleta monocromatica azul nos badges de status (em vez de vermelho/emerald)
- Ring de progresso circular em vez de barra horizontal

#### 4. Padrao de Cores Sonance

- Status badges: azul claro (planning), azul medio (active), cinza (completed), cinza claro (paused) -- sem vermelho/emerald
- Accent glow azul nos elementos interativos
- Progress bars em escala monocromatica de azul

---

### Arquivos Afetados

- `src/components/instagram-engine/CampaignsTab.tsx` -- Refatoracao completa da navegacao (mega-menu categorizado), header simplificado, cards premium, paleta de cores

### Detalhes Tecnicos

- Usar `DropdownMenu` do Radix para as categorias de navegacao
- Cada categoria sera um `DropdownMenuTrigger` com `DropdownMenuContent` listando os sub-itens
- O botao "Dashboard" permanece como botao direto (sem dropdown)
- Acoes secundarias do header movidas para `DropdownMenu` com icone `MoreHorizontal`
- Cards usam `hover:border-primary/20` + `transition-all duration-300` para efeito premium

