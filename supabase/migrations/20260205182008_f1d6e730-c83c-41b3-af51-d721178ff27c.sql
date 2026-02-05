-- Add missing RLS policies for tables without any

-- knowledge_articles
DROP POLICY IF EXISTS "auth_select_knowledge_articles" ON public.knowledge_articles;
DROP POLICY IF EXISTS "auth_insert_knowledge_articles" ON public.knowledge_articles;
DROP POLICY IF EXISTS "auth_update_knowledge_articles" ON public.knowledge_articles;
DROP POLICY IF EXISTS "auth_delete_knowledge_articles" ON public.knowledge_articles;
CREATE POLICY "auth_select_knowledge_articles" ON public.knowledge_articles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_knowledge_articles" ON public.knowledge_articles FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_knowledge_articles" ON public.knowledge_articles FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_knowledge_articles" ON public.knowledge_articles FOR DELETE USING (auth.uid() IS NOT NULL);

-- knowledge_files
DROP POLICY IF EXISTS "auth_select_knowledge_files" ON public.knowledge_files;
DROP POLICY IF EXISTS "auth_insert_knowledge_files" ON public.knowledge_files;
DROP POLICY IF EXISTS "auth_update_knowledge_files" ON public.knowledge_files;
DROP POLICY IF EXISTS "auth_delete_knowledge_files" ON public.knowledge_files;
CREATE POLICY "auth_select_knowledge_files" ON public.knowledge_files FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_knowledge_files" ON public.knowledge_files FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_knowledge_files" ON public.knowledge_files FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_knowledge_files" ON public.knowledge_files FOR DELETE USING (auth.uid() IS NOT NULL);

-- portal_approvals
DROP POLICY IF EXISTS "auth_select_portal_approvals" ON public.portal_approvals;
DROP POLICY IF EXISTS "auth_insert_portal_approvals" ON public.portal_approvals;
DROP POLICY IF EXISTS "auth_update_portal_approvals" ON public.portal_approvals;
DROP POLICY IF EXISTS "auth_delete_portal_approvals" ON public.portal_approvals;
CREATE POLICY "auth_select_portal_approvals" ON public.portal_approvals FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_portal_approvals" ON public.portal_approvals FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_portal_approvals" ON public.portal_approvals FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_portal_approvals" ON public.portal_approvals FOR DELETE USING (auth.uid() IS NOT NULL);

-- portal_comments
DROP POLICY IF EXISTS "auth_select_portal_comments" ON public.portal_comments;
DROP POLICY IF EXISTS "auth_insert_portal_comments" ON public.portal_comments;
DROP POLICY IF EXISTS "auth_update_portal_comments" ON public.portal_comments;
DROP POLICY IF EXISTS "auth_delete_portal_comments" ON public.portal_comments;
CREATE POLICY "auth_select_portal_comments" ON public.portal_comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_portal_comments" ON public.portal_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_portal_comments" ON public.portal_comments FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_portal_comments" ON public.portal_comments FOR DELETE USING (auth.uid() IS NOT NULL);

-- portal_deliverables
DROP POLICY IF EXISTS "auth_select_portal_deliverables" ON public.portal_deliverables;
DROP POLICY IF EXISTS "auth_insert_portal_deliverables" ON public.portal_deliverables;
DROP POLICY IF EXISTS "auth_update_portal_deliverables" ON public.portal_deliverables;
DROP POLICY IF EXISTS "auth_delete_portal_deliverables" ON public.portal_deliverables;
CREATE POLICY "auth_select_portal_deliverables" ON public.portal_deliverables FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_portal_deliverables" ON public.portal_deliverables FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_portal_deliverables" ON public.portal_deliverables FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_portal_deliverables" ON public.portal_deliverables FOR DELETE USING (auth.uid() IS NOT NULL);

-- portal_links
DROP POLICY IF EXISTS "auth_select_portal_links" ON public.portal_links;
DROP POLICY IF EXISTS "auth_insert_portal_links" ON public.portal_links;
DROP POLICY IF EXISTS "auth_update_portal_links" ON public.portal_links;
DROP POLICY IF EXISTS "auth_delete_portal_links" ON public.portal_links;
CREATE POLICY "auth_select_portal_links" ON public.portal_links FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_portal_links" ON public.portal_links FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_portal_links" ON public.portal_links FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_portal_links" ON public.portal_links FOR DELETE USING (auth.uid() IS NOT NULL);

-- project_stage_settings
DROP POLICY IF EXISTS "auth_select_project_stage_settings" ON public.project_stage_settings;
DROP POLICY IF EXISTS "auth_insert_project_stage_settings" ON public.project_stage_settings;
DROP POLICY IF EXISTS "auth_update_project_stage_settings" ON public.project_stage_settings;
DROP POLICY IF EXISTS "auth_delete_project_stage_settings" ON public.project_stage_settings;
CREATE POLICY "auth_select_project_stage_settings" ON public.project_stage_settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_project_stage_settings" ON public.project_stage_settings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_project_stage_settings" ON public.project_stage_settings FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_project_stage_settings" ON public.project_stage_settings FOR DELETE USING (auth.uid() IS NOT NULL);

