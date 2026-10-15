'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User,
  AtSign,
  Building2,
  Check,
  ShieldCheck,
  Plus,
  Trash2,
  Sun,
  Moon,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace, Workspace } from '@/context/WorkspaceContext';
import Toast, { ToastMessage } from '@/components/Toast';
import WorkspaceIcon, { AVAILABLE_WORKSPACE_ICONS } from '@/components/WorkspaceIcon';
import { useTheme } from '@/context/ThemeContext';

const WORKSPACE_COLORS = [
  { name: 'Indigo', hex: '#4F46E5' },
  { name: 'Purple', hex: '#7C3AED' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Rose', hex: '#F43F5E' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Teal', hex: '#0D9488' },
  { name: 'Cyan', hex: '#06B6D4' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Slate', hex: '#334155' },
];

function SettingsContent() {
  const { user, updateUser, isAuthenticated, isLoading } = useAuth();
  const { theme, toggleTheme: setContextTheme, setTheme } = useTheme();
  const {
    workspaces,
    currentWorkspace,
    switchWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
  } = useWorkspace();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const createParam = searchParams.get('create');

  // Compute initial tab from URL if present
  const getInitialTab = (): 'profile' | 'workspaces' | 'preferences' => {
    if (tabParam === 'workspaces' || tabParam === 'profile' || tabParam === 'preferences') {
      return tabParam;
    }
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (p === 'workspaces' || p === 'profile' || p === 'preferences') {
        return p;
      }
    }
    return 'profile';
  };

  const [activeTab, setActiveTab] = useState<'profile' | 'workspaces' | 'preferences'>(getInitialTab);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Profile Form State
  const [fullName, setFullName] = useState(user?.name || '');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [jobTitle, setJobTitle] = useState('Product Designer');

  // Workspace Form State
  const [workspaceName, setWorkspaceName] = useState(currentWorkspace?.name || '');
  const [workspaceIcon, setWorkspaceIcon] = useState(currentWorkspace?.icon || 'building');
  const [workspaceColor, setWorkspaceColor] = useState(currentWorkspace?.color || '#4F46E5');
  const [newWsName, setNewWsName] = useState('');
  const [newWsIcon, setNewWsIcon] = useState('building');
  const [newWsColor, setNewWsColor] = useState('#4F46E5');
  const [isCreatingWs, setIsCreatingWs] = useState(() => {
    if (createParam === 'true') return true;
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('create') === 'true';
    }
    return false;
  });

  // Sync active tab and create form with searchParams & window.location
  useEffect(() => {
    let t = tabParam;
    let c = createParam;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (!t) t = urlParams.get('tab');
      if (!c) c = urlParams.get('create');
    }

    if (t === 'workspaces' || t === 'profile' || t === 'preferences') {
      setActiveTab(t);
    }
    if (c === 'true') {
      setActiveTab('workspaces');
      setIsCreatingWs(true);
    }
  }, [tabParam, createParam]);

  // Listen for instant switch event from sidebar
  useEffect(() => {
    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: 'profile' | 'workspaces' | 'preferences'; create?: boolean }>;
      if (customEvent.detail?.tab) {
        setActiveTab(customEvent.detail.tab);
        if (customEvent.detail.create) {
          setIsCreatingWs(true);
        }
      }
    };

    window.addEventListener('switch-settings-tab', handleSwitchTab);
    return () => window.removeEventListener('switch-settings-tab', handleSwitchTab);
  }, []);



  useEffect(() => {
    if (user?.name) setFullName(user.name);
    if (user?.email) setEmail(user.email);

    const savedExtra = localStorage.getItem('profile_extra');
    if (savedExtra) {
      try {
        const parsed = JSON.parse(savedExtra);
        if (parsed.username) setUsername(parsed.username);
        if (parsed.title) setJobTitle(parsed.title);
      } catch (err) {
        console.error(err);
      }
    } else if (user?.name) {
      setUsername(user.name.toLowerCase().replace(/\s+/g, '_'));
    }

    const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    setTheme(savedTheme);
  }, [user]);

  useEffect(() => {
    if (currentWorkspace) {
      setWorkspaceName(currentWorkspace.name);
      setWorkspaceIcon(currentWorkspace.icon || 'building');
      setWorkspaceColor(currentWorkspace.color || '#4F46E5');
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '');

    updateUser({
      name: fullName.trim() || user?.name || 'User',
      email: email.trim(),
    });

    localStorage.setItem(
      'profile_extra',
      JSON.stringify({
        username: cleanUsername,
        title: jobTitle.trim(),
      })
    );

    setIsSaving(false);
    addToast('success', 'Profile and username updated successfully!');
  };

  const handleSaveWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;

    updateWorkspace(currentWorkspace.id, {
      name: workspaceName.trim(),
      icon: workspaceIcon,
      color: workspaceColor,
    });

    addToast('success', 'Workspace settings saved!');
  };

  const handleCreateNewWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    createWorkspace(newWsName.trim(), newWsIcon, newWsColor);
    setNewWsName('');
    setNewWsIcon('building');
    setNewWsColor('#4F46E5');
    setIsCreatingWs(false);
    addToast('success', `Created workspace "${newWsName.trim()}"!`);
  };

  const toggleTheme = (newTheme: 'light' | 'dark') => {
    setContextTheme(newTheme);
    addToast('success', `Switched to ${newTheme} mode`);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAFAFA]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const initial = (fullName || 'U').charAt(0).toUpperCase();

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#FAFAFA] dark:bg-[#121215] text-gray-900 dark:text-gray-100">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50">
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </div>

      <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 pb-12">
            {/* Header Title */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Settings
              </h1>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                Manage your account credentials, custom username, and workspace configurations.
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 dark:border-zinc-800 gap-6 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('profile');
                  router.replace('/settings?tab=profile');
                }}
                className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'profile'
                    ? 'border-black text-black dark:border-white dark:text-white font-bold'
                    : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Profile & Username</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('workspaces');
                  router.replace('/settings?tab=workspaces');
                }}
                className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'workspaces'
                    ? 'border-black text-black dark:border-white dark:text-white font-bold'
                    : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Workspaces ({workspaces.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('preferences');
                  router.replace('/settings?tab=preferences');
                }}
                className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'preferences'
                    ? 'border-black text-black dark:border-white dark:text-white font-bold'
                    : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Appearance & Theme</span>
              </button>
            </div>

            {/* Tab 1: Profile & Username */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* User Identity Preview Card */}
                <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center text-lg font-bold shadow-xs shrink-0">
                    {initial}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white text-base">{fullName || 'User'}</div>
                    <div className="text-gray-500 dark:text-zinc-400 text-xs flex items-center gap-1.5 mt-0.5">
                      <span className="font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/50">
                        @{username || 'username'}
                      </span>
                      <span>•</span>
                      <span>{jobTitle}</span>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">User Profile Information</h3>

                  {/* Username Field */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                      Username (Unique Handle)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-gray-400 dark:text-zinc-500 font-bold text-xs">@</span>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) =>
                          setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                        }
                        placeholder="your_handle"
                        className="w-full pl-8 pr-3.5 py-2 text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-black dark:focus:border-zinc-500 font-medium"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
                      Used for workspace assignment tags and team member handles.
                    </p>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                      Full / Display Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Dipesh"
                      className="w-full px-3.5 py-2 text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-black dark:focus:border-zinc-500 font-medium"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-3.5 py-2 text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-black dark:focus:border-zinc-500 font-medium"
                    />
                  </div>

                  {/* Role / Job Title */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                      Role / Title
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Senior Frontend Developer"
                      className="w-full px-3.5 py-2 text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-black dark:focus:border-zinc-500 font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Workspaces */}
            {activeTab === 'workspaces' && (
              <div className="space-y-6">
                {/* Active Workspace Settings Card */}
                <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-zinc-100">Current Active Workspace</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </div>

                  <form onSubmit={handleSaveWorkspace} className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-100 dark:border-zinc-800">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0 transition-colors"
                        style={{ backgroundColor: workspaceColor }}
                      >
                        <WorkspaceIcon name={workspaceIcon} className="w-5 h-5 text-white stroke-[2.2]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-gray-900 dark:text-zinc-100">{workspaceName || currentWorkspace?.name}</div>
                        <div className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
                          Role: {currentWorkspace?.role || 'Owner'} • {currentWorkspace?.membersCount || 1} team members
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                          Workspace Name
                        </label>
                        <input
                          type="text"
                          required
                          value={workspaceName}
                          onChange={(e) => setWorkspaceName(e.target.value)}
                          placeholder="Workspace Name"
                          className="w-full px-3.5 py-2 text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 focus:border-black dark:focus:border-white font-medium"
                        />
                      </div>

                      {/* Workspace Color */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                          Workspace Color
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          {WORKSPACE_COLORS.map((c) => {
                            const isSelected = workspaceColor.toLowerCase() === c.hex.toLowerCase();
                            return (
                              <button
                                key={c.hex}
                                type="button"
                                title={c.name}
                                onClick={() => setWorkspaceColor(c.hex)}
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-white transition-transform cursor-pointer ${
                                  isSelected
                                    ? 'ring-2 ring-offset-2 ring-black dark:ring-white scale-110 shadow-xs'
                                    : 'hover:scale-105 opacity-85 hover:opacity-100'
                                }`}
                                style={{ backgroundColor: c.hex }}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Workspace Icon */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                          Workspace Icon
                        </label>
                        <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5">
                          {AVAILABLE_WORKSPACE_ICONS.map(({ key, Icon }) => {
                            const isSelected = workspaceIcon === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setWorkspaceIcon(key)}
                                className={`h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-black bg-gray-900 text-white dark:border-white dark:bg-white dark:text-black shadow-xs'
                                    : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600 hover:bg-white dark:hover:bg-zinc-800'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                      >
                        Save Workspace Settings
                      </button>
                    </div>
                  </form>
                </div>

                {/* All Workspaces List */}
                <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-zinc-100">Your Workspaces</h3>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-400">Switch between different workspaces or delete unused ones</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreatingWs((o) => !o)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-gray-900 dark:text-zinc-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Workspace</span>
                    </button>
                  </div>

                  {/* Create Workspace Inline Form */}
                  {isCreatingWs && (
                    <form onSubmit={handleCreateNewWorkspace} className="p-4 sm:p-5 bg-gray-50/90 dark:bg-zinc-800/50 rounded-2xl border border-gray-200/90 dark:border-zinc-700/80 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-gray-900 dark:text-zinc-100">Create New Workspace</h4>
                        {/* Live icon & color badge preview */}
                        <div className="flex items-center gap-2 px-2.5 py-1 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200/90 dark:border-zinc-700 text-xs shadow-xs">
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0 transition-colors"
                            style={{ backgroundColor: newWsColor }}
                          >
                            <WorkspaceIcon name={newWsIcon} className="w-3 h-3 text-white stroke-[2.2]" />
                          </div>
                          <span className="font-semibold text-gray-800 dark:text-zinc-200 text-[11px] truncate max-w-[150px]">
                            {newWsName.trim() || 'Workspace Preview'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                          Workspace Name
                        </label>
                        <input
                          type="text"
                          required
                          autoFocus
                          value={newWsName}
                          onChange={(e) => setNewWsName(e.target.value)}
                          placeholder="e.g. Design Studio, Marketing, Personal"
                          className="w-full px-3.5 py-2 text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 focus:border-black dark:focus:border-white font-medium"
                        />
                      </div>

                      {/* Color Choice */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                          Choose Color
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          {WORKSPACE_COLORS.map((c) => {
                            const isSelected = newWsColor.toLowerCase() === c.hex.toLowerCase();
                            return (
                              <button
                                key={c.hex}
                                type="button"
                                title={c.name}
                                onClick={() => setNewWsColor(c.hex)}
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-white transition-transform cursor-pointer ${
                                  isSelected
                                    ? 'ring-2 ring-offset-2 ring-black dark:ring-white scale-110 shadow-xs'
                                    : 'hover:scale-105 opacity-85 hover:opacity-100'
                                }`}
                                style={{ backgroundColor: c.hex }}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Icon Choice */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                          Choose Icon
                        </label>
                        <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5">
                          {AVAILABLE_WORKSPACE_ICONS.map(({ key, Icon }) => {
                            const isSelected = newWsIcon === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setNewWsIcon(key)}
                                className={`h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-black bg-gray-900 text-white dark:border-white dark:bg-white dark:text-black shadow-xs'
                                    : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600 hover:bg-white dark:hover:bg-zinc-800'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-200/60 dark:border-zinc-750">
                        <button
                          type="button"
                          onClick={() => setIsCreatingWs(false)}
                          className="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 text-xs font-medium cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                        >
                          Create Workspace
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Workspaces Table / List */}
                  <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {workspaces.map((ws) => {
                      const isActive = ws.id === currentWorkspace?.id;
                      return (
                        <div
                          key={ws.id}
                          className="py-3 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs shrink-0"
                              style={{ backgroundColor: ws.color }}
                            >
                              <WorkspaceIcon name={ws.icon} className="w-4 h-4 text-white stroke-[2.2]" />
                            </div>
                            <div className="truncate">
                              <div className="font-bold text-xs text-gray-900 dark:text-zinc-100 truncate flex items-center gap-2">
                                <span>{ws.name}</span>
                                {isActive && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60">
                                    Current
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-gray-500 dark:text-zinc-400">
                                {ws.role} • {ws.membersCount || 1} members
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {!isActive ? (
                              <button
                                type="button"
                                onClick={() => {
                                  switchWorkspace(ws.id);
                                  addToast('success', `Switched to workspace "${ws.name}"`);
                                }}
                                className="px-3 py-1 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-xs font-semibold text-gray-700 dark:text-zinc-300 cursor-pointer transition-colors"
                              >
                                Switch
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium px-2 py-1">Active</span>
                            )}

                            {workspaces.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete workspace "${ws.name}"?`)) {
                                    deleteWorkspace(ws.id);
                                    addToast('success', `Deleted workspace "${ws.name}"`);
                                  }
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                                title="Delete Workspace"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Appearance & Theme */}
            {activeTab === 'preferences' && (
              <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-gray-900 dark:text-zinc-100">Theme & Appearance</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Choose your preferred visual theme for Follow Up</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => toggleTheme('light')}
                    className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      theme === 'light'
                        ? 'border-black bg-gray-50 ring-2 ring-black/5 dark:border-zinc-500 dark:bg-zinc-800/80'
                        : 'border-gray-200 dark:border-zinc-750 hover:border-gray-300 dark:hover:border-zinc-650'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-800/50">
                        <Sun className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-gray-900 dark:text-zinc-100">Light Mode</div>
                        <div className="text-[11px] text-gray-500 dark:text-zinc-400">Clean, crisp light interface</div>
                      </div>
                    </div>
                    {theme === 'light' && <Check className="w-4 h-4 text-black dark:text-white stroke-[2.5]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleTheme('dark')}
                    className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'border-black dark:border-zinc-500 bg-gray-900 dark:bg-zinc-800 text-white ring-2 ring-black/5 dark:ring-white/10'
                        : 'border-gray-200 dark:border-zinc-750 hover:border-gray-300 dark:hover:border-zinc-650'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-800 dark:bg-zinc-700 text-indigo-400 flex items-center justify-center border border-gray-700 dark:border-zinc-600">
                        <Moon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-gray-900 dark:text-white">Dark Mode</div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">Low-glare dark palette</div>
                      </div>
                    </div>
                    {theme === 'dark' && <Check className="w-4 h-4 text-white stroke-[2.5]" />}
                  </button>
                </div>
              </div>
            )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#FAFAFA]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

