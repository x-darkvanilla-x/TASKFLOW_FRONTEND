'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChevronsUpDown,
  ChevronDown,
  LayoutGrid,
  Layers,
  X,
  User as UserIcon,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { TaskStats } from '@/services/tasks.service';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  stats?: TaskStats | null;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Auto-close mobile sidebar overlay ONLY when route/pathname actually changes
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        onClose();
      }
    }
  }, [pathname, onClose]);

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  const displayName = user?.name ? user.name.split(' ')[0] : 'Dexter';
  const initial = displayName.charAt(0).toUpperCase();

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
        className={`bg-[#FAFAFA] border-r border-gray-200/90 flex flex-col shrink-0 h-screen transition-all duration-300 z-50 fixed md:sticky inset-y-0 left-0 overflow-hidden ${
          isOpen
            ? 'w-64 opacity-100 translate-x-0 shadow-2xl md:shadow-none'
            : 'w-0 border-r-0 opacity-0 -translate-x-full'
        }`}
      >
        {/* Sidebar Header / User Profile Section */}
        <div className="p-4 relative">
          <div
            className="flex items-center justify-between cursor-pointer p-2 rounded-xl"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            title="Click for profile menu"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0">
                {initial}
              </div>
              <span className="font-semibold text-sm text-gray-900 tracking-tight">
                {displayName}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <ChevronsUpDown
                className="w-4 h-4 text-gray-700 stroke-[2.5] cursor-pointer"
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
              <div className="absolute left-4 right-4 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-40 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onClose();
                    router.push('/profile');
                  }}
                  className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium cursor-pointer transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-gray-500" />
                  View Profile
                </button>

                <button
                  type="button"
                  onClick={() => {
                    toggleTheme();
                    setProfileMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center justify-between font-medium cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Moon className="w-4 h-4 text-indigo-600" />
                    )}
                    <span>Theme ({theme === 'dark' ? 'Dark' : 'Light'})</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200/50">
                    Toggle
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium border-t border-gray-100 cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>

        {/* Workspace Menu List */}
        <div className="px-4 py-2 flex-1">
          {/* Workspace Header with Dropdown Arrow */}
          <div
            className="flex items-center justify-between px-2 py-2 mb-1 select-none cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
            onClick={() => setWorkspaceOpen((prev) => !prev)}
          >
            <span className="text-sm font-semibold text-gray-900 tracking-tight">
              Workspace
            </span>
            <ChevronDown
              className={`w-4 h-4 text-gray-800 stroke-[2.5] transition-transform duration-200 ${workspaceOpen ? 'rotate-0' : '-rotate-90'
                }`}
            />
          </div>

          {/* Navigation Items (Tasks & Projects) */}
          {workspaceOpen && (
            <nav className="space-y-1">
              <a
                href="/dashboard"
                onClick={() => onClose()}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${pathname === '/dashboard' || pathname === '/'
                    ? 'bg-[#F3F4F6] text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <LayoutGrid className="w-4.5 h-4.5 text-gray-900 stroke-[2.2]" />
                Tasks
              </a>
              <a
                href="/dashboard#projects"
                onClick={() => onClose()}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-800 hover:bg-gray-50 hover:text-gray-900 transition-all"
              >
                <Layers className="w-4.5 h-4.5 text-gray-800 stroke-[2.2]" />
                Projects
              </a>
            </nav>
          )}
        </div>
      </aside>
    </>
  );
}
