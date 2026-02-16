
CREATE TABLE public.saved_focus_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  plan_data JSONB NOT NULL DEFAULT '{}',
  completed_tasks JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_focus_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own focus plans" ON public.saved_focus_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own focus plans" ON public.saved_focus_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own focus plans" ON public.saved_focus_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own focus plans" ON public.saved_focus_plans FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_saved_focus_plans_updated_at
BEFORE UPDATE ON public.saved_focus_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
