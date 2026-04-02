# _unused Campaign Components

Moved on 2026-04-02 during codebase cleanup.

## Why these were moved

These 72 `Campaign*.tsx` components are sub-views of `CampaignsTab.tsx`. They are NOT imported by any file outside `src/components/instagram-engine/`. The only consumer is `CampaignsTab.tsx`, which was updated to import from this `_unused/` directory so the build remains intact.

**Important:** These files are still imported by `CampaignsTab.tsx` via `_unused/` paths. If you delete them, the build will break. To fully remove them, also clean up the imports and JSX in `CampaignsTab.tsx`.

## What is here (72 files)

| Category | Components |
|----------|-----------|
| A/B Testing | CampaignABComparison, CampaignABTestFramework, CampaignABTesting |
| Ads & Copy | CampaignAdsCopyGenerator, CampaignSpinGenerator |
| AI & Automation | CampaignAITools, CampaignAutomation, CampaignAutoPlanner, CampaignRepostAutomation |
| Alerts | CampaignAlerts, CampaignSmartAlerts |
| Analytics | CampaignAnalyticsAdvanced, CampaignAudienceHeatmap, CampaignHeatmap, CampaignSentimentAnalysis |
| Approval | CampaignApprovalPipeline, CampaignApprovalWorkflow |
| Briefing | CampaignBriefingGenerator, CampaignCreativeBriefing |
| Budget | CampaignBudgetAllocator |
| Calendar | CampaignCalendar, CampaignHolidayCalendar, CampaignSeasonal, CampaignUnifiedCalendar |
| Changelog | CampaignChangelog |
| Client | CampaignClientReview |
| Cloner | CampaignCloner |
| Collaboration | CampaignCollaboration, CampaignCollaborationBoard |
| Compare | CampaignCompare, CampaignComparison, CampaignCrossComparator |
| Competitor | CampaignCompetitorShadow, CampaignCompetitorTracker |
| Content | CampaignContentFunnel, CampaignContentGapAnalyzer, CampaignContentMap, CampaignContentRecycling, CampaignSplitContent, CampaignSwipeFiles |
| DNA & Journey | CampaignCustomerJourney, CampaignDNA, CampaignStoryArc |
| Feed & Preview | CampaignFeedPreview |
| Funnel | CampaignFunnelView |
| Goals | CampaignGoals |
| Hashtags | CampaignHashtagIntelligence, CampaignHashtagPlanner |
| Health | CampaignHealthScore, CampaignRiskScore |
| Kanban | CampaignKanban |
| Mood | CampaignMoodBoard, CampaignMoodTracker |
| Performance | CampaignPerformanceDashboard, CampaignVelocityTracker |
| Persona | CampaignPersonaMap |
| Pitch | CampaignPitchDeck |
| Post Mortem | CampaignAutopsy, CampaignPostMortem |
| Publish | CampaignPublishQueue |
| Reports | CampaignFinalReport, CampaignPDFReport, CampaignPostReport, CampaignROIDashboard |
| Simulator | CampaignResultsSimulator |
| Templates | CampaignTemplateLibrary |
| Timeline | CampaignGanttTimeline, CampaignTimeline, CampaignTimingOptimizer |
| War Room | CampaignMicroBlitz, CampaignWarRoom |
| Wizard | CampaignWizard |

## To restore a component

Move it back to `src/components/instagram-engine/` and update its import in `CampaignsTab.tsx` from `./_unused/ComponentName` to `./ComponentName`.
