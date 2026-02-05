-- FASE 1 PARTE 2: Remove remaining insecure policies
-- Remove "Users can view all X" and "Allow all for X" and similar patterns

-- brand_kits
DROP POLICY IF EXISTS "Users can view all brand_kits" ON public.brand_kits;

-- branding_settings
DROP POLICY IF EXISTS "Allow all for branding_settings" ON public.branding_settings;

-- cadence_steps
DROP POLICY IF EXISTS "Users can view all cadence_steps" ON public.cadence_steps;

-- cadences
DROP POLICY IF EXISTS "Users can view all cadences" ON public.cadences;

-- calendar_connections
DROP POLICY IF EXISTS "Users can view all calendar_connections" ON public.calendar_connections;

-- calendar_events
DROP POLICY IF EXISTS "Users can view all calendar_events" ON public.calendar_events;

-- campaign_creatives
DROP POLICY IF EXISTS "Users can view all campaign_creatives" ON public.campaign_creatives;

-- campaigns
DROP POLICY IF EXISTS "Users can view all campaigns" ON public.campaigns;

-- cashflow_snapshots
DROP POLICY IF EXISTS "Users can view all cashflow_snapshots" ON public.cashflow_snapshots;

-- content_checklist
DROP POLICY IF EXISTS "Users can view all content_checklist" ON public.content_checklist;

-- content_comments
DROP POLICY IF EXISTS "Users can view all content_comments" ON public.content_comments;

-- content_ideas
DROP POLICY IF EXISTS "Users can view all content_ideas" ON public.content_ideas;

-- content_items
DROP POLICY IF EXISTS "Users can view all content_items" ON public.content_items;

-- content_scripts
DROP POLICY IF EXISTS "Users can view all content_scripts" ON public.content_scripts;

-- contract tables - "Allow all for X"
DROP POLICY IF EXISTS "Allow all for contract_addendums" ON public.contract_addendums;
DROP POLICY IF EXISTS "Allow all for contract_alerts" ON public.contract_alerts;
DROP POLICY IF EXISTS "Allow all for contract_links" ON public.contract_links;
DROP POLICY IF EXISTS "Allow all for contract_settings" ON public.contract_settings;
DROP POLICY IF EXISTS "Allow all for contract_signatures" ON public.contract_signatures;
DROP POLICY IF EXISTS "Allow all for contract_templates" ON public.contract_templates;
DROP POLICY IF EXISTS "Allow all for contract_versions" ON public.contract_versions;
DROP POLICY IF EXISTS "Users can view all contracts" ON public.contracts;

-- creative_briefs
DROP POLICY IF EXISTS "Users can view all creative_briefs" ON public.creative_briefs;

-- creative_outputs
DROP POLICY IF EXISTS "Users can view all creative_outputs" ON public.creative_outputs;

-- deadlines
DROP POLICY IF EXISTS "Users can view all deadlines" ON public.deadlines;

-- do_not_contact
DROP POLICY IF EXISTS "Users can view all do_not_contact" ON public.do_not_contact;

-- event_logs
DROP POLICY IF EXISTS "Allow all for event_logs" ON public.event_logs;

-- expenses
DROP POLICY IF EXISTS "Users can view all expenses" ON public.expenses;

-- finance_settings
DROP POLICY IF EXISTS "Allow all for finance_settings" ON public.finance_settings;

-- financial_accounts
DROP POLICY IF EXISTS "Users can view all financial_accounts" ON public.financial_accounts;

-- generated_images
DROP POLICY IF EXISTS "Users can view all generated_images" ON public.generated_images;

-- inbox_messages
DROP POLICY IF EXISTS "Authenticated users can insert inbox messages" ON public.inbox_messages;
DROP POLICY IF EXISTS "Authenticated users can view inbox messages" ON public.inbox_messages;

-- inbox_threads
DROP POLICY IF EXISTS "Authenticated users can insert inbox threads" ON public.inbox_threads;
DROP POLICY IF EXISTS "Authenticated users can update inbox threads" ON public.inbox_threads;
DROP POLICY IF EXISTS "Authenticated users can view inbox threads" ON public.inbox_threads;

-- instagram_connections
DROP POLICY IF EXISTS "Users can view all instagram_connections" ON public.instagram_connections;

