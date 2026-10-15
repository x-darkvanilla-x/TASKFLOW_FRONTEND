'use client';

import { useState } from 'react';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
} from 'lucide-react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Task, TaskStatus } from '@/services/tasks.service';
import { formatMemberName } from '@/services/members.service';
import TaskCard from './TaskCard';
import { FieldVisibility, ViewMode } from './Header';

export interface ColumnDef {
  id: TaskStatus;
  title: string;
}

const COLUMNS: ColumnDef[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'doing', title: 'Doing' },
  { id: 'completed', title: 'Completed' },
  { id: 'on-hold', title: 'On Hold' },
];

interface TaskBoardProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
  onDragEnd: (result: DropResult) => void;
  viewMode?: ViewMode;
  fieldVisibility?: FieldVisibility;
}

export default function TaskBoard({
  tasks,
  onEdit,
  onDelete,
  onAddTask,
  onDragEnd,
  viewMode = 'board',
  fieldVisibility = {
    priority: true,
    members: true,
    dueDate: true,
    labels: true,
    status: false,
    reporter: false,
  },
}: TaskBoardProps) {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, taskId: string) => {
    e.stopPropagation();
    if (activeMenuId === taskId) {
      setActiveMenuId(null);
      setMenuPos(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuHeight = 72;
      const spaceBelow = window.innerHeight - rect.bottom;

      let top = rect.bottom + 4;
      if (spaceBelow < menuHeight + 10) {
        top = Math.max(10, rect.top - menuHeight - 4);
      }

      setActiveMenuId(taskId);
      setMenuPos({
        top,
        left: Math.max(10, Math.min(window.innerWidth - 122, rect.right - 112)),
      });
    }
  };

  const getColumnTasks = (columnId: TaskStatus) => {
    return tasks.filter((t) => {
      if (columnId === 'doing' && (t.status === 'doing' || t.status === 'in-progress')) return true;
      if (columnId === 'completed' && (t.status === 'completed' || t.status === 'done')) return true;
      return t.status === columnId;
    });
  };

  // Format Date as DD Month (short form) YYYY e.g. 20 Aug 2026 (only showing end date if range)
  const formatDateShortYear = (dateStr?: string): string => {
    if (!dateStr) return '';

    let targetDateStr = dateStr.trim();
    if (!targetDateStr) return '';
    if (targetDateStr.includes(' to ')) {
      const parts = targetDateStr.split(' to ');
      targetDateStr = (parts[1] || parts[0]).trim();
    }

    if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/.test(targetDateStr)) {
      return targetDateStr;
    }
    if (/^\d{1,2}\s+[A-Za-z]{3}$/.test(targetDateStr)) {
      return `${targetDateStr} 2026`;
    }

    const d = new Date(targetDateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    }

    return targetDateStr;
  };

  // Priority indicator renderer matching user design
  const renderPriority = (priority?: string) => {
    const p = priority || 'medium';
    if (p === 'urgent') {
      return (
        <span className="flex items-center gap-1.5 text-pink-600 font-bold text-xs">
          <span className="inline-flex gap-0.5 items-end h-3">
            <span className="w-0.5 h-1.5 bg-pink-600 rounded-xs"></span>
            <span className="w-0.5 h-2.5 bg-pink-600 rounded-xs"></span>
            <span className="w-0.5 h-3.5 bg-pink-600 rounded-xs"></span>
          </span>
          Urgent
        </span>
      );
    }
    if (p === 'high') {
      return (
        <span className="flex items-center gap-1.5 text-pink-500 font-medium text-xs">
          <span className="inline-flex gap-0.5 items-end h-3">
            <span className="w-0.5 h-1.5 bg-pink-500 rounded-xs"></span>
            <span className="w-0.5 h-2.5 bg-pink-500 rounded-xs"></span>
            <span className="w-0.5 h-3.5 bg-pink-500 rounded-xs"></span>
          </span>
          High
        </span>
      );
    }
    if (p === 'medium') {
      return (
        <span className="flex items-center gap-1.5 text-amber-500 font-medium text-xs">
          <span className="inline-flex gap-0.5 items-end h-3">
            <span className="w-0.5 h-1.5 bg-amber-500 rounded-xs"></span>
            <span className="w-0.5 h-2.5 bg-amber-500 rounded-xs"></span>
            <span className="w-0.5 h-3.5 bg-gray-300 rounded-xs"></span>
          </span>
          Medium
        </span>
      );
    }
    if (p === 'no-priority' || p === 'none') {
      return (
        <span className="flex items-center gap-1.5 text-gray-500 font-medium text-xs">
          <span className="text-gray-400 font-bold leading-none">.</span>
          No Priority
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-gray-400 font-medium text-xs">
        <span className="inline-flex gap-0.5 items-end h-3">
          <span className="w-0.5 h-1.5 bg-gray-400 rounded-xs"></span>
          <span className="w-0.5 h-2.5 bg-gray-300 rounded-xs"></span>
          <span className="w-0.5 h-3.5 bg-gray-300 rounded-xs"></span>
        </span>
        Low
      </span>
    );
  };

  // Render List View matching mockup
  if (viewMode === 'list') {
    return (
      <div className="space-y-6 pb-6">
        {COLUMNS.map((column) => {
          const columnTasks = getColumnTasks(column.id);
          const isCollapsed = !!collapsedSections[column.id];

          return (
            <div key={column.id} className="space-y-2">
              {/* Collapsible Status Group Header */}
              <button
                type="button"
                onClick={() => toggleSection(column.id)}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-zinc-200 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer select-none"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
                )}
                <span>{column.title}</span>
              </button>

              {/* Table Card Box */}
              {!isCollapsed && (
                <div className="bg-white dark:bg-zinc-900 border border-gray-200/90 dark:border-zinc-800 rounded-sm overflow-x-auto shadow-xs">
                  <div className="min-w-[600px]">
                    {/* Table Header Row */}
                    <div className="bg-[#F5F5F5] dark:bg-zinc-800/70 border-b border-gray-200/80 dark:border-zinc-800 px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-zinc-400 flex items-center gap-3">
                      <div className="flex-1 min-w-[160px]">Task</div>

                      {fieldVisibility.priority && <div className="w-24 shrink-0">Priority</div>}
                      {fieldVisibility.members && <div className="w-24 shrink-0">Members</div>}
                      {fieldVisibility.dueDate && <div className="w-32 shrink-0">Due Date</div>}
                      {fieldVisibility.labels && <div className="w-28 shrink-0">Labels</div>}
                      {fieldVisibility.status && <div className="w-24 shrink-0">Status</div>}
                      {fieldVisibility.reporter && <div className="w-24 shrink-0">Reporter</div>}

                      <div className="w-20 shrink-0 text-right pr-2">Actions</div>
                    </div>

                    {/* Table Rows */}
                    {columnTasks.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-gray-400 dark:text-zinc-500 italic">
                        No tasks in this list
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {columnTasks.map((task, index) => {
                          const assigneeName = task.assignee || 'Unassigned';
                          const avatarColor = task.assignee ? task.avatarColor || 'bg-indigo-600' : 'bg-gray-400';
                          const initial = assigneeName.charAt(0).toUpperCase();

                          return (
                            <div
                              key={task._id}
                              className="px-4 py-3 hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors flex items-center gap-3 text-xs relative"
                            >
                              {/* Task Title Column */}
                              <div
                                className="flex-1 min-w-[160px] font-medium text-gray-800 dark:text-zinc-200 truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                                onClick={() => onEdit(task)}
                              >
                                {task.title}
                              </div>

                              {/* Priority Column */}
                              {fieldVisibility.priority && (
                                <div className="w-24 shrink-0">
                                  {renderPriority(task.priority)}
                                </div>
                              )}

                              {/* Members Column */}
                              {fieldVisibility.members && (
                                <div className="w-24 shrink-0 flex items-center gap-1.5">
                                  <div
                                    className={`w-5 h-5 rounded-full ${avatarColor} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}
                                    title={formatMemberName(assigneeName)}
                                  >
                                    {initial}
                                  </div>
                                </div>
                              )}

                              {/* Due Date Column */}
                              {fieldVisibility.dueDate && (
                                <div className="w-32 shrink-0 text-gray-600 dark:text-zinc-400">
                                  {formatDateShortYear(task.dueDate)}
                                </div>
                              )}

                              {/* Labels Column */}
                              {fieldVisibility.labels && (
                                <div className="w-28 shrink-0 flex items-center gap-1 flex-wrap">
                                  {task.tags && task.tags.length > 0
                                    ? task.tags.map((tag, i) => (
                                        <span
                                          key={i}
                                          className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 px-1.5 py-0.5 rounded text-[10px]"
                                        >
                                          {tag}
                                        </span>
                                      ))
                                    : null}
                                </div>
                              )}

                              {/* Status Column */}
                              {fieldVisibility.status && (
                                <div className="w-24 shrink-0 uppercase text-[10px] font-medium text-gray-500 dark:text-zinc-400">
                                  {task.status}
                                </div>
                              )}

                              {/* Reporter Column */}
                              {fieldVisibility.reporter && (
                                <div className="w-24 shrink-0 text-gray-500 dark:text-zinc-400">
                                  Admin
                                </div>
                              )}

                              {/* Actions Options Menu Column */}
                              <div className="w-20 shrink-0 text-right pr-2">
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenMenu(e, task._id)}
                                  className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 rounded transition-colors cursor-pointer"
                                  title="Actions"
                                >
                                  <MoreHorizontal className="w-4 h-4 ml-auto" />
                                </button>

                                {activeMenuId === task._id && menuPos && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-40"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        setMenuPos(null);
                                      }}
                                    />
                                    <div
                                      className="fixed bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 py-1.5 w-28 text-xs text-left animate-in fade-in zoom-in-95 duration-100"
                                      style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          setMenuPos(null);
                                          onEdit(task);
                                        }}
                                        className="w-full px-3 py-1.5 text-left text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                                      >
                                        <Pencil className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-400" />
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          setMenuPos(null);
                                          onDelete(task);
                                        }}
                                        className="w-full px-3 py-1.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                        Delete
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Task Button Row at Bottom of Card Box */}
                    <div
                      onClick={() => onAddTask(column.id)}
                      className="px-4 py-2.5 border-t border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors text-xs font-medium text-gray-600 dark:text-zinc-400 flex items-center gap-1.5 cursor-pointer select-none"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Task
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Render Board View (Default)
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 sm:gap-4 items-start pb-4 overflow-x-auto snap-x snap-mandatory scrollbar-thin -mx-1 px-1 sm:mx-0 sm:px-0">
        {COLUMNS.map((column) => {
          const columnTasks = getColumnTasks(column.id);
          return (
            <div
              key={column.id}
              className="w-[85vw] max-w-[320px] sm:w-80 bg-[#F4F5F7] dark:bg-[#18181c] rounded-xl border border-gray-200/80 dark:border-zinc-800 flex flex-col shrink-0 snap-start"
              id={`column-${column.id}`}
            >
              {/* Column Header */}
              <div className="p-3 flex items-center justify-between border-b border-gray-200/50 dark:border-zinc-800/80">
                <div className="flex items-center gap-2">
                  {/* <GripVertical width={14} /> */}
                  <span className="text-xs font-semibold text-gray-700 dark:text-zinc-200">
                    {column.title}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <button
                    type="button"
                    onClick={() => onAddTask(column.id)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-400 dark:text-zinc-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded transition-colors cursor-pointer"
                    title={`Add task to ${column.title}`}
                    id={`add-task-${column.id}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  {/* <button
                    type="button"
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button> */}
                </div>
              </div>

              {/* Column Task Cards Area */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-2.5 space-y-2.5 flex-1 min-h-[120px] transition-colors ${snapshot.isDraggingOver ? 'bg-gray-200/40 dark:bg-zinc-800/40' : ''
                      }`}
                  >
                    {columnTasks.map((task, index) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        index={index}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        fieldVisibility={fieldVisibility}
                      />
                    ))}
                    {provided.placeholder}

                    {/* Add Task Button inside Column */}
                    <button
                      type="button"
                      onClick={() => onAddTask(column.id)}
                      className="w-full py-1.5 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 px-2 rounded hover:bg-gray-200/50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 mt-2 cursor-pointer"
                      id={`add-task-btn-${column.id}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Task
                    </button>
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
