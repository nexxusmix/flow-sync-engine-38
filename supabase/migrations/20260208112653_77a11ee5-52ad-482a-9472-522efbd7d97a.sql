-- Alterar entity_id de UUID para TEXT para suportar IDs compostos como "instagram-2026-02-22"
ALTER TABLE public.automation_suggestions 
ALTER COLUMN entity_id TYPE TEXT;