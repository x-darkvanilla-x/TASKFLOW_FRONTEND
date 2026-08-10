'use client';

import { MoreHorizontal, Calendar, Tag, Pencil, Trash2 } from 'lucide-react';
import { Task } from '@/services/tasks.service';
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

  const assigneeName = task.assignee || 'Admin';
  const avatarColor = task.avatarColor || 'bg-indigo-600';
  const initial = assigneeName.charAt(0).toUpperCase();

  const formatCardDate = (dateStr?: string) => {
    if (!dateStr) return '29 Jul';
    try {
      let targetStr = dateStr.trim();
      if (targetStr.includes(' to ')) {
        const parts = targetStr.split(' to ');
        targetStr = (parts[1] || parts[0]).trim();
      }
      const d = new Date(targetStr);
      if (isNaN(d.getTime())) return targetStr;
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  const displayDueDate = formatCardDate(task.dueDate);
  const tagsToDisplay =
    task.tags && task.tags.length > 0 ? task.tags : ['Deployment', 'Deployment'];

  const renderPriorityBars = (priority?: string) => {
    const p = priority || 'medium';
    if (p === 'high' || p === 'urgent') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-50 text-pink-600 border border-pink-100 text-xs font-semibold select-none">
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100 text-xs font-semibold select-none">
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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200 text-xs font-semibold select-none">
        <span className="inline-flex gap-0.5 items-end h-3">
          <span className="w-0.5 h-1.5 bg-gray-400 rounded-xs"></span>
          <span className="w-0.5 h-2.5 bg-gray-300 rounded-xs"></span>
          <span className="w-0.5 h-3.5 bg-gray-300 rounded-xs"></span>
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
          className={`bg-white p-3.5 sm:p-4.5 rounded-2xl border border-gray-200/90 shadow-2xs hover:shadow-xs transition-all group cursor-pointer relative select-none space-y-3 ${
            snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-500/20 z-30' : ''
          }`}
          id={`task-card-${task._id}`}
        >
          {/* Top Row: Task Title & Options */}
          <div className="flex items-start justify-between gap-2.5">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 leading-snug tracking-tight flex-1">
              {task.title}
            </h3>
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptions((prev) => !prev);
                }}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showOptions && (
                <div
                  className="absolute right-0 top-7 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1 w-32 text-xs animate-in fade-in zoom-in-95 duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowOptions(false);
                      onEdit(task);
                    }}
                    className="w-full px-3 py-1.5 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                  >
                    <Pencil className="w-3.5 h-3.5 text-gray-500" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOptions(false);
                      onDelete(task);
                    }}
                    className="w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
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
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
              <div
                className={`w-6 h-6 rounded-full ${avatarColor} text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs overflow-hidden`}
              >
                {initial}
              </div>
              <span>{assigneeName}</span>
            </div>

            {/* Due Date Pill */}
            {fieldVisibility.dueDate && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50/90 hover:bg-red-100/80 text-red-600 border border-red-100/60 rounded-full text-xs font-semibold select-none transition-colors">
                <Calendar className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>{displayDueDate}</span>
              </div>
            )}
          </div>

          {/* Bottom Row: Tags / Labels */}
          {fieldVisibility.labels !== false && (
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              {tagsToDisplay.map((tag, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100/80 hover:bg-gray-200/80 border border-gray-200/60 text-gray-800 text-xs font-semibold rounded-full transition-colors"
                >
                  <Tag className="w-3.5 h-3.5 text-gray-800 shrink-0" />
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
