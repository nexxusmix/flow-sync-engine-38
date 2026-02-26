
-- Workspace members table
CREATE TYPE public.workspace_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

CREATE TABLE public.workspace_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role workspace_role NOT NULL DEFAULT 'editor',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Security definer function to check workspace membership
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id uuid, _workspace_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_workspace_role(_user_id uuid, _workspace_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid)
RETURNS workspace_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.workspace_members
  WHERE user_id = _user_id AND workspace_id = _workspace_id
  LIMIT 1
$$;

-- RLS: members can see other members in their workspace
CREATE POLICY "Members can view workspace members"
ON public.workspace_members FOR SELECT
TO authenticated
USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Only owner/admin can insert
CREATE POLICY "Admins can invite members"
ON public.workspace_members FOR INSERT
TO authenticated
WITH CHECK (
  public.get_workspace_role(auth.uid(), workspace_id) IN ('owner', 'admin')
);

-- Only owner/admin can update roles
CREATE POLICY "Admins can update member roles"
ON public.workspace_members FOR UPDATE
TO authenticated
USING (public.get_workspace_role(auth.uid(), workspace_id) IN ('owner', 'admin'));

-- Only owner/admin can remove, or user can remove self
CREATE POLICY "Admins can remove members or self-leave"
ON public.workspace_members FOR DELETE
TO authenticated
USING (
  public.get_workspace_role(auth.uid(), workspace_id) IN ('owner', 'admin')
  OR user_id = auth.uid()
);

-- Workspace invites table
CREATE TABLE public.workspace_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  email TEXT NOT NULL,
  role workspace_role NOT NULL DEFAULT 'editor',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, email, status)
);

ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view workspace invites"
ON public.workspace_invites FOR SELECT
TO authenticated
USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can create invites"
ON public.workspace_invites FOR INSERT
TO authenticated
WITH CHECK (
  public.get_workspace_role(auth.uid(), workspace_id) IN ('owner', 'admin')
);

CREATE POLICY "Admins can update invites"
ON public.workspace_invites FOR UPDATE
TO authenticated
USING (public.get_workspace_role(auth.uid(), workspace_id) IN ('owner', 'admin'));

CREATE POLICY "Admins can delete invites"
ON public.workspace_invites FOR DELETE
TO authenticated
USING (public.get_workspace_role(auth.uid(), workspace_id) IN ('owner', 'admin'));

-- Auto-add existing users as owners
-- (trigger for new signups to auto-join default workspace)
CREATE OR REPLACE FUNCTION public.auto_add_workspace_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_count integer;
BEGIN
  SELECT COUNT(*) INTO v_member_count FROM public.workspace_members
  WHERE workspace_id = '00000000-0000-0000-0000-000000000000'::uuid;

  IF v_member_count = 0 THEN
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES ('00000000-0000-0000-0000-000000000000'::uuid, NEW.id, 'owner')
    ON CONFLICT DO NOTHING;
  ELSE
    -- Check if there's a pending invite for this email
    IF EXISTS (
      SELECT 1 FROM public.workspace_invites
      WHERE email = NEW.email AND status = 'pending'
        AND expires_at > now()
        AND workspace_id = '00000000-0000-0000-0000-000000000000'::uuid
    ) THEN
      INSERT INTO public.workspace_members (workspace_id, user_id, role)
      SELECT workspace_id, NEW.id, role
      FROM public.workspace_invites
      WHERE email = NEW.email AND status = 'pending'
        AND expires_at > now()
        AND workspace_id = '00000000-0000-0000-0000-000000000000'::uuid
      LIMIT 1
      ON CONFLICT DO NOTHING;

      UPDATE public.workspace_invites
      SET status = 'accepted'
      WHERE email = NEW.email AND status = 'pending'
        AND workspace_id = '00000000-0000-0000-0000-000000000000'::uuid;
    ELSE
      INSERT INTO public.workspace_members (workspace_id, user_id, role)
      VALUES ('00000000-0000-0000-0000-000000000000'::uuid, NEW.id, 'editor')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_workspace
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.auto_add_workspace_member();

-- Seed existing users as members
INSERT INTO public.workspace_members (workspace_id, user_id, role)
SELECT '00000000-0000-0000-0000-000000000000'::uuid, id,
  CASE WHEN (SELECT COUNT(*) FROM public.workspace_members) = 0 THEN 'owner'::workspace_role ELSE 'editor'::workspace_role END
FROM auth.users
ON CONFLICT DO NOTHING;
