'use client';

import { MoreHorizontal, Calendar, Tag, Pencil, Trash2 } from 'lucide-react';
import { Task } from '@/services/tasks.service';
import { formatMemberName } from '@/services/members.service';
import { Draggable } from '@hello-pangea/dnd';
import { useState } from 'react';
import { FieldVisibility } from './Header';

interface TaskCardProps {
  task: Task;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  fieldVisibility?: FieldVisibility;
}

export default function TaskCard({
  task,
  index,
  onEdit,
  onDelete,
  fieldVisibility = {
    priority: false,
    members: true,
    dueDate: true,
    labels: true,
    status: false,
    reporter: false,
  },
}: TaskCardProps) {
  const [showOptions, setShowOptions] = useState(false);

  const assigneeName = task.assignee || 'Unassigned';
  const avatarColor = task.assignee ? task.avatarColor || 'bg-indigo-600' : 'bg-gray-400';
  const initial = assigneeName.charAt(0).toUpperCase();

  const formatCardDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      let targetStr = dateStr.trim();
      if (!targetStr) return '';
      if (targetStr.includes(' to ')) {
        const parts = targetStr.split(' to ');
        targetStr = (parts[1] || parts[0]).trim();
      }
      const d = new Date(targetStr);
      if (isNaN(d.getTime())) return targetStr;
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr || '';
    }
  };

  const displayDueDate = formatCardDate(task.dueDate);
  const tagsToDisplay =
    task.tags && task.tags.length > 0 ? task.tags : [];

  const renderPriorityBars = (priority?: string) => {
    const p = priority || 'medium';
    if (p === 'urgent') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-50 dark:bg-pink-950/50 text-pink-700 dark:text-pink-400 border border-pink-200 dark:border-pink-800/60 text-xs font-bold select-none">
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-pink-800/50 text-xs font-semibold select-none">
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 text-xs font-semibold select-none">
          <span className="inline-flex gap-0.5 items-end h-3">
            <span className="w-0.5 h-1.5 bg-amber-500 rounded-xs"></span>
            <span className="w-0.5 h-2.5 bg-amber-500 rounded-xs"></span>
            <span className="w-0.5 h-3.5 bg-gray-300 dark:bg-zinc-600 rounded-xs"></span>
          </span>
          Medium
        </span>
      );
    }
    if (p === 'no-priority' || p === 'none') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 text-xs font-medium select-none">
          <span className="text-gray-400 font-bold leading-none">.</span>
          No Priority
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 text-xs font-semibold select-none">
        <span className="inline-flex gap-0.5 items-end h-3">
          <span className="w-0.5 h-1.5 bg-gray-400 rounded-xs"></span>
          <span className="w-0.5 h-2.5 bg-gray-300 dark:bg-zinc-600 rounded-xs"></span>
          <span className="w-0.5 h-3.5 bg-gray-300 dark:bg-zinc-600 rounded-xs"></span>
        </span>
        Low
      </span>
    );
  };

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white dark:bg-zinc-900 p-3.5 sm:p-4.5 rounded-2xl border border-gray-200/90 dark:border-zinc-800 shadow-2xs hover:shadow-xs transition-all group cursor-pointer relative select-none space-y-3 ${
            snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-500/20 z-30' : ''
          }`}
          id={`task-card-${task._id}`}
        >
          {/* Top Row: Task Title & Options */}
          <div className="flex items-start justify-between gap-2.5">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-zinc-100 leading-snug tracking-tight flex-1">
              {task.title}
            </h3>
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptions((prev) => !prev);
                }}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors"
                title="Options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showOptions && (
                <div
                  className="absolute right-0 top-7 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl z-20 py-1 w-32 text-xs animate-in fade-in zoom-in-95 duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowOptions(false);
                      onEdit(task);
                    }}
                    className="w-full px-3 py-1.5 text-left text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-2 font-medium"
                  >
                    <Pencil className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-400" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOptions(false);
                      onDelete(task);
                    }}
                    className="w-full px-3 py-1.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Priority Pill with Signal Bars */}
          {fieldVisibility.priority !== false && task.priority && (
            <div>
              {renderPriorityBars(task.priority)}
            </div>
          )}

          {/* Middle Row: Assignee & Due Date */}
          <div className="flex items-center justify-between gap-2">
            {/* Assignee / Member */}
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-zinc-200">
              <div
                className={`w-6 h-6 rounded-full ${avatarColor} text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs overflow-hidden`}
              >
                {initial}
              </div>
              <span>{formatMemberName(assigneeName)}</span>
            </div>

            {/* Due Date Pill */}
            {fieldVisibility.dueDate && displayDueDate ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50/90 hover:bg-red-100/80 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-100/60 dark:border-red-900/50 rounded-full text-xs font-semibold select-none transition-colors">
                <Calendar className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>{displayDueDate}</span>
              </div>
            ) : null}
          </div>

          {/* Bottom Row: Tags / Labels */}
          {fieldVisibility.labels !== false && tagsToDisplay.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              {tagsToDisplay.map((tag, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100/80 hover:bg-gray-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-750 border border-gray-200/60 dark:border-zinc-700 text-gray-800 dark:text-zinc-200 text-xs font-semibold rounded-full transition-colors"
                >
                  <Tag className="w-3.5 h-3.5 text-gray-800 dark:text-zinc-400 shrink-0" />
                  <span>{tag}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
