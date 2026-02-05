-- FASE 1: RLS CLEANUP - Remove insecure duplicate policies
-- Only for tables that actually exist

-- brand_kits
DROP POLICY IF EXISTS "Users can delete brand_kits" ON public.brand_kits;
DROP POLICY IF EXISTS "Users can insert brand_kits" ON public.brand_kits;
DROP POLICY IF EXISTS "Users can select brand_kits" ON public.brand_kits;
DROP POLICY IF EXISTS "Users can update brand_kits" ON public.brand_kits;

-- branding_settings
DROP POLICY IF EXISTS "Users can delete branding_settings" ON public.branding_settings;
DROP POLICY IF EXISTS "Users can insert branding_settings" ON public.branding_settings;
DROP POLICY IF EXISTS "Users can select branding_settings" ON public.branding_settings;
DROP POLICY IF EXISTS "Users can update branding_settings" ON public.branding_settings;

-- cadence_steps
DROP POLICY IF EXISTS "Users can delete cadence_steps" ON public.cadence_steps;
DROP POLICY IF EXISTS "Users can insert cadence_steps" ON public.cadence_steps;
DROP POLICY IF EXISTS "Users can select cadence_steps" ON public.cadence_steps;
DROP POLICY IF EXISTS "Users can update cadence_steps" ON public.cadence_steps;

-- cadences
DROP POLICY IF EXISTS "Users can delete cadences" ON public.cadences;
DROP POLICY IF EXISTS "Users can insert cadences" ON public.cadences;
DROP POLICY IF EXISTS "Users can select cadences" ON public.cadences;
DROP POLICY IF EXISTS "Users can update cadences" ON public.cadences;

-- calendar_connections
DROP POLICY IF EXISTS "Users can delete calendar_connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Users can insert calendar_connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Users can select calendar_connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Users can update calendar_connections" ON public.calendar_connections;

-- calendar_events
DROP POLICY IF EXISTS "Users can delete calendar_events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can insert calendar_events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can select calendar_events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can update calendar_events" ON public.calendar_events;

-- campaign_creatives
DROP POLICY IF EXISTS "Users can delete campaign_creatives" ON public.campaign_creatives;
DROP POLICY IF EXISTS "Users can insert campaign_creatives" ON public.campaign_creatives;
DROP POLICY IF EXISTS "Users can select campaign_creatives" ON public.campaign_creatives;
DROP POLICY IF EXISTS "Users can update campaign_creatives" ON public.campaign_creatives;

-- campaigns
DROP POLICY IF EXISTS "Users can delete campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can insert campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can select campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update campaigns" ON public.campaigns;

-- cashflow_snapshots
DROP POLICY IF EXISTS "Users can delete cashflow_snapshots" ON public.cashflow_snapshots;
DROP POLICY IF EXISTS "Users can insert cashflow_snapshots" ON public.cashflow_snapshots;
DROP POLICY IF EXISTS "Users can select cashflow_snapshots" ON public.cashflow_snapshots;
DROP POLICY IF EXISTS "Users can update cashflow_snapshots" ON public.cashflow_snapshots;

-- content_checklist
DROP POLICY IF EXISTS "Users can delete content_checklist" ON public.content_checklist;
DROP POLICY IF EXISTS "Users can insert content_checklist" ON public.content_checklist;
DROP POLICY IF EXISTS "Users can select content_checklist" ON public.content_checklist;
DROP POLICY IF EXISTS "Users can update content_checklist" ON public.content_checklist;

-- content_comments
DROP POLICY IF EXISTS "Users can delete content_comments" ON public.content_comments;
DROP POLICY IF EXISTS "Users can insert content_comments" ON public.content_comments;
DROP POLICY IF EXISTS "Users can select content_comments" ON public.content_comments;
DROP POLICY IF EXISTS "Users can update content_comments" ON public.content_comments;

