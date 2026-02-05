-- ============================================================
-- MIGRAÇÃO SEGURA: APENAS TABELAS QUE EXISTEM
-- ============================================================

-- REMOVER POLÍTICAS ABERTAS DAS TABELAS EXISTENTES
-- (usando IF EXISTS para evitar erros)

-- brand_kits
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.brand_kits;
DROP POLICY IF EXISTS "Authenticated users can manage brand_kits" ON public.brand_kits;

-- branding_settings  
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.branding_settings;
DROP POLICY IF EXISTS "Authenticated users can manage branding_settings" ON public.branding_settings;

-- cadence_steps
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.cadence_steps;
DROP POLICY IF EXISTS "Authenticated users can manage cadence_steps" ON public.cadence_steps;

-- cadences
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.cadences;
DROP POLICY IF EXISTS "Authenticated users can manage cadences" ON public.cadences;

-- calendar_connections
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.calendar_connections;
DROP POLICY IF EXISTS "Users can manage own calendar connections" ON public.calendar_connections;

-- calendar_events
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.calendar_events;
DROP POLICY IF EXISTS "Authenticated users can manage calendar_events" ON public.calendar_events;

-- campaign_creatives
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.campaign_creatives;
DROP POLICY IF EXISTS "Authenticated users can manage campaign_creatives" ON public.campaign_creatives;

-- campaigns
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can manage campaigns" ON public.campaigns;

-- cashflow_snapshots
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.cashflow_snapshots;
DROP POLICY IF EXISTS "Authenticated users can manage cashflow_snapshots" ON public.cashflow_snapshots;

-- content_checklist
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.content_checklist;
DROP POLICY IF EXISTS "Authenticated users can manage content_checklist" ON public.content_checklist;

-- content_comments
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.content_comments;
DROP POLICY IF EXISTS "Authenticated users can manage content_comments" ON public.content_comments;

-- content_ideas
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.content_ideas;
DROP POLICY IF EXISTS "Authenticated users can manage content_ideas" ON public.content_ideas;

-- content_items
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.content_items;
DROP POLICY IF EXISTS "Authenticated users can manage content_items" ON public.content_items;

-- content_scripts
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.content_scripts;
DROP POLICY IF EXISTS "Authenticated users can manage content_scripts" ON public.content_scripts;

-- contract_addendums
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.contract_addendums;
DROP POLICY IF EXISTS "Authenticated users can manage contract_addendums" ON public.contract_addendums;

-- contract_alerts
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.contract_alerts;
DROP POLICY IF EXISTS "Authenticated users can manage contract_alerts" ON public.contract_alerts;

-- contract_links
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.contract_links;
DROP POLICY IF EXISTS "Authenticated users can manage contract_links" ON public.contract_links;

-- contract_settings
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.contract_settings;
DROP POLICY IF EXISTS "Authenticated users can manage contract_settings" ON public.contract_settings;

-- contract_signatures
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.contract_signatures;
DROP POLICY IF EXISTS "Authenticated users can manage contract_signatures" ON public.contract_signatures;

-- contract_templates
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.contract_templates;
DROP POLICY IF EXISTS "Authenticated users can manage contract_templates" ON public.contract_templates;

-- contract_versions
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.contract_versions;
DROP POLICY IF EXISTS "Authenticated users can manage contract_versions" ON public.contract_versions;

-- contracts
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can manage contracts" ON public.contracts;

-- creative_briefs
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.creative_briefs;
DROP POLICY IF EXISTS "Authenticated users can manage creative_briefs" ON public.creative_briefs;

-- creative_outputs
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.creative_outputs;
DROP POLICY IF EXISTS "Authenticated users can manage creative_outputs" ON public.creative_outputs;

-- deadlines
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.deadlines;
DROP POLICY IF EXISTS "Authenticated users can manage deadlines" ON public.deadlines;

-- do_not_contact
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.do_not_contact;
DROP POLICY IF EXISTS "Authenticated users can manage do_not_contact" ON public.do_not_contact;

