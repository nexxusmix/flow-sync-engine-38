-- Add anonymous access policies for client portal

-- portal_deliverables: Allow anonymous select for visible deliverables on active links
CREATE POLICY "anon_portal_deliverables_select" 
ON public.portal_deliverables FOR SELECT
USING (
  visible_in_portal = true 
  AND EXISTS (
    SELECT 1 FROM public.portal_links 
    WHERE portal_links.id = portal_deliverables.portal_link_id 
    AND portal_links.is_active = true
    AND (portal_links.expires_at IS NULL OR portal_links.expires_at > now())
  )
);

-- portal_comments: Allow anonymous select for comments on visible deliverables
CREATE POLICY "anon_portal_comments_select" 
ON public.portal_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.portal_deliverables d
    JOIN public.portal_links l ON l.id = d.portal_link_id
    WHERE d.id = portal_comments.deliverable_id
    AND d.visible_in_portal = true
    AND l.is_active = true
    AND (l.expires_at IS NULL OR l.expires_at > now())
  )
);

-- portal_comments: Allow anonymous insert for client comments
CREATE POLICY "anon_portal_comments_insert" 
ON public.portal_comments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.portal_deliverables d
    JOIN public.portal_links l ON l.id = d.portal_link_id
    WHERE d.id = portal_comments.deliverable_id
    AND d.visible_in_portal = true
    AND l.is_active = true
    AND (l.expires_at IS NULL OR l.expires_at > now())
  )
);

-- portal_approvals: Allow anonymous select for approvals
CREATE POLICY "anon_portal_approvals_select" 
ON public.portal_approvals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.portal_deliverables d
    JOIN public.portal_links l ON l.id = d.portal_link_id
    WHERE d.id = portal_approvals.deliverable_id
    AND d.visible_in_portal = true
    AND l.is_active = true
    AND (l.expires_at IS NULL OR l.expires_at > now())
  )
);

-- portal_approvals: Allow anonymous insert for client approvals
CREATE POLICY "anon_portal_approvals_insert" 
ON public.portal_approvals FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.portal_deliverables d
    JOIN public.portal_links l ON l.id = d.portal_link_id
    WHERE d.id = portal_approvals.deliverable_id
    AND d.visible_in_portal = true
    AND l.is_active = true
    AND l.blocked_by_payment = false
    AND (l.expires_at IS NULL OR l.expires_at > now())
  )
);