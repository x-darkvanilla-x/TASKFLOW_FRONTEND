'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { membersService } from '@/services/members.service';
import { useAuth } from './AuthContext';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  role: 'Owner' | 'Admin' | 'Member' | 'Developer' | string;
  plan?: 'Free' | 'Pro' | 'Enterprise' | 'Team';
  membersCount?: number;
  ownerId?: string;
  ownerName?: string;
}

const DEFAULT_WORKSPACES: Workspace[] = [
  {
    id: 'ws-default',
    name: 'My Workspace',
    slug: 'my-workspace',
    icon: 'building',
    color: '#4F46E5', // Indigo
    role: 'Owner',
    plan: 'Free',
    membersCount: 1,
  },
];

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  switchWorkspace: (workspaceId: string) => void;
  createWorkspace: (name: string, icon?: string, color?: string) => Workspace;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspaces: DEFAULT_WORKSPACES,
  currentWorkspace: DEFAULT_WORKSPACES[0],
  switchWorkspace: () => {},
  createWorkspace: () => DEFAULT_WORKSPACES[0],
  updateWorkspace: () => {},
  deleteWorkspace: () => {},
  refreshWorkspaces: async () => {},
});

export const WorkspaceProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>(DEFAULT_WORKSPACES);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>(DEFAULT_WORKSPACES[0].id);

  const refreshWorkspaces = async () => {
    try {
      const remote = await membersService.getMyWorkspaces();
      if (Array.isArray(remote) && remote.length > 0) {
        let mergedList: Workspace[] = [];
        setWorkspaces((prev) => {
          const merged: Workspace[] = [...remote];
          for (const p of prev) {
            const isOwnedByMe = user?.id && (p.ownerId === user.id || p.role === 'Owner');
            if (
              isOwnedByMe &&
              p.id !== 'ws-default' &&
              !merged.some((m) => m.id === p.id || m.name === p.name)
            ) {
              merged.push(p);
            }
          }
          mergedList = merged;
          localStorage.setItem('followup_workspaces', JSON.stringify(merged));
          return merged;
        });

        const savedActiveId = localStorage.getItem('followup_active_workspace_id');
        setCurrentWorkspaceId((prevId) => {
          const list = mergedList.length > 0 ? mergedList : remote;
          const targetWs =
            (savedActiveId && list.find((r) => r.id === savedActiveId)) ||
            list.find((r) => r.id === prevId) ||
            list[0];

          if (targetWs) {
            localStorage.setItem('followup_active_workspace_id', targetWs.id);
            if (targetWs.ownerId) {
              localStorage.setItem('followup_active_workspace_owner_id', targetWs.ownerId);
            } else {
              localStorage.removeItem('followup_active_workspace_owner_id');
            }
            return targetWs.id;
          }
          return prevId;
        });
      }
    } catch {}
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshWorkspaces();
    }
  }, [isAuthenticated, user?.id]);

  // Initialize from localStorage and fetch remote accessible workspaces
  useEffect(() => {
    try {
      const savedWorkspaces = localStorage.getItem('followup_workspaces');
      const savedActiveId = localStorage.getItem('followup_active_workspace_id');

      let parsedWorkspaces = DEFAULT_WORKSPACES;
      if (savedWorkspaces) {
        const raw = JSON.parse(savedWorkspaces);
        const filtered = Array.isArray(raw)
          ? raw.filter(
              (w: Workspace) =>
                !['ws-acme', 'ws-personal', 'ws-engineering'].includes(w.id) &&
                w.name !== 'Acme Corp' &&
                w.name !== 'Engineering Sprint'
            )
          : [];

        if (filtered.length > 0) {
          parsedWorkspaces = filtered.map((w: Workspace) => {
            let cleanIcon = w.icon;
            if (cleanIcon === '🏢') cleanIcon = 'building';
            else if (cleanIcon === '🚀') cleanIcon = 'rocket';
            else if (cleanIcon === '⚡') cleanIcon = 'zap';
            else if (cleanIcon === '💼') cleanIcon = 'briefcase';
            else if (!cleanIcon || cleanIcon.length > 10) cleanIcon = 'building';
            return { ...w, icon: cleanIcon };
          });
        } else {
          parsedWorkspaces = DEFAULT_WORKSPACES;
        }

        localStorage.setItem('followup_workspaces', JSON.stringify(parsedWorkspaces));
        setWorkspaces(parsedWorkspaces);
      }

      if (savedActiveId && parsedWorkspaces.some((w) => w.id === savedActiveId)) {
        setCurrentWorkspaceId(savedActiveId);
      } else if (parsedWorkspaces.length > 0) {
        setCurrentWorkspaceId(parsedWorkspaces[0].id);
        localStorage.setItem('followup_active_workspace_id', parsedWorkspaces[0].id);
      }
    } catch (e) {
      console.error('Error loading workspaces from storage', e);
    }

    refreshWorkspaces();
  }, []);

  const currentWorkspace =
    workspaces.find((w) => w.id === currentWorkspaceId) || workspaces[0] || DEFAULT_WORKSPACES[0];

  useEffect(() => {
    if (currentWorkspace?.ownerId) {
      localStorage.setItem('followup_active_workspace_owner_id', currentWorkspace.ownerId);
    } else {
      localStorage.removeItem('followup_active_workspace_owner_id');
    }
  }, [currentWorkspace?.ownerId]);

  const switchWorkspace = (workspaceId: string) => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (ws) {
      setCurrentWorkspaceId(workspaceId);
      localStorage.setItem('followup_active_workspace_id', workspaceId);
      if (ws.ownerId) {
        localStorage.setItem('followup_active_workspace_owner_id', ws.ownerId);
      } else {
        localStorage.removeItem('followup_active_workspace_owner_id');
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('workspace-switched', {
            detail: { workspaceId, ownerId: ws.ownerId },
          })
        );
      }
    }
  };

  const createWorkspace = (name: string, icon = 'building', color = '#2563EB'): Workspace => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const tempId = `ws-${Date.now()}`;
    const newWorkspace: Workspace = {
      id: tempId,
      name: name.trim(),
      slug: slug || `workspace-${Date.now()}`,
      icon,
      color,
      role: 'Owner',
      plan: 'Free',
      membersCount: 1,
      ownerId: user?.id,
      ownerName: user?.name || 'You',
    };

    const updated = [...workspaces, newWorkspace];
    setWorkspaces(updated);
    setCurrentWorkspaceId(newWorkspace.id);

    localStorage.setItem('followup_workspaces', JSON.stringify(updated));
    localStorage.setItem('followup_active_workspace_id', newWorkspace.id);
    if (user?.id) {
      localStorage.setItem('followup_active_workspace_owner_id', user.id);
    }

    // Persist to backend database
    membersService.createWorkspace({ name: name.trim(), icon, color }).then((saved) => {
      if (saved?.id) {
        setWorkspaces((prev) =>
          prev.map((w) =>
            w.id === tempId
              ? { ...w, id: saved.id, ownerId: saved.ownerId, ownerName: saved.ownerName }
              : w
          )
        );
        setCurrentWorkspaceId(saved.id);
        localStorage.setItem('followup_active_workspace_id', saved.id);
        if (saved.ownerId) {
          localStorage.setItem('followup_active_workspace_owner_id', saved.ownerId);
        }
      }
    });

    return newWorkspace;
  };

  const updateWorkspace = (id: string, updates: Partial<Workspace>) => {
    setWorkspaces((prev) => {
      const updated = prev.map((w) => (w.id === id ? { ...w, ...updates } : w));
      try {
        localStorage.setItem('followup_workspaces', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Persist updates to backend database
    membersService.updateWorkspace(id, {
      name: updates.name,
      icon: updates.icon,
      color: updates.color,
    });
  };

  const deleteWorkspace = (id: string) => {
    if (workspaces.length <= 1) return; // Keep at least one workspace
    const updated = workspaces.filter((w) => w.id !== id);
    setWorkspaces(updated);
    localStorage.setItem('followup_workspaces', JSON.stringify(updated));

    if (currentWorkspaceId === id) {
      setCurrentWorkspaceId(updated[0].id);
      localStorage.setItem('followup_active_workspace_id', updated[0].id);
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        switchWorkspace,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        refreshWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