-- event_logs
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.event_logs;
DROP POLICY IF EXISTS "Authenticated users can manage event_logs" ON public.event_logs;
DROP POLICY IF EXISTS "Authenticated users can read event_logs" ON public.event_logs;
DROP POLICY IF EXISTS "Authenticated users can insert event_logs" ON public.event_logs;

-- expenses
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can manage expenses" ON public.expenses;

-- finance_settings
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.finance_settings;
DROP POLICY IF EXISTS "Authenticated users can manage finance_settings" ON public.finance_settings;

-- financial_accounts
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.financial_accounts;
DROP POLICY IF EXISTS "Authenticated users can manage financial_accounts" ON public.financial_accounts;

-- generated_images
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.generated_images;
DROP POLICY IF EXISTS "Authenticated users can manage generated_images" ON public.generated_images;

-- inbox_messages
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.inbox_messages;
DROP POLICY IF EXISTS "Authenticated users can manage inbox_messages" ON public.inbox_messages;

-- inbox_threads
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.inbox_threads;
DROP POLICY IF EXISTS "Authenticated users can manage inbox_threads" ON public.inbox_threads;

-- instagram_connections
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.instagram_connections;
DROP POLICY IF EXISTS "Authenticated users can manage instagram_connections" ON public.instagram_connections;

-- instagram_references
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.instagram_references;
DROP POLICY IF EXISTS "Authenticated users can manage instagram_references" ON public.instagram_references;

-- instagram_snapshots
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.instagram_snapshots;
DROP POLICY IF EXISTS "Authenticated users can manage instagram_snapshots" ON public.instagram_snapshots;

-- integration_settings
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.integration_settings;
DROP POLICY IF EXISTS "Authenticated users can manage integration_settings" ON public.integration_settings;

-- knowledge_articles
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.knowledge_articles;
DROP POLICY IF EXISTS "Authenticated users can manage knowledge_articles" ON public.knowledge_articles;

-- marketing_assets
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.marketing_assets;
DROP POLICY IF EXISTS "Authenticated users can manage marketing_assets" ON public.marketing_assets;

-- marketing_settings
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.marketing_settings;
DROP POLICY IF EXISTS "Authenticated users can manage marketing_settings" ON public.marketing_settings;

-- meeting_notes
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.meeting_notes;
DROP POLICY IF EXISTS "Authenticated users can manage meeting_notes" ON public.meeting_notes;

-- notification_settings
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.notification_settings;
DROP POLICY IF EXISTS "Authenticated users can manage notification_settings" ON public.notification_settings;

-- profiles
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- project_stages
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.project_stages;
DROP POLICY IF EXISTS "Authenticated users can manage project_stages" ON public.project_stages;

-- projects
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can manage projects" ON public.projects;

-- proposal_links
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.proposal_links;
DROP POLICY IF EXISTS "Authenticated users can manage proposal_links" ON public.proposal_links;

-- proposal_settings
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.proposal_settings;
DROP POLICY IF EXISTS "Authenticated users can manage proposal_settings" ON public.proposal_settings;

-- proposals
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.proposals;
DROP POLICY IF EXISTS "Authenticated users can manage proposals" ON public.proposals;

-- prospect_activities
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.prospect_activities;
DROP POLICY IF EXISTS "Authenticated users can manage prospect_activities" ON public.prospect_activities;

-- prospect_lists
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.prospect_lists;
DROP POLICY IF EXISTS "Authenticated users can manage prospect_lists" ON public.prospect_lists;

-- prospect_opportunities
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.prospect_opportunities;
DROP POLICY IF EXISTS "Authenticated users can manage prospect_opportunities" ON public.prospect_opportunities;

-- prospecting_settings
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.prospecting_settings;
DROP POLICY IF EXISTS "Authenticated users can manage prospecting_settings" ON public.prospecting_settings;

-- prospects
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.prospects;
DROP POLICY IF EXISTS "Authenticated users can manage prospects" ON public.prospects;

-- revenues
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.revenues;
DROP POLICY IF EXISTS "Authenticated users can manage revenues" ON public.revenues;

