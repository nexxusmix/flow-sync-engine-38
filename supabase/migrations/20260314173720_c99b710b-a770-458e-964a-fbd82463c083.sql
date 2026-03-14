
-- Add missing columns to existing knowledge_articles
ALTER TABLE public.knowledge_articles ADD COLUMN IF NOT EXISTS summary text;
ALTER TABLE public.knowledge_articles ADD COLUMN IF NOT EXISTS article_type text NOT NULL DEFAULT 'article';
ALTER TABLE public.knowledge_articles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.knowledge_articles ADD COLUMN IF NOT EXISTS reviewer_id uuid;
ALTER TABLE public.knowledge_articles ADD COLUMN IF NOT EXISTS related_entity_type text;
ALTER TABLE public.knowledge_articles ADD COLUMN IF NOT EXISTS related_entity_id text;
ALTER TABLE public.knowledge_articles ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE public.knowledge_articles ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.knowledge_articles ADD COLUMN IF NOT EXISTS helpful_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.knowledge_articles ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public.knowledge_articles ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE public.knowledge_articles ADD COLUMN IF NOT EXISTS category_id uuid;

-- Rename content_md to content if it exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='knowledge_articles' AND column_name='content_md') THEN
    ALTER TABLE public.knowledge_articles RENAME COLUMN content_md TO content;
  END IF;
END $$;

-- Knowledge categories
CREATE TABLE IF NOT EXISTS public.knowledge_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  icon text DEFAULT 'folder',
  sort_order integer NOT NULL DEFAULT 0,
  parent_id uuid REFERENCES public.knowledge_categories(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- FAQ items
CREATE TABLE IF NOT EXISTS public.knowledge_faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  category_id uuid REFERENCES public.knowledge_categories(id) ON DELETE SET NULL,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  views_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Assistant conversations
CREATE TABLE IF NOT EXISTS public.knowledge_assistant_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Nova conversa',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Assistant messages
CREATE TABLE IF NOT EXISTS public.knowledge_assistant_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.knowledge_assistant_conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL,
  sources jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_assistant_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_kb_categories" ON public.knowledge_categories FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_kb_faq" ON public.knowledge_faq_items FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_kb_convos" ON public.knowledge_assistant_conversations FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "auth_kb_msgs" ON public.knowledge_assistant_messages FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.knowledge_assistant_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.knowledge_assistant_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