-- content_ideas
DROP POLICY IF EXISTS "Users can delete content_ideas" ON public.content_ideas;
DROP POLICY IF EXISTS "Users can insert content_ideas" ON public.content_ideas;
DROP POLICY IF EXISTS "Users can select content_ideas" ON public.content_ideas;
DROP POLICY IF EXISTS "Users can update content_ideas" ON public.content_ideas;

-- content_items
DROP POLICY IF EXISTS "Users can delete content_items" ON public.content_items;
DROP POLICY IF EXISTS "Users can insert content_items" ON public.content_items;
DROP POLICY IF EXISTS "Users can select content_items" ON public.content_items;
DROP POLICY IF EXISTS "Users can update content_items" ON public.content_items;

-- content_scripts
DROP POLICY IF EXISTS "Users can delete content_scripts" ON public.content_scripts;
DROP POLICY IF EXISTS "Users can insert content_scripts" ON public.content_scripts;
DROP POLICY IF EXISTS "Users can select content_scripts" ON public.content_scripts;
DROP POLICY IF EXISTS "Users can update content_scripts" ON public.content_scripts;

-- contract_addendums
DROP POLICY IF EXISTS "Users can delete contract_addendums" ON public.contract_addendums;
DROP POLICY IF EXISTS "Users can insert contract_addendums" ON public.contract_addendums;
DROP POLICY IF EXISTS "Users can select contract_addendums" ON public.contract_addendums;
DROP POLICY IF EXISTS "Users can update contract_addendums" ON public.contract_addendums;

-- contract_alerts
DROP POLICY IF EXISTS "Users can delete contract_alerts" ON public.contract_alerts;
DROP POLICY IF EXISTS "Users can insert contract_alerts" ON public.contract_alerts;
DROP POLICY IF EXISTS "Users can select contract_alerts" ON public.contract_alerts;
DROP POLICY IF EXISTS "Users can update contract_alerts" ON public.contract_alerts;

-- contract_links
DROP POLICY IF EXISTS "Users can delete contract_links" ON public.contract_links;
DROP POLICY IF EXISTS "Users can insert contract_links" ON public.contract_links;
DROP POLICY IF EXISTS "Users can select contract_links" ON public.contract_links;
DROP POLICY IF EXISTS "Users can update contract_links" ON public.contract_links;

-- contract_settings
DROP POLICY IF EXISTS "Users can delete contract_settings" ON public.contract_settings;
DROP POLICY IF EXISTS "Users can insert contract_settings" ON public.contract_settings;
DROP POLICY IF EXISTS "Users can select contract_settings" ON public.contract_settings;
DROP POLICY IF EXISTS "Users can update contract_settings" ON public.contract_settings;

-- contract_signatures
DROP POLICY IF EXISTS "Users can delete contract_signatures" ON public.contract_signatures;
DROP POLICY IF EXISTS "Users can insert contract_signatures" ON public.contract_signatures;
DROP POLICY IF EXISTS "Users can select contract_signatures" ON public.contract_signatures;
DROP POLICY IF EXISTS "Users can update contract_signatures" ON public.contract_signatures;

-- contract_templates
DROP POLICY IF EXISTS "Users can delete contract_templates" ON public.contract_templates;
DROP POLICY IF EXISTS "Users can insert contract_templates" ON public.contract_templates;
DROP POLICY IF EXISTS "Users can select contract_templates" ON public.contract_templates;
DROP POLICY IF EXISTS "Users can update contract_templates" ON public.contract_templates;

-- contract_versions
DROP POLICY IF EXISTS "Users can delete contract_versions" ON public.contract_versions;
DROP POLICY IF EXISTS "Users can insert contract_versions" ON public.contract_versions;
DROP POLICY IF EXISTS "Users can select contract_versions" ON public.contract_versions;
DROP POLICY IF EXISTS "Users can update contract_versions" ON public.contract_versions;

-- contracts
DROP POLICY IF EXISTS "Users can delete contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can insert contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can select contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can update contracts" ON public.contracts;

