

# Padronização de Cores Sonance — 184 Arquivos Restantes

## Escopo

**190 arquivos** com cores poluídas (45 no Instagram Engine, 112 em componentes gerais, 33 em páginas). O utilitário `sc` em `src/lib/colors.ts` já existe e cobre status, prioridade, score, risco e trend.

## Abordagem

Dado o volume, a refatoração será executada em **7 lotes sequenciais** por área funcional, do mais visível ao menos frequente. Cada lote aplica substituições mecânicas seguindo o mapeamento da paleta Sonance.

### Mapeamento de substituição

```text
ANTES                         →  DEPOIS
──────────────────────────────────────────────
emerald-400/500 (sucesso)     →  primary
green-300/400/500             →  primary
amber-400/500 (warning)       →  muted-foreground / border
purple-400/500                →  primary/70
teal/violet/pink/indigo       →  primary ou muted-foreground
red (não-erro)                →  primary
red (erro real)               →  destructive (manter)
```

Onde possível, substituir blocos inline por chamadas a `sc.status()`, `sc.risk()`, `sc.score()`.

### Lotes

**Lote 1 — Páginas principais (33 arquivos)**
AlertsBoardPage, MkAutomationsPage, MkCalendarPage, e demais páginas em `src/pages/` com ocorrências.

**Lote 2 — Client Portal e Projetos (~15 arquivos)**
PortalProjectStages, GalleryTab, ProjectPaymentsSummary, etc.

**Lote 3 — Instagram Engine — Produção e Colaboração (~12 arquivos)**
CampaignCollaboration, CampaignAlerts, InstagramFeedPreview, Kanban, Approval, PublishQueue, Timeline.

**Lote 4 — Instagram Engine — Analytics e Estratégia (~10 arquivos)**
AnalyticsAdvanced, ROI, Heatmap, HealthScore, SentimentAnalysis, CustomerJourney, CompetitorShadow.

**Lote 5 — Instagram Engine — IA Tools (~14 arquivos)**
SmartAlerts, ResultsSimulator, AutoPlanner, HashtagIntel, ABTesting, RiskScore, ContentGap, BudgetAllocator.

**Lote 6 — Instagram Engine — Visual e Calendário (~10 arquivos)**
RepostAutomation, ContentRecycling, MoodBoard, GanttTimeline, TimingOptimizer, AudienceHeatmap.

**Lote 7 — Componentes restantes (~20 arquivos)**
Playbooks, Marketing Hub, Action Hub, Knowledge, Tasks, e quaisquer remanescentes.

## Regras por arquivo

1. Substituir classes hardcoded pela chamada `sc.*()` quando o contexto é status/risco/prioridade
2. Para cores decorativas sem semântica de status, usar tokens diretos (`text-primary`, `bg-muted`, etc.)
3. Manter `text-destructive`/`bg-destructive` para erros reais
4. Não alterar lógica, apenas classes CSS

## Estimativa

~2500 ocorrências em ~190 arquivos. Substituições puramente mecânicas, sem mudança de lógica ou dependências.

