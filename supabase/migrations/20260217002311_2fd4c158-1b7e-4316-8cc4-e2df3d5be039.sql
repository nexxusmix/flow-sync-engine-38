
-- Add created_by column to revenues, expenses, campaigns, content_items
ALTER TABLE public.revenues ADD COLUMN created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.expenses ADD COLUMN created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.campaigns ADD COLUMN created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.content_items ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Drop old RLS policies for revenues
DROP POLICY IF EXISTS "auth_select_revenues" ON public.revenues;
DROP POLICY IF EXISTS "auth_insert_revenues" ON public.revenues;
DROP POLICY IF EXISTS "auth_update_revenues" ON public.revenues;
DROP POLICY IF EXISTS "auth_delete_revenues" ON public.revenues;

-- New RLS policies for revenues (filter by created_by)
CREATE POLICY "auth_select_revenues" ON public.revenues FOR SELECT TO authenticated USING (created_by = auth.uid());
CREATE POLICY "auth_insert_revenues" ON public.revenues FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_revenues" ON public.revenues FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "auth_delete_revenues" ON public.revenues FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Drop old RLS policies for expenses
DROP POLICY IF EXISTS "auth_select_expenses" ON public.expenses;
DROP POLICY IF EXISTS "auth_insert_expenses" ON public.expenses;
DROP POLICY IF EXISTS "auth_update_expenses" ON public.expenses;
DROP POLICY IF EXISTS "auth_delete_expenses" ON public.expenses;

-- New RLS policies for expenses (filter by created_by)
CREATE POLICY "auth_select_expenses" ON public.expenses FOR SELECT TO authenticated USING (created_by = auth.uid());
CREATE POLICY "auth_insert_expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_expenses" ON public.expenses FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "auth_delete_expenses" ON public.expenses FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Drop old RLS policies for campaigns
DROP POLICY IF EXISTS "auth_select_campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "auth_insert_campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "auth_update_campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "auth_delete_campaigns" ON public.campaigns;

-- New RLS policies for campaigns (filter by created_by)
CREATE POLICY "auth_select_campaigns" ON public.campaigns FOR SELECT TO authenticated USING (created_by = auth.uid());
CREATE POLICY "auth_insert_campaigns" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_campaigns" ON public.campaigns FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "auth_delete_campaigns" ON public.campaigns FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Drop old RLS policies for content_items
DROP POLICY IF EXISTS "auth_select_content_items" ON public.content_items;
DROP POLICY IF EXISTS "auth_insert_content_items" ON public.content_items;
DROP POLICY IF EXISTS "auth_update_content_items" ON public.content_items;
DROP POLICY IF EXISTS "auth_delete_content_items" ON public.content_items;

-- New RLS policies for content_items (filter by created_by)
CREATE POLICY "auth_select_content_items" ON public.content_items FOR SELECT TO authenticated USING (created_by = auth.uid());
CREATE POLICY "auth_insert_content_items" ON public.content_items FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_content_items" ON public.content_items FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "auth_delete_content_items" ON public.content_items FOR DELETE TO authenticated USING (created_by = auth.uid());
