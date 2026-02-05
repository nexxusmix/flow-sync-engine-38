import { create } from 'zustand';
import { 
  Project, 
  ProjectFilters, 
  ViewMode, 
  Deliverable, 
  Comment, 
  ChecklistItem,
  ProjectStage,
  AuditLog,
  PortalLink,
  DeliverableVersion,
  ProjectTemplate,
  ProjectStageType
} from '@/types/projects';
import { ProjectUpdate } from '@/types/projectUpdates';
import { TEAM_MEMBERS, CLIENTS } from '@/data/projectsMockData';
import { getTemplateById, PROJECT_STAGES } from '@/data/projectTemplates';

interface ProjectsState {
  projects: Project[];
  selectedProject: Project | null;
  filters: ProjectFilters;
  viewMode: ViewMode;
  isNewProjectModalOpen: boolean;
  isEditProjectModalOpen: boolean;
  projectUpdates: Record<string, ProjectUpdate[]>;
  
  // Actions
  setFilters: (filters: Partial<ProjectFilters>) => void;
  resetFilters: () => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedProject: (project: Project | null) => void;
  setNewProjectModalOpen: (open: boolean) => void;
  setEditProjectModalOpen: (open: boolean) => void;
  
  // CRUD
  addProject: (projectData: Partial<Project>) => Project;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  // Deliverables
  addDeliverable: (projectId: string, deliverable: Partial<Deliverable>) => void;
  updateDeliverable: (projectId: string, deliverableId: string, data: Partial<Deliverable>) => void;
  addDeliverableVersion: (projectId: string, deliverableId: string, version: Partial<DeliverableVersion>) => void;
  
  // Comments
  addComment: (projectId: string, deliverableId: string, comment: Partial<Comment>) => void;
  resolveComment: (projectId: string, deliverableId: string, commentId: string) => void;
  
  // Checklist
  updateChecklistItem: (projectId: string, itemId: string, data: Partial<ChecklistItem>) => void;
  
  // Stages
  updateStage: (projectId: string, stageId: string, data: Partial<ProjectStage>) => void;
  advanceStage: (projectId: string) => void;
  moveProjectToStage: (projectId: string, newStage: ProjectStageType) => void;
  
  // Portal
  generatePortalLink: (projectId: string) => void;
  regeneratePortalToken: (projectId: string) => void;
  togglePortalActive: (projectId: string) => void;
  updatePortalVisibleDeliverables: (projectId: string, deliverableIds: string[]) => void;
  
  // Audit
  addAuditLog: (projectId: string, log: Partial<AuditLog>) => void;
  
  // Updates
  addProjectUpdate: (projectId: string, update: ProjectUpdate) => void;
  getProjectUpdates: (projectId: string) => ProjectUpdate[];
  
  // Getters
  getFilteredProjects: () => Project[];
  getProjectById: (id: string) => Project | undefined;
  getProjectByShareToken: (token: string) => Project | undefined;
}