-- creative_briefs
DROP POLICY IF EXISTS "Users can delete creative_briefs" ON public.creative_briefs;
DROP POLICY IF EXISTS "Users can insert creative_briefs" ON public.creative_briefs;
DROP POLICY IF EXISTS "Users can select creative_briefs" ON public.creative_briefs;
DROP POLICY IF EXISTS "Users can update creative_briefs" ON public.creative_briefs;

-- creative_outputs
DROP POLICY IF EXISTS "Users can delete creative_outputs" ON public.creative_outputs;
DROP POLICY IF EXISTS "Users can insert creative_outputs" ON public.creative_outputs;
DROP POLICY IF EXISTS "Users can select creative_outputs" ON public.creative_outputs;
DROP POLICY IF EXISTS "Users can update creative_outputs" ON public.creative_outputs;

-- crm_contacts
DROP POLICY IF EXISTS "Users can delete crm_contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "Users can insert crm_contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "Users can select crm_contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "Users can update crm_contacts" ON public.crm_contacts;

-- crm_deals
DROP POLICY IF EXISTS "Users can delete crm_deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can insert crm_deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can select crm_deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can update crm_deals" ON public.crm_deals;

-- crm_stages
DROP POLICY IF EXISTS "Users can delete crm_stages" ON public.crm_stages;
DROP POLICY IF EXISTS "Users can insert crm_stages" ON public.crm_stages;
DROP POLICY IF EXISTS "Users can select crm_stages" ON public.crm_stages;
DROP POLICY IF EXISTS "Users can update crm_stages" ON public.crm_stages;

-- deadlines
DROP POLICY IF EXISTS "Users can delete deadlines" ON public.deadlines;
DROP POLICY IF EXISTS "Users can insert deadlines" ON public.deadlines;
DROP POLICY IF EXISTS "Users can select deadlines" ON public.deadlines;
DROP POLICY IF EXISTS "Users can update deadlines" ON public.deadlines;

-- do_not_contact
DROP POLICY IF EXISTS "Users can delete do_not_contact" ON public.do_not_contact;
DROP POLICY IF EXISTS "Users can insert do_not_contact" ON public.do_not_contact;
DROP POLICY IF EXISTS "Users can select do_not_contact" ON public.do_not_contact;
DROP POLICY IF EXISTS "Users can update do_not_contact" ON public.do_not_contact;

-- event_logs
DROP POLICY IF EXISTS "Users can delete event_logs" ON public.event_logs;
DROP POLICY IF EXISTS "Users can insert event_logs" ON public.event_logs;
DROP POLICY IF EXISTS "Users can select event_logs" ON public.event_logs;
DROP POLICY IF EXISTS "Users can update event_logs" ON public.event_logs;

-- expenses
DROP POLICY IF EXISTS "Users can delete expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can select expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update expenses" ON public.expenses;

-- finance_settings
DROP POLICY IF EXISTS "Users can delete finance_settings" ON public.finance_settings;
DROP POLICY IF EXISTS "Users can insert finance_settings" ON public.finance_settings;
DROP POLICY IF EXISTS "Users can select finance_settings" ON public.finance_settings;
DROP POLICY IF EXISTS "Users can update finance_settings" ON public.finance_settings;

-- financial_accounts
DROP POLICY IF EXISTS "Users can delete financial_accounts" ON public.financial_accounts;
DROP POLICY IF EXISTS "Users can insert financial_accounts" ON public.financial_accounts;
DROP POLICY IF EXISTS "Users can select financial_accounts" ON public.financial_accounts;
DROP POLICY IF EXISTS "Users can update financial_accounts" ON public.financial_accounts;

-- generated_images
DROP POLICY IF EXISTS "Users can delete generated_images" ON public.generated_images;
DROP POLICY IF EXISTS "Users can insert generated_images" ON public.generated_images;
DROP POLICY IF EXISTS "Users can select generated_images" ON public.generated_images;
DROP POLICY IF EXISTS "Users can update generated_images" ON public.generated_images;

