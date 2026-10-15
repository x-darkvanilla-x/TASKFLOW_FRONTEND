'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Flag, AlignLeft, Type, Tag, Plus } from 'lucide-react';
import { Task, CreateTaskPayload, TaskStatus, TaskPriority } from '@/services/tasks.service';

interface TaskModalProps {
  task?: Task | null;
  defaultStatus?: TaskStatus;
  onSave: (payload: CreateTaskPayload) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export default function TaskModal({
  task,
  defaultStatus = 'todo',
  onSave,
  onClose,
  isLoading,
}: TaskModalProps) {
  const isEditing = !!task;

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium');
  const initialStart = task?.dueDate?.includes(' to ')
    ? task.dueDate.split(' to ')[0]
    : '';
  const initialDue = task?.dueDate?.includes(' to ')
    ? task.dueDate.split(' to ')[1]
    : task?.dueDate || '';

  const [startDate, setStartDate] = useState(initialStart);
  const [dueDate, setDueDate] = useState(initialDue);
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [error, setError] = useState('');

  const handleAddTag = () => {
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      setTags((prev) => [...prev, newTagInput.trim()]);
      setNewTagInput('');
      setShowTagInput(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setError('');

    const combined =
      startDate && dueDate
        ? `${startDate} to ${dueDate}`
        : dueDate || startDate || undefined;

    await onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      dueDate: combined,
      tags,
    });
  };

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
      >
        <div className="modal-header">
          <h2 className="modal-title" id="task-modal-title">
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            id="task-modal-close"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Title */}
            <div className="form-group">
              <label className="form-label required" htmlFor="task-title">
                Title
              </label>
              <input
                id="task-title"
                type="text"
                className="form-input"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                autoFocus
              />
              {error && (
                <span style={{ fontSize: '12px', color: 'var(--priority-high)' }}>
                  {error}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="task-description">
                Description
              </label>
              <textarea
                id="task-description"
                className="form-textarea"
                placeholder="Add more details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
              />
            </div>

            {/* Status + Priority */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="task-status">
                  Status
                </label>
                <select
                  id="task-status"
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                >
                  <option value="todo">To Do</option>
                  <option value="doing">Doing</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-priority">
                  Priority
                </label>
                <select
                  id="task-priority"
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                >
                  <option value="no-priority">. No Priority</option>
                  <option value="urgent">▲ Urgent</option>
                  <option value="high">● High</option>
                  <option value="medium">◐ Medium</option>
                  <option value="low">○ Low</option>
                </select>
              </div>
            </div>

            {/* Start Date & Due Date Range */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="task-start-date">
                  From (Start Date)
                </label>
                <input
                  id="task-start-date"
                  type="date"
                  className="form-input cursor-pointer"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="task-due-date">
                  To (Due Date)
                </label>
                <input
                  id="task-due-date"
                  type="date"
                  className="form-input cursor-pointer"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={startDate || undefined}
                />
              </div>
            </div>

            {/* Labels */}
            <div className="form-group">
              <label className="form-label">Labels</label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium"
                  >
                    <Tag className="w-3 h-3 text-gray-400" />
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                      title={`Remove ${t}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {showTagInput ? (
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    onBlur={handleAddTag}
                    placeholder="New label..."
                    className="form-input"
                    style={{ width: '110px', padding: '4px 8px', fontSize: '12px' }}
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowTagInput(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer flex items-center gap-1 py-1 px-2 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add Label
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              id="task-modal-cancel"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="task-modal-save"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  Saving...
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
