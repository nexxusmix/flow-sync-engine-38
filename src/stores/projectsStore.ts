import { create } from 'zustand';
import { 
  ProjectFilters, 
  ViewMode, 
  ProjectTemplate,
} from '@/types/projects';
import { ProjectUpdate } from '@/types/projectUpdates';

// UI-only store for Projects module
// Data is managed by useProjects hook (Supabase)
interface ProjectsUIState {
  // UI State
  selectedProjectId: string | null;
  filters: ProjectFilters;
  viewMode: ViewMode;
  isNewProjectModalOpen: boolean;
  isEditProjectModalOpen: boolean;
  
  // Local updates cache (for optimistic UI)
  projectUpdates: Record<string, ProjectUpdate[]>;
  
  // Actions
  setFilters: (filters: Partial<ProjectFilters>) => void;
  resetFilters: () => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedProjectId: (id: string | null) => void;
  setNewProjectModalOpen: (open: boolean) => void;
  setEditProjectModalOpen: (open: boolean) => void;
  
  // Updates (local cache for UI)
  addProjectUpdate: (projectId: string, update: ProjectUpdate) => void;
  getProjectUpdates: (projectId: string) => ProjectUpdate[];
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

export const useProjectsStore = create<ProjectsUIState>((set, get) => ({
  // UI State - initialized empty
  selectedProjectId: null,
  filters: defaultFilters,
  viewMode: 'list',
  isNewProjectModalOpen: false,
  isEditProjectModalOpen: false,
  projectUpdates: {},

  // Filter actions
  setFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters } 
  })),

  resetFilters: () => set({ filters: defaultFilters }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setSelectedProjectId: (id) => set({ selectedProjectId: id }),

  setNewProjectModalOpen: (open) => set({ isNewProjectModalOpen: open }),

  setEditProjectModalOpen: (open) => set({ isEditProjectModalOpen: open }),

  // Project updates (local cache for UI optimism)
  addProjectUpdate: (projectId, update) => set((state) => ({
    projectUpdates: {
      ...state.projectUpdates,
      [projectId]: [...(state.projectUpdates[projectId] || []), update],
    },
  })),

  getProjectUpdates: (projectId) => {
    return get().projectUpdates[projectId] || [];
  },
}));

// Selector hooks for specific state slices
export const useProjectFilters = () => useProjectsStore((state) => ({
  filters: state.filters,
  setFilters: state.setFilters,
  resetFilters: state.resetFilters,
}));

export const useProjectViewMode = () => useProjectsStore((state) => ({
  viewMode: state.viewMode,
  setViewMode: state.setViewMode,
}));

export const useProjectModals = () => useProjectsStore((state) => ({
  isNewProjectModalOpen: state.isNewProjectModalOpen,
  isEditProjectModalOpen: state.isEditProjectModalOpen,
  setNewProjectModalOpen: state.setNewProjectModalOpen,
  setEditProjectModalOpen: state.setEditProjectModalOpen,
  selectedProjectId: state.selectedProjectId,
  setSelectedProjectId: state.setSelectedProjectId,
}));
