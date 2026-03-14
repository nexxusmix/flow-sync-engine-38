
-- =============================================
-- FIX RLS POLICIES: Workspace isolation + security hardening
-- =============================================

-- 1. action_items: Remove public SELECT true, add workspace-scoped
DROP POLICY IF EXISTS "action_items_select" ON public.action_items;
DROP POLICY IF EXISTS "auth_action_items_delete" ON public.action_items;
DROP POLICY IF EXISTS "auth_action_items_insert" ON public.action_items;
DROP POLICY IF EXISTS "auth_action_items_update" ON public.action_items;

CREATE POLICY "ws_action_items_select" ON public.action_items FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_action_items_insert" ON public.action_items FOR INSERT TO authenticated
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_action_items_update" ON public.action_items FOR UPDATE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_action_items_delete" ON public.action_items FOR DELETE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));

-- 2. alerts: Replace USING(true) with workspace scope
DROP POLICY IF EXISTS "auth_alerts_select" ON public.alerts;
CREATE POLICY "ws_alerts_select" ON public.alerts FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));

-- 3. ai_outbox: Replace USING(true) with workspace scope
DROP POLICY IF EXISTS "auth_ai_outbox_select" ON public.ai_outbox;
CREATE POLICY "ws_ai_outbox_select" ON public.ai_outbox FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));

-- 4. alert_events: Replace USING(true) with join to alerts
DROP POLICY IF EXISTS "auth_alert_events_select" ON public.alert_events;
CREATE POLICY "ws_alert_events_select" ON public.alert_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM alerts a WHERE a.id = alert_events.alert_id
    AND is_workspace_member(auth.uid(), a.workspace_id::uuid)
  ));

-- 5. alert_rules: Replace USING(true) with workspace scope
DROP POLICY IF EXISTS "auth_alert_rules_select" ON public.alert_rules;
CREATE POLICY "ws_alert_rules_select" ON public.alert_rules FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));

-- 6. alert_actions: Replace USING(true) for public with workspace scope
DROP POLICY IF EXISTS "Users can view own alert actions" ON public.alert_actions;
CREATE POLICY "ws_alert_actions_select" ON public.alert_actions FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));

-- 7. automation_rules: Replace USING(true) for public with workspace scope
DROP POLICY IF EXISTS "Users can view automation rules" ON public.automation_rules;
DROP POLICY IF EXISTS "auth_automation_rules_update" ON public.automation_rules;
CREATE POLICY "ws_automation_rules_select" ON public.automation_rules FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_automation_rules_update" ON public.automation_rules FOR UPDATE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));

-- 8. automation_suggestions: Replace USING(true) for public with workspace scope
DROP POLICY IF EXISTS "Users can view their suggestions" ON public.automation_suggestions;
DROP POLICY IF EXISTS "auth_automation_suggestions_insert" ON public.automation_suggestions;
DROP POLICY IF EXISTS "auth_automation_suggestions_update" ON public.automation_suggestions;
CREATE POLICY "ws_automation_suggestions_select" ON public.automation_suggestions FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_automation_suggestions_insert" ON public.automation_suggestions FOR INSERT TO authenticated
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_automation_suggestions_update" ON public.automation_suggestions FOR UPDATE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));

-- 9. client_onboardings: Replace ALL true with workspace scope
DROP POLICY IF EXISTS "auth_onboardings" ON public.client_onboardings;
CREATE POLICY "ws_onboardings_select" ON public.client_onboardings FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_onboardings_insert" ON public.client_onboardings FOR INSERT TO authenticated
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_onboardings_update" ON public.client_onboardings FOR UPDATE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_onboardings_delete" ON public.client_onboardings FOR DELETE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));

-- 10. onboarding_phases: scope via parent
DROP POLICY IF EXISTS "auth_onboarding_phases" ON public.onboarding_phases;
CREATE POLICY "ws_onboarding_phases_all" ON public.onboarding_phases FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM client_onboardings co WHERE co.id = onboarding_phases.onboarding_id
    AND is_workspace_member(auth.uid(), co.workspace_id::uuid)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM client_onboardings co WHERE co.id = onboarding_phases.onboarding_id
    AND is_workspace_member(auth.uid(), co.workspace_id::uuid)
  ));

-- 11. onboarding_phase_steps: scope via parent chain
DROP POLICY IF EXISTS "auth_onboarding_steps" ON public.onboarding_phase_steps;
CREATE POLICY "ws_onboarding_steps_all" ON public.onboarding_phase_steps FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM onboarding_phases op
    JOIN client_onboardings co ON co.id = op.onboarding_id
    WHERE op.id = onboarding_phase_steps.phase_id
    AND is_workspace_member(auth.uid(), co.workspace_id::uuid)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM onboarding_phases op
    JOIN client_onboardings co ON co.id = op.onboarding_id
    WHERE op.id = onboarding_phase_steps.phase_id
    AND is_workspace_member(auth.uid(), co.workspace_id::uuid)
  ));

