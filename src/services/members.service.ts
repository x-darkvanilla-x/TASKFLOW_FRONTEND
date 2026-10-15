import api from './api';

export interface Member {
  _id?: string;
  name: string;
  username?: string;
  email?: string;
  role?: string;
  avatarColor?: string;
  memberUserId?: string;
  workspaceId?: string;
  workspaceName?: string;
  isOwner?: boolean;
  createdAt?: string;
}

export interface CreateMemberPayload {
  name: string;
  username?: string;
  email?: string;
  role?: string;
  avatarColor?: string;
  memberUserId?: string;
  workspaceId?: string;
  workspaceName?: string;
}

export interface SearchedUser {
  _id: string;
  name: string;
  username: string;
  email?: string;
}

export const membersService = {
  async getMyWorkspaces(): Promise<any[]> {
    try {
      const response = await api.get('/members/workspaces');
      const data = response.data?.data || response.data || [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async createWorkspace(payload: { name: string; icon?: string; color?: string }): Promise<any> {
    try {
      const response = await api.post('/members/workspaces', payload);
      return response.data?.data || response.data;
    } catch {
      return null;
    }
  },

  async updateWorkspace(id: string, payload: { name?: string; icon?: string; color?: string }): Promise<any> {
    try {
      const response = await api.patch(`/members/workspaces/${id}`, payload);
      return response.data?.data || response.data;
    } catch {
      return null;
    }
  },

  async getAll(workspaceOwnerId?: string, workspaceId?: string): Promise<Member[]> {
    try {
      const params = new URLSearchParams();
      if (workspaceOwnerId) params.append('workspaceOwnerId', workspaceOwnerId);
      if (workspaceId) params.append('workspaceId', workspaceId);
      const query = params.toString();
      const url = query ? `/members?${query}` : '/members';
      const response = await api.get(url);
      const data = response.data?.data || response.data || [];
      return Array.isArray(data) ? data : [];
    } catch {
      // Fallback to local storage if API is temporarily unavailable
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem('local_workspace_members');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            const mockHandles = [
              'sarah_dev',
              'alexj',
              'mchen_lead',
              'emma_ui',
              'david_kim',
              'liam_backend',
              'sophia_pm',
            ];
            const cleaned = Array.isArray(parsed)
              ? parsed.filter(
                  (m: Member) =>
                    !mockHandles.includes(m.username?.toLowerCase() || '') &&
                    !m._id?.startsWith('u-') &&
                    m.name !== 'Sarah Connor' &&
                    m.name !== 'Alex Johnson'
                )
              : [];
            if (cleaned.length !== parsed.length) {
              localStorage.setItem('local_workspace_members', JSON.stringify(cleaned));
            }
            return cleaned;
          } catch {}
        }
      }
      return [];
    }
  },

  async create(payload: CreateMemberPayload): Promise<Member> {
    try {
      const response = await api.post('/members', payload);
      const created = response.data?.data || response.data;
      if (created) return created;
    } catch {}

    const fallbackMember: Member = {
      _id: `mem-${Date.now()}`,
      name: payload.name,
      username: payload.username || payload.name.toLowerCase().replace(/\s+/g, '_'),
      email: payload.email,
      role: payload.role || 'Member',
      avatarColor: payload.avatarColor || 'bg-indigo-600',
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('local_workspace_members');
      const list: Member[] = local ? JSON.parse(local) : [];
      list.push(fallbackMember);
      localStorage.setItem('local_workspace_members', JSON.stringify(list));
    }

    return fallbackMember;
  },

  async searchUsers(query: string): Promise<SearchedUser[]> {
    if (!query || !query.trim()) return [];
    try {
      const response = await api.get(`/members/search?q=${encodeURIComponent(query.trim())}`);
      const list = response.data?.data || response.data || [];
      if (Array.isArray(list)) {
        return list;
      }
    } catch {}

    return [];
  },

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`/members/${id}`);
      return true;
    } catch {
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem('local_workspace_members');
        if (local) {
          const list: Member[] = JSON.parse(local);
          const filtered = list.filter((m) => m._id !== id);
          localStorage.setItem('local_workspace_members', JSON.stringify(filtered));
        }
      }
      return true;
    }
  },
};

/**
 * Formats a member's name to show first name and surname first initial (e.g., "Dipesh Adelkar" -> "Dipesh A.")
 */
export function formatMemberName(name?: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed || trimmed.toLowerCase() === 'you' || trimmed.toLowerCase() === 'unassigned') return trimmed;
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) return trimmed;
  const firstName = parts[0];
  const surnameInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstName} ${surnameInitial}.`;
}
