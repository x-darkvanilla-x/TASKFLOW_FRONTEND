import api from './api';

export type TaskStatus = 'todo' | 'doing' | 'in-progress' | 'completed' | 'done' | 'on-hold';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent' | 'no-priority' | 'none';

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
    priority: 'urgent' | 'high' | 'medium' | 'low';
    assignee: string;
    dueDate?: string;
  }[];
  resources?: {
    id: string;
    title: string;
    url: string;
  }[];
  userId: string;
  createdBy?: string;
  creatorName?: string;
  isLocked?: boolean;
  workspaceId?: string;
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
  createdBy?: string;
  creatorName?: string;
  isLocked?: boolean;
  workspaceId?: string;
  subtasks?: {
    id: string;
    title: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
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
  workspaceId?: string;
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
    const activeWsId = typeof window !== 'undefined' ? localStorage.getItem('followup_active_workspace_id') : undefined;
    const wsId = filters?.workspaceId || activeWsId;
    if (wsId) params.append('workspaceId', wsId);
    const response = await api.get(`/tasks?${params.toString()}`);
    return response.data.data;
  },

  async create(payload: CreateTaskPayload): Promise<Task> {
    const activeWsId = typeof window !== 'undefined' ? localStorage.getItem('followup_active_workspace_id') : undefined;
    const body = {
      ...(activeWsId && !payload.workspaceId ? { workspaceId: activeWsId } : {}),
      ...payload,
    };
    const response = await api.post('/tasks', body);
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

  async getStats(workspaceId?: string): Promise<TaskStats> {
    const activeWsId = workspaceId || (typeof window !== 'undefined' ? localStorage.getItem('followup_active_workspace_id') : undefined);
    const query = activeWsId ? `?workspaceId=${encodeURIComponent(activeWsId)}` : '';
    const response = await api.get(`/tasks/stats${query}`);
    return response.data.data;
  },
};