-- inbox_messages
DROP POLICY IF EXISTS "Users can delete inbox_messages" ON public.inbox_messages;
DROP POLICY IF EXISTS "Users can insert inbox_messages" ON public.inbox_messages;
DROP POLICY IF EXISTS "Users can select inbox_messages" ON public.inbox_messages;
DROP POLICY IF EXISTS "Users can update inbox_messages" ON public.inbox_messages;

-- inbox_threads
DROP POLICY IF EXISTS "Users can delete inbox_threads" ON public.inbox_threads;
DROP POLICY IF EXISTS "Users can insert inbox_threads" ON public.inbox_threads;
DROP POLICY IF EXISTS "Users can select inbox_threads" ON public.inbox_threads;
DROP POLICY IF EXISTS "Users can update inbox_threads" ON public.inbox_threads;

-- instagram_connections
DROP POLICY IF EXISTS "Users can delete instagram_connections" ON public.instagram_connections;
DROP POLICY IF EXISTS "Users can insert instagram_connections" ON public.instagram_connections;
DROP POLICY IF EXISTS "Users can select instagram_connections" ON public.instagram_connections;
DROP POLICY IF EXISTS "Users can update instagram_connections" ON public.instagram_connections;

-- instagram_references
DROP POLICY IF EXISTS "Users can delete instagram_references" ON public.instagram_references;
DROP POLICY IF EXISTS "Users can insert instagram_references" ON public.instagram_references;
DROP POLICY IF EXISTS "Users can select instagram_references" ON public.instagram_references;
DROP POLICY IF EXISTS "Users can update instagram_references" ON public.instagram_references;

-- instagram_snapshots
DROP POLICY IF EXISTS "Users can delete instagram_snapshots" ON public.instagram_snapshots;
DROP POLICY IF EXISTS "Users can insert instagram_snapshots" ON public.instagram_snapshots;
DROP POLICY IF EXISTS "Users can select instagram_snapshots" ON public.instagram_snapshots;
DROP POLICY IF EXISTS "Users can update instagram_snapshots" ON public.instagram_snapshots;

-- integration_settings
DROP POLICY IF EXISTS "Users can delete integration_settings" ON public.integration_settings;
DROP POLICY IF EXISTS "Users can insert integration_settings" ON public.integration_settings;
DROP POLICY IF EXISTS "Users can select integration_settings" ON public.integration_settings;
DROP POLICY IF EXISTS "Users can update integration_settings" ON public.integration_settings;

-- knowledge_articles
DROP POLICY IF EXISTS "Users can delete knowledge_articles" ON public.knowledge_articles;
DROP POLICY IF EXISTS "Users can insert knowledge_articles" ON public.knowledge_articles;
DROP POLICY IF EXISTS "Users can select knowledge_articles" ON public.knowledge_articles;
DROP POLICY IF EXISTS "Users can update knowledge_articles" ON public.knowledge_articles;

-- knowledge_files
DROP POLICY IF EXISTS "Users can delete knowledge_files" ON public.knowledge_files;
DROP POLICY IF EXISTS "Users can insert knowledge_files" ON public.knowledge_files;
DROP POLICY IF EXISTS "Users can select knowledge_files" ON public.knowledge_files;
DROP POLICY IF EXISTS "Users can update knowledge_files" ON public.knowledge_files;

-- marketing_assets
DROP POLICY IF EXISTS "Users can delete marketing_assets" ON public.marketing_assets;
DROP POLICY IF EXISTS "Users can insert marketing_assets" ON public.marketing_assets;
DROP POLICY IF EXISTS "Users can select marketing_assets" ON public.marketing_assets;
DROP POLICY IF EXISTS "Users can update marketing_assets" ON public.marketing_assets;

-- marketing_settings
DROP POLICY IF EXISTS "Users can delete marketing_settings" ON public.marketing_settings;
DROP POLICY IF EXISTS "Users can insert marketing_settings" ON public.marketing_settings;
DROP POLICY IF EXISTS "Users can select marketing_settings" ON public.marketing_settings;
DROP POLICY IF EXISTS "Users can update marketing_settings" ON public.marketing_settings;

