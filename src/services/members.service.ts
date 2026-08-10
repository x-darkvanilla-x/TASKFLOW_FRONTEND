import api from './api';

export interface Member {
  _id?: string;
  name: string;
  email?: string;
  role?: string;
  avatarColor?: string;
}

export interface CreateMemberPayload {
  name: string;
  email?: string;
  role?: string;
  avatarColor?: string;
}

export const membersService = {
  async getAll(): Promise<Member[]> {
    try {
      const response = await api.get('/members');
      return response.data?.data || [];
    } catch {
      return [];
    }
  },

  async create(payload: CreateMemberPayload): Promise<Member> {
    try {
      const response = await api.post('/members', payload);
      return response.data.data;
    } catch {
      return {
        _id: `mem-${Date.now()}`,
        name: payload.name,
        role: payload.role || 'Member',
        avatarColor: payload.avatarColor || 'bg-indigo-600',
      };
    }
  },
};