-- instagram_references
DROP POLICY IF EXISTS "Users can view all instagram_references" ON public.instagram_references;

-- instagram_snapshots
DROP POLICY IF EXISTS "Users can view all instagram_snapshots" ON public.instagram_snapshots;

-- integration_settings
DROP POLICY IF EXISTS "Allow all for integration_settings" ON public.integration_settings;

-- knowledge_articles
DROP POLICY IF EXISTS "Users can view all knowledge_articles" ON public.knowledge_articles;

-- knowledge_files
DROP POLICY IF EXISTS "Users can view all knowledge_files" ON public.knowledge_files;

-- marketing_assets
DROP POLICY IF EXISTS "Users can view all marketing_assets" ON public.marketing_assets;

-- marketing_settings
DROP POLICY IF EXISTS "Allow all for marketing_settings" ON public.marketing_settings;

-- meeting_notes
DROP POLICY IF EXISTS "Users can view all meeting_notes" ON public.meeting_notes;

-- notification_events
DROP POLICY IF EXISTS "Users can view all notification_events" ON public.notification_events;

-- notification_settings
DROP POLICY IF EXISTS "Allow all for notification_settings" ON public.notification_settings;

-- payment_milestones
DROP POLICY IF EXISTS "Users can view all payment_milestones" ON public.payment_milestones;

-- portal tables
DROP POLICY IF EXISTS "Users can view all portal_approvals" ON public.portal_approvals;
DROP POLICY IF EXISTS "Users can view all portal_comments" ON public.portal_comments;
DROP POLICY IF EXISTS "Users can view all portal_deliverables" ON public.portal_deliverables;
DROP POLICY IF EXISTS "Users can view all portal_links" ON public.portal_links;

-- profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- project tables
DROP POLICY IF EXISTS "Users can view all project_stage_settings" ON public.project_stage_settings;
DROP POLICY IF EXISTS "Users can view all project_stages" ON public.project_stages;
DROP POLICY IF EXISTS "Users can view all projects" ON public.projects;

-- proposal tables
DROP POLICY IF EXISTS "Users can view all proposal_acceptance" ON public.proposal_acceptance;
DROP POLICY IF EXISTS "Users can view all proposal_deliverables" ON public.proposal_deliverables;
DROP POLICY IF EXISTS "Users can view all proposal_links" ON public.proposal_links;
DROP POLICY IF EXISTS "Users can view all proposal_sections" ON public.proposal_sections;
DROP POLICY IF EXISTS "Allow all for proposal_settings" ON public.proposal_settings;
DROP POLICY IF EXISTS "Users can view all proposal_timeline" ON public.proposal_timeline;
DROP POLICY IF EXISTS "Users can view all proposals" ON public.proposals;

-- prospect tables
DROP POLICY IF EXISTS "Users can view all prospect_activities" ON public.prospect_activities;
DROP POLICY IF EXISTS "Users can view all prospect_lists" ON public.prospect_lists;
DROP POLICY IF EXISTS "Users can view all prospect_opportunities" ON public.prospect_opportunities;
DROP POLICY IF EXISTS "Allow all for prospecting_settings" ON public.prospecting_settings;
DROP POLICY IF EXISTS "Users can view all prospects" ON public.prospects;

-- reminders
DROP POLICY IF EXISTS "Users can view all reminders" ON public.reminders;

-- report tables
DROP POLICY IF EXISTS "Users can view all report_exports" ON public.report_exports;
DROP POLICY IF EXISTS "Users can view all report_snapshots" ON public.report_snapshots;

-- revenues
DROP POLICY IF EXISTS "Users can view all revenues" ON public.revenues;

-- storyboard_scenes
DROP POLICY IF EXISTS "Users can view all storyboard_scenes" ON public.storyboard_scenes;

-- system_flags
DROP POLICY IF EXISTS "Users can view all system_flags" ON public.system_flags;

-- user tables
DROP POLICY IF EXISTS "Users can view all user_role_assignments" ON public.user_role_assignments;
DROP POLICY IF EXISTS "Users can view all user_roles" ON public.user_roles;

-- workspace_settings
DROP POLICY IF EXISTS "Allow all for workspace_settings" ON public.workspace_settings;