const defaultFilters: ProjectFilters = {
  search: '',
  status: 'all',
  stage: 'all',
  client: 'all',
  owner: 'all',
  template: 'all',
  deadline: 'all',
  blockedByPayment: 'all',
};

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [], // Start empty - no mock data
  selectedProject: null,
  filters: defaultFilters,
  viewMode: 'list',
  isNewProjectModalOpen: false,
  isEditProjectModalOpen: false,
  projectUpdates: {},

  setFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters } 
  })),

  resetFilters: () => set({ filters: defaultFilters }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setSelectedProject: (project) => set({ selectedProject: project }),

  setNewProjectModalOpen: (open) => set({ isNewProjectModalOpen: open }),

  setEditProjectModalOpen: (open) => set({ isEditProjectModalOpen: open }),

  addProject: (projectData) => {
    const template = getTemplateById(projectData.template as ProjectTemplate);
    const newId = `proj-${Date.now()}`;
    
    // Generate stages from template
    const stages: ProjectStage[] = (template?.defaultStages || PROJECT_STAGES.map(s => s.type)).map((stageType, index) => ({
      id: `${newId}-stage-${index}`,
      projectId: newId,
      name: PROJECT_STAGES.find(s => s.type === stageType)?.name || stageType,
      type: stageType as ProjectStageType,
      order: index + 1,
      status: index === 0 ? 'em_andamento' : 'nao_iniciado',
      dependencies: index > 0 ? [template?.defaultStages[index - 1] || ''] : [],
    }));

    // Generate checklist from template
    const checklist: ChecklistItem[] = (template?.defaultChecklist || []).map((item, index) => ({
      ...item,
      id: `${newId}-check-${index}`,
      projectId: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    // Generate default deliverables from template
    const deliverables: Deliverable[] = (template?.defaultDeliverables || []).map((del, index) => ({
      id: `${newId}-del-${index}`,
      projectId: newId,
      title: del.title,
      type: del.type,
      currentVersion: 0,
      status: 'rascunho',
      visibleInPortal: false,
      revisionLimit: template?.defaultRevisionLimit || 2,
      revisionsUsed: 0,
      versions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const newProject: Project = {
      id: newId,
      title: projectData.title || 'Novo Projeto',
      clientId: projectData.clientId || CLIENTS[0].id,
      client: CLIENTS.find(c => c.id === projectData.clientId) || CLIENTS[0],
      dealId: projectData.dealId,
      template: projectData.template || 'filme_institucional',
      currentStage: 'briefing',
      status: 'ok',
      healthScore: 100,
      contractValue: projectData.contractValue || 0,
      owner: projectData.owner || TEAM_MEMBERS[0],
      team: projectData.team || [TEAM_MEMBERS[0]],
      startDate: projectData.startDate || new Date().toISOString(),
      estimatedDelivery: projectData.estimatedDelivery || new Date(Date.now() + (template?.defaultSLADays || 30) * 24 * 60 * 60 * 1000).toISOString(),
      blockedByPayment: false,
      blockPaymentEnabled: projectData.blockPaymentEnabled !== false,
      revisionLimit: template?.defaultRevisionLimit || 2,
      revisionsUsed: 0,
      stages,
      deliverables,
      checklist,
      clientChecklist: [],
      files: [],
      auditLogs: [{
        id: `${newId}-log-1`,
        projectId: newId,
        timestamp: new Date().toISOString(),
        actor: projectData.owner?.name || TEAM_MEMBERS[0].name,
        actorType: 'team',
        action: 'create',
        entityType: 'project',
        entityId: newId,
        description: 'Projeto criado',
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({ 
      projects: [...state.projects, newProject],
      isNewProjectModalOpen: false,
    }));

    return newProject;
  },

  updateProject: (id, data) => set((state) => ({
    projects: state.projects.map(p => 
      p.id === id 
        ? { ...p, ...data, updatedAt: new Date().toISOString() }
        : p
    ),
    selectedProject: state.selectedProject?.id === id 
      ? { ...state.selectedProject, ...data, updatedAt: new Date().toISOString() }
      : state.selectedProject,
  })),

  deleteProject: (id) => set((state) => ({
    projects: state.projects.filter(p => p.id !== id),
    selectedProject: state.selectedProject?.id === id ? null : state.selectedProject,
  })),

  addDeliverable: (projectId, deliverable) => set((state) => {
    const newDeliverable: Deliverable = {
      id: `${projectId}-del-${Date.now()}`,
      projectId,
      title: deliverable.title || 'Novo Entregável',
      type: deliverable.type || 'video',
      currentVersion: 0,
      status: 'rascunho',
      visibleInPortal: deliverable.visibleInPortal || false,
      revisionLimit: deliverable.revisionLimit || 2,
      revisionsUsed: 0,
      versions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      projects: state.projects.map(p => 
        p.id === projectId 
          ? { ...p, deliverables: [...p.deliverables, newDeliverable], updatedAt: new Date().toISOString() }
          : p
      ),
    };
  }),

  updateDeliverable: (projectId, deliverableId, data) => set((state) => ({
    projects: state.projects.map(p => 
      p.id === projectId 
        ? {
            ...p,
            deliverables: p.deliverables.map(d => 
              d.id === deliverableId ? { ...d, ...data, updatedAt: new Date().toISOString() } : d
            ),
            updatedAt: new Date().toISOString(),
          }
        : p
    ),
  })),

  addDeliverableVersion: (projectId, deliverableId, version) => set((state) => {
    const project = state.projects.find(p => p.id === projectId);
    const deliverable = project?.deliverables.find(d => d.id === deliverableId);
    const newVersionNumber = (deliverable?.currentVersion || 0) + 1;

    const newVersion: DeliverableVersion = {
      id: `${deliverableId}-v${newVersionNumber}`,
      deliverableId,
      versionNumber: newVersionNumber,
      fileUrl: version.fileUrl || '',
      fileType: version.fileType || 'video',
      author: version.author || TEAM_MEMBERS[0],
      notes: version.notes,
      createdAt: new Date().toISOString(),
      status: 'rascunho',
    };

    return {
      projects: state.projects.map(p => 
        p.id === projectId 
          ? {
              ...p,
              deliverables: p.deliverables.map(d => 
                d.id === deliverableId 
                  ? { 
                      ...d, 
                      versions: [...d.versions, newVersion],
                      currentVersion: newVersionNumber,
                      updatedAt: new Date().toISOString(),
                    } 
                  : d
              ),
              updatedAt: new Date().toISOString(),
            }
          : p
      ),
    };
  }),

  addComment: (projectId, deliverableId, comment) => set((state) => {
    const project = state.projects.find(p => p.id === projectId);
    const deliverable = project?.deliverables.find(d => d.id === deliverableId);
    const currentVersion = deliverable?.versions[deliverable.versions.length - 1];
    const existingComments = currentVersion ? [] : []; // Would need to track comments separately

    const newComment: Comment = {
      id: `${deliverableId}-comment-${Date.now()}`,
      deliverableId,
      versionId: currentVersion?.id || '',
      author: comment.author || 'Cliente',
      authorType: comment.authorType || 'client',
      content: comment.content || '',
      timecode: comment.timecode,
      pinX: comment.pinX,
      pinY: comment.pinY,
      status: 'open',
      round: 1, // Would calculate based on existing comments
      createdAt: new Date().toISOString(),
    };

    // For now, we'll add an audit log
    return {
      projects: state.projects.map(p => 
        p.id === projectId 
          ? {
              ...p,
              auditLogs: [...p.auditLogs, {
                id: `${projectId}-log-${Date.now()}`,
                projectId,
                timestamp: new Date().toISOString(),
                actor: newComment.author,
                actorType: newComment.authorType,
                action: 'comment',
                entityType: 'comment',
                entityId: newComment.id,
                description: `Comentário adicionado: "${newComment.content.substring(0, 50)}..."`,
              }],
              updatedAt: new Date().toISOString(),
            }
          : p
      ),
    };
  }),

  resolveComment: (projectId, deliverableId, commentId) => {
    // Would update comment status to resolved
    get().addAuditLog(projectId, {
      action: 'resolve_comment',
      entityType: 'comment',
      entityId: commentId,
      description: 'Comentário marcado como resolvido',
    });
  },

  updateChecklistItem: (projectId, itemId, data) => set((state) => ({
    projects: state.projects.map(p => 
      p.id === projectId 
        ? {
            ...p,
            checklist: p.checklist.map(item => 
              item.id === itemId ? { ...item, ...data, updatedAt: new Date().toISOString() } : item
            ),
            updatedAt: new Date().toISOString(),
          }
        : p
    ),
  })),

  updateStage: (projectId, stageId, data) => set((state) => ({
    projects: state.projects.map(p => 
      p.id === projectId 
        ? {
            ...p,
            stages: p.stages.map(s => 
              s.id === stageId ? { ...s, ...data } : s
            ),
            updatedAt: new Date().toISOString(),
          }
        : p
    ),
  })),

  advanceStage: (projectId) => set((state) => {
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return state;

    const currentStageIndex = project.stages.findIndex(s => s.type === project.currentStage);
    if (currentStageIndex === -1 || currentStageIndex >= project.stages.length - 1) return state;

    const nextStage = project.stages[currentStageIndex + 1];

    return {
      projects: state.projects.map(p => 
        p.id === projectId 
          ? {
              ...p,
              currentStage: nextStage.type,
              stages: p.stages.map((s, idx) => {
                if (idx === currentStageIndex) return { ...s, status: 'concluido', actualDate: new Date().toISOString() };
                if (idx === currentStageIndex + 1) return { ...s, status: 'em_andamento' };
                return s;
              }),
              auditLogs: [...p.auditLogs, {
                id: `${projectId}-log-${Date.now()}`,
                projectId,
                timestamp: new Date().toISOString(),
                actor: 'Sistema',
                actorType: 'system',
                action: 'stage_change',
                entityType: 'stage',
                entityId: nextStage.id,
                description: `Projeto avançou para etapa: ${nextStage.name}`,
              }],
              updatedAt: new Date().toISOString(),
            }
          : p
      ),
    };
  }),

  moveProjectToStage: (projectId, newStage) => set((state) => {
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return state;

    const stageName = PROJECT_STAGES.find(s => s.type === newStage)?.name || newStage;

    return {
      projects: state.projects.map(p => 
        p.id === projectId 
          ? {
              ...p,
              currentStage: newStage,
              auditLogs: [...p.auditLogs, {
                id: `${projectId}-log-${Date.now()}`,
                projectId,
                timestamp: new Date().toISOString(),
                actor: 'Sistema',
                actorType: 'system',
                action: 'stage_change',
                entityType: 'stage',
                entityId: newStage,
                description: `Projeto movido para etapa: ${stageName}`,
              }],
              updatedAt: new Date().toISOString(),
            }
          : p
      ),
    };
  }),

  generatePortalLink: (projectId) => set((state) => {
    const shareToken = `sqd_${projectId}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    const portalLink: PortalLink = {
      id: `${projectId}-portal`,
      projectId,
      shareToken,
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      visibleDeliverables: [],
      clientActivity: [],
      createdAt: new Date().toISOString(),
    };

    return {
      projects: state.projects.map(p => 
        p.id === projectId 
          ? { ...p, portalLink, updatedAt: new Date().toISOString() }
          : p
      ),
    };
  }),

  regeneratePortalToken: (projectId) => set((state) => {
    const newToken = `sqd_${projectId}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    return {
      projects: state.projects.map(p => 
        p.id === projectId && p.portalLink
          ? { 
              ...p, 
              portalLink: { 
                ...p.portalLink, 
                shareToken: newToken,
                regeneratedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            }
          : p
      ),
    };
  }),

  togglePortalActive: (projectId) => set((state) => ({
    projects: state.projects.map(p => 
      p.id === projectId && p.portalLink
        ? { 
            ...p, 
            portalLink: { ...p.portalLink, isActive: !p.portalLink.isActive },
            updatedAt: new Date().toISOString(),
          }
        : p
    ),
  })),

  updatePortalVisibleDeliverables: (projectId, deliverableIds) => set((state) => ({
    projects: state.projects.map(p => 
      p.id === projectId && p.portalLink
        ? { 
            ...p, 
            portalLink: { ...p.portalLink, visibleDeliverables: deliverableIds },
            updatedAt: new Date().toISOString(),
          }
        : p
    ),
  })),

  addAuditLog: (projectId, log) => set((state) => ({
    projects: state.projects.map(p => 
      p.id === projectId 
        ? {
            ...p,
            auditLogs: [...p.auditLogs, {
              id: `${projectId}-log-${Date.now()}`,
              projectId,
              timestamp: new Date().toISOString(),
              actor: log.actor || 'Sistema',
              actorType: log.actorType || 'system',
              action: log.action || 'unknown',
              entityType: log.entityType || 'project',
              entityId: log.entityId || projectId,
              description: log.description || '',
              metadata: log.metadata,
            }],
          }
        : p
    ),
  })),

  addProjectUpdate: (projectId, update) => set((state) => ({
    projectUpdates: {
      ...state.projectUpdates,
      [projectId]: [...(state.projectUpdates[projectId] || []), update].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    },
    projects: state.projects.map(p => 
      p.id === projectId 
        ? {
            ...p,
            auditLogs: [...p.auditLogs, {
              id: `${projectId}-log-${Date.now()}`,
              projectId,
              timestamp: new Date().toISOString(),
              actor: update.author,
              actorType: update.authorType,
              action: 'update_added',
              entityType: 'project',
              entityId: update.id,
              description: `Atualização adicionada: ${update.summary?.substring(0, 50) || update.content.substring(0, 50)}...`,
            }],
          }
        : p
    ),
  })),

  getProjectUpdates: (projectId) => get().projectUpdates[projectId] || [],

  getFilteredProjects: () => {
    const { projects, filters } = get();
    
    return projects.filter(project => {
      // Search filter
      if (filters.search && !project.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !project.client.company.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (filters.status !== 'all' && project.status !== filters.status) {
        return false;
      }
      
      // Stage filter
      if (filters.stage !== 'all' && project.currentStage !== filters.stage) {
        return false;
      }
      
      // Client filter
      if (filters.client !== 'all' && project.clientId !== filters.client) {
        return false;
      }
      
      // Owner filter
      if (filters.owner !== 'all' && project.owner.id !== filters.owner) {
        return false;
      }
      
      // Template filter
      if (filters.template !== 'all' && project.template !== filters.template) {
        return false;
      }
      
      // Deadline filter
      if (filters.deadline !== 'all') {
        const delivery = new Date(project.estimatedDelivery);
        const now = new Date();
        const diffDays = Math.ceil((delivery.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (filters.deadline === 'atrasado' && diffDays >= 0) return false;
        if (filters.deadline === '7days' && (diffDays < 0 || diffDays > 7)) return false;
        if (filters.deadline === '30days' && (diffDays < 0 || diffDays > 30)) return false;
      }
      
      // Blocked by payment filter
      if (filters.blockedByPayment !== 'all' && project.blockedByPayment !== filters.blockedByPayment) {
        return false;
      }
      
      return true;
    });
  },

  getProjectById: (id) => get().projects.find(p => p.id === id),

  getProjectByShareToken: (token) => get().projects.find(p => p.portalLink?.shareToken === token),
}));