-- project_stages
DROP POLICY IF EXISTS "auth_select_project_stages" ON public.project_stages;
DROP POLICY IF EXISTS "auth_insert_project_stages" ON public.project_stages;
DROP POLICY IF EXISTS "auth_update_project_stages" ON public.project_stages;
DROP POLICY IF EXISTS "auth_delete_project_stages" ON public.project_stages;
CREATE POLICY "auth_select_project_stages" ON public.project_stages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_project_stages" ON public.project_stages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_project_stages" ON public.project_stages FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_project_stages" ON public.project_stages FOR DELETE USING (auth.uid() IS NOT NULL);

-- projects
DROP POLICY IF EXISTS "auth_select_projects" ON public.projects;
DROP POLICY IF EXISTS "auth_insert_projects" ON public.projects;
DROP POLICY IF EXISTS "auth_update_projects" ON public.projects;
DROP POLICY IF EXISTS "auth_delete_projects" ON public.projects;
CREATE POLICY "auth_select_projects" ON public.projects FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_projects" ON public.projects FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_projects" ON public.projects FOR DELETE USING (auth.uid() IS NOT NULL);

-- proposal_acceptance
DROP POLICY IF EXISTS "auth_select_proposal_acceptance" ON public.proposal_acceptance;
DROP POLICY IF EXISTS "auth_insert_proposal_acceptance" ON public.proposal_acceptance;
DROP POLICY IF EXISTS "auth_update_proposal_acceptance" ON public.proposal_acceptance;
DROP POLICY IF EXISTS "auth_delete_proposal_acceptance" ON public.proposal_acceptance;
CREATE POLICY "auth_select_proposal_acceptance" ON public.proposal_acceptance FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_proposal_acceptance" ON public.proposal_acceptance FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_proposal_acceptance" ON public.proposal_acceptance FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_proposal_acceptance" ON public.proposal_acceptance FOR DELETE USING (auth.uid() IS NOT NULL);

-- proposal_links
DROP POLICY IF EXISTS "auth_select_proposal_links" ON public.proposal_links;
DROP POLICY IF EXISTS "auth_insert_proposal_links" ON public.proposal_links;
DROP POLICY IF EXISTS "auth_update_proposal_links" ON public.proposal_links;
DROP POLICY IF EXISTS "auth_delete_proposal_links" ON public.proposal_links;
CREATE POLICY "auth_select_proposal_links" ON public.proposal_links FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_proposal_links" ON public.proposal_links FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_proposal_links" ON public.proposal_links FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_proposal_links" ON public.proposal_links FOR DELETE USING (auth.uid() IS NOT NULL);

-- prospect_activities
DROP POLICY IF EXISTS "auth_select_prospect_activities" ON public.prospect_activities;
DROP POLICY IF EXISTS "auth_insert_prospect_activities" ON public.prospect_activities;
DROP POLICY IF EXISTS "auth_update_prospect_activities" ON public.prospect_activities;
DROP POLICY IF EXISTS "auth_delete_prospect_activities" ON public.prospect_activities;
CREATE POLICY "auth_select_prospect_activities" ON public.prospect_activities FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_prospect_activities" ON public.prospect_activities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_prospect_activities" ON public.prospect_activities FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_prospect_activities" ON public.prospect_activities FOR DELETE USING (auth.uid() IS NOT NULL);

-- prospect_opportunities
DROP POLICY IF EXISTS "auth_select_prospect_opportunities" ON public.prospect_opportunities;
DROP POLICY IF EXISTS "auth_insert_prospect_opportunities" ON public.prospect_opportunities;
DROP POLICY IF EXISTS "auth_update_prospect_opportunities" ON public.prospect_opportunities;
DROP POLICY IF EXISTS "auth_delete_prospect_opportunities" ON public.prospect_opportunities;
CREATE POLICY "auth_select_prospect_opportunities" ON public.prospect_opportunities FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_prospect_opportunities" ON public.prospect_opportunities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_prospect_opportunities" ON public.prospect_opportunities FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_prospect_opportunities" ON public.prospect_opportunities FOR DELETE USING (auth.uid() IS NOT NULL);

-- system_flags
DROP POLICY IF EXISTS "auth_select_system_flags" ON public.system_flags;
DROP POLICY IF EXISTS "auth_insert_system_flags" ON public.system_flags;
DROP POLICY IF EXISTS "auth_update_system_flags" ON public.system_flags;
DROP POLICY IF EXISTS "auth_delete_system_flags" ON public.system_flags;
CREATE POLICY "auth_select_system_flags" ON public.system_flags FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_system_flags" ON public.system_flags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_system_flags" ON public.system_flags FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_system_flags" ON public.system_flags FOR DELETE USING (auth.uid() IS NOT NULL);

-- user_roles
DROP POLICY IF EXISTS "auth_select_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "auth_insert_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "auth_update_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "auth_delete_user_roles" ON public.user_roles;
CREATE POLICY "auth_select_user_roles" ON public.user_roles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_user_roles" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_user_roles" ON public.user_roles FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_user_roles" ON public.user_roles FOR DELETE USING (auth.uid() IS NOT NULL);