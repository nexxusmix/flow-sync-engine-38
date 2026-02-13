
-- =====================================================
-- SECURITY HARDENING MIGRATION (FIXED)
-- =====================================================

-- PART 1: Fix USING(true) / WITH CHECK(true) policies

-- action_items
DROP POLICY IF EXISTS "action_items_delete" ON public.action_items;
DROP POLICY IF EXISTS "action_items_insert" ON public.action_items;
DROP POLICY IF EXISTS "action_items_update" ON public.action_items;
CREATE POLICY "auth_action_items_insert" ON public.action_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_action_items_update" ON public.action_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_action_items_delete" ON public.action_items FOR DELETE USING (auth.uid() IS NOT NULL);

-- ai_outbox
DROP POLICY IF EXISTS "auth_ai_outbox_insert" ON public.ai_outbox;
DROP POLICY IF EXISTS "auth_ai_outbox_update" ON public.ai_outbox;
CREATE POLICY "auth_ai_outbox_insert_v2" ON public.ai_outbox FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_ai_outbox_update_v2" ON public.ai_outbox FOR UPDATE USING (auth.uid() IS NOT NULL);

-- alert_actions
DROP POLICY IF EXISTS "Users can insert alert actions" ON public.alert_actions;
CREATE POLICY "auth_alert_actions_insert" ON public.alert_actions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- alert_events
DROP POLICY IF EXISTS "auth_alert_events_insert" ON public.alert_events;
CREATE POLICY "auth_alert_events_insert_v2" ON public.alert_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- alerts
DROP POLICY IF EXISTS "auth_alerts_insert" ON public.alerts;
DROP POLICY IF EXISTS "auth_alerts_update" ON public.alerts;
CREATE POLICY "auth_alerts_insert_v2" ON public.alerts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_alerts_update_v2" ON public.alerts FOR UPDATE USING (auth.uid() IS NOT NULL);

-- automation_rules
DROP POLICY IF EXISTS "Users can update automation rules" ON public.automation_rules;
CREATE POLICY "auth_automation_rules_update" ON public.automation_rules FOR UPDATE USING (auth.uid() IS NOT NULL);

-- automation_suggestions
DROP POLICY IF EXISTS "System can create suggestions" ON public.automation_suggestions;
DROP POLICY IF EXISTS "Users can update their suggestions" ON public.automation_suggestions;
CREATE POLICY "auth_automation_suggestions_insert" ON public.automation_suggestions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_automation_suggestions_update" ON public.automation_suggestions FOR UPDATE USING (auth.uid() IS NOT NULL);

-- campaign_creative_packages
DROP POLICY IF EXISTS "Users can delete creative packages" ON public.campaign_creative_packages;
DROP POLICY IF EXISTS "Users can create creative packages" ON public.campaign_creative_packages;
DROP POLICY IF EXISTS "Users can update creative packages" ON public.campaign_creative_packages;
CREATE POLICY "auth_ccp_insert" ON public.campaign_creative_packages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_ccp_update" ON public.campaign_creative_packages FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_ccp_delete" ON public.campaign_creative_packages FOR DELETE USING (auth.uid() IS NOT NULL);

-- content_assets
DROP POLICY IF EXISTS "Users can delete content assets" ON public.content_assets;
DROP POLICY IF EXISTS "Users can insert content assets" ON public.content_assets;
CREATE POLICY "auth_content_assets_insert" ON public.content_assets FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_content_assets_delete" ON public.content_assets FOR DELETE USING (auth.uid() IS NOT NULL);

-- creative_work_references
DROP POLICY IF EXISTS "Users can manage references" ON public.creative_work_references;
CREATE POLICY "auth_cwr_select" ON public.creative_work_references FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_cwr_insert" ON public.creative_work_references FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_cwr_update" ON public.creative_work_references FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_cwr_delete" ON public.creative_work_references FOR DELETE USING (auth.uid() IS NOT NULL);

-- event_logs
DROP POLICY IF EXISTS "anon_event_logs_insert" ON public.event_logs;
CREATE POLICY "auth_event_logs_insert" ON public.event_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- govbr_signing_sessions
DROP POLICY IF EXISTS "Service role can manage signing sessions" ON public.govbr_signing_sessions;
CREATE POLICY "auth_govbr_select" ON public.govbr_signing_sessions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_govbr_insert" ON public.govbr_signing_sessions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_govbr_update" ON public.govbr_signing_sessions FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_govbr_delete" ON public.govbr_signing_sessions FOR DELETE USING (auth.uid() IS NOT NULL);

