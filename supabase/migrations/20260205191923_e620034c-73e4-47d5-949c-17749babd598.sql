-- Update handle_new_user to also insert into profiles correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile with proper columns (id, user_id, full_name)
  INSERT INTO public.profiles (id, user_id, full_name)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- First user is admin
  IF (SELECT COUNT(*) FROM public.user_role_assignments) = 0 THEN
    INSERT INTO public.user_role_assignments (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_role_assignments (user_id, role) VALUES (NEW.id, 'operacao');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();