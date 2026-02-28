

## Cockpit Executivo com IA Preditiva e Prescritiva

O dashboard atual é descritivo (mostra o que aconteceu). Vamos transformá-lo num cockpit preditivo e prescritivo que responde: **o que vai dar errado, quando, e o que fazer agora**.

### Arquitetura

```text
┌─────────────────────────────────────────────┐
│  Edge Function: generate-executive-insights  │
│  (Gemini 2.5 Flash)                          │
│  Input: all metrics + tasks + projects       │
│  Output: structured JSON with:               │
│    - risk_radar (array of risks)             │
│    - revenue_forecast (30/60/90d)            │
│    - capacity_forecast (weekly load)         │
│    - bottlenecks (detected patterns)         │
│    - action_items (prescriptive)             │
│    - executive_summary (1 paragraph)         │
│    - cash_runway_months                      │
│    - project_health_scores                   │
│    - backlog_clear_date                      │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  useExecutiveDashboard.ts                    │
│  + Add computed predictive metrics:          │
│    - backlogClearDate (velocity math)        │
│    - cashRunwayMonths (balance/burn rate)    │
│    - revenueForecast30/60/90                 │
│    - projectRiskScores per project           │
│    - capacityLoadByWeek                      │
│    - pipelineRunwayDays                      │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  ExecutiveDashboardPage.tsx                   │
│  NEW SECTIONS (inserted at top):             │
│  1. AI Executive Summary banner              │
│  2. Risk Radar (color-coded risk cards)      │
│  3. Capacity Forecast (weekly bar chart)     │
│  4. Revenue Forecast (30/60/90 cards)        │
│  5. Cash Runway indicator                    │
│  6. "O que fazer hoje" action block          │
│  7. Project Health Ranking                   │
│  + Emergency state when score<70 + vel<1     │
└─────────────────────────────────────────────┘
```

### Implementation Steps

#### 1. New Edge Function `generate-executive-insights`
- Receives all dashboard metrics, tasks, projects, revenues, deals as context
- Uses `google/gemini-2.5-flash` with tool calling to return structured analysis
- Tool schema: `save_executive_insights` with fields for risk_radar, forecasts, action_items, executive_summary, bottlenecks, project_health_scores
- Each risk: `{ type, severity (red/yellow/green), title, description, metric }`
- Each action: `{ priority, title, reason, impact_area }`

#### 2. Expand `useExecutiveDashboard.ts` with computed predictive metrics
All calculated client-side from existing data (no AI needed):
- **backlogClearDate**: `tasksPending / velocityPerDay` → projected date
- **cashRunwayMonths**: `(balance + pendingRevenue) / avgMonthlyExpense`
- **revenueForecast30/60/90**: based on deals by stage × probability
- **projectRiskScores**: per project = (overdue stages / total stages × velocity × days remaining)
- **capacityLoadWeekly**: estimated hours from tasks created vs completed per week (4 weeks ahead)
- **pipelineRunwayDays**: `active projects backlog / velocity` — how many days of work are covered
- **burnRateMonthly**: average of last 3 months expenses
- **breakEvenPoint**: monthly fixed cost threshold

#### 3. Redesign `ExecutiveDashboardPage.tsx` — New top sections

**A. Emergency State Banner** — When `productivityScore < 70` AND `velocityPerDay < 1`:
- Full-width red/amber banner: "O que você vai cortar ou delegar hoje?"
- Shows: backlog clear date, capacity overload percentage

**B. AI Risk Radar** (new component `AIRiskRadar.tsx`):
- Button "Gerar Análise IA" that calls `generate-executive-insights`
- Renders color-coded risk cards: 🔴 high, 🟠 medium, 🟡 low
- Categories: prazo, financeiro, sobrecarga, pipeline, gargalo
- Cached in localStorage with timestamp

**C. Revenue Forecast Cards** (3 cards: 30d, 60d, 90d):
- Computed from deals pipeline × stage probability
- Shows projected revenue with confidence indicator

**D. Cash Runway Indicator**:
- Formula: `(balanceCurrent + pendingRevenue) / burnRateMonthly`
- Visual: progress bar showing months of runway
- Alert if < 2 months

**E. Capacity Forecast Chart** (new `CapacityForecast` component):
- 4-week ahead bar chart showing estimated load % vs capacity
- Red bars for overload weeks (>100%)

**F. "O que fazer hoje" Block** (AI-generated):
- Top 3 prioritized actions from AI analysis
- Each with reason and impact area
- Generated alongside risk radar

**G. Project Health Ranking**:
- Table/list of active projects sorted by computed risk score
- Each with: name, risk %, days to deadline, tasks remaining, financial status
- Color-coded rows

#### 4. Register and deploy edge function
- Add `generate-executive-insights` to `supabase/config.toml`
- Deploy function

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/generate-executive-insights/index.ts` | Create |
| `src/hooks/useExecutiveDashboard.ts` | Expand with predictive metrics |
| `src/components/dashboard/AIRiskRadar.tsx` | Create |
| `src/components/dashboard/CapacityForecast.tsx` | Create |
| `src/components/dashboard/RevenueForecaster.tsx` | Create |
| `src/components/dashboard/CashRunwayIndicator.tsx` | Create |
| `src/components/dashboard/ExecutiveActionBlock.tsx` | Create |
| `src/components/dashboard/ProjectHealthRanking.tsx` | Create |
| `src/components/dashboard/EmergencyBanner.tsx` | Create |
| `src/pages/ExecutiveDashboardPage.tsx` | Restructure layout with new sections at top |
| `supabase/config.toml` | Register new function |

