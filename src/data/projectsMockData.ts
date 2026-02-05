import { 
  Project, 
  TeamMember, 
  Client, 
  Deliverable, 
  Comment,
  ProjectStage,
  ChecklistItem,
  ClientChecklistItem,
  PortalLink,
  AuditLog,
  ProjectFile
} from '@/types/projects';
import { PROJECT_STAGES } from './projectTemplates';

// Team Members
export const TEAM_MEMBERS: TeamMember[] = [
  { id: 'tm1', name: 'Alexandre Gomes', initials: 'AG', role: 'Diretor Criativo', avatar: '' },
  { id: 'tm2', name: 'Julia Pereira', initials: 'JP', role: 'Produtora Executiva', avatar: '' },
  { id: 'tm3', name: 'Marcos Silva', initials: 'MS', role: 'Editor Sênior', avatar: '' },
  { id: 'tm4', name: 'Carolina Mendes', initials: 'CM', role: 'Motion Designer', avatar: '' },
  { id: 'tm5', name: 'Rafael Costa', initials: 'RC', role: 'Diretor de Fotografia', avatar: '' },
];

// Clients
export const CLIENTS: Client[] = [
  { id: 'c1', name: 'Ricardo Almeida', company: 'Grupo Soma', email: 'ricardo@gruposoma.com.br', phone: '(11) 99999-1111' },
  { id: 'c2', name: 'Fernanda Castro', company: 'Reserva', email: 'fernanda@reserva.com.br', phone: '(21) 99999-2222' },
  { id: 'c3', name: 'Bruno Martins', company: 'XP Inc', email: 'bruno@xp.com.br', phone: '(11) 99999-3333' },
  { id: 'c4', name: 'Ana Beatriz', company: 'Track & Field', email: 'ana@trackfield.com.br', phone: '(11) 99999-4444' },
  { id: 'c5', name: 'Carlos Eduardo', company: 'Mitre Realty', email: 'carlos@mitre.com.br', phone: '(11) 99999-5555' },
  { id: 'c6', name: 'Mariana Costa', company: 'Natura', email: 'mariana@natura.com.br', phone: '(11) 99999-6666' },
];

// Helper to generate stages
const generateStages = (projectId: string, templateStages: string[], currentStageIndex: number): ProjectStage[] => {
  return templateStages.map((stageType, index) => {
    const stageInfo = PROJECT_STAGES.find(s => s.type === stageType);
    let status: ProjectStage['status'] = 'nao_iniciado';
    if (index < currentStageIndex) status = 'concluido';
    else if (index === currentStageIndex) status = 'em_andamento';
    
    return {
      id: `${projectId}-stage-${index}`,
      projectId,
      name: stageInfo?.name || stageType,
      type: stageType as ProjectStage['type'],
      order: index + 1,
      status,
      owner: TEAM_MEMBERS[index % TEAM_MEMBERS.length],
      plannedDate: new Date(Date.now() + (index * 3 * 24 * 60 * 60 * 1000)).toISOString(),
      dependencies: index > 0 ? [templateStages[index - 1]] : [],
    };
  });
};