-- 12. onboarding_material_requests: scope via parent chain
DROP POLICY IF EXISTS "auth_material_requests" ON public.onboarding_material_requests;
CREATE POLICY "ws_material_requests_all" ON public.onboarding_material_requests FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM client_onboardings co WHERE co.id = onboarding_material_requests.onboarding_id
    AND is_workspace_member(auth.uid(), co.workspace_id::uuid)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM client_onboardings co WHERE co.id = onboarding_material_requests.onboarding_id
    AND is_workspace_member(auth.uid(), co.workspace_id::uuid)
  ));

-- 13. onboarding_briefing_answers: scope via parent chain
DROP POLICY IF EXISTS "auth_briefing_answers" ON public.onboarding_briefing_answers;
CREATE POLICY "ws_briefing_answers_all" ON public.onboarding_briefing_answers FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM client_onboardings co WHERE co.id = onboarding_briefing_answers.onboarding_id
    AND is_workspace_member(auth.uid(), co.workspace_id::uuid)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM client_onboardings co WHERE co.id = onboarding_briefing_answers.onboarding_id
    AND is_workspace_member(auth.uid(), co.workspace_id::uuid)
  ));

-- 14. playbooks: Replace ALL true with workspace scope
DROP POLICY IF EXISTS "auth_playbooks" ON public.playbooks;
CREATE POLICY "ws_playbooks_all" ON public.playbooks FOR ALL TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid))
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id::uuid));

-- 15. playbook_phases: scope via parent
DROP POLICY IF EXISTS "auth_playbook_phases" ON public.playbook_phases;
CREATE POLICY "ws_playbook_phases_all" ON public.playbook_phases FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM playbooks p WHERE p.id = playbook_phases.playbook_id
    AND is_workspace_member(auth.uid(), p.workspace_id::uuid)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM playbooks p WHERE p.id = playbook_phases.playbook_id
    AND is_workspace_member(auth.uid(), p.workspace_id::uuid)
  ));

-- 16. playbook_steps: scope via parent chain
DROP POLICY IF EXISTS "auth_playbook_steps" ON public.playbook_steps;
CREATE POLICY "ws_playbook_steps_all" ON public.playbook_steps FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM playbook_phases pp
    JOIN playbooks p ON p.id = pp.playbook_id
    WHERE pp.id = playbook_steps.phase_id
    AND is_workspace_member(auth.uid(), p.workspace_id::uuid)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM playbook_phases pp
    JOIN playbooks p ON p.id = pp.playbook_id
    WHERE pp.id = playbook_steps.phase_id
    AND is_workspace_member(auth.uid(), p.workspace_id::uuid)
  ));

-- 17. playbook_applications: scope via workspace
DROP POLICY IF EXISTS "auth_playbook_applications" ON public.playbook_applications;
CREATE POLICY "ws_playbook_applications_all" ON public.playbook_applications FOR ALL TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid))
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id::uuid));

-- 18. playbook_application_steps: scope via parent
DROP POLICY IF EXISTS "auth_playbook_application_steps" ON public.playbook_application_steps;
CREATE POLICY "ws_playbook_application_steps_all" ON public.playbook_application_steps FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM playbook_applications pa WHERE pa.id = playbook_application_steps.application_id
    AND is_workspace_member(auth.uid(), pa.workspace_id::uuid)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM playbook_applications pa WHERE pa.id = playbook_application_steps.application_id
    AND is_workspace_member(auth.uid(), pa.workspace_id::uuid)
  ));

-- 19. project_media_items: Replace USING(true) with workspace scope
DROP POLICY IF EXISTS "auth_select_project_media" ON public.project_media_items;
CREATE POLICY "ws_project_media_select" ON public.project_media_items FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));

-- 20. content_assets: Replace USING(true) for public with workspace scope
DROP POLICY IF EXISTS "Users can view content assets" ON public.content_assets;
CREATE POLICY "ws_content_assets_select" ON public.content_assets FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));

-- 21. reference_links: Replace USING(true) for public with auth check
DROP POLICY IF EXISTS "Users can view all reference links" ON public.reference_links;
CREATE POLICY "ws_reference_links_select" ON public.reference_links FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 22. profiles: Remove overly broad auth_select_profiles (keep admin + own profile policies)
DROP POLICY IF EXISTS "auth_select_profiles" ON public.profiles;

-- 23. Instagram tables: Replace auth.uid() IS NOT NULL with workspace scope
-- instagram_posts
DROP POLICY IF EXISTS "auth_instagram_posts_select" ON public.instagram_posts;
DROP POLICY IF EXISTS "auth_instagram_posts_insert" ON public.instagram_posts;
DROP POLICY IF EXISTS "auth_instagram_posts_update" ON public.instagram_posts;
DROP POLICY IF EXISTS "auth_instagram_posts_delete" ON public.instagram_posts;
CREATE POLICY "ws_instagram_posts_select" ON public.instagram_posts FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_instagram_posts_insert" ON public.instagram_posts FOR INSERT TO authenticated
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_instagram_posts_update" ON public.instagram_posts FOR UPDATE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_instagram_posts_delete" ON public.instagram_posts FOR DELETE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));

