-- FASE 1 PARTE 3: Remove final insecure policies

-- knowledge_articles
DROP POLICY IF EXISTS "Authenticated users can insert knowledge articles" ON public.knowledge_articles;
DROP POLICY IF EXISTS "Authenticated users can delete knowledge articles" ON public.knowledge_articles;
DROP POLICY IF EXISTS "Authenticated users can update knowledge articles" ON public.knowledge_articles;
DROP POLICY IF EXISTS "Authenticated users can view knowledge articles" ON public.knowledge_articles;

-- knowledge_files
DROP POLICY IF EXISTS "Authenticated users can insert knowledge files" ON public.knowledge_files;
DROP POLICY IF EXISTS "Authenticated users can delete knowledge files" ON public.knowledge_files;
DROP POLICY IF EXISTS "Authenticated users can view knowledge files" ON public.knowledge_files;

-- portal_approvals
DROP POLICY IF EXISTS "Anyone can view portal approvals" ON public.portal_approvals;
DROP POLICY IF EXISTS "Anyone can insert portal approvals" ON public.portal_approvals;

-- portal_comments
DROP POLICY IF EXISTS "Anyone can view portal comments" ON public.portal_comments;
DROP POLICY IF EXISTS "Anyone can insert portal comments" ON public.portal_comments;

-- portal_deliverables
DROP POLICY IF EXISTS "Authenticated users can delete portal deliverables" ON public.portal_deliverables;
DROP POLICY IF EXISTS "Authenticated users can update portal deliverables" ON public.portal_deliverables;
DROP POLICY IF EXISTS "Anon can view portal deliverables" ON public.portal_deliverables;
DROP POLICY IF EXISTS "Authenticated users can insert portal deliverables" ON public.portal_deliverables;
DROP POLICY IF EXISTS "Authenticated users can view portal deliverables" ON public.portal_deliverables;

-- portal_links
DROP POLICY IF EXISTS "Authenticated users can update portal links" ON public.portal_links;
DROP POLICY IF EXISTS "Anon can view portal links by token" ON public.portal_links;
DROP POLICY IF EXISTS "Authenticated users can view portal links" ON public.portal_links;
DROP POLICY IF EXISTS "Authenticated users can insert portal links" ON public.portal_links;
DROP POLICY IF EXISTS "Authenticated users can delete portal links" ON public.portal_links;

-- project_stage_settings
DROP POLICY IF EXISTS "Allow all for project_stage_settings" ON public.project_stage_settings;

-- project_stages
DROP POLICY IF EXISTS "project_stages_select_authenticated" ON public.project_stages;

-- projects
DROP POLICY IF EXISTS "projects_select_authenticated" ON public.projects;

-- proposal_acceptance
DROP POLICY IF EXISTS "Anyone can view proposal_acceptance" ON public.proposal_acceptance;
DROP POLICY IF EXISTS "Anyone can insert proposal_acceptance" ON public.proposal_acceptance;

-- proposal_links
DROP POLICY IF EXISTS "Anyone can update proposal_links" ON public.proposal_links;
DROP POLICY IF EXISTS "Anyone can view proposal_links" ON public.proposal_links;

-- prospect_activities
DROP POLICY IF EXISTS "prospect_activities_select" ON public.prospect_activities;

-- prospect_opportunities
DROP POLICY IF EXISTS "prospect_opportunities_select" ON public.prospect_opportunities;

-- system_flags
DROP POLICY IF EXISTS "Allow all for system_flags" ON public.system_flags;

-- user_roles
DROP POLICY IF EXISTS "Allow all for user_roles" ON public.user_roles;