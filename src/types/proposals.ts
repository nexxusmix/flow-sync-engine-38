// Proposal Types for SQUAD Hub

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'expired';

export type SectionType = 'intro' | 'context' | 'scope' | 'deliverables' | 'timeline' | 'investment' | 'terms' | 'cta';

export interface Proposal {
  id: string;
  workspace_id: string;
  opportunity_id?: string;
  project_id?: string;
  client_name: string;
  client_email?: string;
  title: string;
  version: number;
  status: ProposalStatus;
  valid_until?: string;
  total_value: number;
  notes_internal?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ProposalSection {
  id: string;
  proposal_id: string;
  order_index: number;
  type: SectionType;
  title?: string;
  content: Record<string, unknown>;
  created_at: string;
}

export interface ProposalDeliverable {
  id: string;
  proposal_id: string;
  title: string;
  description?: string;
  quantity: number;
  unit_price?: number;
  notes?: string;
  created_at: string;
}

export interface ProposalTimeline {
  id: string;
  proposal_id: string;
  phase: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  order_index: number;
  created_at: string;
}

export interface ProposalAcceptance {
  id: string;
  proposal_id: string;
  accepted_by_name: string;
  accepted_by_email: string;
  accepted_at: string;
  ip_address?: string;
  user_agent?: string;
  notes?: string;
}

export interface ProposalLink {
  id: string;
  proposal_id: string;
  share_token: string;
  is_active: boolean;
  expires_at?: string;
  view_count: number;
  last_viewed_at?: string;
  created_at: string;
}

export interface ProposalWithDetails extends Proposal {
  sections: ProposalSection[];
  deliverables: ProposalDeliverable[];
  timeline: ProposalTimeline[];
  acceptance?: ProposalAcceptance;
  link?: ProposalLink;
}

// Default section templates
export const DEFAULT_SECTIONS: { type: SectionType; title: string; order: number }[] = [
  { type: 'intro', title: 'Introdução', order: 0 },
  { type: 'context', title: 'Contexto do Projeto', order: 1 },
  { type: 'scope', title: 'Escopo', order: 2 },
  { type: 'deliverables', title: 'Entregáveis', order: 3 },
  { type: 'timeline', title: 'Cronograma', order: 4 },
  { type: 'investment', title: 'Investimento', order: 5 },
  { type: 'terms', title: 'Condições', order: 6 },
  { type: 'cta', title: 'Próximos Passos', order: 7 },
];

export const STATUS_LABELS: Record<ProposalStatus, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-muted text-muted-foreground' },
  sent: { label: 'Enviada', color: 'bg-primary/20 text-primary' },
  viewed: { label: 'Visualizada', color: 'bg-primary/10 text-primary/70' },
  approved: { label: 'Aprovada', color: 'bg-primary/20 text-primary' },
  rejected: { label: 'Recusada', color: 'bg-destructive/20 text-destructive' },
  expired: { label: 'Expirada', color: 'bg-muted text-muted-foreground' },
};

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  intro: 'Introdução',
  context: 'Contexto',
  scope: 'Escopo',
  deliverables: 'Entregáveis',
  timeline: 'Cronograma',
  investment: 'Investimento',
  terms: 'Condições',
  cta: 'Próximos Passos',
};