-- meeting_notes
DROP POLICY IF EXISTS "Users can delete meeting_notes" ON public.meeting_notes;
DROP POLICY IF EXISTS "Users can insert meeting_notes" ON public.meeting_notes;
DROP POLICY IF EXISTS "Users can select meeting_notes" ON public.meeting_notes;
DROP POLICY IF EXISTS "Users can update meeting_notes" ON public.meeting_notes;

-- notification_events
DROP POLICY IF EXISTS "Users can delete notification_events" ON public.notification_events;
DROP POLICY IF EXISTS "Users can insert notification_events" ON public.notification_events;
DROP POLICY IF EXISTS "Users can select notification_events" ON public.notification_events;
DROP POLICY IF EXISTS "Users can update notification_events" ON public.notification_events;

-- notification_settings
DROP POLICY IF EXISTS "Users can delete notification_settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can insert notification_settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can select notification_settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update notification_settings" ON public.notification_settings;

-- payment_milestones
DROP POLICY IF EXISTS "Users can delete payment_milestones" ON public.payment_milestones;
DROP POLICY IF EXISTS "Users can insert payment_milestones" ON public.payment_milestones;
DROP POLICY IF EXISTS "Users can select payment_milestones" ON public.payment_milestones;
DROP POLICY IF EXISTS "Users can update payment_milestones" ON public.payment_milestones;

-- portal_approvals
DROP POLICY IF EXISTS "Users can delete portal_approvals" ON public.portal_approvals;
DROP POLICY IF EXISTS "Users can insert portal_approvals" ON public.portal_approvals;
DROP POLICY IF EXISTS "Users can select portal_approvals" ON public.portal_approvals;
DROP POLICY IF EXISTS "Users can update portal_approvals" ON public.portal_approvals;

-- portal_comments
DROP POLICY IF EXISTS "Users can delete portal_comments" ON public.portal_comments;
DROP POLICY IF EXISTS "Users can insert portal_comments" ON public.portal_comments;
DROP POLICY IF EXISTS "Users can select portal_comments" ON public.portal_comments;
DROP POLICY IF EXISTS "Users can update portal_comments" ON public.portal_comments;

-- portal_deliverables
DROP POLICY IF EXISTS "Users can delete portal_deliverables" ON public.portal_deliverables;
DROP POLICY IF EXISTS "Users can insert portal_deliverables" ON public.portal_deliverables;
DROP POLICY IF EXISTS "Users can select portal_deliverables" ON public.portal_deliverables;
DROP POLICY IF EXISTS "Users can update portal_deliverables" ON public.portal_deliverables;

-- portal_links
DROP POLICY IF EXISTS "Users can delete portal_links" ON public.portal_links;
DROP POLICY IF EXISTS "Users can insert portal_links" ON public.portal_links;
DROP POLICY IF EXISTS "Users can select portal_links" ON public.portal_links;
DROP POLICY IF EXISTS "Users can update portal_links" ON public.portal_links;

-- profiles
DROP POLICY IF EXISTS "Users can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can select profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON public.profiles;

-- project_stage_settings
DROP POLICY IF EXISTS "Users can delete project_stage_settings" ON public.project_stage_settings;
DROP POLICY IF EXISTS "Users can insert project_stage_settings" ON public.project_stage_settings;
DROP POLICY IF EXISTS "Users can select project_stage_settings" ON public.project_stage_settings;
DROP POLICY IF EXISTS "Users can update project_stage_settings" ON public.project_stage_settings;

-- project_stages
DROP POLICY IF EXISTS "Users can delete project_stages" ON public.project_stages;
DROP POLICY IF EXISTS "Users can insert project_stages" ON public.project_stages;
DROP POLICY IF EXISTS "Users can select project_stages" ON public.project_stages;
DROP POLICY IF EXISTS "Users can update project_stages" ON public.project_stages;