// Helper to generate checklist
const generateChecklist = (projectId: string, stages: ProjectStage[]): ChecklistItem[] => {
  const items: ChecklistItem[] = [];
  stages.forEach((stage, stageIndex) => {
    const checklistItems = [
      { title: `Validar ${stage.name.toLowerCase()}`, isCritical: true },
      { title: `Documentar ${stage.name.toLowerCase()}`, isCritical: false },
    ];
    checklistItems.forEach((item, itemIndex) => {
      items.push({
        id: `${projectId}-check-${stageIndex}-${itemIndex}`,
        projectId,
        stageId: stage.id,
        title: item.title,
        isCritical: item.isCritical,
        status: stage.status === 'concluido' ? 'concluido' : 'pendente',
        assignee: stage.owner,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  });
  return items;
};

// Helper to generate deliverables
const generateDeliverables = (projectId: string, titles: string[]): Deliverable[] => {
  return titles.map((title, index) => ({
    id: `${projectId}-del-${index}`,
    projectId,
    title,
    type: 'video',
    currentVersion: index === 0 ? 2 : 1,
    status: index === 0 ? 'revisao' : 'rascunho',
    visibleInPortal: index === 0,
    revisionLimit: 2,
    revisionsUsed: index === 0 ? 1 : 0,
    versions: [
      {
        id: `${projectId}-del-${index}-v1`,
        deliverableId: `${projectId}-del-${index}`,
        versionNumber: 1,
        fileUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        fileType: 'video',
        author: TEAM_MEMBERS[2],
        notes: 'Primeira versão',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'rascunho',
      },
    ],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  }));
};

// Helper to generate comments
const generateComments = (deliverableId: string, versionId: string): Comment[] => {
  return [
    {
      id: `${deliverableId}-comment-1`,
      deliverableId,
      versionId,
      author: 'Cliente',
      authorType: 'client',
      content: 'A transição no segundo 15 está muito brusca, podemos suavizar?',
      timecode: 15,
      status: 'open',
      round: 1,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `${deliverableId}-comment-2`,
      deliverableId,
      versionId,
      author: 'Cliente',
      authorType: 'client',
      content: 'Gostei muito da colorização nessa parte!',
      timecode: 32,
      status: 'resolved',
      round: 1,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      resolvedAt: new Date().toISOString(),
      resolvedBy: 'Marcos Silva',
    },
    {
      id: `${deliverableId}-comment-3`,
      deliverableId,
      versionId,
      author: 'Cliente',
      authorType: 'client',
      content: 'Podemos adicionar o logo no final?',
      status: 'open',
      round: 1,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
  ];
};

// Generate audit logs
const generateAuditLogs = (projectId: string): AuditLog[] => {
  return [
    {
      id: `${projectId}-log-1`,
      projectId,
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      actor: 'Alexandre Gomes',
      actorType: 'team',
      action: 'create',
      entityType: 'project',
      entityId: projectId,
      description: 'Projeto criado',
    },
    {
      id: `${projectId}-log-2`,
      projectId,
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      actor: 'Julia Pereira',
      actorType: 'team',
      action: 'stage_change',
      entityType: 'stage',
      entityId: `${projectId}-stage-0`,
      description: 'Etapa Briefing concluída',
    },
    {
      id: `${projectId}-log-3`,
      projectId,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      actor: 'Marcos Silva',
      actorType: 'team',
      action: 'upload',
      entityType: 'deliverable',
      entityId: `${projectId}-del-0`,
      description: 'Nova versão do Corte 1 enviada',
    },
    {
      id: `${projectId}-log-4`,
      projectId,
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      actor: 'Cliente',
      actorType: 'client',
      action: 'comment',
      entityType: 'comment',
      entityId: `${projectId}-del-0-comment-1`,
      description: 'Cliente adicionou comentário na revisão',
    },
  ];
};

// Client checklist
const generateClientChecklist = (projectId: string): ClientChecklistItem[] => {
  return [
    {
      id: `${projectId}-cc-1`,
      projectId,
      title: 'Enviar briefing completo',
      description: 'Documento com objetivos, público-alvo e referências',
      status: 'aprovado',
      submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      approvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `${projectId}-cc-2`,
      projectId,
      title: 'Enviar logos e assets',
      description: 'Arquivos vetoriais da marca',
      status: 'enviado',
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `${projectId}-cc-3`,
      projectId,
      title: 'Aprovar roteiro',
      description: 'Validação do roteiro antes da captação',
      status: 'pendente',
    },
  ];
};

// Portal link
const generatePortalLink = (projectId: string, deliverableIds: string[]): PortalLink => {
  return {
    id: `${projectId}-portal`,
    projectId,
    shareToken: `sqd_${projectId}_${Math.random().toString(36).substring(2, 15)}`,
    isActive: true,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    visibleDeliverables: deliverableIds.slice(0, 2),
    clientActivity: [
      {
        id: `${projectId}-activity-1`,
        portalLinkId: `${projectId}-portal`,
        action: 'visit',
        description: 'Cliente acessou o portal',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `${projectId}-activity-2`,
        portalLinkId: `${projectId}-portal`,
        action: 'comment',
        description: 'Cliente adicionou 2 comentários',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  };
};

// Files
const generateFiles = (projectId: string): ProjectFile[] => {
  return [
    {
      id: `${projectId}-file-1`,
      projectId,
      name: 'briefing_v1.pdf',
      folder: 'projeto',
      fileUrl: '/files/briefing.pdf',
      fileType: 'application/pdf',
      size: 2500000,
      tags: ['briefing', 'documento'],
      visibleInPortal: false,
      uploadedBy: TEAM_MEMBERS[1],
      uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `${projectId}-file-2`,
      projectId,
      name: 'referencias_cliente.zip',
      folder: 'referencias',
      fileUrl: '/files/refs.zip',
      fileType: 'application/zip',
      size: 15000000,
      tags: ['referencias', 'cliente'],
      visibleInPortal: false,
      uploadedBy: TEAM_MEMBERS[0],
      uploadedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
};

// Calculate health score
const calculateHealthScore = (stages: ProjectStage[], blockedByPayment: boolean): number => {
  if (blockedByPayment) return 30;
  const completedStages = stages.filter(s => s.status === 'concluido').length;
  const totalStages = stages.length;
  const progressScore = (completedStages / totalStages) * 50;
  const randomFactor = Math.floor(Math.random() * 30) + 20;
  return Math.min(100, Math.floor(progressScore + randomFactor));
};

// Mock Projects
export const MOCK_PROJECTS: Project[] = [
  // Project 1 - Em Edição
  (() => {
    const projectId = 'proj-1';
    const templateStages = ['briefing', 'roteiro', 'pre_producao', 'captacao', 'edicao', 'revisao', 'aprovacao', 'entrega', 'pos_venda'];
    const stages = generateStages(projectId, templateStages, 4);
    const deliverables = generateDeliverables(projectId, ['Corte 1', 'Corte 2', 'Versão Final']);
    deliverables[0].versions[0].id = `${projectId}-del-0-v1`;
    const comments = generateComments(deliverables[0].id, deliverables[0].versions[0].id);
    
    return {
      id: projectId,
      title: 'Campanha Institucional 2025',
      clientId: 'c1',
      client: CLIENTS[0],
      dealId: 'deal-1',
      template: 'filme_institucional',
      currentStage: 'edicao',
      status: 'ok',
      healthScore: calculateHealthScore(stages, false),
      contractValue: 120000,
      owner: TEAM_MEMBERS[0],
      team: [TEAM_MEMBERS[0], TEAM_MEMBERS[2], TEAM_MEMBERS[4]],
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedDelivery: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
      blockedByPayment: false,
      blockPaymentEnabled: true,
      revisionLimit: 2,
      revisionsUsed: 1,
      stages,
      deliverables,
      checklist: generateChecklist(projectId, stages),
      clientChecklist: generateClientChecklist(projectId),
      files: generateFiles(projectId),
      portalLink: generatePortalLink(projectId, deliverables.map(d => d.id)),
      auditLogs: generateAuditLogs(projectId),
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
  })(),

  // Project 2 - Em Risco (atrasado)
  (() => {
    const projectId = 'proj-2';
    const templateStages = ['briefing', 'roteiro', 'pre_producao', 'captacao', 'edicao', 'revisao', 'aprovacao', 'entrega'];
    const stages = generateStages(projectId, templateStages, 3);
    const deliverables = generateDeliverables(projectId, ['Vídeo Manifesto', 'Teaser']);
    
    return {
      id: projectId,
      title: 'Vídeo Manifesto Marca',
      clientId: 'c2',
      client: CLIENTS[1],
      template: 'filme_produto',
      currentStage: 'captacao',
      status: 'em_risco',
      healthScore: 52,
      contractValue: 45000,
      owner: TEAM_MEMBERS[1],
      team: [TEAM_MEMBERS[1], TEAM_MEMBERS[4]],
      startDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      blockedByPayment: false,
      blockPaymentEnabled: true,
      revisionLimit: 2,
      revisionsUsed: 0,
      stages,
      deliverables,
      checklist: generateChecklist(projectId, stages),
      clientChecklist: generateClientChecklist(projectId),
      files: generateFiles(projectId),
      portalLink: generatePortalLink(projectId, deliverables.map(d => d.id)),
      auditLogs: generateAuditLogs(projectId),
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
  })(),

  // Project 3 - Bloqueado por pagamento
  (() => {
    const projectId = 'proj-3';
    const templateStages = ['briefing', 'pre_producao', 'captacao', 'edicao', 'revisao', 'aprovacao', 'entrega'];
    const stages = generateStages(projectId, templateStages, 5);
    stages[5].status = 'bloqueado';
    stages[5].blockReason = 'pagamento_pendente';
    const deliverables = generateDeliverables(projectId, ['Aftermovie Completo', 'Teaser']);
    
    return {
      id: projectId,
      title: 'Aftermovie Summit 2025',
      clientId: 'c3',
      client: CLIENTS[2],
      template: 'aftermovie',
      currentStage: 'aprovacao',
      status: 'bloqueado',
      healthScore: 35,
      contractValue: 15000,
      owner: TEAM_MEMBERS[2],
      team: [TEAM_MEMBERS[2], TEAM_MEMBERS[4]],
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedDelivery: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      blockedByPayment: true,
      blockPaymentEnabled: true,
      revisionLimit: 2,
      revisionsUsed: 2,
      stages,
      deliverables,
      checklist: generateChecklist(projectId, stages),
      clientChecklist: generateClientChecklist(projectId),
      files: generateFiles(projectId),
      portalLink: generatePortalLink(projectId, deliverables.map(d => d.id)),
      auditLogs: generateAuditLogs(projectId),
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
  })(),

  // Project 4 - Reels em andamento
  (() => {
    const projectId = 'proj-4';
    const templateStages = ['briefing', 'captacao', 'edicao', 'revisao', 'aprovacao', 'entrega'];
    const stages = generateStages(projectId, templateStages, 2);
    const deliverables = generateDeliverables(projectId, ['Reel 1', 'Reel 2', 'Reel 3', 'Reel 4']);
    
    return {
      id: projectId,
      title: 'Pacote Reels Q1',
      clientId: 'c4',
      client: CLIENTS[3],
      template: 'reels_pacote',
      currentStage: 'edicao',
      status: 'ok',
      healthScore: 88,
      contractValue: 22000,
      owner: TEAM_MEMBERS[3],
      team: [TEAM_MEMBERS[3], TEAM_MEMBERS[2]],
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      blockedByPayment: false,
      blockPaymentEnabled: true,
      revisionLimit: 3,
      revisionsUsed: 0,
      stages,
      deliverables,
      checklist: generateChecklist(projectId, stages),
      clientChecklist: generateClientChecklist(projectId),
      files: generateFiles(projectId),
      portalLink: generatePortalLink(projectId, deliverables.map(d => d.id)),
      auditLogs: generateAuditLogs(projectId),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
  })(),

  // Project 5 - Entregue
  (() => {
    const projectId = 'proj-5';
    const templateStages = ['briefing', 'pre_producao', 'captacao', 'edicao', 'aprovacao', 'entrega'];
    const stages = generateStages(projectId, templateStages, 6);
    stages.forEach(s => s.status = 'concluido');
    const deliverables = generateDeliverables(projectId, ['Tour 360 Completo']);
    deliverables[0].status = 'entregue';
    
    return {
      id: projectId,
      title: 'Tour Virtual Empreendimento',
      clientId: 'c5',
      client: CLIENTS[4],
      template: 'tour_360',
      currentStage: 'entrega',
      status: 'ok',
      healthScore: 100,
      contractValue: 8000,
      owner: TEAM_MEMBERS[4],
      team: [TEAM_MEMBERS[4]],
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedDelivery: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      actualDelivery: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      blockedByPayment: false,
      blockPaymentEnabled: true,
      revisionLimit: 1,
      revisionsUsed: 1,
      stages,
      deliverables,
      checklist: generateChecklist(projectId, stages),
      clientChecklist: generateClientChecklist(projectId),
      files: generateFiles(projectId),
      portalLink: generatePortalLink(projectId, deliverables.map(d => d.id)),
      auditLogs: generateAuditLogs(projectId),
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    };
  })(),

  // Project 6 - Briefing
  (() => {
    const projectId = 'proj-6';
    const templateStages = ['briefing', 'roteiro', 'pre_producao', 'captacao', 'edicao', 'revisao', 'aprovacao', 'entrega', 'pos_venda'];
    const stages = generateStages(projectId, templateStages, 0);
    const deliverables: Deliverable[] = [];
    
    return {
      id: projectId,
      title: 'Filme Institucional Beleza',
      clientId: 'c6',
      client: CLIENTS[5],
      template: 'filme_institucional',
      currentStage: 'briefing',
      status: 'ok',
      healthScore: 95,
      contractValue: 65000,
      owner: TEAM_MEMBERS[0],
      team: [TEAM_MEMBERS[0], TEAM_MEMBERS[1]],
      startDate: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      blockedByPayment: false,
      blockPaymentEnabled: true,
      revisionLimit: 2,
      revisionsUsed: 0,
      stages,
      deliverables,
      checklist: generateChecklist(projectId, stages),
      clientChecklist: generateClientChecklist(projectId),
      files: [],
      auditLogs: generateAuditLogs(projectId),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  })(),
];

// Export comments separately for easy access
export const MOCK_COMMENTS: Comment[] = [
  ...generateComments('proj-1-del-0', 'proj-1-del-0-v1'),
];

// Stats calculation helpers
export const getProjectStats = () => {
  const total = MOCK_PROJECTS.length;
  const emRisco = MOCK_PROJECTS.filter(p => p.status === 'em_risco').length;
  const bloqueados = MOCK_PROJECTS.filter(p => p.status === 'bloqueado').length;
  const atrasados = MOCK_PROJECTS.filter(p => p.status === 'atrasado').length;
  const ok = MOCK_PROJECTS.filter(p => p.status === 'ok').length;
  const valorTotal = MOCK_PROJECTS.reduce((acc, p) => acc + p.contractValue, 0);
  const healthMedia = Math.round(MOCK_PROJECTS.reduce((acc, p) => acc + p.healthScore, 0) / total);
  
  return { total, emRisco, bloqueados, atrasados, ok, valorTotal, healthMedia };
};

export const getProjectsByStage = () => {
  const stages = PROJECT_STAGES.map(s => s.type);
  return stages.map(stage => ({
    stage,
    name: PROJECT_STAGES.find(s => s.type === stage)?.name || stage,
    count: MOCK_PROJECTS.filter(p => p.currentStage === stage).length,
  }));
};
