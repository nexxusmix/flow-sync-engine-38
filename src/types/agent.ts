// ============================================
// POLO AI - Agent Execution Types
// ============================================

export type AgentRunStatus = 
  | 'pending' 
  | 'planning' 
  | 'executing' 
  | 'success' 
  | 'error' 
  | 'needs_confirmation';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface ExecutionStep {
  action: string;
  entity?: string;
  data?: Record<string, unknown>;
  matchBy?: string;
  fromEntity?: string;
  fromId?: string;
  toEntity?: string;
  toId?: string;
  relationType?: string;
  query?: string;
  contractId?: string;
}

export interface ExecutionPlan {
  context: {
    client_id?: string;
    project_id?: string;
    contract_id?: string;
    proposal_id?: string;
  };
  steps: ExecutionStep[];
  risk_level: RiskLevel;
  needs_confirmation: boolean;
  summary?: string;
}

export interface AgentRun {
  id: string;
  user_id: string;
  workspace_id: string;
  input_text: string;
  attachments: AttachmentInfo[];
  context_json: Record<string, unknown>;
  plan_json: ExecutionPlan | null;
  result_json: ExecutionResult | null;
  status: AgentRunStatus;
  error_message: string | null;
  risk_level: RiskLevel;
  confirmed_at: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface AgentAction {
  id: string;
  run_id: string;
  step_index: number;
  action_type: string;
  entity_type: string | null;
  entity_id: string | null;
  input_json: Record<string, unknown>;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface AttachmentInfo {
  name: string;
  type: string;
  size: number;
  content?: string;
  extracted_data?: Record<string, unknown>;
}

export interface ExecutionResult {
  actions: ActionResult[];
  errors: string[];
}

export interface ActionResult {
  step_index: number;
  action_type: string;
  entity_type?: string;
  entity_id?: string;
  status: 'success' | 'error' | 'skipped';
  before_json?: Record<string, unknown>;
  after_json?: Record<string, unknown>;
  error_message?: string;
  duration_ms: number;
}

// ============================================
// Conversation & Memory Types
// ============================================

export interface AgentConversation {
  id: string;
  user_id: string;
  workspace_id: string;
  title: string;
  summary: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentMessageDB {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments: AttachmentInfo[] | null;
  plan_json: ExecutionPlan | null;
  result_json: ExecutionResult | null;
  run_id: string | null;
  created_at: string;
}

export interface AgentMemory {
  id: string;
  user_id: string;
  workspace_id: string;
  key: string;
  value: Record<string, unknown>;
  source_conversation_id: string | null;
  created_at: string;
  updated_at: string;
}

// Chat message with execution support (UI state)
export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  files?: AttachmentInfo[];
  plan?: ExecutionPlan;
  execution?: ExecutionResult;
  results?: ActionResult[];
  runId?: string;
  needsConfirmation?: boolean;
  dbId?: string; // ID from agent_messages table
}

// Response format from Polo AI
export interface PoloAIResponse {
  message: string;
  plan?: ExecutionPlan;
  execution_needed: boolean;
}
