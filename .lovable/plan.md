
# Multi-Product Platform Architecture ("Agency Suite")

## Overview

Transform SQUAD Hub into a multi-product platform with two verticals -- **Produtora Audiovisual** and **Marketing & Social Media** -- sharing the same database, auth, finance, CRM, and AI engine, but with separate visual contexts, filtered data, and independent navigation.

## What Already Exists (No Need to Rebuild)

The codebase already has a full Marketing module:
- Marketing Dashboard, Calendar, Pipeline, Ideas, Campaigns, Assets, Studio, References, Automations, Transcription
- Content items, brand kits, creative works, campaigns tables
- Marketing settings, reports

The Produtora module is the core platform (Projects, Stages, Portal, Deliverables, Storyboards, etc.)

**The work is about connecting them under a unified multi-product architecture, not rebuilding either.**

## Implementation Phases

---

### Phase 1: Database Schema Expansion

**A) Add `product_type` to `projects` table**

```sql
ALTER TABLE public.projects
  ADD COLUMN product_type text NOT NULL DEFAULT 'production'
  CHECK (product_type IN ('production', 'marketing'));
```

All existing projects get `'production'` by default. New marketing projects will be tagged `'marketing'`.

**B) Add `module_access` to `profiles` table**

```sql
ALTER TABLE public.profiles
  ADD COLUMN module_access text[] NOT NULL DEFAULT ARRAY['production', 'marketing'];
```

Controls which modules each user can see. Default gives full access.

**C) Add `subscription_plan` to `workspace_settings`**

```sql
ALTER TABLE public.workspace_settings
  ADD COLUMN subscription_plan text NOT NULL DEFAULT 'full'
  CHECK (subscription_plan IN ('production', 'marketing', 'full'));
```

Workspace-level plan that gates available modules.

No new tables needed -- just 3 columns on existing tables.

---

### Phase 2: Platform Context System

**A) Create `useProductContext` hook**

A React context + hook that manages the active product module:

```typescript
type ProductModule = 'production' | 'marketing' | 'full';

interface ProductContextType {
  activeModule: ProductModule;
  setActiveModule: (module: ProductModule) => void;
  hasAccess: (module: 'production' | 'marketing') => boolean;
  availableModules: ProductModule[];
}
```

- Persisted in `localStorage`
- Reads `module_access` from user profile
- Reads `subscription_plan` from workspace settings
- Exposes `hasAccess()` for conditional rendering

**B) Create Platform Selector Page (`/plataforma`)**

Shown after login when user has access to multiple modules. Three cards:

- "Produtora Audiovisual" -- icon: Clapperboard -- routes to `/`
- "Marketing & Social Media" -- icon: Megaphone -- routes to `/marketing`
- "Agency Suite (Completo)" -- routes to `/` with full sidebar

If user only has access to one module, skip selector and redirect.

**C) Persist selection**

Store in `localStorage` as `squad-active-module`. Restore on refresh.

---

### Phase 3: Context-Aware Sidebar

**Current sidebar**: Single flat list of all menu items.

**New behavior**: Sidebar items filtered by `activeModule`:

| Item | Production | Marketing | Full |
|------|-----------|-----------|------|
| Overview | Yes | Yes (marketing dashboard) | Yes |
| Calendario | Yes | Yes | Yes |
| Projetos | Yes (production only) | Yes (marketing only) | Yes (all) |
| CRM | Yes | Yes | Yes |
| Marketing module | No | Yes | Yes |
| Gerar Posts | No | Yes | Yes |
| Transcricao | No | Yes | Yes |
| Prospeccao | Yes | No | Yes |
| Financeiro | Yes | Yes | Yes |
| Propostas | Yes | No | Yes |
| Contratos | Yes | No | Yes |
| Relatorios | Yes | Yes | Yes |
| Tarefas | Yes | Yes | Yes |

Implementation:
- Each menu item gets a `modules` field: `['production']`, `['marketing']`, or `['production', 'marketing']`
- Sidebar filters items based on `activeModule`
- Add a module switcher pill at the top of the sidebar (below logo)

---

### Phase 4: Project Filtering by Product Type

**A) Update `useProjects` hook**

Add `product_type` filter to all project queries:

```typescript
const { activeModule } = useProductContext();

// When activeModule is 'production', filter product_type = 'production'
// When activeModule is 'marketing', filter product_type = 'marketing'  
// When activeModule is 'full', show all
```

