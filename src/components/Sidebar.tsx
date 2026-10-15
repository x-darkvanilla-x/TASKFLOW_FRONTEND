'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChevronsUpDown,
  LayoutGrid,
  Layers,
  User as UserIcon,
  LogOut,
  Sun,
  Moon,
  Users,
  Settings as SettingsIcon,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { TaskStats } from '@/services/tasks.service';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import { useTheme } from '@/context/ThemeContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  stats?: TaskStats | null;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [username, setUsername] = useState('');

  // Load saved username on mount / update
  useEffect(() => {
    const savedExtra = localStorage.getItem('profile_extra');
    if (savedExtra) {
      try {
        const parsed = JSON.parse(savedExtra);
        if (parsed.username) setUsername(parsed.username);
      } catch (e) {
        console.error(e);
      }
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  const displayName = user?.name ? user.name.split(' ')[0] : 'User';
  const initial = (user?.name || 'U').charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`bg-[#FAFAFA] dark:bg-[#121215] border-r border-gray-200/90 dark:border-zinc-800 flex flex-col shrink-0 h-screen transition-all duration-300 z-50 fixed md:sticky inset-y-0 left-0 overflow-hidden ${
          isOpen
            ? 'w-64 opacity-100 translate-x-0 shadow-2xl md:shadow-none'
            : 'w-0 border-r-0 opacity-0 -translate-x-full'
        }`}
      >
        {/* Sidebar Header / User Profile Section */}
        <div className="p-3.5 relative border-b border-gray-100/80 dark:border-zinc-800">
          <div
            className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-gray-100/70 dark:hover:bg-zinc-850/80 transition-colors"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            title="Click for profile & settings"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
                {initial}
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs text-gray-900 dark:text-zinc-100 tracking-tight block truncate">
                  {user?.name || 'User'}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-zinc-400 block truncate">
                  {username ? `@${username}` : (user?.email || 'Set username')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <ChevronsUpDown
                className="w-4 h-4 text-gray-400 dark:text-zinc-500 stroke-[2] cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setProfileMenuOpen((prev) => !prev);
                }}
              />
            </div>
          </div>

          {/* Profile Dropdown Menu */}
          {profileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setProfileMenuOpen(false)}
              />
              <div className="absolute left-3.5 right-3.5 top-full mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-lg z-40 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    router.push('/settings');
                  }}
                  className="w-full px-3 py-2 text-left text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-2 font-medium cursor-pointer transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
                  View & Edit Profile
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    router.push('/settings');
                  }}
                  className="w-full px-3 py-2 text-left text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-2 font-medium cursor-pointer transition-colors"
                >
                  <SettingsIcon className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
                  Settings
                </button>

                <button
                  type="button"
                  onClick={() => {
                    toggleTheme();
                    setProfileMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center justify-between font-medium cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Moon className="w-4 h-4 text-indigo-600" />
                    )}
                    <span>Theme ({theme === 'dark' ? 'Dark' : 'Light'})</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border border-gray-200/50 dark:border-zinc-700">
                    Toggle
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 font-medium border-t border-gray-100 dark:border-zinc-800 cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4 text-red-500 dark:text-red-400" />
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>

        {/* Workspace Switcher & Navigation List */}
        <div className="px-3.5 py-3 flex-1 flex flex-col justify-between overflow-y-auto">
          {/* Top section: Workspace Switcher and Workspace-specific options */}
          <div className="space-y-4">
            {/* Active Workspace Switcher Card */}
            <div>
              <div className="px-1 mb-1.5 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                Current Workspace
              </div>
              <WorkspaceSwitcher />
            </div>

            {/* Workspace-Specific Navigation Items */}
            <div>
              <div className="px-1 mb-1.5 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                Workspace
              </div>
              <nav className="space-y-1">
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    pathname === '/dashboard' || pathname === '/'
                      ? 'bg-black text-white dark:bg-zinc-800 dark:text-white shadow-xs'
                      : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/60 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Tasks</span>
                </Link>

                <Link
                  href="/projects"
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    pathname === '/projects'
                      ? 'bg-black text-white dark:bg-zinc-800 dark:text-white shadow-xs'
                      : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/60 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Projects</span>
                </Link>

                <Link
                  href="/team"
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    pathname === '/team'
                      ? 'bg-black text-white dark:bg-zinc-800 dark:text-white shadow-xs'
                      : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/60 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Team members</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Bottom section: General Options (Notifications & Settings) */}
          <div className="pt-3 border-t border-gray-200/80 dark:border-zinc-800 mt-4 space-y-1">
            <div className="px-1 mb-1 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
              General
            </div>
            <nav className="space-y-1">
              <Link
                href="/notifications"
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  pathname === '/notifications'
                    ? 'bg-black text-white dark:bg-zinc-800 dark:text-white shadow-xs'
                    : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/60 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    )}
                  </div>
                  <span>Notifications</span>
                </div>

                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white min-w-4 text-center leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              <Link
                href="/settings"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  pathname === '/settings'
                    ? 'bg-black text-white dark:bg-zinc-800 dark:text-white shadow-xs'
                    : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/60 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <SettingsIcon className="w-4 h-4" />
                <span>Settings</span>
              </Link>
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
}
