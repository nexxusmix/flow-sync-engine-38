-- Tabela de Regras de Automação
CREATE TABLE public.automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  config_json JSONB DEFAULT '{}',
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Sugestões de Automação
CREATE TABLE public.automation_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_key TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  title TEXT NOT NULL,
  message TEXT,
  suggestion_json JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'ignored')),
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  applied_at TIMESTAMP WITH TIME ZONE,
  ignored_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_automation_rules_key ON public.automation_rules(key);
CREATE INDEX idx_automation_rules_enabled ON public.automation_rules(is_enabled);
CREATE INDEX idx_automation_suggestions_status ON public.automation_suggestions(status);
CREATE INDEX idx_automation_suggestions_rule ON public.automation_suggestions(rule_key);
CREATE INDEX idx_automation_suggestions_entity ON public.automation_suggestions(entity_type, entity_id);
CREATE INDEX idx_automation_suggestions_created ON public.automation_suggestions(created_at DESC);

-- Enable RLS
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for automation_rules
CREATE POLICY "Users can view automation rules"
ON public.automation_rules FOR SELECT
USING (true);

CREATE POLICY "Users can update automation rules"
ON public.automation_rules FOR UPDATE
USING (true);

-- RLS Policies for automation_suggestions
CREATE POLICY "Users can view their suggestions"
ON public.automation_suggestions FOR SELECT
USING (true);

CREATE POLICY "Users can update their suggestions"
ON public.automation_suggestions FOR UPDATE
USING (true);

CREATE POLICY "System can create suggestions"
ON public.automation_suggestions FOR INSERT
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_automation_rules_updated_at
BEFORE UPDATE ON public.automation_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default rules
INSERT INTO public.automation_rules (key, name, description, config_json) VALUES
('marketing.studio.next_steps', 'Próximos Passos do Studio', 'Sugere ações após geração de pacote criativo', '{"enabled_actions": ["create_content", "link_campaign", "suggest_schedule"]}'),
('marketing.content.stalled', 'Conteúdo Parado', 'Detecta conteúdos em status intermediário há muitos dias', '{"days_threshold": 4, "check_statuses": ["scripting", "recording", "editing"]}'),
('marketing.content.review_stuck', 'Revisão Travada', 'Detecta conteúdos em revisão/aprovação há muito tempo', '{"days_threshold": 3, "check_statuses": ["review", "approval"]}'),
('marketing.calendar.gaps', 'Buraco no Calendário', 'Detecta semanas com poucos posts agendados', '{"min_posts_per_week": 3, "channels": ["instagram", "youtube", "tiktok"]}'),
('marketing.content.repurpose', 'Reaproveitamento Inteligente', 'Sugere reaproveitar conteúdos de sucesso', '{"min_days_published": 14, "formats": ["carousel", "reels", "shorts"]}')