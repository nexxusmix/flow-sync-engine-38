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
  created_at: string;
  updated_at: string;
}

export interface TaskColumn {
  key: Task['status'];
  title: string;
  color: string;
}

export interface TaskCategory {
  key: Task['category'];
  label: string;
  color: string;
}

export interface GeneratedTask {
  title: string;
  description?: string | null;
  category: Task['category'];
  tags: string[];
  due_date?: string | null;
  status: Task['status'];
}
