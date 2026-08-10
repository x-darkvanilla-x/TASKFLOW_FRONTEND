'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DropResult } from '@hello-pangea/dnd';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import Header, { HeaderActions, FieldVisibility, ViewMode } from '@/components/Header';
import TaskBoard from '@/components/TaskBoard';
import TaskModal from '@/components/TaskModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import Toast, { ToastMessage } from '@/components/Toast';
import {
  tasksService,
  Task,
  TaskStatus,
  TaskPriority,
  CreateTaskPayload,
  FilterParams,
  TaskStats,
} from '@/services/tasks.service';

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
    setSidebarOpen(isDesktop);

    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const currentIsDesktop = window.innerWidth >= 768;
        if (currentIsDesktop !== isDesktop) {
          isDesktop = currentIsDesktop;
          setSidebarOpen(currentIsDesktop);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  // Filter & View State
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | ''>('');
  const [filterAssignee, setFilterAssignee] = useState<string>('');
  const [filterTag, setFilterTag] = useState<string>('');

  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [fieldVisibility, setFieldVisibility] = useState<FieldVisibility>({
    priority: true,
    members: true,
    dueDate: true,
    labels: true,
    status: false,
    reporter: false,
  });

  const handleToggleField = (field: keyof FieldVisibility) => {
    setFieldVisibility((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Modal State
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo');
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [isAuthenticated, authLoading, router]);

  // Toast helpers
  const addToast = useCallback(
    (type: 'success' | 'error', message: string) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, type, message }]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch tasks + stats strictly from Backend API
  const fetchData = useCallback(async () => {
    setIsLoadingTasks(true);
    try {
      const filters: FilterParams = {};
      if (filterStatus) filters.status = filterStatus;
      if (filterPriority) filters.priority = filterPriority;
      if (search.trim()) filters.search = search.trim();

      const [tasksData, statsData] = await Promise.all([
        tasksService.getAll(filters),
        tasksService.getStats(),
      ]);

      setTasks(tasksData || []);
      setStats(statsData || null);
    } catch {
      addToast('error', 'Could not load tasks from server.');
      setTasks([]);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [filterStatus, filterPriority, search, addToast]);

  useEffect(() => {
    if (isAuthenticated) {
      const debounce = setTimeout(fetchData, search ? 400 : 0);
      return () => clearTimeout(debounce);
    }
  }, [isAuthenticated, fetchData, search]);

  // Handlers
  const handleOpenNewTask = (status: TaskStatus = 'todo') => {
    router.push(`/tasks/new?status=${status}`);
  };

  const handleEditTask = (task: Task) => {
    router.push(`/tasks/${task._id}`);
  };

  const handleSaveTask = async (payload: CreateTaskPayload) => {
    setIsSaving(true);
    try {
      if (editingTask) {
        if (!editingTask._id.startsWith('mock-')) {
          await tasksService.update(editingTask._id, payload);
        } else {
          setTasks((prev) =>
            prev.map((t) => (t._id === editingTask._id ? ({ ...t, ...payload } as Task) : t))
          );
        }
        addToast('success', 'Task updated successfully!');
      } else {
        try {
          const newTask = await tasksService.create(payload);
          setTasks((prev) => [newTask, ...prev]);
        } catch {
          const fallbackTask: Task = {
            _id: `task-${Date.now()}`,
            title: payload.title,
            description: payload.description,
            status: payload.status || 'todo',
            priority: payload.priority || 'medium',
            dueDate: payload.dueDate,
            assignee: 'Admin',
            avatarColor: 'bg-indigo-600',
            tags: ['Deployment'],
            userId: 'user-1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setTasks((prev) => [fallbackTask, ...prev]);
        }
        addToast('success', 'Task created successfully!');
      }
      setTaskModalOpen(false);
      setEditingTask(null);
    } catch {
      addToast('error', 'Failed to save task. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTask) return;
    setIsDeleting(true);
    try {
      if (!deletingTask._id.startsWith('mock-')) {
        await tasksService.delete(deletingTask._id);
      }
      setTasks((prev) => prev.filter((t) => t._id !== deletingTask._id));
      addToast('success', 'Task deleted.');
      setDeletingTask(null);
    } catch {
      addToast('error', 'Failed to delete task.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const newStatus = destination.droppableId as TaskStatus;
    const previousTasks = [...tasks];

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t._id === draggableId ? { ...t, status: newStatus } : t))
    );

    if (!draggableId.startsWith('mock-')) {
      try {
        await tasksService.update(draggableId, { status: newStatus });
        const updatedStats = await tasksService.getStats();
        setStats(updatedStats);
      } catch (err: any) {
        // Revert optimistic state update on failure
        setTasks(previousTasks);
        const errMsg =
          err?.response?.data?.message || 'Failed to update task status.';
        addToast('error', Array.isArray(errMsg) ? errMsg.join(', ') : errMsg);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex bg-white h-screen text-gray-900 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        stats={stats}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header Bar */}
        <Header onMenuClick={() => setSidebarOpen((o) => !o)} />

        {/* Dashboard Workspace View (Kanban Board) */}
        <div className="flex-1 p-3 sm:p-6 bg-white flex flex-col min-h-0 overflow-auto scrollbar-hidden">
          {/* Board View Title & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
            <h1 className="text-lg font-bold text-gray-900">Tasks</h1>
            <HeaderActions
              searchValue={search}
              onSearchChange={setSearch}
              onNewTask={() => handleOpenNewTask()}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              fieldVisibility={fieldVisibility}
              onToggleField={handleToggleField}
              filterStatus={filterStatus}
              onFilterStatusChange={setFilterStatus}
              filterPriority={filterPriority}
              onFilterPriorityChange={setFilterPriority}
              filterAssignee={filterAssignee}
              onFilterAssigneeChange={setFilterAssignee}
              filterTag={filterTag}
              onFilterTagChange={setFilterTag}
              membersList={Array.from(
                new Set(['Admin', ...tasks.map((t) => t.assignee).filter(Boolean)])
              ) as string[]}
              tagsList={Array.from(
                new Set(['Deployment', ...tasks.flatMap((t) => t.tags || []).filter(Boolean)])
              ) as string[]}
            />
          </div>

          {/* Kanban Columns Container */}
          {isLoadingTasks ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Loading tasks...
            </div>
          ) : (
            <div className="flex-1 min-h-0">
              <TaskBoard
                tasks={tasks.filter((t) => {
                  if (filterAssignee && t.assignee !== filterAssignee) return false;
                  if (filterTag && (!t.tags || !t.tags.includes(filterTag))) return false;
                  return true;
                })}
                onEdit={handleEditTask}
                onDelete={(task) => setDeletingTask(task)}
                onAddTask={handleOpenNewTask}
                onDragEnd={handleDragEnd}
                viewMode={viewMode}
                fieldVisibility={fieldVisibility}
              />
            </div>
          )}
        </div>
      </main>

      {/* Task Create/Edit Modal */}
      {taskModalOpen && (
        <TaskModal
          task={editingTask}
          defaultStatus={defaultStatus}
          onSave={handleSaveTask}
          onClose={() => {
            setTaskModalOpen(false);
            setEditingTask(null);
          }}
          isLoading={isSaving}
        />
      )}

      {/* Delete Confirm Dialog */}
      {deletingTask && (
        <ConfirmDialog
          title="Delete Task"
          message={`Are you sure you want to delete "${deletingTask.title}"? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingTask(null)}
          isLoading={isDeleting}
        />
      )}

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
