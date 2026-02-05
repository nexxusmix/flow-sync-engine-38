// Contract Types for SQUAD Hub

export type ContractStatus = 'draft' | 'active' | 'sent' | 'viewed' | 'signed' | 'completed' | 'cancelled' | 'expired';
export type ServiceType = 'filme' | 'reels' | 'foto' | 'drone' | 'tour360' | 'motion' | 'landing' | 'trafego' | 'pacote' | 'outro';
export type RenewalType = 'none' | 'monthly' | 'quarterly' | 'yearly';
export type SignatureType = 'accept_click' | 'upload_signed_pdf' | 'govbr';
export type SignatureProvider = 'internal' | 'govbr';
export type AlertType = 'renewal_30' | 'renewal_15' | 'renewal_7' | 'expired' | 'breach';
export type AddendumStatus = 'draft' | 'sent' | 'signed';
export type GovBrSessionStatus = 'pending' | 'completed' | 'expired' | 'failed';

export interface ContractTemplate {
  id: string;
  workspace_id: string;
  name: string;
  service_type?: ServiceType;
  version: number;
  body: string;
  variables: Record<string, unknown>;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

export interface Contract {
  id: string;
  workspace_id: string;
  proposal_id?: string;
  project_id: string;
  project_name?: string;
  client_name?: string;
  client_document?: string;
  client_email?: string;
  template_id?: string;
  total_value: number;
  payment_terms?: string;
  start_date?: string;
  end_date?: string;
  status: ContractStatus;
  renewal_type?: RenewalType;
  renewal_notice_days: number;
  payment_block_on_breach: boolean;
  public_summary: Record<string, unknown>;
  current_version: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractVersion {
  id: string;
  contract_id: string;
  version: number;
  body_rendered: string;
  variables_filled: Record<string, unknown>;
  checksum?: string;
  created_at: string;
}

export interface ContractAddendum {
  id: string;
  contract_id: string;
  title: string;
  body?: string;
  status: AddendumStatus;
  signed_at?: string;
  signed_by_name?: string;
  signed_by_email?: string;
  created_at: string;
}

export interface ContractSignature {
  id: string;
  contract_id: string;
  signer_name: string;
  signer_email: string;
  signed_at: string;
  ip_address?: string;
  user_agent?: string;
  signature_type: SignatureType;
  signed_file_url?: string;
  // Campos gov.br
  signer_cpf?: string;
  provider?: SignatureProvider;
  document_hash?: string;
  proof_url?: string;
  raw_payload?: Record<string, unknown>;
}

export interface GovBrSigningSession {
  id: string;
  contract_id: string;
  state_token: string;
  document_hash: string;
  return_url?: string;
  created_at: string;
  expires_at: string;
  completed_at?: string;
  status: GovBrSessionStatus;
}

export interface ContractLink {
  id: string;
  contract_id: string;
  share_token: string;
  is_active: boolean;
  expires_at?: string;
  view_count: number;
  last_viewed_at?: string;
  created_at: string;
}

export interface ContractAlert {
  id: string;
  contract_id: string;
  type: AlertType;
  due_at: string;
  status: 'open' | 'done';
  created_at: string;
}

export interface ContractWithDetails extends Contract {
  versions?: ContractVersion[];
  addendums?: ContractAddendum[];
  signatures?: ContractSignature[];
  link?: ContractLink;
  alerts?: ContractAlert[];
}

export const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-muted text-muted-foreground' },
  active: { label: 'Ativo', color: 'bg-emerald-500/20 text-emerald-500' },
  sent: { label: 'Enviado', color: 'bg-blue-500/20 text-blue-500' },
  viewed: { label: 'Visualizado', color: 'bg-amber-500/20 text-amber-500' },
  signed: { label: 'Assinado', color: 'bg-emerald-500/20 text-emerald-500' },
  completed: { label: 'Concluído', color: 'bg-primary/20 text-primary' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-500' },
  expired: { label: 'Expirado', color: 'bg-zinc-500/20 text-zinc-500' },
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  filme: 'Filme Institucional',
  reels: 'Pacote Reels',
  foto: 'Fotografia',
  drone: 'Drone',
  tour360: 'Tour 360°',
  motion: 'Motion Graphics',
  landing: 'Landing Page',
  trafego: 'Gestão de Tráfego',
  pacote: 'Pacote Mensal',
  outro: 'Outro',
};

export const RENEWAL_TYPE_LABELS: Record<RenewalType, string> = {
  none: 'Sem renovação',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  yearly: 'Anual',
};

// Default contract variables
export const DEFAULT_CONTRACT_VARIABLES = {
  contratante_nome: '',
  contratante_documento: '',
  contratante_endereco: '',
  contratada_nome: 'SQUAD Produtora',
  contratada_documento: '',
  servico_tipo: '',
  servico_descricao: '',
  entregaveis: [],
  prazo_inicio: '',
  prazo_fim: '',
  prazo_entrega: '',
  local_captacao: '',
  revisoes_incluidas: 2,
  valor_total: 0,
  forma_pagamento: '',
  multa_cancelamento: '30%',
  uso_imagem: 'Autorizado para fins comerciais e institucionais',
  direitos_autorais: 'Todos os direitos patrimoniais serão transferidos ao contratante após quitação total',
  confidencialidade: false,
  sla_atendimento: '48 horas úteis',
};
