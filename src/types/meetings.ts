/**
 * Types for Project Meetings/Interactions module
 */

export type InteractionType = 'reuniao' | 'pedido_cliente' | 'mensagem_cliente' | 'alinhamento_interno';
export type InteractionSource = 'whatsapp' | 'meet' | 'zoom' | 'presencial' | 'email' | 'outro';
export type ActionItemStatus = 'aberto' | 'em_andamento' | 'concluido';

export interface ProjectInteraction {
  id: string;
  project_id: string;
  workspace_id: string;
  type: InteractionType;
  title: string;
  occurred_at: string;
  source: InteractionSource | null;
  participants: string | null;
  transcript: string | null;
  notes_internal: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Joined data
  assets?: InteractionAsset[];
  summary?: InteractionSummary | null;
}

export interface InteractionAsset {
  id: string;
  interaction_id: string;
  type: 'file' | 'link';
  storage_path: string | null;
  url: string | null;
  filename: string | null;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

export interface InteractionSummary {
  id: string;
  interaction_id: string;
  summary_bullets: string[];
  decisions: string[];
  action_items: ActionItemFromSummary[];
  deadlines: DeadlineItem[];
  risks: string[];
  generated_at: string;
  ai_run_id: string | null;
}

export interface ActionItemFromSummary {
  title: string;
  assignee?: string;
  due_date?: string;
}

export interface DeadlineItem {
  description: string;
  date: string;
}

export interface ProjectActionItem {
  id: string;
  project_id: string;
  interaction_id: string | null;
  workspace_id: string;
  title: string;
  description: string | null;
  assignee: string | null;
  due_date: string | null;
  status: ActionItemStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CreateInteractionInput {
  project_id: string;
  type: InteractionType;
  title: string;
  occurred_at: string;
  source?: InteractionSource;
  participants?: string;
  transcript?: string;
  notes_internal?: string;
  is_public?: boolean;
}

export interface CreateActionItemInput {
  project_id: string;
  interaction_id?: string;
  title: string;
  description?: string;
  assignee?: string;
  due_date?: string;
  status?: ActionItemStatus;
}