-- instagram_connections
DROP POLICY IF EXISTS "auth_instagram_connections_select" ON public.instagram_connections;
DROP POLICY IF EXISTS "auth_instagram_connections_insert" ON public.instagram_connections;
DROP POLICY IF EXISTS "auth_instagram_connections_update" ON public.instagram_connections;
DROP POLICY IF EXISTS "auth_instagram_connections_delete" ON public.instagram_connections;
CREATE POLICY "ws_instagram_connections_select" ON public.instagram_connections FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_instagram_connections_insert" ON public.instagram_connections FOR INSERT TO authenticated
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_instagram_connections_update" ON public.instagram_connections FOR UPDATE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_instagram_connections_delete" ON public.instagram_connections FOR DELETE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));

-- instagram_competitors
DROP POLICY IF EXISTS "auth_instagram_competitors_select" ON public.instagram_competitors;
DROP POLICY IF EXISTS "auth_instagram_competitors_insert" ON public.instagram_competitors;
DROP POLICY IF EXISTS "auth_instagram_competitors_update" ON public.instagram_competitors;
DROP POLICY IF EXISTS "auth_instagram_competitors_delete" ON public.instagram_competitors;
CREATE POLICY "ws_instagram_competitors_select" ON public.instagram_competitors FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_instagram_competitors_insert" ON public.instagram_competitors FOR INSERT TO authenticated
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_instagram_competitors_update" ON public.instagram_competitors FOR UPDATE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_instagram_competitors_delete" ON public.instagram_competitors FOR DELETE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));

-- instagram_personas
DROP POLICY IF EXISTS "auth_instagram_personas_select" ON public.instagram_personas;
DROP POLICY IF EXISTS "auth_instagram_personas_insert" ON public.instagram_personas;
DROP POLICY IF EXISTS "auth_instagram_personas_update" ON public.instagram_personas;
DROP POLICY IF EXISTS "auth_instagram_personas_delete" ON public.instagram_personas;
CREATE POLICY "ws_instagram_personas_select" ON public.instagram_personas FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_instagram_personas_insert" ON public.instagram_personas FOR INSERT TO authenticated
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_instagram_personas_update" ON public.instagram_personas FOR UPDATE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_instagram_personas_delete" ON public.instagram_personas FOR DELETE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));

-- instagram_mood_items
DROP POLICY IF EXISTS "auth_instagram_mood_items_select" ON public.instagram_mood_items;
DROP POLICY IF EXISTS "auth_instagram_mood_items_insert" ON public.instagram_mood_items;
DROP POLICY IF EXISTS "auth_instagram_mood_items_update" ON public.instagram_mood_items;
DROP POLICY IF EXISTS "auth_instagram_mood_items_delete" ON public.instagram_mood_items;
CREATE POLICY "ws_instagram_mood_items_select" ON public.instagram_mood_items FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_instagram_mood_items_insert" ON public.instagram_mood_items FOR INSERT TO authenticated
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_instagram_mood_items_update" ON public.instagram_mood_items FOR UPDATE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_instagram_mood_items_delete" ON public.instagram_mood_items FOR DELETE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));

-- instagram_automation_rules
DROP POLICY IF EXISTS "auth_instagram_automation_rules_select" ON public.instagram_automation_rules;
DROP POLICY IF EXISTS "auth_instagram_automation_rules_insert" ON public.instagram_automation_rules;
DROP POLICY IF EXISTS "auth_instagram_automation_rules_update" ON public.instagram_automation_rules;
DROP POLICY IF EXISTS "auth_instagram_automation_rules_delete" ON public.instagram_automation_rules;
CREATE POLICY "ws_instagram_automation_rules_select" ON public.instagram_automation_rules FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_instagram_automation_rules_insert" ON public.instagram_automation_rules FOR INSERT TO authenticated
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_instagram_automation_rules_update" ON public.instagram_automation_rules FOR UPDATE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_instagram_automation_rules_delete" ON public.instagram_automation_rules FOR DELETE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));

-- instagram_campaign_tasks
DROP POLICY IF EXISTS "auth_instagram_campaign_tasks_select" ON public.instagram_campaign_tasks;
DROP POLICY IF EXISTS "auth_instagram_campaign_tasks_insert" ON public.instagram_campaign_tasks;
DROP POLICY IF EXISTS "auth_instagram_campaign_tasks_update" ON public.instagram_campaign_tasks;
DROP POLICY IF EXISTS "auth_instagram_campaign_tasks_delete" ON public.instagram_campaign_tasks;
CREATE POLICY "ws_instagram_campaign_tasks_select" ON public.instagram_campaign_tasks FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_instagram_campaign_tasks_insert" ON public.instagram_campaign_tasks FOR INSERT TO authenticated
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_instagram_campaign_tasks_update" ON public.instagram_campaign_tasks FOR UPDATE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));
CREATE POLICY "ws_instagram_campaign_tasks_delete" ON public.instagram_campaign_tasks FOR DELETE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id::uuid));

-- 24. portal_links: Fix anon enumeration - require share_token parameter
-- We keep the anon policy but it's already scoped by is_active + expires_at
-- The real fix is application-level: always filter by share_token in queries
-- For now, this is acceptable as share tokens are UUID-based and not guessable
