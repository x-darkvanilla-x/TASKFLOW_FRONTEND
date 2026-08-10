import api from './api';

export type TaskStatus = 'todo' | 'doing' | 'in-progress' | 'completed' | 'done' | 'on-hold';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  assignee?: string;
  avatarColor?: string;
  tags?: string[];
  subtasks?: {
    id: string;
    title: string;
    priority: 'high' | 'medium' | 'low';
    assignee: string;
    dueDate?: string;
  }[];
  resources?: {
    id: string;
    title: string;
    url: string;
  }[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assignee?: string;
  avatarColor?: string;
  tags?: string[];
  subtasks?: {
    id: string;
    title: string;
    priority: 'high' | 'medium' | 'low';
    assignee: string;
    dueDate?: string;
  }[];
  resources?: {
    id: string;
    title: string;
    url: string;
  }[];
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {}

export interface FilterParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
}

export interface TaskStats {
  total: number;
  todo: number;
  doing?: number;
  inProgress: number;
  completed?: number;
  done: number;
  onHold?: number;
}

export const tasksService = {
  async getAll(filters?: FilterParams): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.search) params.append('search', filters.search);
    const response = await api.get(`/tasks?${params.toString()}`);
    return response.data.data;
  },

  async create(payload: CreateTaskPayload): Promise<Task> {
    const response = await api.post('/tasks', payload);
    return response.data.data;
  },

  async getById(id: string): Promise<Task> {
    const response = await api.get(`/tasks/${id}`);
    return response.data.data;
  },

  async update(id: string, payload: UpdateTaskPayload): Promise<Task> {
    const response = await api.patch(`/tasks/${id}`, payload);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },

  async getStats(): Promise<TaskStats> {
    const response = await api.get('/tasks/stats');
    return response.data.data;
  },
};
