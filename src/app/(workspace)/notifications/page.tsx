'use client';

import React, { useState, useMemo } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Building2,
  CheckSquare,
  UserMinus,
  UserPlus,
  ArrowRight,
  Clock,
  Search,
  Filter,
  X,
  ChevronRight,
  Shield,
  Briefcase,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { useNotifications, AppNotification, NotificationType } from '@/context/NotificationContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { membersService } from '@/services/members.service';
import Toast, { ToastMessage } from '@/components/Toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();

  const { workspaces, switchWorkspace, refreshWorkspaces } = useWorkspace();
  const router = useRouter();
  const [tab, setTab] = useState<'all' | 'unread' | 'workspace' | 'tasks'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Format relative timestamp
  const formatTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  };

  // Filter notifications by tab and search
  const filteredNotifications = useMemo(() => {
    let list = notifications;

    if (tab === 'unread') {
      list = list.filter((n) => !n.read);
    } else if (tab === 'workspace') {
      list = list.filter(
        (n) => n.type === 'workspace_added' || n.type === 'workspace_removed'
      );
    } else if (tab === 'tasks') {
      list = list.filter((n) => n.type === 'task_assigned');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          (n.metadata?.workspaceName && n.metadata.workspaceName.toLowerCase().includes(q)) ||
          (n.metadata?.taskTitle && n.metadata.taskTitle.toLowerCase().includes(q))
      );
    }

    return list;
  }, [notifications, tab, searchQuery]);

  // Visual icon based on notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'workspace_added':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
        );
      case 'task_assigned':
        return (
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
        );
      case 'workspace_removed':
        return (
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
            <UserMinus className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
        );
    }
  };

  const handleCardClick = async (notif: AppNotification) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }

    // Handle workspace removed notification
    if (notif.type === 'workspace_removed') {
      const wsName =
        notif.metadata?.workspaceName ||
        notif.message.match(/"([^"]+)"/)?.[1] ||
        'the workspace';
      addToast('error', `You are no longer a member of "${wsName}".`);
      return;
    }

    // Handle workspace added notification or /team links
    if (notif.type === 'workspace_added' || notif.link === '/team') {
      const targetWsName =
        notif.metadata?.workspaceName ||
        notif.message.match(/added to "([^"]+)"/i)?.[1] ||
        notif.message.match(/"([^"]+)"/)?.[1];
      const targetWsId = notif.metadata?.workspaceId;

      // Real-time sync of accessible workspaces to verify current membership
      let accessibleWorkspaces = workspaces;
      try {
        const fresh = await membersService.getMyWorkspaces();
        if (Array.isArray(fresh) && fresh.length > 0) {
          accessibleWorkspaces = fresh;
          await refreshWorkspaces();
        }
      } catch {
        // fallback
      }

      // Check if user is still a member of this workspace
      const matched = accessibleWorkspaces.find((w) => {
        if (targetWsId && (w.id === targetWsId || (w as any)._id === targetWsId)) {
          return true;
        }
        if (
          targetWsName &&
          w.name.trim().toLowerCase() === targetWsName.trim().toLowerCase()
        ) {
          return true;
        }
        return false;
      });

      if (matched) {
        switchWorkspace(matched.id);
        router.push('/team');
        return;
      }

      // If user is no longer in this workspace, show toast message!
      const displayName = targetWsName || 'this workspace';
      addToast(
        'error',
        `You are no longer a member of "${displayName}" or this workspace is no longer accessible.`
      );
      return;
    }

    // Default action for tasks or generic links
    if (notif.link) {
      router.push(notif.link);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAFA] dark:bg-[#121215] text-gray-900 dark:text-gray-100 p-4 sm:p-8 transition-colors">
      <Toast toasts={toasts} onDismiss={dismissToast} />
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1">
              General activity updates: workspace invitations, assigned tasks, and system events.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-2xs"
              >
                <CheckCheck className="w-4 h-4 text-indigo-500" />
                <span>Mark all read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer shadow-2xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear all</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Tabs Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tab Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                tab === 'all'
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                  : 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All ({notifications.length})
            </button>

            <button
              type="button"
              onClick={() => setTab('unread')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                tab === 'unread'
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                  : 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Unread ({unreadCount})
            </button>

            <button
              type="button"
              onClick={() => setTab('workspace')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                tab === 'workspace'
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                  : 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Workspaces (
              {
                notifications.filter(
                  (n) => n.type === 'workspace_added' || n.type === 'workspace_removed'
                ).length
              }
              )
            </button>

            <button
              type="button"
              onClick={() => setTab('tasks')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                tab === 'tasks'
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                  : 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Tasks ({notifications.filter((n) => n.type === 'task_assigned').length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications List Container */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-12 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-gray-400">
                <Bell className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {searchQuery
                  ? 'No matching notifications found'
                  : tab === 'unread'
                  ? 'All caught up!'
                  : 'No notifications'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-sm mx-auto">
                {searchQuery
                  ? `No alerts match "${searchQuery}". Clear your search query to see all notifications.`
                  : tab === 'unread'
                  ? 'You have read all notifications in your queue. Switch to "All" to review past events.'
                  : 'When tasks are assigned to you or you are added to or removed from a workspace, you will receive notifications here.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isUnread = !notif.read;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleCardClick(notif)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative group ${
                    isUnread
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200/80 dark:border-indigo-800/60 shadow-xs'
                      : 'bg-white dark:bg-zinc-900 border-gray-200/80 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    {getNotificationIcon(notif.type)}

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {notif.title}
                        </span>

                        {isUnread && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                            New
                          </span>
                        )}

                        {notif.type === 'workspace_added' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <Building2 className="w-3 h-3" />
                            <span>Workspace</span>
                          </span>
                        )}

                        {notif.type === 'task_assigned' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            <CheckSquare className="w-3 h-3" />
                            <span>Task</span>
                          </span>
                        )}

                        {notif.type === 'workspace_removed' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <UserMinus className="w-3 h-3" />
                            <span>Workspace Alert</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-gray-700 dark:text-zinc-300 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Footer Row */}
                      <div className="flex items-center justify-between gap-3 mt-3 pt-2 border-t border-gray-100 dark:border-zinc-800/80 text-xs">
                        <div className="flex items-center gap-1.5 text-gray-400 dark:text-zinc-500 text-[11px]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatTime(notif.timestamp)}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          {notif.link && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCardClick(notif);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline cursor-pointer"
                            >
                              <span>Open details</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          )}

                          {/* Delete individual button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notif.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 rounded-md transition-colors cursor-pointer"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
