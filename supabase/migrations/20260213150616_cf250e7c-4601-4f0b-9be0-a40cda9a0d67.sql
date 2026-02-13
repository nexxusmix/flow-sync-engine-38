
-- Add new columns to tasks table for premium features
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS progress integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS start_date text,
  ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_refined boolean NOT NULL DEFAULT false;

-- Add constraint for priority values
ALTER TABLE public.tasks ADD CONSTRAINT tasks_priority_check 
  CHECK (priority IN ('normal', 'alta', 'urgente'));

-- Add constraint for progress range  
ALTER TABLE public.tasks ADD CONSTRAINT tasks_progress_check 
  CHECK (progress >= 0 AND progress <= 100);
