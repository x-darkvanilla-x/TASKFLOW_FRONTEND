'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Check,
  X,
  Crown,
  Trash2,
  Shield,
  Briefcase,
  Mail,
  AtSign,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { membersService, Member, SearchedUser } from '@/services/members.service';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import Toast, { ToastMessage } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

const AVAILABLE_ROLES = [
  'Developer',
  'Frontend Engineer',
  'Backend Engineer',
  'Full Stack Developer',
  'UI/UX Designer',
  'Product Manager',
  'QA Engineer',
  'DevOps Engineer',
  'Member',
];

const AVATAR_COLORS = [
  'bg-indigo-600',
  'bg-purple-600',
  'bg-blue-600',
  'bg-emerald-600',
  'bg-pink-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-cyan-600',
];

export default function TeamMembersPage() {
  const { user } = useAuth();
  const { currentWorkspace, updateWorkspace } = useWorkspace();

  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Filter state for members list
  const [searchFilter, setSearchFilter] = useState('');

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  const [selectedRole, setSelectedRole] = useState('Developer');
  const [isAdding, setIsAdding] = useState(false);

  // Manual fallback input if user wants to add custom username
  const [manualName, setManualName] = useState('');
  const [manualUsername, setManualUsername] = useState('');

  // Delete confirm state
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Current logged in user details
  const currentUserName = user?.name || 'You';
  const currentUserEmail = user?.email || '';
  const currentUsername = useMemo(() => {
    if (typeof window !== 'undefined') {
      const extra = localStorage.getItem('profile_extra');
      if (extra) {
        try {
          const parsed = JSON.parse(extra);
          if (parsed.username) return parsed.username;
        } catch { }
      }
    }
    return user?.name ? user.name.toLowerCase().replace(/\s+/g, '_') : 'you';
  }, [user]);

  // Check if current user is owner of the active workspace
  const isWorkspaceOwner = useMemo(() => {
    if (!currentWorkspace) return true;
    if (user?.id && currentWorkspace.ownerId) {
      return currentWorkspace.ownerId === user.id;
    }
    return currentWorkspace.role === 'Owner';
  }, [currentWorkspace, user?.id]);

  // Load team members
  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const fetched = await membersService.getAll(currentWorkspace?.ownerId, currentWorkspace?.id);

      const mockHandles = [
        'sarah_dev',
        'alexj',
        'mchen_lead',
        'emma_ui',
        'david_kim',
        'liam_backend',
        'sophia_pm',
      ];

      const cleaned = fetched
        .filter(
          (m) =>
            !mockHandles.includes(m.username?.toLowerCase() || '') &&
            !m._id?.startsWith('u-') &&
            m.name !== 'Sarah Connor' &&
            m.name !== 'Alex Johnson'
        )
        .map((m) => ({
          ...m,
          username: m.username || m.name.toLowerCase().replace(/\s+/g, '_'),
        }));

      let nextMembers = cleaned;
      if (nextMembers.length === 0) {
        nextMembers = [
          {
            _id: user?.id || 'owner-self',
            name: currentUserName,
            username: currentUsername,
            email: currentUserEmail,
            role: currentWorkspace?.role || 'Owner',
            avatarColor: 'bg-indigo-600',
          },
        ];
      }

      setMembers(nextMembers);
      if (currentWorkspace && currentWorkspace.membersCount !== nextMembers.length) {
        updateWorkspace(currentWorkspace.id, { membersCount: nextMembers.length });
      }
    } catch {
      addToast('error', 'Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [user?.id, user?.name, user?.email, currentWorkspace?.id, currentWorkspace?.ownerId, currentWorkspace?.role, currentUsername]);

  useEffect(() => {
    const handleWsSwitch = () => {
      fetchMembers();
    };
    window.addEventListener('workspace-switched', handleWsSwitch);
    return () => window.removeEventListener('workspace-switched', handleWsSwitch);
  }, [currentWorkspace?.ownerId]);

  // Search registered users by username or name
  useEffect(() => {
    if (!userQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await membersService.searchUsers(userQuery.trim());
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [userQuery]);

  // Add Member Handler
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWorkspaceOwner) {
      addToast('error', 'Only the workspace owner can add team members.');
      return;
    }
    setIsAdding(true);

    const nameToAdd = selectedUser ? selectedUser.name : manualName.trim();
    const usernameToAdd = selectedUser
      ? selectedUser.username
      : manualUsername.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '') ||
      nameToAdd.toLowerCase().replace(/\s+/g, '_');
    const emailToAdd = selectedUser?.email || '';

    if (!nameToAdd) {
      addToast('error', 'Please enter a member name or select a user');
      setIsAdding(false);
      return;
    }

    // Check if already in workspace
    const alreadyExists = members.some(
      (m) =>
        m.name.toLowerCase() === nameToAdd.toLowerCase() ||
        (m.username && m.username.toLowerCase() === usernameToAdd.toLowerCase())
    );

    if (alreadyExists) {
      addToast('error', `@${usernameToAdd} is already a team member in this workspace!`);
      setIsAdding(false);
      return;
    }

    try {
      const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
      const created = await membersService.create({
        name: nameToAdd,
        username: usernameToAdd,
        email: emailToAdd,
        role: selectedRole,
        avatarColor: randomColor,
        memberUserId: selectedUser?._id,
        workspaceId: currentWorkspace?.id,
        workspaceName: currentWorkspace?.name,
      });

      const nextMembers = [...members, created];
      setMembers(nextMembers);
      if (currentWorkspace) {
        updateWorkspace(currentWorkspace.id, { membersCount: nextMembers.length });
      }
      addToast('success', `Added @${usernameToAdd} (${nameToAdd}) as ${selectedRole}!`);

      // Reset modal state
      setIsAddModalOpen(false);
      setUserQuery('');
      setSelectedUser(null);
      setManualName('');
      setManualUsername('');
      setSelectedRole('Developer');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to add team member';
      addToast('error', msg);
    } finally {
      setIsAdding(false);
    }
  };

  // Delete Member Handler
  const confirmDeleteMember = async () => {
    if (!memberToDelete || !memberToDelete._id) return;

    if (!isWorkspaceOwner) {
      addToast('error', 'Only the workspace owner can remove team members');
      setMemberToDelete(null);
      return;
    }

    if (memberToDelete.role === 'Owner' || (memberToDelete as any).isOwner || memberToDelete.name === currentUserName) {
      addToast('error', 'Cannot remove the workspace owner');
      setMemberToDelete(null);
      return;
    }

    try {
      await membersService.delete(memberToDelete._id);
      const nextMembers = members.filter((m) => m._id !== memberToDelete._id);
      setMembers(nextMembers);
      if (currentWorkspace) {
        updateWorkspace(currentWorkspace.id, { membersCount: Math.max(1, nextMembers.length) });
      }
      addToast('success', `Removed ${memberToDelete.name} from the workspace.`);
    } catch {
      addToast('error', 'Failed to remove member');
    } finally {
      setMemberToDelete(null);
    }
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    if (!searchFilter.trim()) return members;
    const q = searchFilter.trim().toLowerCase().replace(/^@/, '');
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.username && m.username.toLowerCase().includes(q)) ||
        (m.role && m.role.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q))
    );
  }, [members, searchFilter]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAFA] dark:bg-[#121215] text-gray-900 dark:text-gray-100 p-4 sm:p-8 transition-colors">
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Confirm Remove Member Dialog */}
      {memberToDelete && (
        <ConfirmDialog
          title="Remove Team Member"
          message={`Are you sure you want to remove ${memberToDelete.name} (@${memberToDelete.username}) from this workspace? They will no longer be assignable to workspace tasks.`}
          onConfirm={confirmDeleteMember}
          onCancel={() => setMemberToDelete(null)}
        />
      )}

      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Team Members
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-full border border-gray-200 dark:border-zinc-700">
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1">
              Add collaborators by their username to assign tasks and manage workspace delivery.
            </p>
          </div>

          {isWorkspaceOwner && (
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(true);
                setUserQuery('');
                setSelectedUser(null);
                setManualName('');
                setManualUsername('');
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-xs hover:bg-gray-800 dark:hover:bg-zinc-200 transition-all shadow-sm shrink-0 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Team Member</span>
            </button>
          )}
        </div>

        {/* Search Bar & Workspace Context Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search members by name or @username..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 transition-all"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-gray-500 dark:text-zinc-400 flex items-center gap-2 self-start sm:self-auto">
            <span>Workspace:</span>
            <span className="font-semibold text-gray-800 dark:text-zinc-200">
              {currentWorkspace?.name || 'Current Workspace'}
            </span>
          </div>
        </div>

        {/* Team Members List / Table */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
              <p className="text-xs text-gray-400">Loading workspace team members...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-gray-400">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                No members found
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-sm mx-auto">
                {searchFilter
                  ? `No team members match "${searchFilter}". Try another search term.`
                  : 'Start adding team members by their username to collaborate on tasks.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-zinc-800/80">
              {filteredMembers.map((member) => {
                const isOwner =
                  member.role === 'Owner' ||
                  (member as any).isOwner ||
                  (member._id && member._id.startsWith('owner-'));
                const avatarColor = member.avatarColor || 'bg-indigo-600';
                const initial = (member.name || 'U').charAt(0).toUpperCase();
                const handle = member.username || member.name.toLowerCase().replace(/\s+/g, '_');

                return (
                  <div
                    key={member._id || member.name}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* Member Identity & Username */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl ${avatarColor} text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0`}
                      >
                        {initial}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                            {member.name}
                          </span>
                          {isOwner && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                              <Crown className="w-3 h-3 text-amber-500" />
                              <span>Owner</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-zinc-400 font-mono">
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            @{handle}
                          </span>
                          {member.email && (
                            <>
                              <span className="text-gray-300 dark:text-zinc-600">•</span>
                              <span className="font-sans truncate text-gray-500 dark:text-zinc-400">
                                {member.email}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Role & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-zinc-800">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200/80 dark:border-zinc-700/60">
                        <Briefcase className="w-3 h-3 text-gray-500" />
                        <span>{member.role || 'Member'}</span>
                      </span>

                      {/* Only workspace owner can delete team members; other users can only view */}
                      {isWorkspaceOwner && !isOwner && (
                        <button
                          type="button"
                          onClick={() => setMemberToDelete(member)}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Helpful Tip */}
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-800 flex items-start gap-3 text-xs text-gray-600 dark:text-zinc-400">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            All added team members immediately sync with <span className="font-semibold text-gray-900 dark:text-white">Tasks</span>. You can search them by their username (@handle) when assigning tasks and subtasks.
          </p>
        </div>
      </div>

      {/* Add Team Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-800 dark:text-zinc-200">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Add Team Member
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                    Search registered users by their username
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleAddMember} className="p-5 space-y-4">
              {/* Username Search Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                  Search by Username or Name
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Type @username or name..."
                    value={userQuery}
                    onChange={(e) => {
                      setUserQuery(e.target.value);
                      if (selectedUser) setSelectedUser(null);
                    }}
                    className="w-full bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-zinc-900 transition-all"
                    autoFocus
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-2.5">
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-gray-900 dark:border-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Live Search Results */}
              {userQuery.trim() && (
                <div className="border border-gray-200 dark:border-zinc-800 rounded-xl p-2 bg-gray-50/50 dark:bg-zinc-800/40 max-h-48 overflow-y-auto space-y-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                    Matching Users ({searchResults.length})
                  </div>

                  {searchResults.length > 0 ? (
                    searchResults.map((sr) => {
                      const isChosen = selectedUser?._id === sr._id;
                      const isAlreadyInTeam = members.some(
                        (m) =>
                          m.name.toLowerCase() === sr.name.toLowerCase() ||
                          (m.username && m.username.toLowerCase() === sr.username.toLowerCase())
                      );

                      return (
                        <div
                          key={sr._id}
                          onClick={() => {
                            if (!isAlreadyInTeam) {
                              setSelectedUser(sr);
                              setManualName(sr.name);
                              setManualUsername(sr.username);
                            }
                          }}
                          className={`p-2 rounded-lg flex items-center justify-between text-xs transition-all ${isAlreadyInTeam
                            ? 'opacity-50 cursor-not-allowed bg-transparent'
                            : isChosen
                              ? 'bg-black text-white dark:bg-white dark:text-black font-semibold cursor-pointer'
                              : 'hover:bg-white dark:hover:bg-zinc-800 text-gray-800 dark:text-zinc-200 cursor-pointer'
                            }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                              {sr.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold truncate">{sr.name}</div>
                              <div className="text-[10px] opacity-75 font-mono">
                                @{sr.username}
                              </div>
                            </div>
                          </div>

                          {isAlreadyInTeam ? (
                            <span className="text-[10px] font-medium text-gray-400 italic">
                              Already added
                            </span>
                          ) : isChosen ? (
                            <Check className="w-4 h-4 shrink-0" />
                          ) : (
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                              Select
                            </span>
                          )}
                        </div>
                      );
                    })
                  ) : !isSearching ? (
                    <div className="p-3 text-center text-xs text-gray-500">
                      No registered user found with that handle. You can manually enter details below.
                    </div>
                  ) : null}
                </div>
              )}

              {/* Selected User Badge */}
              {selectedUser && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      Selected: <strong>{selectedUser.name}</strong> (@{selectedUser.username})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(null);
                      setManualName('');
                      setManualUsername('');
                    }}
                    className="text-emerald-600 hover:text-emerald-800 cursor-pointer text-[11px] font-semibold"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Fallback Manual Inputs if user not found */}
              {!selectedUser && (
                <div className="pt-1 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                      Member Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Jane Doe"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-black dark:focus:border-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                      Username (@Handle)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">@</span>
                      <input
                        type="text"
                        placeholder="janedoe"
                        value={manualUsername}
                        onChange={(e) =>
                          setManualUsername(
                            e.target.value.toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '')
                          )
                        }
                        className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl pl-7 pr-3 py-2 text-xs text-gray-900 dark:text-gray-100 font-mono outline-none focus:border-black dark:focus:border-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                  Workspace Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-black dark:focus:border-white font-medium cursor-pointer"
                >
                  {AVAILABLE_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding || (!selectedUser && !manualName.trim())}
                  className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isAdding ? 'Adding...' : 'Add to Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
