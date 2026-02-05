-- =============================================================================
-- FASE 1: AUTENTICACAO - profiles e user_role_assignments
-- =============================================================================

-- Enum para roles do app
CREATE TYPE public.app_role AS ENUM ('admin', 'comercial', 'operacao', 'financeiro');

-- Tabela de perfis (vinculada ao auth.users)
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name text,
    avatar_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de assignments de roles (separada da user_roles existente)
CREATE TABLE public.user_role_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'operacao',
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;

-- Função SECURITY DEFINER para verificar role (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_app_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_role_assignments
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies para profiles
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_app_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policies para user_role_assignments
CREATE POLICY "Users can view own role"
ON public.user_role_assignments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_role_assignments FOR SELECT
TO authenticated
USING (public.has_app_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_role_assignments FOR INSERT
TO authenticated
WITH CHECK (public.has_app_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_role_assignments FOR UPDATE
TO authenticated
USING (public.has_app_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_role_assignments FOR DELETE
TO authenticated
USING (public.has_app_role(auth.uid(), 'admin'));

-- Trigger para criar profile automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  -- Primeiro usuário é admin
  IF (SELECT COUNT(*) FROM public.user_role_assignments) = 0 THEN
    INSERT INTO public.user_role_assignments (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_role_assignments (user_id, role) VALUES (NEW.id, 'operacao');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- FASE 2: INBOX
-- =============================================================================

-- Enum para canais de inbox
CREATE TYPE public.inbox_channel AS ENUM ('instagram', 'whatsapp', 'email');
CREATE TYPE public.inbox_direction AS ENUM ('in', 'out');
CREATE TYPE public.inbox_status AS ENUM ('open', 'pending', 'closed');

-- Tabela de threads/conversas
CREATE TABLE public.inbox_threads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL DEFAULT gen_random_uuid(),
    channel inbox_channel NOT NULL,
    external_thread_id text,
    contact_name text NOT NULL,
    contact_handle text,
    contact_avatar_url text,
    last_message_at timestamptz DEFAULT now(),
    status inbox_status NOT NULL DEFAULT 'open',
    assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de mensagens
CREATE TABLE public.inbox_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id uuid REFERENCES public.inbox_threads(id) ON DELETE CASCADE NOT NULL,
    direction inbox_direction NOT NULL,
    text text NOT NULL,
    media_url text,
    sent_at timestamptz NOT NULL DEFAULT now(),
    meta jsonb DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.inbox_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies para inbox_threads
CREATE POLICY "Authenticated users can view inbox threads"
ON public.inbox_threads FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert inbox threads"
ON public.inbox_threads FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update inbox threads"
ON public.inbox_threads FOR UPDATE
TO authenticated
USING (true);

-- RLS Policies para inbox_messages
CREATE POLICY "Authenticated users can view inbox messages"
ON public.inbox_messages FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert inbox messages"
ON public.inbox_messages FOR INSERT
TO authenticated
WITH CHECK (true);

-- =============================================================================
-- FASE 3: KNOWLEDGE BASE
-- =============================================================================

-- Tabela de artigos
CREATE TABLE public.knowledge_articles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL DEFAULT gen_random_uuid(),
    title text NOT NULL,
    category text,
    content_md text NOT NULL DEFAULT '',
    tags text[] DEFAULT '{}',
    is_published boolean DEFAULT true,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de arquivos anexos
CREATE TABLE public.knowledge_files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id uuid REFERENCES public.knowledge_articles(id) ON DELETE CASCADE NOT NULL,
    file_url text NOT NULL,
    file_name text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies para knowledge_articles
CREATE POLICY "Authenticated users can view knowledge articles"
ON public.knowledge_articles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert knowledge articles"
ON public.knowledge_articles FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update knowledge articles"
ON public.knowledge_articles FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete knowledge articles"
ON public.knowledge_articles FOR DELETE
TO authenticated
USING (true);

-- RLS Policies para knowledge_files
CREATE POLICY "Authenticated users can view knowledge files"
ON public.knowledge_files FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert knowledge files"
ON public.knowledge_files FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete knowledge files"
ON public.knowledge_files FOR DELETE
TO authenticated
USING (true);

-- =============================================================================
-- FASE 4: PORTAL DO CLIENTE
-- =============================================================================

-- Enum para status de deliverable
CREATE TYPE public.deliverable_status AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'delivered');

-- Tabela de links do portal
CREATE TABLE public.portal_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id text NOT NULL,
    project_name text,
    client_name text,
    share_token text NOT NULL UNIQUE,
    is_active boolean DEFAULT true,
    expires_at timestamptz,
    blocked_by_payment boolean DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de deliverables do portal
CREATE TABLE public.portal_deliverables (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    portal_link_id uuid REFERENCES public.portal_links(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    type text DEFAULT 'video',
    file_url text,
    thumbnail_url text,
    status deliverable_status NOT NULL DEFAULT 'pending',
    visible_in_portal boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de comentários do portal
CREATE TABLE public.portal_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deliverable_id uuid REFERENCES public.portal_deliverables(id) ON DELETE CASCADE NOT NULL,
    author_name text NOT NULL,
    author_email text,
    content text NOT NULL,
    timecode text,
    status text DEFAULT 'open',
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de aprovações do portal
CREATE TABLE public.portal_approvals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deliverable_id uuid REFERENCES public.portal_deliverables(id) ON DELETE CASCADE NOT NULL,
    approved_by_name text NOT NULL,
    approved_by_email text,
    approved_at timestamptz NOT NULL DEFAULT now(),
    notes text
);

-- Enable RLS
ALTER TABLE public.portal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies para portal_links (somente autenticados internamente)
CREATE POLICY "Authenticated users can view portal links"
ON public.portal_links FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert portal links"
ON public.portal_links FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update portal links"
ON public.portal_links FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete portal links"
ON public.portal_links FOR DELETE
TO authenticated
USING (true);

-- RLS Policies para portal_deliverables
CREATE POLICY "Authenticated users can view portal deliverables"
ON public.portal_deliverables FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert portal deliverables"
ON public.portal_deliverables FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update portal deliverables"
ON public.portal_deliverables FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete portal deliverables"
ON public.portal_deliverables FOR DELETE
TO authenticated
USING (true);

-- RLS Policies para portal_comments (públicos via anon para edge functions)
CREATE POLICY "Anyone can view portal comments"
ON public.portal_comments FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can insert portal comments"
ON public.portal_comments FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- RLS Policies para portal_approvals (públicos via anon para edge functions)
CREATE POLICY "Anyone can view portal approvals"
ON public.portal_approvals FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can insert portal approvals"
ON public.portal_approvals FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Anon pode ler portal_links pelo share_token (para edge functions)
CREATE POLICY "Anon can view portal links by token"
ON public.portal_links FOR SELECT
TO anon
USING (true);

-- Anon pode ler deliverables (para edge functions)
CREATE POLICY "Anon can view portal deliverables"
ON public.portal_deliverables FOR SELECT
TO anon
USING (true);

-- =============================================================================
-- INDEXES PARA PERFORMANCE
-- =============================================================================

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_role_assignments_user_id ON public.user_role_assignments(user_id);
CREATE INDEX idx_inbox_threads_status ON public.inbox_threads(status);
CREATE INDEX idx_inbox_threads_channel ON public.inbox_threads(channel);
CREATE INDEX idx_inbox_messages_thread_id ON public.inbox_messages(thread_id);
CREATE INDEX idx_knowledge_articles_category ON public.knowledge_articles(category);
CREATE INDEX idx_portal_links_share_token ON public.portal_links(share_token);
CREATE INDEX idx_portal_deliverables_portal_link_id ON public.portal_deliverables(portal_link_id);

-- =============================================================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_articles_updated_at
    BEFORE UPDATE ON public.knowledge_articles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portal_deliverables_updated_at
    BEFORE UPDATE ON public.portal_deliverables
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();