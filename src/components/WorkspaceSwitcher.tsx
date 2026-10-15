'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronsUpDown, Check, Plus, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWorkspace } from '@/context/WorkspaceContext';
import WorkspaceIcon from './WorkspaceIcon';

export default function WorkspaceSwitcher() {
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleNavigateToWorkspaces = (create = false) => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('switch-settings-tab', { detail: { tab: 'workspaces', create } })
      );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current Workspace Card Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-2 rounded-xl bg-gray-100/70 hover:bg-gray-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 border border-gray-200/60 dark:border-zinc-700/60 transition-all text-left cursor-pointer group select-none"
        title="Click to switch workspace"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs shrink-0"
            style={{ backgroundColor: currentWorkspace?.color || '#4F46E5' }}
          >
            <WorkspaceIcon name={currentWorkspace?.icon} className="w-3.5 h-3.5 text-white stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-gray-900 dark:text-zinc-100 truncate block">
                {currentWorkspace?.name || 'Workspace'}
              </span>
            </div>
            <span className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium tracking-tight block">
              {currentWorkspace?.ownerName && currentWorkspace?.role !== 'Owner'
                ? `by ${currentWorkspace.ownerName}`
                : currentWorkspace?.role || 'Owner'}
              {currentWorkspace?.membersCount !== undefined
                ? ` • ${currentWorkspace.membersCount} ${currentWorkspace.membersCount === 1 ? 'member' : 'members'}`
                : ''}
            </span>
          </div>
        </div>

        <ChevronsUpDown className="w-4 h-4 text-gray-400 dark:text-zinc-500 group-hover:text-gray-700 dark:group-hover:text-zinc-300 shrink-0 transition-colors" />
      </button>

      {/* Switcher Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-zinc-900 border border-gray-200/90 dark:border-zinc-800 rounded-2xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
            Workspaces
          </div>

          {/* List of Workspaces */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 px-1">
            {workspaces.map((ws) => {
              const isSelected = ws.id === currentWorkspace?.id;
              const count = ws.membersCount !== undefined ? ws.membersCount : 1;
              return (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => {
                    switchWorkspace(ws.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white font-semibold'
                      : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-850'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-white shadow-xs shrink-0"
                      style={{ backgroundColor: ws.color }}
                    >
                      <WorkspaceIcon name={ws.icon} className="w-3.5 h-3.5 text-white stroke-[2.2]" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs truncate font-medium text-gray-900 dark:text-zinc-200">{ws.name}</div>
                      <div className="text-[10px] text-gray-400 dark:text-zinc-500 font-normal">
                        {ws.ownerName && ws.role !== 'Owner'
                          ? `by ${ws.ownerName}`
                          : `${ws.role || 'Owner'} • ${count} ${count === 1 ? 'member' : 'members'}`}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-black dark:text-white stroke-[2.5] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="my-1.5 border-t border-gray-100 dark:border-zinc-800" />

          {/* Actions: Navigate directly to settings page workspaces tab */}
          <div className="px-1 space-y-0.5 text-xs">
            <Link
              href="/settings?tab=workspaces&create=true"
              onClick={() => handleNavigateToWorkspaces(true)}
              className="w-full px-2.5 py-1.5 rounded-xl text-left text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-2 font-medium cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
              <span>Create New Workspace</span>
            </Link>

            <Link
              href="/settings?tab=workspaces"
              onClick={() => handleNavigateToWorkspaces(false)}
              className="w-full px-2.5 py-1.5 rounded-xl text-left text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-2 font-medium cursor-pointer transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
              <span>Workspace Settings</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
