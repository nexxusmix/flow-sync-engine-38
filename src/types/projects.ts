// Project Types for SQUAD Hub

export type ProjectTemplate = 
  | 'filme_institucional'
  | 'filme_produto'
  | 'aftermovie'
  | 'reels_pacote'
  | 'foto_pacote'
  | 'tour_360'
  | 'motion_vinheta';

export type ProjectStageType = 
  | 'briefing'
  | 'roteiro'
  | 'pre_producao'
  | 'captacao'
  | 'edicao'
  | 'revisao'
  | 'aprovacao'
  | 'entrega'
  | 'pos_venda';

export type ProjectStatus = 'ok' | 'em_risco' | 'atrasado' | 'bloqueado';

export type StageStatus = 'nao_iniciado' | 'em_andamento' | 'concluido' | 'bloqueado';

export type DeliverableStatus = 'rascunho' | 'revisao' | 'aprovado' | 'entregue' | 'arquivado';

export type DeliverableType = 'video' | 'imagem' | 'pdf' | 'zip' | 'audio' | 'outro';

export type ChecklistStatus = 'pendente' | 'em_andamento' | 'concluido' | 'bloqueado';

export type CommentStatus = 'open' | 'resolved';

export type BlockReason = 
  | 'briefing_pendente'
  | 'aprovacao_pendente'
  | 'pagamento_pendente'
  | 'asset_pendente'
  | 'cliente_pendente'
  | null;

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  avatar?: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
}

export interface ProjectStage {
  id: string;
  projectId: string;
  name: string;
  type: ProjectStageType;
  order: number;
  status: StageStatus;
  owner?: TeamMember;
  plannedDate?: string;
  actualDate?: string;
  blockReason?: BlockReason;
  dependencies: string[];
}

export interface ChecklistItem {
  id: string;
  projectId: string;
  stageId: string;
  title: string;
  description?: string;
  isCritical: boolean;
  status: ChecklistStatus;
  assignee?: TeamMember;
  dueDate?: string;
  evidence?: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliverableVersion {
  id: string;
  deliverableId: string;
  versionNumber: number;
  fileUrl: string;
  fileType: DeliverableType;
  author: TeamMember;
  notes?: string;
  createdAt: string;
  status: DeliverableStatus;
}

export interface Deliverable {
  id: string;
  projectId: string;
  title: string;
  type: DeliverableType;
  currentVersion: number;
  status: DeliverableStatus;
  visibleInPortal: boolean;
  revisionLimit: number;
  revisionsUsed: number;
  versions: DeliverableVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  deliverableId: string;
  versionId: string;
  author: string;
  authorType: 'client' | 'team';
  content: string;
  timecode?: number; // seconds for video
  pinX?: number; // for images
  pinY?: number; // for images
  status: CommentStatus;
  round: number;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface Approval {
  id: string;
  deliverableId: string;
  versionId: string;
  approvedBy: string;
  approvedAt: string;
  notes?: string;
}

export interface ClientChecklistItem {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'pendente' | 'enviado' | 'aprovado';
  fileUrl?: string;
  submittedAt?: string;
  approvedAt?: string;
}

export interface ClientActivity {
  id: string;
  portalLinkId: string;
  action: 'visit' | 'comment' | 'approval' | 'download' | 'checklist_submit';
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface PortalLink {
  id: string;
  projectId: string;
  shareToken: string;
  isActive: boolean;
  expiresAt?: string;
  visibleDeliverables: string[];
  clientActivity: ClientActivity[];
  createdAt: string;
  regeneratedAt?: string;
}

export interface AuditLog {
  id: string;
  projectId: string;
  timestamp: string;
  actor: string;
  actorType: 'team' | 'client' | 'system';
  action: string;
  entityType: 'project' | 'stage' | 'deliverable' | 'version' | 'comment' | 'approval' | 'portal' | 'checklist' | 'file';
  entityId: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  folder: 'brutos' | 'projeto' | 'referencias' | 'entregas' | 'contratos' | 'outros';
  fileUrl: string;
  fileType: string;
  size: number;
  tags: string[];
  visibleInPortal: boolean;
  uploadedBy: TeamMember;
  uploadedAt: string;
}

export interface Project {
  id: string;
  title: string;
  clientId: string;
  client: Client;
  dealId?: string;
  template: ProjectTemplate;
  currentStage: ProjectStageType;
  status: ProjectStatus;
  healthScore: number;
  contractValue: number;
  owner: TeamMember;
  team: TeamMember[];
  startDate: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  blockedByPayment: boolean;
  blockPaymentEnabled: boolean;
  revisionLimit: number;
  revisionsUsed: number;
  stages: ProjectStage[];
  deliverables: Deliverable[];
  checklist: ChecklistItem[];
  clientChecklist: ClientChecklistItem[];
  files: ProjectFile[];
  portalLink?: PortalLink;
  auditLogs: AuditLog[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTemplateConfig {
  id: ProjectTemplate;
  name: string;
  description: string;
  defaultStages: ProjectStageType[];
  defaultRevisionLimit: number;
  defaultSLADays: number;
  defaultChecklist: Omit<ChecklistItem, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>[];
  defaultDeliverables: Pick<Deliverable, 'title' | 'type'>[];
}

export interface ProjectFilters {
  search: string;
  status: ProjectStatus | 'all';
  stage: ProjectStageType | 'all';
  client: string | 'all';
  owner: string | 'all';
  template: ProjectTemplate | 'all';
  deadline: 'all' | '7days' | '30days' | 'atrasado';
  blockedByPayment: boolean | 'all';
}

export type ViewMode = 'list' | 'kanban';