-- user_role_assignments
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.user_role_assignments;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_role_assignments;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_role_assignments;

-- workspace_settings
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.workspace_settings;
DROP POLICY IF EXISTS "Authenticated users can manage workspace_settings" ON public.workspace_settings;

-- ============================================================
-- CRIAR NOVAS POLÍTICAS SEGURAS (auth.uid() IS NOT NULL)
-- ============================================================

-- brand_kits
CREATE POLICY "auth_select_brand_kits" ON public.brand_kits FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_brand_kits" ON public.brand_kits FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_brand_kits" ON public.brand_kits FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_brand_kits" ON public.brand_kits FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- branding_settings
CREATE POLICY "auth_select_branding_settings" ON public.branding_settings FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_branding_settings" ON public.branding_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_branding_settings" ON public.branding_settings FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_branding_settings" ON public.branding_settings FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- cadence_steps
CREATE POLICY "auth_select_cadence_steps" ON public.cadence_steps FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_cadence_steps" ON public.cadence_steps FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_cadence_steps" ON public.cadence_steps FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_cadence_steps" ON public.cadence_steps FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- cadences
CREATE POLICY "auth_select_cadences" ON public.cadences FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_cadences" ON public.cadences FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_cadences" ON public.cadences FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_cadences" ON public.cadences FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- calendar_connections (user specific)
CREATE POLICY "auth_select_calendar_connections" ON public.calendar_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "auth_insert_calendar_connections" ON public.calendar_connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auth_update_calendar_connections" ON public.calendar_connections FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auth_delete_calendar_connections" ON public.calendar_connections FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- calendar_events
CREATE POLICY "auth_select_calendar_events" ON public.calendar_events FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_calendar_events" ON public.calendar_events FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_calendar_events" ON public.calendar_events FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_calendar_events" ON public.calendar_events FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- campaign_creatives
CREATE POLICY "auth_select_campaign_creatives" ON public.campaign_creatives FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_campaign_creatives" ON public.campaign_creatives FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_campaign_creatives" ON public.campaign_creatives FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_campaign_creatives" ON public.campaign_creatives FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- campaigns
CREATE POLICY "auth_select_campaigns" ON public.campaigns FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_campaigns" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_campaigns" ON public.campaigns FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_campaigns" ON public.campaigns FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- cashflow_snapshots
CREATE POLICY "auth_select_cashflow_snapshots" ON public.cashflow_snapshots FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_cashflow_snapshots" ON public.cashflow_snapshots FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_cashflow_snapshots" ON public.cashflow_snapshots FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_cashflow_snapshots" ON public.cashflow_snapshots FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- content_checklist
CREATE POLICY "auth_select_content_checklist" ON public.content_checklist FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_content_checklist" ON public.content_checklist FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_content_checklist" ON public.content_checklist FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_content_checklist" ON public.content_checklist FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- content_comments
CREATE POLICY "auth_select_content_comments" ON public.content_comments FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_content_comments" ON public.content_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_content_comments" ON public.content_comments FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_content_comments" ON public.content_comments FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- content_ideas
CREATE POLICY "auth_select_content_ideas" ON public.content_ideas FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_content_ideas" ON public.content_ideas FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_content_ideas" ON public.content_ideas FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_content_ideas" ON public.content_ideas FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- content_items
CREATE POLICY "auth_select_content_items" ON public.content_items FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_content_items" ON public.content_items FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_content_items" ON public.content_items FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_content_items" ON public.content_items FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- content_scripts
CREATE POLICY "auth_select_content_scripts" ON public.content_scripts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_content_scripts" ON public.content_scripts FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_content_scripts" ON public.content_scripts FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_content_scripts" ON public.content_scripts FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- contract_addendums
CREATE POLICY "auth_select_contract_addendums" ON public.contract_addendums FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_contract_addendums" ON public.contract_addendums FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_contract_addendums" ON public.contract_addendums FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_contract_addendums" ON public.contract_addendums FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- contract_alerts
CREATE POLICY "auth_select_contract_alerts" ON public.contract_alerts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_contract_alerts" ON public.contract_alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_contract_alerts" ON public.contract_alerts FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_contract_alerts" ON public.contract_alerts FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- contract_links
CREATE POLICY "auth_select_contract_links" ON public.contract_links FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_contract_links" ON public.contract_links FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_contract_links" ON public.contract_links FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_contract_links" ON public.contract_links FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- contract_settings
CREATE POLICY "auth_select_contract_settings" ON public.contract_settings FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_contract_settings" ON public.contract_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_contract_settings" ON public.contract_settings FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_contract_settings" ON public.contract_settings FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- contract_signatures
CREATE POLICY "auth_select_contract_signatures" ON public.contract_signatures FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_contract_signatures" ON public.contract_signatures FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_contract_signatures" ON public.contract_signatures FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_contract_signatures" ON public.contract_signatures FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- contract_templates
CREATE POLICY "auth_select_contract_templates" ON public.contract_templates FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_contract_templates" ON public.contract_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_contract_templates" ON public.contract_templates FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_contract_templates" ON public.contract_templates FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- contract_versions
CREATE POLICY "auth_select_contract_versions" ON public.contract_versions FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_contract_versions" ON public.contract_versions FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_contract_versions" ON public.contract_versions FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_contract_versions" ON public.contract_versions FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- contracts
CREATE POLICY "auth_select_contracts" ON public.contracts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_contracts" ON public.contracts FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_contracts" ON public.contracts FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_contracts" ON public.contracts FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- creative_briefs
CREATE POLICY "auth_select_creative_briefs" ON public.creative_briefs FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_creative_briefs" ON public.creative_briefs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_creative_briefs" ON public.creative_briefs FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_creative_briefs" ON public.creative_briefs FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- creative_outputs
CREATE POLICY "auth_select_creative_outputs" ON public.creative_outputs FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_creative_outputs" ON public.creative_outputs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_creative_outputs" ON public.creative_outputs FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_creative_outputs" ON public.creative_outputs FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- deadlines
CREATE POLICY "auth_select_deadlines" ON public.deadlines FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_deadlines" ON public.deadlines FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_deadlines" ON public.deadlines FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_deadlines" ON public.deadlines FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- do_not_contact
CREATE POLICY "auth_select_do_not_contact" ON public.do_not_contact FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_do_not_contact" ON public.do_not_contact FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_do_not_contact" ON public.do_not_contact FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_do_not_contact" ON public.do_not_contact FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- event_logs
CREATE POLICY "auth_select_event_logs" ON public.event_logs FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_event_logs" ON public.event_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- expenses
CREATE POLICY "auth_select_expenses" ON public.expenses FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_expenses" ON public.expenses FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_expenses" ON public.expenses FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- finance_settings
CREATE POLICY "auth_select_finance_settings" ON public.finance_settings FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_finance_settings" ON public.finance_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_finance_settings" ON public.finance_settings FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_finance_settings" ON public.finance_settings FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- financial_accounts
CREATE POLICY "auth_select_financial_accounts" ON public.financial_accounts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_financial_accounts" ON public.financial_accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_financial_accounts" ON public.financial_accounts FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_financial_accounts" ON public.financial_accounts FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- generated_images
CREATE POLICY "auth_select_generated_images" ON public.generated_images FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_generated_images" ON public.generated_images FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_generated_images" ON public.generated_images FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_generated_images" ON public.generated_images FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- inbox_messages
CREATE POLICY "auth_select_inbox_messages" ON public.inbox_messages FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_inbox_messages" ON public.inbox_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_inbox_messages" ON public.inbox_messages FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_inbox_messages" ON public.inbox_messages FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- inbox_threads
CREATE POLICY "auth_select_inbox_threads" ON public.inbox_threads FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_inbox_threads" ON public.inbox_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_inbox_threads" ON public.inbox_threads FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_inbox_threads" ON public.inbox_threads FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- instagram_connections
CREATE POLICY "auth_select_instagram_connections" ON public.instagram_connections FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_instagram_connections" ON public.instagram_connections FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_instagram_connections" ON public.instagram_connections FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_instagram_connections" ON public.instagram_connections FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- instagram_references
CREATE POLICY "auth_select_instagram_references" ON public.instagram_references FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_instagram_references" ON public.instagram_references FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_instagram_references" ON public.instagram_references FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_instagram_references" ON public.instagram_references FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- instagram_snapshots
CREATE POLICY "auth_select_instagram_snapshots" ON public.instagram_snapshots FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_instagram_snapshots" ON public.instagram_snapshots FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_instagram_snapshots" ON public.instagram_snapshots FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_instagram_snapshots" ON public.instagram_snapshots FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- integration_settings
CREATE POLICY "auth_select_integration_settings" ON public.integration_settings FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_integration_settings" ON public.integration_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_integration_settings" ON public.integration_settings FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_integration_settings" ON public.integration_settings FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- knowledge_articles
CREATE POLICY "auth_select_knowledge_articles" ON public.knowledge_articles FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_knowledge_articles" ON public.knowledge_articles FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_knowledge_articles" ON public.knowledge_articles FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_knowledge_articles" ON public.knowledge_articles FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- marketing_assets
CREATE POLICY "auth_select_marketing_assets" ON public.marketing_assets FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_marketing_assets" ON public.marketing_assets FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_marketing_assets" ON public.marketing_assets FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_marketing_assets" ON public.marketing_assets FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- marketing_settings
CREATE POLICY "auth_select_marketing_settings" ON public.marketing_settings FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_marketing_settings" ON public.marketing_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_marketing_settings" ON public.marketing_settings FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_marketing_settings" ON public.marketing_settings FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- meeting_notes
CREATE POLICY "auth_select_meeting_notes" ON public.meeting_notes FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_meeting_notes" ON public.meeting_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_meeting_notes" ON public.meeting_notes FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_meeting_notes" ON public.meeting_notes FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- notification_settings
CREATE POLICY "auth_select_notification_settings" ON public.notification_settings FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_notification_settings" ON public.notification_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_notification_settings" ON public.notification_settings FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_notification_settings" ON public.notification_settings FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- profiles (user can view all, edit own)
CREATE POLICY "auth_select_profiles" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auth_update_profiles" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- project_stages
CREATE POLICY "auth_select_project_stages" ON public.project_stages FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_project_stages" ON public.project_stages FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_project_stages" ON public.project_stages FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_project_stages" ON public.project_stages FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- projects
CREATE POLICY "auth_select_projects" ON public.projects FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_projects" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_projects" ON public.projects FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- proposal_links
CREATE POLICY "auth_select_proposal_links" ON public.proposal_links FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_proposal_links" ON public.proposal_links FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_proposal_links" ON public.proposal_links FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_proposal_links" ON public.proposal_links FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- proposal_settings
CREATE POLICY "auth_select_proposal_settings" ON public.proposal_settings FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_proposal_settings" ON public.proposal_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_proposal_settings" ON public.proposal_settings FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_proposal_settings" ON public.proposal_settings FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- proposals
CREATE POLICY "auth_select_proposals" ON public.proposals FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_proposals" ON public.proposals FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_proposals" ON public.proposals FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_proposals" ON public.proposals FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- prospect_activities
CREATE POLICY "auth_select_prospect_activities" ON public.prospect_activities FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_prospect_activities" ON public.prospect_activities FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_prospect_activities" ON public.prospect_activities FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_prospect_activities" ON public.prospect_activities FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- prospect_lists
CREATE POLICY "auth_select_prospect_lists" ON public.prospect_lists FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_prospect_lists" ON public.prospect_lists FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_prospect_lists" ON public.prospect_lists FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_prospect_lists" ON public.prospect_lists FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- prospect_opportunities
CREATE POLICY "auth_select_prospect_opportunities" ON public.prospect_opportunities FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_prospect_opportunities" ON public.prospect_opportunities FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_prospect_opportunities" ON public.prospect_opportunities FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_prospect_opportunities" ON public.prospect_opportunities FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- prospecting_settings
CREATE POLICY "auth_select_prospecting_settings" ON public.prospecting_settings FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_prospecting_settings" ON public.prospecting_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_prospecting_settings" ON public.prospecting_settings FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_prospecting_settings" ON public.prospecting_settings FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- prospects
CREATE POLICY "auth_select_prospects" ON public.prospects FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_prospects" ON public.prospects FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_prospects" ON public.prospects FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_prospects" ON public.prospects FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- revenues
CREATE POLICY "auth_select_revenues" ON public.revenues FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_revenues" ON public.revenues FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_revenues" ON public.revenues FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_revenues" ON public.revenues FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- user_role_assignments (users view own, admins manage all)
CREATE POLICY "auth_select_user_role_assignments" ON public.user_role_assignments FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_app_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_user_role_assignments" ON public.user_role_assignments FOR INSERT TO authenticated WITH CHECK (public.has_app_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_user_role_assignments" ON public.user_role_assignments FOR UPDATE TO authenticated USING (public.has_app_role(auth.uid(), 'admin')) WITH CHECK (public.has_app_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_user_role_assignments" ON public.user_role_assignments FOR DELETE TO authenticated USING (public.has_app_role(auth.uid(), 'admin'));

-- workspace_settings
CREATE POLICY "auth_select_workspace_settings" ON public.workspace_settings FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_workspace_settings" ON public.workspace_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_workspace_settings" ON public.workspace_settings FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_workspace_settings" ON public.workspace_settings FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- ============================================================
-- CRIAR TABELAS CRM
-- ============================================================

-- CRM Stages (etapas do pipeline)
CREATE TABLE IF NOT EXISTS public.crm_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title text NOT NULL,
  order_index int NOT NULL,
  color text DEFAULT '#6366f1',
  workspace_id text NOT NULL DEFAULT 'default',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.crm_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_crm_stages" ON public.crm_stages FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_crm_stages" ON public.crm_stages FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_crm_stages" ON public.crm_stages FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_crm_stages" ON public.crm_stages FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- Inserir stages padrão
INSERT INTO public.crm_stages (key, title, order_index, color) VALUES
  ('lead', 'Lead', 1, '#94a3b8'),
  ('qualificacao', 'Qualificação', 2, '#f59e0b'),
  ('diagnostico', 'Diagnóstico', 3, '#8b5cf6'),
  ('proposta', 'Proposta', 4, '#3b82f6'),
  ('negociacao', 'Negociação', 5, '#ec4899'),
  ('fechado', 'Fechado', 6, '#22c55e'),
  ('onboarding', 'Onboarding', 7, '#06b6d4'),
  ('pos_venda', 'Pós-Venda', 8, '#10b981')
ON CONFLICT (key) DO NOTHING;

-- CRM Contacts
CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  instagram text,
  company text,
  notes text,
  tags text[],
  workspace_id text NOT NULL DEFAULT 'default',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_crm_contacts" ON public.crm_contacts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_crm_contacts" ON public.crm_contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_crm_contacts" ON public.crm_contacts FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_crm_contacts" ON public.crm_contacts FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- CRM Deals
CREATE TABLE IF NOT EXISTS public.crm_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  stage_key text REFERENCES public.crm_stages(key) DEFAULT 'lead',
  value numeric DEFAULT 0,
  source text,
  score int DEFAULT 0,
  temperature text CHECK (temperature IN ('cold', 'warm', 'hot')) DEFAULT 'warm',
  next_action text,
  next_action_at timestamptz,
  lost_reason text,
  workspace_id text NOT NULL DEFAULT 'default',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_crm_deals" ON public.crm_deals FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_crm_deals" ON public.crm_deals FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_crm_deals" ON public.crm_deals FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_crm_deals" ON public.crm_deals FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_crm_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_crm_contacts_updated_at ON public.crm_contacts;
CREATE TRIGGER update_crm_contacts_updated_at
  BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_crm_updated_at();

DROP TRIGGER IF EXISTS update_crm_deals_updated_at ON public.crm_deals;
CREATE TRIGGER update_crm_deals_updated_at
  BEFORE UPDATE ON public.crm_deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_crm_updated_at();