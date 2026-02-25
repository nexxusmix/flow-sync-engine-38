-- Step 1: Drop old constraint
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;

-- Step 2: Migrate data while no constraint exists
UPDATE public.tasks SET priority = 'high' WHERE priority = 'alta';
UPDATE public.tasks SET priority = 'urgent' WHERE priority = 'urgente';

-- Step 3: Add new constraint with updated values
ALTER TABLE public.tasks ADD CONSTRAINT tasks_priority_check CHECK (priority = ANY (ARRAY['urgent'::text, 'high'::text, 'normal'::text, 'low'::text]));