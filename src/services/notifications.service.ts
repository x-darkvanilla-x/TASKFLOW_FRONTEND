import api from './api';

export type NotificationType = 'workspace_added' | 'task_assigned' | 'workspace_removed' | 'general';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
  metadata?: {
    workspaceId?: string;
    workspaceName?: string;
    taskId?: string;
    taskTitle?: string;
    actorName?: string;
    role?: string;
  };
}

export const notificationsService = {
  async getAll(): Promise<AppNotification[]> {
    try {
      const response = await api.get('/notifications');
      const data = response.data?.data || response.data || [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async markAsRead(id: string): Promise<boolean> {
    try {
      await api.patch(`/notifications/${id}/read`);
      return true;
    } catch {
      return false;
    }
  },

  async markAllAsRead(): Promise<boolean> {
    try {
      await api.patch('/notifications/read-all');
      return true;
    } catch {
      return false;
    }
  },

  async remove(id: string): Promise<boolean> {
    try {
      await api.delete(`/notifications/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  async removeAll(): Promise<boolean> {
    try {
      await api.delete('/notifications');
      return true;
    } catch {
      return false;
    }
  },
};