-- projects
DROP POLICY IF EXISTS "Users can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Users can select projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update projects" ON public.projects;

-- proposal_acceptance
DROP POLICY IF EXISTS "Users can delete proposal_acceptance" ON public.proposal_acceptance;
DROP POLICY IF EXISTS "Users can insert proposal_acceptance" ON public.proposal_acceptance;
DROP POLICY IF EXISTS "Users can select proposal_acceptance" ON public.proposal_acceptance;
DROP POLICY IF EXISTS "Users can update proposal_acceptance" ON public.proposal_acceptance;

-- proposal_deliverables
DROP POLICY IF EXISTS "Users can delete proposal_deliverables" ON public.proposal_deliverables;
DROP POLICY IF EXISTS "Users can insert proposal_deliverables" ON public.proposal_deliverables;
DROP POLICY IF EXISTS "Users can select proposal_deliverables" ON public.proposal_deliverables;
DROP POLICY IF EXISTS "Users can update proposal_deliverables" ON public.proposal_deliverables;

-- proposal_links
DROP POLICY IF EXISTS "Users can delete proposal_links" ON public.proposal_links;
DROP POLICY IF EXISTS "Users can insert proposal_links" ON public.proposal_links;
DROP POLICY IF EXISTS "Users can select proposal_links" ON public.proposal_links;
DROP POLICY IF EXISTS "Users can update proposal_links" ON public.proposal_links;

-- proposal_sections
DROP POLICY IF EXISTS "Users can delete proposal_sections" ON public.proposal_sections;
DROP POLICY IF EXISTS "Users can insert proposal_sections" ON public.proposal_sections;
DROP POLICY IF EXISTS "Users can select proposal_sections" ON public.proposal_sections;
DROP POLICY IF EXISTS "Users can update proposal_sections" ON public.proposal_sections;

-- proposal_settings
DROP POLICY IF EXISTS "Users can delete proposal_settings" ON public.proposal_settings;
DROP POLICY IF EXISTS "Users can insert proposal_settings" ON public.proposal_settings;
DROP POLICY IF EXISTS "Users can select proposal_settings" ON public.proposal_settings;
DROP POLICY IF EXISTS "Users can update proposal_settings" ON public.proposal_settings;

-- proposal_timeline
DROP POLICY IF EXISTS "Users can delete proposal_timeline" ON public.proposal_timeline;
DROP POLICY IF EXISTS "Users can insert proposal_timeline" ON public.proposal_timeline;
DROP POLICY IF EXISTS "Users can select proposal_timeline" ON public.proposal_timeline;
DROP POLICY IF EXISTS "Users can update proposal_timeline" ON public.proposal_timeline;

-- proposals
DROP POLICY IF EXISTS "Users can delete proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can insert proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can select proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can update proposals" ON public.proposals;

-- prospect_activities
DROP POLICY IF EXISTS "Users can delete prospect_activities" ON public.prospect_activities;
DROP POLICY IF EXISTS "Users can insert prospect_activities" ON public.prospect_activities;
DROP POLICY IF EXISTS "Users can select prospect_activities" ON public.prospect_activities;
DROP POLICY IF EXISTS "Users can update prospect_activities" ON public.prospect_activities;

-- prospect_lists
DROP POLICY IF EXISTS "Users can delete prospect_lists" ON public.prospect_lists;
DROP POLICY IF EXISTS "Users can insert prospect_lists" ON public.prospect_lists;
DROP POLICY IF EXISTS "Users can select prospect_lists" ON public.prospect_lists;
DROP POLICY IF EXISTS "Users can update prospect_lists" ON public.prospect_lists;

-- prospect_opportunities
DROP POLICY IF EXISTS "Users can delete prospect_opportunities" ON public.prospect_opportunities;
DROP POLICY IF EXISTS "Users can insert prospect_opportunities" ON public.prospect_opportunities;
DROP POLICY IF EXISTS "Users can select prospect_opportunities" ON public.prospect_opportunities;
DROP POLICY IF EXISTS "Users can update prospect_opportunities" ON public.prospect_opportunities;

