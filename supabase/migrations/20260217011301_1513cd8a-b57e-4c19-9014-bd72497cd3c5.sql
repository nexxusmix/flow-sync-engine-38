-- Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Backfill emails from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id
  AND p.email IS NULL;

-- Update handle_new_user to also store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, user_id, full_name, email)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  
  IF (SELECT COUNT(*) FROM public.user_role_assignments) = 0 THEN
    INSERT INTO public.user_role_assignments (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_role_assignments (user_id, role) VALUES (NEW.id, 'operacao');
  END IF;
  
  RETURN NEW;
END;
$function$;