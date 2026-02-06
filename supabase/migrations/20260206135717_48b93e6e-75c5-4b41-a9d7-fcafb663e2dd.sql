-- Create campaign_creative_packages table for storing creative packages
CREATE TABLE public.campaign_creative_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  studio_run_id UUID NULL,
  title TEXT NOT NULL,
  package_json JSONB NOT NULL DEFAULT '{}',
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_creative_packages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view creative packages in their workspace"
ON public.campaign_creative_packages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = campaign_id
  )
);

CREATE POLICY "Users can create creative packages"
ON public.campaign_creative_packages
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update creative packages"
ON public.campaign_creative_packages
FOR UPDATE
USING (true);

CREATE POLICY "Users can delete creative packages"
ON public.campaign_creative_packages
FOR DELETE
USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_campaign_creative_packages_updated_at
BEFORE UPDATE ON public.campaign_creative_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();