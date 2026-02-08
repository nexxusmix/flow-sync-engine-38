export interface AutomationRule {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  config_json: Record<string, unknown>;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

export interface AutomationSuggestionAction {
  key: string;
  label: string;
}

export interface AutomationSuggestion {
  id: string;
  rule_key: string;
  entity_type: string;
  entity_id: string | null;
  title: string;
  message: string | null;
  suggestion_json: {
    actions?: AutomationSuggestionAction[];
    context?: Record<string, unknown>;
  };
  status: 'pending' | 'applied' | 'ignored';
  workspace_id: string;
  created_at: string;
  applied_at: string | null;
  ignored_at: string | null;
}

export const RULE_ICONS: Record<string, string> = {
  'marketing.studio.next_steps': '✨',
  'marketing.content.stalled': '⏸️',
  'marketing.content.review_stuck': '🔄',
  'marketing.calendar.gaps': '📅',
  'marketing.content.repurpose': '♻️',
};

export const RULE_COLORS: Record<string, string> = {
  'marketing.studio.next_steps': 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  'marketing.content.stalled': 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  'marketing.content.review_stuck': 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  'marketing.calendar.gaps': 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  'marketing.content.repurpose': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
};
