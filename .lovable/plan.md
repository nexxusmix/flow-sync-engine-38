

# Marketing Hub -- Full Implementation Plan

## Current State

The Marketing Hub already exists with:
- `MkAppShell` (layout shell with blue accent, Inter font, ambient glow)
- `MkSidebar` (navigation with all menu items, "Switch Hub" to Film)
- `MkHeader` (search bar, logout)
- `MkDashboardPage` (working dashboard with metric cards, pipeline, quick actions)
- Routes `/m/*` registered in `App.tsx` -- most pointing to `MkPlaceholderPage`

Existing marketing data layer (under `/marketing/*`) has functional hooks and stores (`marketingStore.ts`, content types, campaigns, brand kits, content items, etc.) that can be reused.

## Implementation Sequence

### Phase 1 -- Reusable MK Components Library

Create `src/components/marketing-hub/mk-ui/` with SolaFlux-styled primitives:
- `MkCard` -- glass panel with blue accent hover
- `MkMetricCard` -- large number + sparkline + trend
- `MkStatusBadge` -- blue/amber/emerald/purple pill badges
- `MkEmptyState` -- empty state with icon and CTA
- `MkSectionHeader` -- `// Section` label with tracking-widest
- `MkQuickAction` -- action card (already in dashboard, extract to shared)

All using the existing blue HSL palette (`hsl(210,100%,55%)`) and Inter font from `MkAppShell`.

### Phase 2 -- Campanhas (Campaigns) Page `/m/campanhas`

Create `src/pages/marketing-hub/MkCampaignsPage.tsx`:
- Reuse existing `Campaign` type from `src/types/marketing.ts`
- Reuse existing Supabase tables (`campaigns` table already exists)
- Grid of campaign cards with status badges, date range, budget
- "Nova Campanha" dialog with AI generation option (uses existing `generate-ideas` edge function)
- Link to content items within campaign

### Phase 3 -- Conteudos (Content Pipeline) Page `/m/conteudos`

Create `src/pages/marketing-hub/MkContentsPage.tsx`:
- Kanban board view using `CONTENT_ITEM_STAGES` from `src/types/marketing.ts`
- Reuse existing `content_items` table and `marketingStore`
- Cards show: title, channel icon, format, assigned owner, due date
- Quick status change via drag or dropdown
- Filter bar: channel, pillar, format, campaign

### Phase 4 -- Calendario Editorial `/m/calendario`

Create `src/pages/marketing-hub/MkCalendarPage.tsx`:
- Monthly calendar grid showing content items by `scheduled_at`
- Day cells with colored dots per channel
- Click day to see items + quick create
- Reuse existing `useCalendarEvents` hook adapted for content items

### Phase 5 -- Branding Studio `/m/branding`

Create `src/pages/marketing-hub/MkBrandingPage.tsx`:
- Reuse existing `brand_kits` table and `BrandKit` type
- Display: logo, color swatches (visual), fonts, tone of voice, do/don't lists
- Edit inline with auto-save
- Reference links section
- "Gerar Guidelines com IA" button (invokes Lovable AI via existing action system)

### Phase 6 -- Assets & Midia `/m/assets`

Create `src/pages/marketing-hub/MkAssetsPage.tsx`:
- Grid gallery of `marketing_assets` (already exists in DB)
- Upload to `marketing-assets` bucket (already public)
- Filter by type (logo, template, photo, video, font, LUT)
- Preview modal with metadata
- Drag-and-drop upload zone

### Phase 7 -- Aprovacoes (Approvals) `/m/aprovacoes`

Create `src/pages/marketing-hub/MkApprovalsPage.tsx`:
- List content items in `review` or `approved` status
- Show preview + comments thread
- Approve / Request Changes actions
- Shareable client link (reuse portal token pattern)

### Phase 8 -- Relatorios (Reports) `/m/relatorios`

Create `src/pages/marketing-hub/MkReportsPage.tsx`:
- Marketing metrics overview (reach, engagement, published count)
- Charts using Recharts (already installed)
- Export PDF button (uses existing `export-content-pdf` edge function)

### Phase 9 -- Automacoes `/m/automacoes`

Create `src/pages/marketing-hub/MkAutomationsPage.tsx`:
- Reuse existing `automation_rules` and `automation_suggestions` tables
- Show AI suggestions feed
- "Apply" button per suggestion
- Create new automation rules

### Phase 10 -- Configuracoes `/m/configuracoes`

Create `src/pages/marketing-hub/MkSettingsPage.tsx`:
- Redirect to or embed existing `MarketingSettingsPage` content within `MkAppShell`
- Pillars, channels, formats, tone, frequency

### Phase 11 -- Wire Up Routes in App.tsx

Replace all `MkPlaceholderPage` references with the new functional pages.

---

## Technical Details

### Design Tokens (no changes to Film Hub)
All Marketing Hub styling is scoped to `MkAppShell` which applies:
- `fontFamily: 'Inter'`
- `bg-[#060608]` background
- `hsl(210,100%,55%)` blue accent
- Glass panels with `bg-white/[0.03] border border-white/[0.06]`

The Film Hub remains completely untouched -- different layout components, different routes.

### Data Layer
Reuse existing tables and hooks:
- `campaigns`, `content_items`, `content_ideas`, `brand_kits`, `marketing_assets`
- `marketingStore.ts` (Zustand store)
- `useContentMetrics`, `useAutomation` hooks
- Edge functions: `generate-ideas`, `generate-captions`, `generate-script`, `creative-studio`

### AI Integration
- Uses existing Lovable AI via edge functions already deployed
- "Gerar com IA" buttons invoke `generate-ideas`, `generate-captions`, or `generate-script`
- Speech-to-text available via existing ElevenLabs connector

### No DB Changes Required
All required tables already exist. No migration needed for Phase 1-10.

### Files to Create (per phase)
- ~10 new page files in `src/pages/marketing-hub/`
- ~6 shared MK UI components in `src/components/marketing-hub/mk-ui/`
- 1 edit to `src/App.tsx` (replace placeholder routes)

### What Does NOT Change
- Film Hub layout, routes, styling -- zero changes
- Existing `/marketing/*` routes remain functional
- Supabase schema -- no migrations
- Auth, billing, workspace -- shared as-is