-- prospecting_settings
DROP POLICY IF EXISTS "Users can delete prospecting_settings" ON public.prospecting_settings;
DROP POLICY IF EXISTS "Users can insert prospecting_settings" ON public.prospecting_settings;
DROP POLICY IF EXISTS "Users can select prospecting_settings" ON public.prospecting_settings;
DROP POLICY IF EXISTS "Users can update prospecting_settings" ON public.prospecting_settings;

-- prospects
DROP POLICY IF EXISTS "Users can delete prospects" ON public.prospects;
DROP POLICY IF EXISTS "Users can insert prospects" ON public.prospects;
DROP POLICY IF EXISTS "Users can select prospects" ON public.prospects;
DROP POLICY IF EXISTS "Users can update prospects" ON public.prospects;

-- reminders
DROP POLICY IF EXISTS "Users can delete reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can insert reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can select reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can update reminders" ON public.reminders;

-- report_exports
DROP POLICY IF EXISTS "Users can delete report_exports" ON public.report_exports;
DROP POLICY IF EXISTS "Users can insert report_exports" ON public.report_exports;
DROP POLICY IF EXISTS "Users can select report_exports" ON public.report_exports;
DROP POLICY IF EXISTS "Users can update report_exports" ON public.report_exports;

-- report_snapshots
DROP POLICY IF EXISTS "Users can delete report_snapshots" ON public.report_snapshots;
DROP POLICY IF EXISTS "Users can insert report_snapshots" ON public.report_snapshots;
DROP POLICY IF EXISTS "Users can select report_snapshots" ON public.report_snapshots;
DROP POLICY IF EXISTS "Users can update report_snapshots" ON public.report_snapshots;

-- revenues
DROP POLICY IF EXISTS "Users can delete revenues" ON public.revenues;
DROP POLICY IF EXISTS "Users can insert revenues" ON public.revenues;
DROP POLICY IF EXISTS "Users can select revenues" ON public.revenues;
DROP POLICY IF EXISTS "Users can update revenues" ON public.revenues;

-- storyboard_scenes
DROP POLICY IF EXISTS "Users can delete storyboard_scenes" ON public.storyboard_scenes;
DROP POLICY IF EXISTS "Users can insert storyboard_scenes" ON public.storyboard_scenes;
DROP POLICY IF EXISTS "Users can select storyboard_scenes" ON public.storyboard_scenes;
DROP POLICY IF EXISTS "Users can update storyboard_scenes" ON public.storyboard_scenes;

-- system_flags
DROP POLICY IF EXISTS "Users can delete system_flags" ON public.system_flags;
DROP POLICY IF EXISTS "Users can insert system_flags" ON public.system_flags;
DROP POLICY IF EXISTS "Users can select system_flags" ON public.system_flags;
DROP POLICY IF EXISTS "Users can update system_flags" ON public.system_flags;

-- user_role_assignments
DROP POLICY IF EXISTS "Users can delete user_role_assignments" ON public.user_role_assignments;
DROP POLICY IF EXISTS "Users can insert user_role_assignments" ON public.user_role_assignments;
DROP POLICY IF EXISTS "Users can select user_role_assignments" ON public.user_role_assignments;
DROP POLICY IF EXISTS "Users can update user_role_assignments" ON public.user_role_assignments;

-- user_roles (if exists separately)
DROP POLICY IF EXISTS "Users can delete user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can select user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update user_roles" ON public.user_roles;

-- workspace_settings
DROP POLICY IF EXISTS "Users can delete workspace_settings" ON public.workspace_settings;
DROP POLICY IF EXISTS "Users can insert workspace_settings" ON public.workspace_settings;
DROP POLICY IF EXISTS "Users can select workspace_settings" ON public.workspace_settings;
DROP POLICY IF EXISTS "Users can update workspace_settings" ON public.workspace_settings;