-- message_drafts
DROP POLICY IF EXISTS "message_drafts_delete" ON public.message_drafts;
DROP POLICY IF EXISTS "message_drafts_insert" ON public.message_drafts;
DROP POLICY IF EXISTS "message_drafts_update" ON public.message_drafts;
DROP POLICY IF EXISTS "message_drafts_select" ON public.message_drafts;
CREATE POLICY "auth_md_select" ON public.message_drafts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_md_insert" ON public.message_drafts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_md_update" ON public.message_drafts FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_md_delete" ON public.message_drafts FOR DELETE USING (auth.uid() IS NOT NULL);

-- panorama_access_log
DROP POLICY IF EXISTS "auth_panorama_log_insert" ON public.panorama_access_log;
CREATE POLICY "auth_panorama_log_insert_v2" ON public.panorama_access_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- portal_activities (keep INSERT open for anonymous portal tracking)
DROP POLICY IF EXISTS "auth_portal_activities_all" ON public.portal_activities;
DROP POLICY IF EXISTS "anon_portal_activities_insert" ON public.portal_activities;
CREATE POLICY "auth_pa_select" ON public.portal_activities FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "anon_pa_insert" ON public.portal_activities FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_pa_update" ON public.portal_activities FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_pa_delete" ON public.portal_activities FOR DELETE USING (auth.uid() IS NOT NULL);

-- portal_links
DROP POLICY IF EXISTS "auth_portal_links_all" ON public.portal_links;
CREATE POLICY "auth_pl_select" ON public.portal_links FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_pl_insert" ON public.portal_links FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_pl_update" ON public.portal_links FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_pl_delete" ON public.portal_links FOR DELETE USING (auth.uid() IS NOT NULL);

-- project_files
DROP POLICY IF EXISTS "auth_project_files_all" ON public.project_files;
CREATE POLICY "auth_pf_select" ON public.project_files FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_pf_insert" ON public.project_files FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_pf_update" ON public.project_files FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_pf_delete" ON public.project_files FOR DELETE USING (auth.uid() IS NOT NULL);

-- reference_links
DROP POLICY IF EXISTS "Users can delete reference links" ON public.reference_links;
DROP POLICY IF EXISTS "Users can insert reference links" ON public.reference_links;
CREATE POLICY "auth_rl_insert" ON public.reference_links FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_rl_delete" ON public.reference_links FOR DELETE USING (auth.uid() IS NOT NULL);

-- PART 2: Add policies to tables with RLS enabled but NO policies

CREATE POLICY "auth_ne_select" ON public.notification_events FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_ne_insert" ON public.notification_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auth_pm_select" ON public.payment_milestones FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_pm_insert" ON public.payment_milestones FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_pm_update" ON public.payment_milestones FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_pm_delete" ON public.payment_milestones FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_pd_select" ON public.proposal_deliverables FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_pd_insert" ON public.proposal_deliverables FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_pd_update" ON public.proposal_deliverables FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_pd_delete" ON public.proposal_deliverables FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_ps_select" ON public.proposal_sections FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_ps_insert" ON public.proposal_sections FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_ps_update" ON public.proposal_sections FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_ps_delete" ON public.proposal_sections FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_pt_select" ON public.proposal_timeline FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_pt_insert" ON public.proposal_timeline FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_pt_update" ON public.proposal_timeline FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_pt_delete" ON public.proposal_timeline FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_rem_select" ON public.reminders FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_rem_insert" ON public.reminders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_rem_update" ON public.reminders FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_rem_delete" ON public.reminders FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_re_select" ON public.report_exports FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_re_insert" ON public.report_exports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auth_rs_select" ON public.report_snapshots FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_rs_insert" ON public.report_snapshots FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auth_ss_select" ON public.storyboard_scenes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_ss_insert" ON public.storyboard_scenes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_ss_update" ON public.storyboard_scenes FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_ss_delete" ON public.storyboard_scenes FOR DELETE USING (auth.uid() IS NOT NULL);

-- PART 3: Make sensitive storage buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('project-files', 'exports');

-- PART 4: Fix function search path
ALTER FUNCTION public.update_updated_at_column SET search_path = public;
ALTER FUNCTION public.portal_changes_updated_at SET search_path = public;
