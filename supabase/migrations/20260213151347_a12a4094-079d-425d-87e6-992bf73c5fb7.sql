
-- Phase 1: Multi-product architecture columns

-- A) Add product_type to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'production';

-- Add check constraint
ALTER TABLE public.projects
  ADD CONSTRAINT projects_product_type_check CHECK (product_type IN ('production', 'marketing'));

-- B) Add module_access to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS module_access text[] NOT NULL DEFAULT ARRAY['production', 'marketing'];

-- C) Add subscription_plan to workspace_settings
ALTER TABLE public.workspace_settings
  ADD COLUMN IF NOT EXISTS subscription_plan text NOT NULL DEFAULT 'full';

ALTER TABLE public.workspace_settings
  ADD CONSTRAINT workspace_settings_subscription_plan_check CHECK (subscription_plan IN ('production', 'marketing', 'full'));
