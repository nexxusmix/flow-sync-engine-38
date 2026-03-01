import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'backlog' | 'week' | 'today' | 'done';
  category: 'pessoal' | 'operacao' | 'projeto';
  tags: string[];
  due_date: string | null;
  completed_at: string | null;
  position: number;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface TaskColumn {
  key: 'backlog' | 'week' | 'today' | 'done';
  title: string;
  color: string;
}

export const TASK_COLUMNS: TaskColumn[] = [
  { key: 'backlog', title: 'Backlog', color: 'bg-muted' },
  { key: 'week', title: 'Esta Semana', color: 'bg-primary/10' },
  { key: 'today', title: 'Hoje', color: 'bg-primary/15' },
  { key: 'done', title: 'Concluído', color: 'bg-primary/5' },
];

export const TASK_CATEGORIES = [
  { key: 'operacao', label: 'Operação', color: 'bg-primary' },
  { key: 'pessoal', label: 'Pessoal', color: 'bg-primary/70' },
  { key: 'projeto', label: 'Projeto', color: 'bg-primary/50' },
] as const;

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  isCreating: boolean;
  isGenerating: boolean;
  
  // Actions
  fetchTasks: () => Promise<void>;
  createTask: (task: Partial<Task>) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: Task['status'], newPosition?: number) => Promise<void>;
  createTasksFromAI: (tasks: Array<Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'position' | 'completed_at'>>) => Promise<number>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  isLoading: false,
  isCreating: false,
  isGenerating: false,

  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ tasks: (data as Task[]) || [] });
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createTask: async (taskData) => {
    set({ isCreating: true });
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          user_id: userData.user.id,
          title: taskData.title || 'Nova tarefa',
          description: taskData.description || null,
          status: taskData.status || 'backlog',
          category: taskData.category || 'operacao',
          tags: taskData.tags || [],
          due_date: taskData.due_date || null,
          position: 0,
        }])
        .select()
        .single();

      if (error) throw error;

      const newTask = data as Task;
      set(state => ({ tasks: [newTask, ...state.tasks] }));
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    } finally {
      set({ isCreating: false });
    }
  },

  updateTask: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
      }));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  },

  deleteTask: async (id) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        tasks: state.tasks.filter(t => t.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  },

  toggleComplete: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;

    const isCompleting = task.status !== 'done';
    const updates: Partial<Task> = {
      status: isCompleting ? 'done' : 'backlog',
      completed_at: isCompleting ? new Date().toISOString() : null,
    };

    await get().updateTask(id, updates);
  },

  moveTask: async (taskId, newStatus, newPosition) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;

    const updates: Partial<Task> = {
      status: newStatus,
      position: newPosition ?? task.position,
    };

    // If moving to done, set completed_at
    if (newStatus === 'done' && task.status !== 'done') {
      updates.completed_at = new Date().toISOString();
    } else if (newStatus !== 'done' && task.status === 'done') {
      updates.completed_at = null;
    }

    await get().updateTask(taskId, updates);
  },

  createTasksFromAI: async (tasks) => {
    set({ isGenerating: true });
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const tasksToInsert = tasks.map((task, index) => ({
        user_id: userData.user!.id,
        title: task.title,
        description: task.description || null,
        status: task.status || 'backlog',
        category: task.category || 'operacao',
        tags: task.tags || [],
        due_date: task.due_date || null,
        position: index,
      }));

      const { data, error } = await supabase
        .from('tasks')
        .insert(tasksToInsert)
        .select();

      if (error) throw error;

      const newTasks = (data as Task[]) || [];
      set(state => ({ tasks: [...newTasks, ...state.tasks] }));
      return newTasks.length;
    } catch (error) {
      console.error('Error creating tasks from AI:', error);
      throw error;
    } finally {
      set({ isGenerating: false });
    }
  },
}));
