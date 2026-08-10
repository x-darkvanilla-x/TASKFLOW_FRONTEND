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
    if (!dateStr) return '—';

    let targetDateStr = dateStr.trim();
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
                className="flex items-center gap-1.5 text-xs font-bold text-gray-800 hover:text-gray-900 transition-colors cursor-pointer select-none"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
                <span>{column.title}</span>
              </button>

              {/* Table Card Box */}
              {!isCollapsed && (
                <div className="bg-white border border-gray-200/90 rounded-sm overflow-x-auto shadow-xs">
                  <div className="min-w-[600px]">
                    {/* Table Header Row */}
                    <div className="bg-[#F5F5F5] border-b border-gray-200/80 px-4 py-2.5 text-xs font-semibold text-gray-600 flex items-center gap-3">
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
                      <div className="px-4 py-3 text-xs text-gray-400 italic">
                        No tasks in this list
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {columnTasks.map((task, index) => {
                          const assigneeName = task.assignee || 'Admin';
                          const avatarColor = task.avatarColor || 'bg-indigo-600';
                          const initial = assigneeName.charAt(0).toUpperCase();
                          const isNearBottom = index >= Math.max(0, columnTasks.length - 2);

                          return (
                            <div
                              key={task._id}
                              className="px-4 py-3 hover:bg-gray-50/60 transition-colors flex items-center gap-3 text-xs relative"
                            >
                              {/* Task Title Column */}
                              <div
                                className="flex-1 min-w-[160px] font-medium text-gray-800 truncate cursor-pointer hover:text-indigo-600"
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
                                    title={assigneeName}
                                  >
                                    {initial}
                                  </div>
                                </div>
                              )}

                              {/* Due Date Column */}
                              {fieldVisibility.dueDate && (
                                <div className="w-32 shrink-0 text-gray-600">
                                  {formatDateShortYear(task.dueDate)}
                                </div>
                              )}

                              {/* Labels Column */}
                              {fieldVisibility.labels && (
                                <div className="w-28 shrink-0 flex items-center gap-1 flex-wrap">
                                  {task.tags && task.tags.length > 0 ? (
                                    task.tags.map((tag, i) => (
                                      <span
                                        key={i}
                                        className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]"
                                      >
                                        {tag}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </div>
                              )}

                              {/* Status Column */}
                              {fieldVisibility.status && (
                                <div className="w-24 shrink-0 uppercase text-[10px] font-medium text-gray-500">
                                  {task.status}
                                </div>
                              )}

                              {/* Reporter Column */}
                              {fieldVisibility.reporter && (
                                <div className="w-24 shrink-0 text-gray-500">
                                  Admin
                                </div>
                              )}

                              {/* Actions Options Menu Column */}
                              <div className="w-20 shrink-0 text-right pr-2">
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenMenu(e, task._id)}
                                  className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
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
                                      className="fixed bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1.5 w-28 text-xs text-left animate-in fade-in zoom-in-95 duration-100"
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
                                        className="w-full px-3 py-1.5 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-colors"
                                      >
                                        <Pencil className="w-3.5 h-3.5 text-gray-500" />
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          setMenuPos(null);
                                          onDelete(task);
                                        }}
                                        className="w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium transition-colors"
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
                      className="px-4 py-2.5 border-t border-gray-100 hover:bg-gray-50 transition-colors text-xs font-medium text-gray-600 flex items-center gap-1.5 cursor-pointer select-none"
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
              className="w-[85vw] max-w-[320px] sm:w-80 bg-[#F4F5F7] rounded-xl border border-gray-200/80 flex flex-col shrink-0 snap-start"
              id={`column-${column.id}`}
            >
              {/* Column Header */}
              <div className="p-3 flex items-center justify-between border-b border-gray-200/50">
                <div className="flex items-center gap-2">
                  <GripVertical width={14} />
                  <span className="text-xs font-semibold text-gray-700">
                    {column.title}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <button
                    type="button"
                    onClick={() => onAddTask(column.id)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title={`Add task to ${column.title}`}
                    id={`add-task-${column.id}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Column Task Cards Area */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-2.5 space-y-2.5 flex-1 min-h-[120px] transition-colors ${snapshot.isDraggingOver ? 'bg-gray-200/40' : ''
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
                      className="w-full py-1.5 text-left text-xs font-medium text-gray-500 hover:text-gray-900 px-2 rounded hover:bg-gray-200/50 transition-colors flex items-center gap-1.5 mt-2"
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
