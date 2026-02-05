// Settings Types for SQUAD Hub

export interface WorkspaceSettings {
  id: string;
  workspace_id: string;
  company_name: string;
  company_document?: string;
  default_timezone: string;
  default_currency: string;
  working_days: string[];
  working_hours: { start: string; end: string };
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  permissions: RolePermissions;
  is_system: boolean;
  created_at: string;
}

export interface RolePermissions {
  projects?: Permission[];
  finance?: Permission[];
  proposals?: Permission[];
  contracts?: Permission[];
  marketing?: Permission[];
  prospecting?: Permission[];
  reports?: Permission[];
  settings?: Permission[];
}

export type Permission = 'read' | 'write' | 'delete' | 'approve' | 'send' | 'sign' | 'export' | 'sensitive';

export interface ProjectStageSettings {
  id: string;
  workspace_id: string;
  stage_order: number;
  stage_key: string;
  stage_label: string;
  sla_days: number;
  blocks_delivery: boolean;
  is_active: boolean;
  created_at: string;
}

export interface FinanceSettings {
  id: string;
  workspace_id: string;
  expense_categories: string[];
  payment_methods: string[];
  block_after_days: number;
  block_message: string;
  created_at: string;
  updated_at: string;
}

export interface ProposalSettings {
  id: string;
  workspace_id: string;
  validity_days: number;
  prefix: string;
  intro_text: string;
  terms_text: string;
  required_sections: string[];
  created_at: string;
  updated_at: string;
}

export interface ContractSettings {
  id: string;
  workspace_id: string;
  default_revisions: number;
  default_renewal_type: string;
  default_renewal_notice_days: number;
  breach_text: string;
  mandatory_clauses: string[];
  created_at: string;
  updated_at: string;
}

export interface MarketingSettings {
  id: string;
  workspace_id: string;
  active_pillars: string[];
  active_channels: string[];
  active_formats: string[];
  default_tone: string;
  recommended_frequency: string;
  created_at: string;
  updated_at: string;
}

export interface ProspectingSettings {
  id: string;
  workspace_id: string;
  daily_activity_limit: number;
  allowed_channels: string[];
  min_followup_delay_hours: number;
  optout_text: string;
  blacklist_rules: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface IntegrationSettings {
  id: string;
  workspace_id: string;
  provider: string;
  status: 'connected' | 'disconnected' | 'error';
  config: Record<string, unknown>;
  connected_at?: string;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  id: string;
  workspace_id: string;
  delays_enabled: boolean;
  blocks_enabled: boolean;
  proposals_enabled: boolean;
  contracts_enabled: boolean;
  email_enabled: boolean;
  inapp_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandingSettings {
  id: string;
  workspace_id: string;
  logo_url?: string;
  logo_alt_url?: string;
  favicon_url?: string;
  primary_color: string;
  accent_color: string;
  footer_text: string;
  pdf_signature?: string;
  created_at: string;
  updated_at: string;
}

export interface EventLog {
  id: string;
  workspace_id: string;
  actor_id?: string;
  actor_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  payload: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface SystemFlag {
  id: string;
  workspace_id: string;
  key: string;
  value: unknown;
  description?: string;
  updated_at: string;
}

export const PERMISSION_LABELS: Record<Permission, string> = {
  read: 'Visualizar',
  write: 'Criar/Editar',
  delete: 'Excluir',
  approve: 'Aprovar',
  send: 'Enviar',
  sign: 'Assinar',
  export: 'Exportar',
  sensitive: 'Dados Sensíveis',
};

export const MODULE_LABELS: Record<string, string> = {
  projects: 'Projetos',
  finance: 'Financeiro',
  proposals: 'Propostas',
  contracts: 'Contratos',
  marketing: 'Marketing',
  prospecting: 'Prospecção',
  reports: 'Relatórios',
  settings: 'Configurações',
};

export const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
  { value: 'America/Fortaleza', label: 'Fortaleza (GMT-3)' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5)' },
];

export const CURRENCIES = [
  { value: 'BRL', label: 'Real (R$)' },
  { value: 'USD', label: 'Dólar (US$)' },
  { value: 'EUR', label: 'Euro (€)' },
];

export const WEEKDAYS = [
  { value: 'mon', label: 'Segunda' },
  { value: 'tue', label: 'Terça' },
  { value: 'wed', label: 'Quarta' },
  { value: 'thu', label: 'Quinta' },
  { value: 'fri', label: 'Sexta' },
  { value: 'sat', label: 'Sábado' },
  { value: 'sun', label: 'Domingo' },
];
