'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  Filter,
  Plus,
  List,
  LayoutGrid,
  Check,
  Menu,
  PanelLeft,
  ChevronRight,
  CircleDot,
  BarChart2,
  Users,
  Calendar,
  Users2,
  Tag,
  User,
} from 'lucide-react';
import { TaskStatus, TaskPriority } from '@/services/tasks.service';

export interface FieldVisibility {
  priority: boolean;
  members: boolean;
  dueDate: boolean;
  labels: boolean;
  status: boolean;
  reporter: boolean;
}

export type ViewMode = 'board' | 'list';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between shrink-0 relative z-20">
      {/* Left Header Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="text-gray-600 hover:text-gray-900 cursor-pointer p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
          aria-label="Toggle menu"
          id="mobile-menu-btn"
        >
          <Menu className="w-5 h-5 text-gray-800 md:hidden" />
          <PanelLeft className="w-4.5 h-4.5 text-gray-600 hidden md:block" />
        </button>
      </div>
    </header>
  );
}

interface HeaderActionsProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onNewTask: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  fieldVisibility: FieldVisibility;
  onToggleField: (field: keyof FieldVisibility) => void;
  filterStatus?: TaskStatus | '';
  onFilterStatusChange?: (status: TaskStatus | '') => void;
  filterPriority?: TaskPriority | '';
  onFilterPriorityChange?: (priority: TaskPriority | '') => void;
  filterAssignee?: string;
  onFilterAssigneeChange?: (assignee: string) => void;
  filterTag?: string;
  onFilterTagChange?: (tag: string) => void;
  membersList?: string[];
  tagsList?: string[];
}

export function HeaderActions({
  searchValue,
  onSearchChange,
  onNewTask,
  viewMode,
  onViewModeChange,
  fieldVisibility,
  onToggleField,
  filterStatus = '',
  onFilterStatusChange,
  filterPriority = '',
  onFilterPriorityChange,
  filterAssignee = '',
  onFilterAssigneeChange,
  filterTag = '',
  onFilterTagChange,
  membersList = ['Admin'],
  tagsList = ['Deployment'],
}: HeaderActionsProps) {
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<
    'Status' | 'Priority' | 'Members' | 'Due Date' | 'Teams' | 'Labels' | 'Reporter' | null
  >(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setFieldsOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
        setActiveSubmenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fieldsList: { key: keyof FieldVisibility; label: string }[] = [
    { key: 'priority', label: 'Priority' },
    { key: 'members', label: 'Members' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'labels', label: 'Labels' },
    { key: 'status', label: 'Status' },
    { key: 'reporter', label: 'Reporter' },
  ];

  const hasActiveFilter = !!(filterStatus || filterPriority || filterAssignee || filterTag);

  const renderSignalBars = (level: 'urgent' | 'high' | 'medium' | 'low') => {
    if (level === 'urgent' || level === 'high') {
      return (
        <span className="inline-flex gap-0.5 items-end h-3">
          <span className="w-0.5 h-1.5 bg-pink-500 rounded-xs"></span>
          <span className="w-0.5 h-2.5 bg-pink-500 rounded-xs"></span>
          <span className="w-0.5 h-3.5 bg-pink-500 rounded-xs"></span>
        </span>
      );
    }
    if (level === 'medium') {
      return (
        <span className="inline-flex gap-0.5 items-end h-3">
          <span className="w-0.5 h-1.5 bg-amber-500 rounded-xs"></span>
          <span className="w-0.5 h-2.5 bg-amber-500 rounded-xs"></span>
          <span className="w-0.5 h-3.5 bg-gray-300 rounded-xs"></span>
        </span>
      );
    }
    return (
      <span className="inline-flex gap-0.5 items-end h-3">
        <span className="w-0.5 h-1.5 bg-gray-400 rounded-xs"></span>
        <span className="w-0.5 h-2.5 bg-gray-300 rounded-xs"></span>
        <span className="w-0.5 h-3.5 bg-gray-300 rounded-xs"></span>
      </span>
    );
  };

  const handleClearFilters = () => {
    if (onFilterStatusChange) onFilterStatusChange('');
    if (onFilterPriorityChange) onFilterPriorityChange('');
    if (onFilterAssigneeChange) onFilterAssigneeChange('');
    if (onFilterTagChange) onFilterTagChange('');
    setFilterOpen(false);
    setActiveSubmenu(null);
  };

  const filterCategories = [
    { key: 'Status', label: 'Status', icon: CircleDot },
    { key: 'Priority', label: 'Priority', icon: BarChart2 },
    { key: 'Members', label: 'Members', icon: Users },
    { key: 'Due Date', label: 'Due Date', icon: Calendar },
    { key: 'Teams', label: 'Teams', icon: Users2 },
    { key: 'Labels', label: 'Labels', icon: Tag },
    { key: 'Reporter', label: 'Reporter', icon: User },
  ] as const;

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 relative z-30">
      {/* Search */}
      <div className="relative flex items-center">
        <input
          id="task-search-input"
          type="text"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-24 xs:w-32 sm:w-44 focus:w-36 sm:focus:w-56 transition-all text-xs border border-gray-200 rounded-lg py-1.5 pl-8 pr-2.5 bg-white text-gray-800 outline-none focus:border-gray-400"
        />
        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
      </div>

      {/* Fields Button & Dropdown Container */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setFieldsOpen((prev) => !prev)}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${
            fieldsOpen ? 'border-gray-400 bg-gray-50' : ''
          }`}
          id="fields-dropdown-btn"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
          Fields
        </button>

        {/* Fields Dropdown Popup */}
        {fieldsOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-gray-200 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
            {/* Segmented Control: List | Board */}
            <div className="bg-gray-100/90 p-1 rounded-xl flex items-center gap-1 mb-3">
              <button
                type="button"
                onClick={() => onViewModeChange('list')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4 stroke-[2.5]" />
                List
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('board')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  viewMode === 'board'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <LayoutGrid className="w-4 h-4 stroke-[2.5]" />
                Board
              </button>
            </div>

            {/* Toggles List */}
            <div className="space-y-0.5">
              {fieldsList.map((item) => {
                const isChecked = fieldVisibility[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => onToggleField(item.key)}
                    className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors select-none"
                  >
                    <span className="text-xs font-medium text-gray-800">
                      {item.label}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                        isChecked ? 'bg-black text-white' : 'bg-gray-200'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Filter Button & Popovers matching mockup */}
      <div className="relative" ref={filterRef}>
        <button
          type="button"
          onClick={() => setFilterOpen((prev) => !prev)}
          className={`p-2 text-gray-500 hover:bg-gray-100 rounded-lg border transition-colors cursor-pointer relative ${
            filterOpen || hasActiveFilter
              ? 'border-gray-900 bg-gray-100 text-gray-900'
              : 'border-gray-200'
          }`}
          title="Filter tasks"
          id="filter-tasks-btn"
        >
          <Filter className="w-4 h-4" />
          {hasActiveFilter && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full ring-2 ring-white" />
          )}
        </button>

        {/* Filter Popover Dropdowns */}
        {filterOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-gray-200 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 select-none">
            {/* Filter Main Categories List */}
            <div className="space-y-0.5">
              {filterCategories.map((cat) => {
                const IconComponent = cat.icon;
                const isActive = activeSubmenu === cat.label;
                const isFiltered =
                  (cat.label === 'Status' && filterStatus) ||
                  (cat.label === 'Priority' && filterPriority) ||
                  (cat.label === 'Members' && filterAssignee) ||
                  (cat.label === 'Labels' && filterTag);

                return (
                  <div
                    key={cat.label}
                    onMouseEnter={() => setActiveSubmenu(cat.label as any)}
                    onClick={() => setActiveSubmenu(cat.label as any)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                      isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComponent className="w-4 h-4 text-gray-700 shrink-0" />
                      <span>{cat.label}</span>
                      {isFiltered && (
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full shrink-0" />
                      )}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  </div>
                );
              })}
            </div>

            {/* Clear Filters Row if active */}
            {hasActiveFilter && (
              <div className="pt-1 mt-1 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="w-full text-center py-1.5 text-xs text-red-600 font-semibold hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Submenu Popover */}
            {activeSubmenu && (
              <div className="absolute right-0 sm:right-full top-full sm:top-0 mt-1 sm:mt-0 sm:mr-2 w-48 bg-white rounded-2xl border border-gray-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
                <div className="text-[11px] font-semibold text-gray-400 px-2.5 py-1 uppercase tracking-wider">
                  {activeSubmenu}
                </div>

                {/* Priority Submenu Items */}
                {activeSubmenu === 'Priority' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (onFilterPriorityChange) onFilterPriorityChange('');
                        setFilterOpen(false);
                        setActiveSubmenu(null);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-gray-50 flex items-center justify-between text-xs text-gray-700 font-medium cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-gray-400 font-bold">.</span> No Priority
                      </span>
                      {!filterPriority && <Check className="w-3.5 h-3.5 text-gray-900" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (onFilterPriorityChange) onFilterPriorityChange('high');
                        setFilterOpen(false);
                        setActiveSubmenu(null);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-gray-50 flex items-center justify-between text-xs font-semibold text-pink-600 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        {renderSignalBars('urgent')} Urgent
                      </span>
                      {filterPriority === 'high' && <Check className="w-3.5 h-3.5 text-gray-900" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (onFilterPriorityChange) onFilterPriorityChange('high');
                        setFilterOpen(false);
                        setActiveSubmenu(null);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-gray-50 flex items-center justify-between text-xs font-medium text-pink-500 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        {renderSignalBars('high')} High
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (onFilterPriorityChange) onFilterPriorityChange('medium');
                        setFilterOpen(false);
                        setActiveSubmenu(null);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-gray-50 flex items-center justify-between text-xs font-medium text-amber-500 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        {renderSignalBars('medium')} Medium
                      </span>
                      {filterPriority === 'medium' && <Check className="w-3.5 h-3.5 text-gray-900" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (onFilterPriorityChange) onFilterPriorityChange('low');
                        setFilterOpen(false);
                        setActiveSubmenu(null);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-gray-50 flex items-center justify-between text-xs font-medium text-gray-400 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        {renderSignalBars('low')} Low
                      </span>
                      {filterPriority === 'low' && <Check className="w-3.5 h-3.5 text-gray-900" />}
                    </button>
                  </>
                )}

                {/* Status Submenu Items */}
                {activeSubmenu === 'Status' && (
                  <>
                    {[
                      { label: 'All Statuses', val: '' },
                      { label: 'To Do', val: 'todo' },
                      { label: 'Doing', val: 'doing' },
                      { label: 'Completed', val: 'completed' },
                      { label: 'On Hold', val: 'on-hold' },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          if (onFilterStatusChange) onFilterStatusChange(item.val as any);
                          setFilterOpen(false);
                          setActiveSubmenu(null);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-gray-50 flex items-center justify-between text-xs text-gray-700 font-medium cursor-pointer"
                      >
                        <span>{item.label}</span>
                        {filterStatus === item.val && <Check className="w-3.5 h-3.5 text-gray-900" />}
                      </button>
                    ))}
                  </>
                )}

                {/* Members Submenu Items */}
                {activeSubmenu === 'Members' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (onFilterAssigneeChange) onFilterAssigneeChange('');
                        setFilterOpen(false);
                        setActiveSubmenu(null);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-gray-50 flex items-center justify-between text-xs text-gray-700 font-medium cursor-pointer"
                    >
                      <span>All Members</span>
                      {!filterAssignee && <Check className="w-3.5 h-3.5 text-gray-900" />}
                    </button>
                    {membersList.map((mem) => (
                      <button
                        key={mem}
                        type="button"
                        onClick={() => {
                          if (onFilterAssigneeChange) onFilterAssigneeChange(mem);
                          setFilterOpen(false);
                          setActiveSubmenu(null);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-gray-50 flex items-center justify-between text-xs text-gray-700 font-medium cursor-pointer"
                      >
                        <span>{mem}</span>
                        {filterAssignee === mem && <Check className="w-3.5 h-3.5 text-gray-900" />}
                      </button>
                    ))}
                  </>
                )}

                {/* Labels Submenu Items */}
                {activeSubmenu === 'Labels' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (onFilterTagChange) onFilterTagChange('');
                        setFilterOpen(false);
                        setActiveSubmenu(null);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-gray-50 flex items-center justify-between text-xs text-gray-700 font-medium cursor-pointer"
                    >
                      <span>All Labels</span>
                      {!filterTag && <Check className="w-3.5 h-3.5 text-gray-900" />}
                    </button>
                    {tagsList.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (onFilterTagChange) onFilterTagChange(tag);
                          setFilterOpen(false);
                          setActiveSubmenu(null);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-gray-50 flex items-center justify-between text-xs text-gray-700 font-medium cursor-pointer"
                      >
                        <span>{tag}</span>
                        {filterTag === tag && <Check className="w-3.5 h-3.5 text-gray-900" />}
                      </button>
                    ))}
                  </>
                )}

                {/* Teams Submenu Items */}
                {activeSubmenu === 'Teams' && (
                  <>
                    {['All Teams', 'Workspace'].map((team) => (
                      <button
                        key={team}
                        type="button"
                        onClick={() => {
                          setFilterOpen(false);
                          setActiveSubmenu(null);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-gray-50 flex items-center justify-between text-xs text-gray-700 font-medium cursor-pointer"
                      >
                        <span>{team}</span>
                        {team === 'All Teams' && <Check className="w-3.5 h-3.5 text-gray-900" />}
                      </button>
                    ))}
                  </>
                )}

                {/* Reporter Submenu Items */}
                {activeSubmenu === 'Reporter' && (
                  <>
                    {['All Reporters', 'Admin', 'Dexter'].map((rep) => (
                      <button
                        key={rep}
                        type="button"
                        onClick={() => {
                          setFilterOpen(false);
                          setActiveSubmenu(null);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-gray-50 flex items-center justify-between text-xs text-gray-700 font-medium cursor-pointer"
                      >
                        <span>{rep}</span>
                        {rep === 'All Reporters' && <Check className="w-3.5 h-3.5 text-gray-900" />}
                      </button>
                    ))}
                  </>
                )}

                {/* Due Date Submenu Items */}
                {activeSubmenu === 'Due Date' && (
                  <>
                    {['All Dates', 'Today', 'This Week', 'This Month'].map((dt) => (
                      <button
                        key={dt}
                        type="button"
                        onClick={() => {
                          setFilterOpen(false);
                          setActiveSubmenu(null);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-gray-50 flex items-center justify-between text-xs text-gray-700 font-medium cursor-pointer"
                      >
                        <span>{dt}</span>
                        {dt === 'All Dates' && <Check className="w-3.5 h-3.5 text-gray-900" />}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Task Button */}
      <button
        onClick={onNewTask}
        id="create-task-header-btn"
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-black transition-colors shadow-sm cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Task
      </button>
    </div>
  );
}
