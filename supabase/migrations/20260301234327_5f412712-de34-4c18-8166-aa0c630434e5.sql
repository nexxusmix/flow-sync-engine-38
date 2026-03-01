
-- Table to persist ALL AI interactions, user feedback, style preferences, and trends
CREATE TABLE public.instagram_ai_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  user_id UUID NOT NULL,
  
  -- What type of memory entry
  memory_type TEXT NOT NULL, -- 'generation', 'feedback', 'style_pref', 'trend', 'analysis', 'performance'
  
  -- Context keys for retrieval
  category TEXT, -- pillar: autoridade, luxury, bastidores, etc.
  format TEXT, -- reel, carousel, story, single
  topic TEXT, -- the topic/theme
  
  -- The actual content
  input_data JSONB DEFAULT '{}', -- what was sent to AI
  output_data JSONB DEFAULT '{}', -- what AI returned
  
  -- For feedback tracking
  original_text TEXT, -- AI-generated text
  edited_text TEXT, -- user's edited version (null if not edited)
  field_name TEXT, -- which field: hook, script, caption_short, etc.
  was_accepted BOOLEAN DEFAULT true, -- did user keep it or discard?
  
  -- Performance data linkage
  post_id UUID, -- linked instagram_post
  engagement_score NUMERIC, -- performance score if available
  
  -- Style/preference tracking
  style_tags TEXT[] DEFAULT '{}', -- e.g. ['cinematic', 'raw_luxury', 'documentary']
  tone TEXT, -- tom de voz used
  
  -- Trend data
  trend_data JSONB, -- trend analysis results
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast retrieval
CREATE INDEX idx_ig_memory_workspace ON instagram_ai_memory(workspace_id);
CREATE INDEX idx_ig_memory_type ON instagram_ai_memory(memory_type);
CREATE INDEX idx_ig_memory_category ON instagram_ai_memory(category);
CREATE INDEX idx_ig_memory_format ON instagram_ai_memory(format);
CREATE INDEX idx_ig_memory_created ON instagram_ai_memory(created_at DESC);
CREATE INDEX idx_ig_memory_post ON instagram_ai_memory(post_id) WHERE post_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.instagram_ai_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their workspace memory"
ON public.instagram_ai_memory FOR SELECT
USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Users can insert memory"
ON public.instagram_ai_memory FOR INSERT
WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Users can update memory"
ON public.instagram_ai_memory FOR UPDATE
USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Trigger for updated_at
CREATE TRIGGER update_ig_memory_updated_at
BEFORE UPDATE ON public.instagram_ai_memory
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
