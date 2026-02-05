// Prospecção Types

export type ProspectPriority = 'low' | 'medium' | 'high';
export type ProspectStatus = 'active' | 'paused' | 'blacklisted';
export type OpportunityStage = 'new' | 'contacted' | 'conversation' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
export type ActivityType = 'dm' | 'call' | 'email' | 'meeting' | 'note' | 'followup' | 'proposal';
export type Channel = 'whatsapp' | 'instagram' | 'email' | 'call' | 'in_person';
export type FitScore = 'high' | 'medium' | 'low';
export type NextActionType = 'dm' | 'call' | 'email' | 'followup' | 'meeting' | 'proposal';

export interface ProspectList {
  id: string;
  workspace_id: string;
  name: string;
  segment?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  // Computed
  prospect_count?: number;
}

export interface Prospect {
  id: string;
  workspace_id: string;
  list_id?: string;
  company_name: string;
  niche?: string;
  city?: string;
  region?: string;
  instagram?: string;
  website?: string;
  linkedin?: string;
  email?: string;
  phone?: string;
  decision_maker_name?: string;
  decision_maker_role?: string;
  priority: ProspectPriority;
  status: ProspectStatus;
  tags?: string[];
  notes?: string;
  enriched_at?: string;
  created_at: string;
  updated_at: string;
  // Relations
  list?: ProspectList;
  opportunities?: ProspectOpportunity[];
}

export interface Cadence {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  target_niche?: string;
  is_active: boolean;
  daily_limit: number;
  allowed_channels: Channel[];
  rules?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Relations
  steps?: CadenceStep[];
}

export interface CadenceStep {
  id: string;
  cadence_id: string;
  step_order: number;
  day_offset: number;
  channel: Channel;
  template: string;
  variations?: string[];
  is_active: boolean;
  created_at: string;
}

export interface ProspectOpportunity {
  id: string;
  workspace_id: string;
  prospect_id: string;
  title: string;
  stage: OpportunityStage;
  estimated_value?: number;
  probability: number;
  owner_name?: string;
  owner_initials?: string;
  next_action_at?: string;
  next_action_type?: NextActionType;
  next_action_notes?: string;
  lost_reason?: string;
  won_at?: string;
  lost_at?: string;
  linked_project_id?: string;
  fit_score?: FitScore;
  objections?: string[];
  conversation_summary?: string;
  created_at: string;
  updated_at: string;
  // Relations
  prospect?: Prospect;
  activities?: ProspectActivity[];
}

export interface ProspectActivity {
  id: string;
  workspace_id: string;
  opportunity_id: string;
  type: ActivityType;
  channel?: Channel;
  title: string;
  description?: string;
  due_at?: string;
  completed: boolean;
  completed_at?: string;
  outcome?: string;
  cadence_step_id?: string;
  created_at: string;
  // Relations
  opportunity?: ProspectOpportunity;
}

export interface DoNotContact {
  id: string;
  workspace_id: string;
  prospect_id: string;
  reason?: string;
  blocked_by?: string;
  created_at: string;
}

// Pipeline stages config
export const OPPORTUNITY_STAGES: { type: OpportunityStage; name: string; color: string }[] = [
  { type: 'new', name: 'Novo', color: 'bg-slate-500' },
  { type: 'contacted', name: 'Contatado', color: 'bg-blue-500' },
  { type: 'conversation', name: 'Em Conversa', color: 'bg-cyan-500' },
  { type: 'qualified', name: 'Qualificado', color: 'bg-purple-500' },
  { type: 'proposal', name: 'Proposta', color: 'bg-amber-500' },
  { type: 'negotiation', name: 'Negociação', color: 'bg-orange-500' },
  { type: 'won', name: 'Ganhou', color: 'bg-emerald-500' },
  { type: 'lost', name: 'Perdeu', color: 'bg-red-500' },
];

export const ACTIVITY_TYPES: { type: ActivityType; name: string; icon: string }[] = [
  { type: 'dm', name: 'Mensagem Direta', icon: 'chat' },
  { type: 'call', name: 'Ligação', icon: 'call' },
  { type: 'email', name: 'E-mail', icon: 'mail' },
  { type: 'meeting', name: 'Reunião', icon: 'groups' },
  { type: 'note', name: 'Nota', icon: 'note' },
  { type: 'followup', name: 'Follow-up', icon: 'replay' },
  { type: 'proposal', name: 'Proposta', icon: 'description' },
];

export const CHANNELS: { type: Channel; name: string; icon: string }[] = [
  { type: 'whatsapp', name: 'WhatsApp', icon: 'chat' },
  { type: 'instagram', name: 'Instagram', icon: 'photo_camera' },
  { type: 'email', name: 'E-mail', icon: 'mail' },
  { type: 'call', name: 'Ligação', icon: 'call' },
  { type: 'in_person', name: 'Presencial', icon: 'person' },
];

// Filter types
export interface ProspectFilters {
  search: string;
  list_id: string;
  status: ProspectStatus | 'all';
  priority: ProspectPriority | 'all';
  niche: string;
}

export interface OpportunityFilters {
  search: string;
  stage: OpportunityStage | 'all';
  owner: string;
  hasNextAction: 'all' | 'yes' | 'no' | 'overdue';
}
