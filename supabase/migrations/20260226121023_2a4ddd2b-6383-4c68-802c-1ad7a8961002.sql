
-- Webhooks table for outbound webhooks
CREATE TABLE public.webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret TEXT DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view webhooks"
ON public.webhooks FOR SELECT TO authenticated
USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can manage webhooks"
ON public.webhooks FOR INSERT TO authenticated
WITH CHECK (public.get_workspace_role(auth.uid(), workspace_id) IN ('owner', 'admin'));

CREATE POLICY "Admins can update webhooks"
ON public.webhooks FOR UPDATE TO authenticated
USING (public.get_workspace_role(auth.uid(), workspace_id) IN ('owner', 'admin'));

CREATE POLICY "Admins can delete webhooks"
ON public.webhooks FOR DELETE TO authenticated
USING (public.get_workspace_role(auth.uid(), workspace_id) IN ('owner', 'admin'));

-- Webhook delivery log
CREATE TABLE public.webhook_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  response_status INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view deliveries"
ON public.webhook_deliveries FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.webhooks w
  WHERE w.id = webhook_id AND public.is_workspace_member(auth.uid(), w.workspace_id)
));
