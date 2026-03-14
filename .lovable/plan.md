

## Padronizacao de Cores — Campanhas Instagram

### Diagnostico

**1.328 ocorrencias** de cores poluidas (`emerald`, `amber`, `red`, `green`, `purple`, `teal`, etc.) espalhadas em **63 arquivos** de sub-componentes de campanha. O `CampaignsTab.tsx` principal ja esta limpo com a paleta Sonance, mas todos os componentes internos ainda usam cores semanticas hardcoded.

### Mapeamento de Substituicao

A paleta SQUAD e estritamente **azul (#009CCA) + branco + cinza**. Vermelho reservado **apenas** para erros/destrutivo.

```text
ANTES                    →  DEPOIS (Sonance)
─────────────────────────────────────────────
emerald-400/500          →  primary (azul)
green-400/500            →  primary (azul)
amber-400/500            →  muted-foreground (cinza)
yellow-400/500           →  muted-foreground (cinza)
orange-400/500           →  muted-foreground (cinza)
purple-400/500           →  primary/70 (azul medio)
violet-400/500           →  primary/70 (azul medio)
pink-400/500             →  primary/50 (azul claro)
teal-400/500             →  primary (azul)
indigo-400/500           →  primary (azul)
red-400/500 (sucesso)    →  primary (azul)
red-400/500 (erro real)  →  destructive (manter)
```

### Abordagem

Dado o volume (63 arquivos, 1328 ocorrencias), a refatoracao sera feita em **lotes por categoria** do mega-menu:

1. **Producao** (6 componentes): Kanban, Approval, ApprovalPipeline, PublishQueue, FeedPreview, Timeline
2. **Calendario** (6 componentes): Calendar, UnifiedCalendar, GanttTimeline, TimingOptimizer, HolidayCalendar, Seasonal
3. **Analytics** (7 componentes): AnalyticsAdvanced, ROI, Heatmap, HealthScore, VelocityTracker, SentimentAnalysis, MoodTracker
4. **Estrategia** (8 componentes): Goals, FunnelView, ContentFunnel, ContentMap, PersonaMap, CustomerJourney, StoryArc, DNA
5. **IA Tools** (14 componentes): SmartAlerts, ResultsSimulator, AutoPlanner, BriefingGenerator, AdsCopy, Spin, Hashtags, HashtagIntel, ABTesting, ABTestFramework, RiskScore, ContentGap, PitchDeck, BudgetAllocator
6. **Colaboracao** (5 componentes): Collaboration, CollaborationBoard, ClientReview, WarRoom, AudienceHeatmap
7. **Exportar** (16 componentes): PDFReport, Compare, CrossComparator, PostMortem, Autopsy, Cloner, SwipeFiles, RepostAutomation, ContentRecycling, SplitContent, CompetitorTracker, CompetitorShadow, MicroBlitz, MoodBoard, Alerts, Changelog

### Regras de Substituicao

Para cada arquivo:
- `text-emerald-*` / `bg-emerald-*` → `text-primary` / `bg-primary/15`
- `text-green-*` / `bg-green-*` → `text-primary` / `bg-primary/15`
- `text-amber-*` / `bg-amber-*` → `text-muted-foreground` / `bg-muted`
- `text-yellow-*` / `bg-yellow-*` → `text-muted-foreground` / `bg-muted`
- `text-red-*` / `bg-red-*` para estados de erro/rejeicao → `text-destructive` / `bg-destructive/15` (manter)
- `text-red-*` / `bg-red-*` para intensidade/climax → `text-primary` / `bg-primary/20`
- `text-purple-*` / `bg-purple-*` → `text-primary/70` / `bg-primary/10`
- `border-emerald-*` → `border-primary/30`
- `border-amber-*` → `border-border`
- `border-red-*` → `border-destructive/30`

### Prioridade

Iniciar pelos componentes mais vistos (Dashboard, Kanban, Analytics, Goals) e avancar para os menos frequentes. Todos os 63 arquivos serao tratados para eliminar completamente a poluicao visual.

### Detalhes Tecnicos

- Nenhuma dependencia nova necessaria
- Todas as cores de substituicao ja existem como CSS variables em `index.css`
- O `StatusBadge` do squad-ui ja segue o padrao correto e pode ser reutilizado onde badges aparecem nos sub-componentes