**B) Update New Project Modal**

- Auto-set `product_type` based on `activeModule`
- When in "full" mode, show a selector (Production / Marketing)

**C) Update Projects List, Kanban, Board views**

All already consume `useProjects` -- filtering at the hook level propagates automatically.

---

### Phase 5: Marketing-Specific Project Stages

When `product_type = 'marketing'`, projects use different default stages:

```typescript
const MARKETING_STAGES = [
  { stage_key: 'briefing', title: 'Briefing' },
  { stage_key: 'roteiro', title: 'Roteiro/Copy' },
  { stage_key: 'design', title: 'Design/Criacao' },
  { stage_key: 'revisao', title: 'Revisao Cliente' },
  { stage_key: 'aprovacao', title: 'Aprovacao' },
  { stage_key: 'publicacao', title: 'Publicacao' },
  { stage_key: 'analise', title: 'Analise de Resultado' },
];
```

The `project_stage_settings` table already supports custom stages per workspace. Add a `product_type` filter to stage templates.

---

### Phase 6: Cross-Module Integration Points

These are the "gold" features that connect both verticals:

**A) Marketing roteiro becomes Production task**
- Button on content items: "Enviar para Producao"
- Creates a task linked to the content item's project

**B) Brand Kit sharing**
- Brand kits (already in `brand_kits` table) visible to both modules
- Branding created in marketing available in production projects

**C) Unified financial view**
- `revenues` and `expenses` tables already have `project_id`
- Finance dashboard aggregates across both product types
- Add a filter toggle: "Produtora | Marketing | Todos"

**D) Unified CRM**
- `crm_contacts` and `crm_deals` serve both verticals
- Add `product_type` tag to deals to track origin
- Pipeline shows combined or filtered view

---

### Phase 7: Dashboard Variants

**Production Dashboard** (existing `/` route):
- Keeps current layout: revenue, pipeline, active projects, timeline

**Marketing Dashboard** (existing `/marketing` route):
- Keeps current layout: content calendar, ideas, campaigns, metrics

**Full Dashboard** (new combined view):
- Top row: unified KPIs (revenue from both, total projects, total content)
- Left column: production highlights
- Right column: marketing highlights
- Bottom: unified timeline combining deliveries + publications

---

### Phase 8: Reports Filtering

Add `product_type` filter to all report pages:
- Report 360 shows combined or filtered metrics
- Finance reports can segment by product type
- Marketing reports only show marketing data
- Operations reports show production data

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useProductContext.tsx` | Context provider + hook for active module |
| `src/pages/PlatformSelectorPage.tsx` | Module selection screen after login |
| `src/components/layout/ModuleSwitcher.tsx` | Sidebar pill to switch between modules |

## Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add PlatformSelector route, wrap with ProductProvider |
| `src/components/layout/Sidebar.tsx` | Filter items by module, add ModuleSwitcher |
| `src/hooks/useProjects.tsx` | Add product_type filter to queries |
| `src/components/projects/modals/NewProjectModal.tsx` | Auto-set product_type |
| `src/pages/Dashboard.tsx` | Conditional rendering based on module |
| `src/pages/finance/FinanceDashboard.tsx` | Add product_type filter toggle |
| `src/hooks/useDashboardMetrics.tsx` | Accept product_type filter |
| `src/pages/settings/SettingsDashboard.tsx` | Add "Planos" settings section |

## Database Changes (3 migrations)

1. `ALTER TABLE projects ADD COLUMN product_type text NOT NULL DEFAULT 'production'`
2. `ALTER TABLE profiles ADD COLUMN module_access text[] NOT NULL DEFAULT ARRAY['production','marketing']`
3. `ALTER TABLE workspace_settings ADD COLUMN subscription_plan text NOT NULL DEFAULT 'full'`

## What This Does NOT Change

- Auth system (same login for everyone)
- Task system (tasks are user-scoped, not module-scoped)
- CRM core (contacts/deals shared)
- AI engine (same for both)
- Client portal (project-scoped, works for both types)
- Storage buckets (shared)
- RLS policies (user-scoped, unaffected)
- Design system (same theme, same components)

## Guardrails

- No breaking changes to existing data or features
- All existing projects automatically tagged as `production`
- Users with `full` access see everything as before
- Module filtering is purely additive (filter layer on top of existing queries)
- No new tables -- only 3 new columns
- No secret exposure
- No changes to RLS (module_access is UI-level gating, not security)
