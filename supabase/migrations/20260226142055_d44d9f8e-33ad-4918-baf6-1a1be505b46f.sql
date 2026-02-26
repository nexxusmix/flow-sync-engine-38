
-- Content Templates library
CREATE TABLE public.content_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  created_by UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  format TEXT NOT NULL DEFAULT 'reels', -- reels, carrossel, stories, post, thread
  category TEXT DEFAULT 'geral', -- educacional, vendas, engajamento, bastidores, autoridade
  thumbnail_emoji TEXT DEFAULT '📝',
  
  -- Template structure
  prompt_template TEXT, -- prompt base para IA preencher
  sections JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{key, label, placeholder, ai_instruction}]
  variables JSONB DEFAULT '[]'::jsonb, -- [{key, label, default_value}] — user fills these
  
  -- Generated outputs (when used)
  is_system BOOLEAN NOT NULL DEFAULT false, -- system templates vs user-created
  use_count INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view templates"
  ON public.content_templates FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id) OR is_system = true);

CREATE POLICY "Members can create templates"
  ON public.content_templates FOR INSERT
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update templates"
  ON public.content_templates FOR UPDATE
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can delete templates"
  ON public.content_templates FOR DELETE
  USING (public.is_workspace_member(auth.uid(), workspace_id) AND is_system = false);

-- Template generations (history of AI outputs from templates)
CREATE TABLE public.template_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  template_id UUID REFERENCES public.content_templates(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id),
  
  format TEXT NOT NULL,
  variables_used JSONB DEFAULT '{}'::jsonb,
  
  -- AI outputs
  script JSONB, -- {hook, body, cta, hashtags}
  captions JSONB, -- [{tone, text}]
  shotlist JSONB, -- [{scene, description, camera, duration}]
  design_prompt TEXT,
  
  -- Link to content item if saved
  content_item_id UUID REFERENCES public.content_items(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.template_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view generations"
  ON public.template_generations FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can create generations"
  ON public.template_generations FOR INSERT
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can delete generations"
  ON public.template_generations FOR DELETE
  USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Trigger for updated_at
CREATE TRIGGER update_content_templates_updated_at
  BEFORE UPDATE ON public.content_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed system templates
INSERT INTO public.content_templates (title, description, format, category, thumbnail_emoji, is_system, sections, variables, prompt_template) VALUES
  ('Reels Educativo', 'Ensine algo valioso em 30-60s com hook forte', 'reels', 'educacional', '🎓', true,
   '[{"key":"hook","label":"Hook","ai_instruction":"Crie um hook provocativo de 1 linha"},{"key":"body","label":"Roteiro","ai_instruction":"3-5 pontos objetivos"},{"key":"cta","label":"CTA","ai_instruction":"Call-to-action direto"},{"key":"hashtags","label":"Hashtags","ai_instruction":"8-12 hashtags relevantes"}]'::jsonb,
   '[{"key":"topic","label":"Tema/Assunto","default_value":""},{"key":"audience","label":"Público-alvo","default_value":""},{"key":"tone","label":"Tom de voz","default_value":"profissional"}]'::jsonb,
   'Crie um roteiro de Reels educativo sobre {{topic}} para {{audience}} com tom {{tone}}.'),
   
  ('Carrossel Autoridade', 'Carrossel de 7-10 slides para posicionar expertise', 'carrossel', 'autoridade', '📊', true,
   '[{"key":"hook","label":"Slide 1 (Cover)","ai_instruction":"Título impactante para capa"},{"key":"body","label":"Slides 2-9","ai_instruction":"Conteúdo por slide, numerado"},{"key":"cta","label":"Slide Final","ai_instruction":"CTA + resumo"},{"key":"hashtags","label":"Legenda + Hashtags","ai_instruction":"Legenda curta + hashtags"}]'::jsonb,
   '[{"key":"topic","label":"Tema expert","default_value":""},{"key":"slides_count","label":"Nº de slides","default_value":"7"},{"key":"style","label":"Estilo visual","default_value":"minimalista"}]'::jsonb,
   'Crie um carrossel de {{slides_count}} slides sobre {{topic}} com estilo {{style}}.'),
   
  ('Stories Engajamento', 'Sequência de stories para gerar interação', 'stories', 'engajamento', '🔥', true,
   '[{"key":"hook","label":"Story 1 (Abertura)","ai_instruction":"Pergunta ou provocação"},{"key":"body","label":"Stories 2-4","ai_instruction":"Desenvolvimento + enquete/quiz"},{"key":"cta","label":"Story Final","ai_instruction":"Direcionamento + link/ação"},{"key":"hashtags","label":"Stickers sugeridos","ai_instruction":"Enquete, quiz, emoji slider"}]'::jsonb,
   '[{"key":"topic","label":"Tema","default_value":""},{"key":"goal","label":"Objetivo","default_value":"engajamento"},{"key":"duration","label":"Qtd de stories","default_value":"5"}]'::jsonb,
   'Crie uma sequência de {{duration}} stories sobre {{topic}} com objetivo de {{goal}}.'),
   
  ('Post Vendas', 'Post de feed focado em conversão', 'post', 'vendas', '💰', true,
   '[{"key":"hook","label":"Primeira linha","ai_instruction":"Hook que para o scroll"},{"key":"body","label":"Corpo do texto","ai_instruction":"Problema → solução → prova"},{"key":"cta","label":"CTA","ai_instruction":"Chamada para ação clara"},{"key":"hashtags","label":"Hashtags","ai_instruction":"Mix de hashtags de nicho e volume"}]'::jsonb,
   '[{"key":"product","label":"Produto/Serviço","default_value":""},{"key":"benefit","label":"Principal benefício","default_value":""},{"key":"proof","label":"Prova social","default_value":""}]'::jsonb,
   'Crie um post de vendas para {{product}} destacando {{benefit}} com prova: {{proof}}.'),
   
  ('Reels Bastidores', 'Mostre o processo por trás do trabalho', 'reels', 'bastidores', '🎬', true,
   '[{"key":"hook","label":"Hook","ai_instruction":"Abertura curiosa tipo making-of"},{"key":"body","label":"Roteiro","ai_instruction":"Narração do processo step-by-step"},{"key":"cta","label":"CTA","ai_instruction":"Convite para acompanhar"},{"key":"hashtags","label":"Hashtags","ai_instruction":"Hashtags de bastidores e nicho"}]'::jsonb,
   '[{"key":"process","label":"Processo mostrado","default_value":""},{"key":"result","label":"Resultado final","default_value":""},{"key":"tone","label":"Tom","default_value":"casual e autêntico"}]'::jsonb,
   'Crie um roteiro de bastidores mostrando {{process}} com resultado {{result}} em tom {{tone}}.');
