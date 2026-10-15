'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Lock,
  Eye,
  Share2,
  MoreHorizontal,
  PanelRight,
  ChevronDown,
  Plus,
  Paperclip,
  Send,
  Pencil,
  Trash2,
  Check,
  Tag,
  Calendar,
  User as UserIcon,
  Smile,
  Search,
  X,
} from 'lucide-react';
import {
  tasksService,
  Task,
  TaskStatus,
  TaskPriority,
} from '@/services/tasks.service';
import { membersService, Member, formatMemberName } from '@/services/members.service';
import Toast, { ToastMessage } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { socketService } from '@/services/socket.service';

function DatePillPicker({
  value,
  onChange,
  placeholder,
  min,
  max,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  min?: string;
  max?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const formatMonthDay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleClick = () => {
    if (disabled) return;
    if (inputRef.current) {
      if (typeof inputRef.current.showPicker === 'function') {
        inputRef.current.showPicker();
      } else {
        inputRef.current.focus();
        inputRef.current.click();
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-300/90 rounded-full text-xs text-gray-700 font-medium transition-all shadow-2xs select-none relative group ${
        disabled
          ? 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-zinc-800/50'
          : 'hover:bg-gray-50 cursor-pointer'
      }`}
    >
      <Calendar className="w-3.5 h-3.5 text-gray-500 pointer-events-none" />
      <span className="pointer-events-none">
        {value ? formatMonthDay(value) : placeholder}
      </span>
      {value && !disabled && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onChange('');
          }}
          className="text-gray-400 hover:text-red-500 cursor-pointer ml-0.5 z-20"
          title="Clear date"
        >
          <X className="w-3 h-3" />
        </span>
      )}
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        disabled={disabled}
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10 disabled:cursor-not-allowed disabled:pointer-events-none"
      />
    </div>
  );
}

interface TaskFormContentProps {
  taskId?: string;
  defaultStatus?: TaskStatus;
}

interface SubtaskItem {
  id: string;
  title: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  assignee: string;
  dueDate: string;
}

export default function TaskFormContent({
  taskId,
  defaultStatus = 'todo',
}: TaskFormContentProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(!!taskId);
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Members State
  const [members, setMembers] = useState<Member[]>([]);
  const [membersOpen, setMembersOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Developer');

  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const currentUserName = user?.name || 'You';

  // Task Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignee, setAssignee] = useState(user?.name || 'You');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [creatorName, setCreatorName] = useState(user?.name || 'You');
  const [taskCreatedBy, setTaskCreatedBy] = useState<string | undefined>();
  const [isLocked, setIsLocked] = useState(false);

  // Determine if current user is the creator (or workspace owner)
  const isCreator =
    !taskId ||
    (taskCreatedBy ? taskCreatedBy === user?.id : false) ||
    (creatorName && user?.name
      ? creatorName.trim().toLowerCase() === user.name.trim().toLowerCase()
      : false) ||
    (currentWorkspace?.ownerId ? currentWorkspace.ownerId === user?.id : false) ||
    currentWorkspace?.role === 'owner';

  // If task is locked and current user is not creator, all fields are locked except status
  const isFieldDisabled = isLocked && !isCreator;

  // Resources State
  const [resources, setResources] = useState<
    { id: string; title: string; url: string }[]
  >([]);
  const [showAddResource, setShowAddResource] = useState(false);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');

  // Sync assignee when user is loaded
  useEffect(() => {
    if (user?.name && (assignee === 'You' || !assignee)) {
      setAssignee(user.name);
    }
  }, [user]);

  // Sync creatorName when user is loaded for new task
  useEffect(() => {
    if (!taskId && user?.name) {
      setCreatorName(user.name);
    }
  }, [taskId, user?.name]);

  // Sync status if defaultStatus prop updates and we are creating a new task
  useEffect(() => {
    if (!taskId && defaultStatus) {
      setStatus(defaultStatus);
    }
  }, [taskId, defaultStatus]);

  // Dropdown Popovers State
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [datesOpen, setDatesOpen] = useState(false);

  const formatMonthDay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Fetch project members on mount & on workspace switch
  const loadMembers = async () => {
    try {
      const fetched = await membersService.getAll(currentWorkspace?.ownerId);
      let currentUsername = '';
      if (typeof window !== 'undefined') {
        const savedExtra = localStorage.getItem('profile_extra');
        if (savedExtra) {
          try {
            const parsed = JSON.parse(savedExtra);
            if (parsed.username) currentUsername = parsed.username;
          } catch { }
        }
      }

      const currentUserMember: Member = {
        _id: user?.id || 'self-user',
        name: currentUserName,
        username: currentUsername || currentUserName.toLowerCase().replace(/\s+/g, '_'),
        role: currentWorkspace?.role || 'You',
        avatarColor: 'bg-indigo-600',
      };

      const mockHandles = [
        'sarah_dev',
        'alexj',
        'mchen_lead',
        'emma_ui',
        'david_kim',
        'liam_backend',
        'sophia_pm',
      ];

      const filtered = fetched
        .filter(
          (m) =>
            m.name.toLowerCase() !== currentUserName.toLowerCase() &&
            (!m.username || m.username.toLowerCase() !== currentUsername.toLowerCase()) &&
            !mockHandles.includes(m.username?.toLowerCase() || '') &&
            !m._id?.startsWith('u-') &&
            m.name !== 'Sarah Connor' &&
            m.name !== 'Alex Johnson'
        )
        .map((m) => ({
          ...m,
          username: m.username || m.name.toLowerCase().replace(/\s+/g, '_'),
        }));

      setMembers([currentUserMember, ...filtered]);
    } catch { }
  };

  useEffect(() => {
    loadMembers();
  }, [user, currentUserName, currentWorkspace?.id, currentWorkspace?.ownerId, currentWorkspace?.role]);

  useEffect(() => {
    const handleWsSwitch = () => {
      loadMembers();
    };
    window.addEventListener('workspace-switched', handleWsSwitch);
    return () => window.removeEventListener('workspace-switched', handleWsSwitch);
  }, [currentWorkspace?.ownerId]);

  const handleCreateMember = async () => {
    if (!newMemberName.trim()) return;
    const cleanUsername =
      newMemberUsername.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '') ||
      newMemberName.trim().toLowerCase().replace(/\s+/g, '_');

    const colors = [
      'bg-indigo-600',
      'bg-purple-600',
      'bg-blue-600',
      'bg-emerald-600',
      'bg-amber-600',
      'bg-pink-600',
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const created = await membersService.create({
      name: newMemberName.trim(),
      username: cleanUsername,
      role: newMemberRole.trim() || 'Member',
      avatarColor: randomColor,
      workspaceId: currentWorkspace?.id,
      workspaceName: currentWorkspace?.name,
    });
    setMembers((prev) => [...prev, created]);
    setAssignee(created.name);
    setNewMemberName('');
    setNewMemberUsername('');
    setShowAddMember(false);
    setMembersOpen(false);
    setMemberSearch('');
    addToast('success', `Added @${cleanUsername} (${created.name}) to project members!`);
  };

  // Subtasks State
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>([]);

  // Comments State
  const [comments, setComments] = useState<
    { id: string; author: string; time: string; text: string }[]
  >([]);
  const [newComment, setNewComment] = useState('');

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch task if editing existing task
  useEffect(() => {
    if (!taskId) return;

    const loadTask = async () => {
      setIsLoading(true);
      try {
        const fetchedTask = await tasksService.getById(taskId);
        if (fetchedTask) {
          setTitle(fetchedTask.title);
          setDescription(fetchedTask.description || '');
          setStatus(fetchedTask.status || 'todo');
          setPriority(fetchedTask.priority || 'medium');
          if (fetchedTask.dueDate) {
            if (fetchedTask.dueDate.includes(' to ')) {
              const parts = fetchedTask.dueDate.split(' to ');
              setStartDate(parts[0]);
              setDueDate(parts[1]);
            } else {
              setDueDate(fetchedTask.dueDate);
              setStartDate('');
            }
          } else {
            setStartDate('');
            setDueDate('');
          }
          if (fetchedTask.assignee) setAssignee(fetchedTask.assignee);
          if (fetchedTask.tags && Array.isArray(fetchedTask.tags)) {
            setTags(fetchedTask.tags);
          } else {
            setTags([]);
          }
          if (fetchedTask.subtasks && fetchedTask.subtasks.length > 0) {
            setSubtasks(fetchedTask.subtasks as any);
          }
          if (fetchedTask.resources && fetchedTask.resources.length > 0) {
            setResources(fetchedTask.resources);
          }
          if (fetchedTask.isLocked !== undefined) {
            setIsLocked(!!fetchedTask.isLocked);
          }
          if (fetchedTask.createdBy) {
            setTaskCreatedBy(fetchedTask.createdBy);
          } else if (fetchedTask.userId) {
            setTaskCreatedBy(fetchedTask.userId);
          }
          if (fetchedTask.creatorName) {
            setCreatorName(fetchedTask.creatorName);
          } else {
            setCreatorName(user?.name || 'You');
          }
        }
      } catch (err: any) {
        const errMsg = err?.response?.data?.message || 'Could not load task details.';
        addToast('error', Array.isArray(errMsg) ? errMsg.join(', ') : errMsg);
      } finally {
        setIsLoading(false);
      }
    };

    loadTask();
  }, [taskId]);

  // Listen for socket real-time updates for locked status & status
  useEffect(() => {
    if (!taskId) return;
    const unsub = socketService.onTaskUpdated((updatedTask) => {
      if (updatedTask._id === taskId) {
        if (updatedTask.isLocked !== undefined) {
          setIsLocked(!!updatedTask.isLocked);
        }
        if (updatedTask.status) {
          setStatus(updatedTask.status);
        }
      }
    });
    return () => unsub();
  }, [taskId]);

  const handleToggleLock = async () => {
    if (!isCreator) {
      addToast('error', 'Only the creator of this task can lock or unlock it.');
      return;
    }
    const nextLocked = !isLocked;
    setIsLocked(nextLocked);
    if (taskId && !taskId.startsWith('mock-')) {
      try {
        await tasksService.update(taskId, { isLocked: nextLocked });
        addToast(
          'success',
          nextLocked
            ? 'Task locked. Other members can only change the status.'
            : 'Task unlocked. All fields are now editable.'
        );
      } catch (err: any) {
        setIsLocked(!nextLocked);
        const msg = err?.response?.data?.message || 'Failed to update lock state';
        addToast('error', Array.isArray(msg) ? msg.join(', ') : msg);
      }
    } else {
      addToast(
        'success',
        nextLocked
          ? 'Task will be created as locked.'
          : 'Task will be created as unlocked.'
      );
    }
  };

  const handleSave = async () => {
    if (!title.trim() && !isFieldDisabled) {
      addToast('error', 'Please enter a task title');
      return;
    }

    if (!isFieldDisabled) {
      // Validate subtask due dates are between task startDate and dueDate
      const parseTs = (dStr?: string): number | undefined => {
        if (!dStr) return undefined;
        const d = new Date(dStr.trim());
        return isNaN(d.getTime()) ? undefined : d.getTime();
      };

      const startTs = parseTs(startDate);
      const dueTs = parseTs(dueDate);

      for (const sub of subtasks) {
        if (sub.dueDate) {
          const subTs = parseTs(sub.dueDate);
          if (subTs !== undefined) {
            if (startTs !== undefined && subTs < startTs) {
              addToast(
                'error',
                `Subtask "${sub.title || 'Untitled'}" due date cannot be before task start date (${startDate})`
              );
              return;
            }
            if (dueTs !== undefined && subTs > dueTs) {
              addToast(
                'error',
                `Subtask "${sub.title || 'Untitled'}" due date cannot be after task end date (${dueDate})`
              );
              return;
            }
          }
        }
      }
    }

    setIsSaving(true);
    const combinedDueDate =
      startDate && dueDate
        ? `${startDate} to ${dueDate}`
        : dueDate || startDate || undefined;

    try {
      if (taskId && !taskId.startsWith('mock-')) {
        if (isFieldDisabled) {
          // When locked by creator, non-creators can only update the status
          await tasksService.update(taskId, {
            status,
          });
        } else {
          await tasksService.update(taskId, {
            title: title.trim(),
            description: description.trim(),
            status,
            priority,
            dueDate: combinedDueDate,
            assignee,
            tags,
            subtasks,
            resources,
            isLocked,
          });
        }
      } else {
        await tasksService.create({
          title: title.trim(),
          description: description.trim(),
          status,
          priority,
          dueDate: combinedDueDate,
          assignee,
          tags,
          subtasks,
          resources,
          creatorName: creatorName || user?.name || 'You',
          isLocked,
        });
      }
      addToast('success', isFieldDisabled ? 'Task status updated!' : 'Task saved successfully!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to save task to backend.';
      addToast('error', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSaving(false);
    }
  };

  const parseDateToTimestamp = (dStr?: string): number | undefined => {
    if (!dStr) return undefined;
    const trimmed = dStr.trim();
    if (!trimmed) return undefined;
    if (/^\d{1,2}\s+[A-Za-z]{3}(\s+\d{4})?$/.test(trimmed)) {
      const fullStr = /^\d{1,2}\s+[A-Za-z]{3}$/.test(trimmed) ? `${trimmed} 2026` : trimmed;
      const d = new Date(fullStr);
      if (!isNaN(d.getTime())) return d.getTime();
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d.getTime();
    return undefined;
  };

  const handleAddSubtask = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    let defaultDueDate = todayStr;
    const todayTs = parseDateToTimestamp(todayStr);
    const startTs = parseDateToTimestamp(startDate);
    const dueTs = parseDateToTimestamp(dueDate);

    if (todayTs !== undefined) {
      if (startTs !== undefined && todayTs < startTs) {
        defaultDueDate = startDate;
      } else if (dueTs !== undefined && todayTs > dueTs) {
        defaultDueDate = dueDate;
      }
    } else if (startDate) {
      defaultDueDate = startDate;
    }

    const newSub: SubtaskItem = {
      id: `sub-${Date.now()}`,
      title: `Subtask ${subtasks.length + 1}`,
      priority: 'medium',
      assignee: currentUserName,
      dueDate: defaultDueDate,
    };
    setSubtasks((prev) => [...prev, newSub]);
  };

  const handleSubtaskDateChange = (subId: string, rawVal: string) => {
    if (!rawVal) {
      setSubtasks((prev) =>
        prev.map((s) => (s.id === subId ? { ...s, dueDate: '' } : s))
      );
      return;
    }

    let val = rawVal;
    const valTs = parseDateToTimestamp(val);
    const startTs = parseDateToTimestamp(startDate);
    const dueTs = parseDateToTimestamp(dueDate);

    if (valTs !== undefined) {
      if (startTs !== undefined && valTs < startTs) {
        addToast(
          'error',
          `Subtask due date cannot be before task start date (${startDate}). Adjusted to ${startDate}.`
        );
        val = startDate;
      } else if (dueTs !== undefined && valTs > dueTs) {
        addToast(
          'error',
          `Subtask due date cannot be after task end date (${dueDate}). Adjusted to ${dueDate}.`
        );
        val = dueDate;
      }
    }

    setSubtasks((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, dueDate: val } : s))
    );
  };

  // Auto-clamp existing subtask due dates when task startDate or dueDate changes
  useEffect(() => {
    if (!startDate && !dueDate) return;
    const startTs = parseDateToTimestamp(startDate);
    const dueTs = parseDateToTimestamp(dueDate);

    setSubtasks((prevSubtasks) => {
      let changed = false;
      const updated = prevSubtasks.map((sub) => {
        if (!sub.dueDate) return sub;
        const subTs = parseDateToTimestamp(sub.dueDate);
        if (subTs === undefined) return sub;

        let clampedDate = sub.dueDate;
        if (startTs !== undefined && subTs < startTs) {
          clampedDate = startDate;
          changed = true;
        } else if (dueTs !== undefined && subTs > dueTs) {
          clampedDate = dueDate;
          changed = true;
        }
        return clampedDate !== sub.dueDate ? { ...sub, dueDate: clampedDate } : sub;
      });
      return changed ? updated : prevSubtasks;
    });
  }, [startDate, dueDate]);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        author: currentUserName,
        time: 'just now',
        text: newComment.trim(),
      },
    ]);
    setNewComment('');
  };

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

  const handleAddResource = () => {
    if (!resourceTitle.trim()) return;
    let url = resourceUrl.trim();
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    const newRes = {
      id: `res-${Date.now()}`,
      title: resourceTitle.trim(),
      url: url || '#',
    };
    setResources((prev) => [...prev, newRes]);
    setResourceTitle('');
    setResourceUrl('');
    setShowAddResource(false);
    addToast('success', `Added resource "${newRes.title}"`);
  };

  const handleRemoveResource = (id: string) => {
    setResources((prev) => prev.filter((r) => r.id !== id));
  };

  const renderPriorityBadge = (p: TaskPriority | 'urgent' | 'no-priority' | 'none') => {
    if (p === 'urgent') {
      return (
        <span className="flex items-center gap-1.5 text-pink-600 font-semibold text-xs">
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

  const SubtaskPriorityPicker = ({
    value,
    onChange,
    disabled,
  }: {
    value: 'urgent' | 'high' | 'medium' | 'low';
    onChange: (val: 'urgent' | 'high' | 'medium' | 'low') => void;
    disabled?: boolean;
  }) => {
    const [open, setOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleOutside = (e: MouseEvent) => {
        if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handleOutside);
      return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    return (
      <div ref={pickerRef} className="relative inline-block text-left">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) setOpen((o) => !o);
          }}
          className={`flex items-center gap-1 px-2 py-1 bg-white border border-gray-200/90 rounded-full text-xs font-medium transition-all shadow-2xs select-none ${
            disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'
          }`}
        >
          {renderPriorityBadge(value)}
          {!disabled && <ChevronDown className="w-3 h-3 text-gray-400 ml-0.5" />}
        </button>

        {open && !disabled && (
          <div className="absolute left-0 mt-1 w-32 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 space-y-0.5">
            {(['urgent', 'high', 'medium', 'low'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  onChange(p);
                  setOpen(false);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-gray-50 flex items-center justify-between transition-colors cursor-pointer"
              >
                {renderPriorityBadge(p)}
                {value === p && <Check className="w-3 h-3 text-indigo-600" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const SubtaskTitleInput = ({
    value,
    onChange,
    disabled,
  }: {
    value: string;
    onChange: (val: string) => void;
    disabled?: boolean;
  }) => {
    const textRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      if (textRef.current) {
        textRef.current.style.height = 'auto';
        textRef.current.style.height = `${textRef.current.scrollHeight}px`;
      }
    }, [value]);

    return (
      <textarea
        ref={textRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Subtask title..."
        rows={1}
        className={`w-full font-medium text-gray-800 bg-transparent outline-none border-b border-transparent focus:border-gray-300 transition-colors text-xs resize-none whitespace-pre-wrap break-words overflow-hidden leading-relaxed block ${
          disabled ? 'cursor-not-allowed opacity-80' : ''
        }`}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAFAFA] dark:bg-[#121215]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAFA] dark:bg-[#121215] text-gray-900 dark:text-gray-100 p-4 sm:p-8 transition-colors">
      {/* Toast Notification */}
      <div className="fixed top-4 right-4 z-50">
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Bar with Back Button & Right Action Icons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tasks
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleLock}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                isLocked
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 shadow-xs'
                  : 'bg-white dark:bg-zinc-800 border-gray-200/90 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 hover:text-gray-900 shadow-2xs'
              }`}
              title={
                !isCreator
                  ? 'Task is locked by creator (Read-only except status)'
                  : isLocked
                  ? 'Task is locked (Click to unlock)'
                  : 'Lock task (Only you can edit, others can only change status)'
              }
            >
              <Lock className={`w-3.5 h-3.5 ${isLocked ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500'}`} />
              <span>{isLocked ? 'Locked' : 'Lock'}</span>
            </button>
          </div>
        </div>

        {/* Lock Status Banner */}
        {isLocked && (
          <div
            className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-xs animate-in fade-in duration-200 ${
              isFieldDisabled
                ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
                : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div>
                {isFieldDisabled ? (
                  <span>
                    This task is locked by{' '}
                    <strong>{formatMemberName(creatorName)}</strong>. Only the
                    task status can be changed.
                  </span>
                ) : (
                  <span>
                    You locked this task. Other members can only change the
                    status.
                  </span>
                )}
              </div>
            </div>
            {isCreator && (
              <button
                type="button"
                onClick={handleToggleLock}
                className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 underline cursor-pointer shrink-0"
              >
                Unlock
              </button>
            )}
          </div>
        )}

        {/* Main Task Editor 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full min-w-0">
          {/* Left Column: Title, Properties, Subtasks, Activity Comments */}
          <div className="lg:col-span-8 space-y-6 min-w-0 max-w-full">
            {/* Editable Task Title Input */}
            <input
              type="text"
              value={title}
              disabled={isFieldDisabled}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              className={`w-full text-2xl font-bold text-gray-900 border-none outline-none bg-transparent focus:ring-0 placeholder:text-gray-300 ${
                isFieldDisabled ? 'cursor-not-allowed opacity-90' : ''
              }`}
            />

            {/* Subtitle / Description */}
            <textarea
              value={description}
              disabled={isFieldDisabled}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a detailed description..."
              rows={2}
              className={`w-full text-xs text-gray-600 border-none outline-none bg-transparent focus:ring-0 placeholder:text-gray-400 resize-none font-normal ${
                isFieldDisabled ? 'cursor-not-allowed opacity-80' : ''
              }`}
            />

            {/* Properties Row Section matching user mockup */}
            <div className="space-y-3 pt-2 border-t border-gray-200/60">
              {/* Properties Item */}
              <div className="flex flex-col sm:flex-row sm:items-center items-start gap-2 text-xs">
                <span className="w-24 font-semibold text-gray-500 shrink-0">
                  Properties
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isFieldDisabled}
                    onClick={() => {
                      if (isFieldDisabled) return;
                      setMembersOpen(true);
                      setMemberSearch('');
                    }}
                    className={`flex items-center gap-1.5 bg-gray-100/90 text-gray-800 dark:text-zinc-200 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      isFieldDisabled
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:bg-gray-200/90 dark:bg-zinc-800 dark:hover:bg-zinc-750 cursor-pointer'
                    }`}
                    title={isFieldDisabled ? 'Locked by creator' : 'Click to change member / search by username'}
                  >
                    <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold">
                      {assignee.charAt(0).toUpperCase()}
                    </div>
                    <span>{formatMemberName(assignee)}</span>
                  </button>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Start Date Pill */}
                    <DatePillPicker
                      value={startDate}
                      onChange={setStartDate}
                      placeholder="Start"
                      max={dueDate || undefined}
                      disabled={isFieldDisabled}
                    />

                    {/* Arrow Divider */}
                    <span className="text-gray-400 text-xs font-semibold px-0.5">→</span>

                    {/* End Date Pill */}
                    <DatePillPicker
                      value={dueDate}
                      onChange={setDueDate}
                      placeholder="End"
                      min={startDate || undefined}
                      disabled={isFieldDisabled}
                    />
                  </div>
                </div>
              </div>

              {/* Labels Item */}
              <div className="flex items-start text-xs">
                <span className="w-24 font-semibold text-gray-500 shrink-0 pt-1">
                  Labels
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {tags.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 bg-gray-100/90 hover:bg-gray-200/80 text-gray-700 px-2.5 py-1 rounded-md text-xs font-medium transition-colors group"
                    >
                      <Tag className="w-3 h-3 text-gray-400" />
                      <span>{t}</span>
                      {!isFieldDisabled && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="p-0.5 text-gray-400 hover:text-red-500 rounded-full transition-colors cursor-pointer"
                          title={`Remove label ${t}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {!isFieldDisabled && (
                    showTagInput ? (
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                        onBlur={handleAddTag}
                        placeholder="Tag..."
                        className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs outline-none w-20"
                        autoFocus
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowTagInput(true)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 px-1.5 py-1 font-semibold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Resources Item */}
              <div className="flex items-start text-xs">
                <span className="w-24 font-semibold text-gray-500 shrink-0 pt-1">
                  Resources
                </span>
                <div className="flex-1 space-y-2">
                  {/* Added Resource Links List */}
                  {resources.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {resources.map((res) => (
                        <div
                          key={res.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100/90 hover:bg-gray-200/80 border border-gray-200 rounded-lg text-xs font-medium text-gray-800 transition-colors group"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline hover:text-indigo-600 truncate max-w-[140px]"
                            title={res.url}
                          >
                            {res.title}
                          </a>
                          {!isFieldDisabled && (
                            <button
                              type="button"
                              onClick={() => handleRemoveResource(res.id)}
                              className="p-0.5 text-gray-400 hover:text-red-500 rounded-full transition-colors cursor-pointer"
                              title="Remove resource link"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Resource Form or Trigger Button */}
                  {!isFieldDisabled && (
                    showAddResource ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 max-w-sm space-y-2">
                        <input
                          type="text"
                          placeholder="Resource Title (e.g. Figma Design)"
                          value={resourceTitle}
                          onChange={(e) => setResourceTitle(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-gray-400"
                          autoFocus
                        />
                        <input
                          type="url"
                          placeholder="URL (e.g. https://figma.com/...)"
                          value={resourceUrl}
                          onChange={(e) => setResourceUrl(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddResource()}
                          className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-gray-400 dark:focus:border-zinc-500"
                        />
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleAddResource}
                            className="px-3 py-1 bg-gray-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-white rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Add Link
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddResource(false);
                              setResourceTitle('');
                              setResourceUrl('');
                            }}
                            className="px-2.5 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 rounded-md text-[11px] font-medium hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddResource(true)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer py-0.5"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
                        + Add document or link...
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Subtasks Section */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                <ChevronDown className="w-4 h-4 text-gray-500" />
                Subtasks
              </div>

              {/* Subtasks Table Box */}
              <div className="bg-white border border-gray-200/90 rounded-xl overflow-x-auto w-full max-w-full shadow-xs scrollbar-thin">
                <div className="min-w-[800px]">
                  {/* Header */}
                  <div className="rounded-t-xl bg-gray-50/80 border-b border-gray-200/80 px-4 py-2.5 text-xs font-semibold text-gray-500 flex items-center gap-3">
                    <div className="flex-1 min-w-[260px]">Task</div>
                    <div className="w-28 shrink-0">Priority</div>
                    <div className="w-32 shrink-0">Members</div>
                    <div className="w-36 shrink-0">Due Date</div>
                    <div className="w-12 shrink-0 text-right">Actions</div>
                  </div>

                  {/* Subtask Rows */}
                  <div className="divide-y divide-gray-100">
                    {subtasks.map((sub) => (
                      <div
                        key={sub.id}
                        className="px-4 py-2.5 flex items-center gap-3 text-xs hover:bg-gray-50/60 transition-colors"
                      >
                        {/* Editable Title with Word Wrap */}
                        <div className="flex-1 min-w-[260px]">
                          <SubtaskTitleInput
                            value={sub.title}
                            disabled={isFieldDisabled}
                            onChange={(val) => {
                              setSubtasks((prev) =>
                                prev.map((s) => (s.id === sub.id ? { ...s, title: val } : s))
                              );
                            }}
                          />
                        </div>

                        {/* Signal Bars Priority Selector */}
                        <div className="w-28 shrink-0">
                          <SubtaskPriorityPicker
                            value={sub.priority}
                            disabled={isFieldDisabled}
                            onChange={(val) => {
                              setSubtasks((prev) =>
                                prev.map((s) => (s.id === sub.id ? { ...s, priority: val } : s))
                              );
                            }}
                          />
                        </div>

                        {/* Editable Assignee */}
                        <div className={`w-32 shrink-0 flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 ${
                          isFieldDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-100'
                        }`}>
                          <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                            {(sub.assignee || 'U').charAt(0).toUpperCase()}
                          </div>
                          <select
                            value={sub.assignee}
                            disabled={isFieldDisabled}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSubtasks((prev) =>
                                prev.map((s) => (s.id === sub.id ? { ...s, assignee: val } : s))
                              );
                            }}
                            className={`bg-transparent text-xs text-gray-700 outline-none truncate w-full font-medium ${
                              isFieldDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
                            }`}
                          >
                            {members.map((m) => (
                              <option key={m._id || m.name} value={m.name}>
                                {formatMemberName(m.name)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Editable Due Date */}
                        <div className="w-36 shrink-0">
                          <DatePillPicker
                            value={sub.dueDate}
                            disabled={isFieldDisabled}
                            onChange={(val) => {
                              setSubtasks((prev) =>
                                prev.map((s) => (s.id === sub.id ? { ...s, dueDate: val } : s))
                              );
                            }}
                            placeholder="Set due date"
                            min={startDate || undefined}
                            max={dueDate || undefined}
                          />
                        </div>

                        {/* Actions Column */}
                        <div className="w-12 shrink-0 text-right flex justify-end">
                          {!isFieldDisabled && (
                            <button
                              type="button"
                              onClick={() => {
                                setSubtasks((prev) => prev.filter((s) => s.id !== sub.id));
                              }}
                              className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                              title="Delete Subtask"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Subtasks Button Row */}
                  {!isFieldDisabled && (
                    <div
                      onClick={handleAddSubtask}
                      className="px-4 py-2.5 border-t border-gray-100 hover:bg-gray-50 transition-colors text-xs font-medium text-gray-600 flex items-center gap-1.5 cursor-pointer select-none"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Subtasks
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Activity / Comments Section matching user screenshot */}
            <div className="space-y-3 pt-2">
              <div className="text-sm font-bold text-gray-900">Subtasks</div>

              {/* Comment Card 1 */}
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-white border border-gray-200/90 rounded-xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center text-[10px] font-bold">
                        A
                      </div>
                      <span className="text-xs font-bold text-gray-900">
                        {comment.author}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {comment.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Smile className="w-4 h-4 cursor-pointer hover:text-gray-600" />
                      <MoreHorizontal className="w-4 h-4 cursor-pointer hover:text-gray-600" />
                    </div>
                  </div>

                  <div className="text-xs text-gray-800 font-normal pl-8">
                    {comment.text}
                  </div>

                  {/* Reply Box */}
                  <div className="pt-2 pl-8 flex items-center gap-2 border-t border-gray-100">
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold">
                      A
                    </div>
                    <input
                      type="text"
                      placeholder="Leave a reply..."
                      className="flex-1 text-xs text-gray-700 bg-transparent outline-none placeholder:text-gray-400"
                    />
                    <Paperclip className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
                    <Send className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
                  </div>
                </div>
              ))}

              {/* New Comment Input Box */}
              <div className="bg-white border border-gray-200/90 rounded-xl p-3 shadow-xs flex items-center gap-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="Add a comment..."
                  className="flex-1 text-xs text-gray-700 bg-transparent outline-none placeholder:text-gray-400"
                />
                <Paperclip className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                <button
                  type="button"
                  onClick={handleAddComment}
                  className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Details Card & Updates Card */}
          <div className="lg:col-span-4 space-y-5">
            {/* Details Card */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-4">
              {/* Details Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-1 text-xs font-bold text-gray-900 dark:text-zinc-100">
                  {/* <ChevronDown className="w-4 h-4 text-gray-500" /> */}
                  Details
                </div>
                {/* <div className="flex items-center gap-1 text-gray-400">
                  <Plus className="w-4 h-4 cursor-pointer hover:text-gray-700" />
                  <MoreHorizontal className="w-4 h-4 cursor-pointer hover:text-gray-700" />
                </div> */}
              </div>

              {/* Row 1: Status */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-zinc-400 font-semibold">Status</span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setStatusOpen((prev) => !prev)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-750 rounded-lg text-xs font-medium border border-gray-200 dark:border-zinc-700 transition-colors cursor-pointer ${status === 'doing' || status === 'in-progress'
                      ? 'text-amber-600 dark:text-amber-400'
                      : status === 'completed' || status === 'done'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : status === 'on-hold'
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${status === 'doing' || status === 'in-progress'
                        ? 'bg-amber-500'
                        : status === 'completed' || status === 'done'
                          ? 'bg-emerald-500'
                          : status === 'on-hold'
                            ? 'bg-purple-500'
                            : 'bg-blue-500'
                        }`}
                    ></span>
                    <span className="capitalize">{status === 'on-hold' ? 'On Hold' : status}</span>
                  </button>

                  {statusOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setStatusOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-lg z-40 py-1 w-36 text-xs">
                        {(
                          [
                            { id: 'todo', label: 'To Do', dot: 'bg-blue-500' },
                            { id: 'doing', label: 'Doing', dot: 'bg-amber-500' },
                            { id: 'completed', label: 'Completed', dot: 'bg-emerald-500' },
                            { id: 'on-hold', label: 'On Hold', dot: 'bg-purple-500' },
                          ] as const
                        ).map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => {
                              setStatus(st.id as TaskStatus);
                              setStatusOpen(false);
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center justify-between text-gray-700 dark:text-zinc-300 font-medium cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${st.dot}`}></span>
                              <span>{st.label}</span>
                            </span>
                            {status === st.id && (
                              <Check className="w-3.5 h-3.5 text-gray-900 dark:text-white" />
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Row 2: Priority Popover Selector matching screenshot */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-zinc-400 font-semibold">Priority</span>
                <div className="relative">
                  <button
                    type="button"
                    disabled={isFieldDisabled}
                    onClick={() => {
                      if (isFieldDisabled) return;
                      setPriorityOpen((prev) => !prev);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 dark:bg-zinc-800 rounded-lg text-xs border border-gray-200 dark:border-zinc-700 transition-colors ${
                      isFieldDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-zinc-750 cursor-pointer'
                    }`}
                    title={isFieldDisabled ? 'Priority is locked' : undefined}
                  >
                    {renderPriorityBadge(priority)}
                    {!isFieldDisabled && <ChevronDown className="w-3 h-3 text-gray-400 dark:text-zinc-500" />}
                  </button>

                  {/* Priority Dropdown Popover */}
                  {priorityOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setPriorityOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl z-40 p-2 w-48 text-xs animate-in fade-in zoom-in-95 duration-100 space-y-1">
                        <div className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 px-2 py-1 uppercase tracking-wider">
                          Priority
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setPriority('no-priority');
                            setPriorityOpen(false);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center justify-between text-gray-700 dark:text-zinc-300 font-medium cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="text-gray-400 font-bold">.</span> No Priority
                          </span>
                          {(priority === 'no-priority' || priority === 'none') && (
                            <Check className="w-3.5 h-3.5 text-gray-800 dark:text-white" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPriority('urgent');
                            setPriorityOpen(false);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center justify-between font-medium cursor-pointer"
                        >
                          {renderPriorityBadge('urgent')}
                          {priority === 'urgent' && <Check className="w-3.5 h-3.5 text-gray-800 dark:text-white" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPriority('high');
                            setPriorityOpen(false);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center justify-between font-medium cursor-pointer"
                        >
                          {renderPriorityBadge('high')}
                          {priority === 'high' && <Check className="w-3.5 h-3.5 text-gray-800 dark:text-white" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPriority('medium');
                            setPriorityOpen(false);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center justify-between font-medium cursor-pointer"
                        >
                          {renderPriorityBadge('medium')}
                          {priority === 'medium' && <Check className="w-3.5 h-3.5 text-gray-800 dark:text-white" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPriority('low');
                            setPriorityOpen(false);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center justify-between font-medium cursor-pointer"
                        >
                          {renderPriorityBadge('low')}
                          {priority === 'low' && <Check className="w-3.5 h-3.5 text-gray-800 dark:text-white" />}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Row 3: Members */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-semibold">Members</span>
                <div className="relative">
                  <button
                    type="button"
                    disabled={isFieldDisabled}
                    onClick={() => {
                      if (isFieldDisabled) return;
                      setMembersOpen((prev) => !prev);
                      setMemberSearch('');
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg text-xs font-medium text-gray-800 dark:text-zinc-200 border border-gray-200 dark:border-zinc-700 transition-colors ${
                      isFieldDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 cursor-pointer'
                    }`}
                    title={isFieldDisabled ? 'Assignee is locked' : undefined}
                  >
                    <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold">
                      {assignee.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[100px] truncate">{formatMemberName(assignee)}</span>
                    {!isFieldDisabled && <ChevronDown className="w-3 h-3 text-gray-400" />}
                  </button>

                  {/* Members Dropdown Popover */}
                  {membersOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => {
                          setMembersOpen(false);
                          setMemberSearch('');
                        }}
                      />
                      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl z-40 p-2.5 w-72 text-xs animate-in fade-in zoom-in-95 duration-100 space-y-2">
                        <div className="text-[10px] font-semibold text-gray-400 dark:text-zinc-400 px-1 py-0.5 uppercase tracking-wider flex items-center justify-between">
                          <span>Project Members</span>
                          <span className="text-gray-300 dark:text-zinc-500 font-normal">
                            ({members.length})
                          </span>
                        </div>

                        {/* Search Members by Username or Name */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Search by name or @username..."
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg pl-8 pr-7 py-1.5 text-xs text-gray-800 dark:text-zinc-200 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-zinc-900 transition-all"
                            autoFocus
                          />
                          {memberSearch && (
                            <button
                              type="button"
                              onClick={() => setMemberSearch('')}
                              className="absolute right-2 top-2 p-0.5 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Member Items List */}
                        <div className="max-h-52 overflow-y-auto space-y-0.5 pr-0.5">
                          {members
                            .filter((m) => {
                              if (!memberSearch.trim()) return true;
                              const q = memberSearch.trim().toLowerCase().replace(/^@/, '');
                              return (
                                m.name.toLowerCase().includes(q) ||
                                (m.username && m.username.toLowerCase().includes(q)) ||
                                (m.role && m.role.toLowerCase().includes(q))
                              );
                            })
                            .map((mem) => {
                              const initial = mem.name.charAt(0).toUpperCase();
                              const color = mem.avatarColor || 'bg-indigo-600';
                              const isSelected = assignee === mem.name;
                              const handle = mem.username || mem.name.toLowerCase().replace(/\s+/g, '_');

                              return (
                                <button
                                  key={mem._id || mem.name}
                                  type="button"
                                  onClick={() => {
                                    setAssignee(mem.name);
                                    setMembersOpen(false);
                                    setMemberSearch('');
                                  }}
                                  className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between transition-colors cursor-pointer ${isSelected
                                    ? 'bg-gray-100 dark:bg-zinc-800 font-semibold'
                                    : 'hover:bg-gray-50 dark:hover:bg-zinc-800/60'
                                    }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div
                                      className={`w-5 h-5 rounded-full ${color} text-white flex items-center justify-center text-[9px] font-bold shrink-0`}
                                    >
                                      {initial}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-xs font-medium text-gray-800 dark:text-zinc-200 truncate flex items-center gap-1.5">
                                        <span>{formatMemberName(mem.name)}</span>
                                        {mem.role === 'You' && (
                                          <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1 rounded">
                                            You
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono truncate">
                                        @{handle}
                                        {mem.role && mem.role !== 'You' && (
                                          <span className="font-sans ml-1 text-gray-400">
                                            • {mem.role}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-gray-900 dark:text-white shrink-0 ml-1" />}
                                </button>
                              );
                            })}

                          {members.filter((m) => {
                            if (!memberSearch.trim()) return true;
                            const q = memberSearch.trim().toLowerCase().replace(/^@/, '');
                            return (
                              m.name.toLowerCase().includes(q) ||
                              (m.username && m.username.toLowerCase().includes(q)) ||
                              (m.role && m.role.toLowerCase().includes(q))
                            );
                          }).length === 0 && (
                              <div className="py-3 text-center text-xs text-gray-400 dark:text-zinc-500">
                                No members matching &ldquo;{memberSearch}&rdquo;
                              </div>
                            )}
                        </div>

                        {/* Add New Member Quick Toggle */}
                        <div className="border-t border-gray-100 dark:border-zinc-800 pt-1.5 mt-1">
                          {showAddMember ? (
                            <div className="p-2 bg-gray-50 dark:bg-zinc-800/80 rounded-xl space-y-2 border border-gray-100 dark:border-zinc-700">
                              <input
                                type="text"
                                placeholder="Full Name (e.g. Jane Doe)"
                                value={newMemberName}
                                onChange={(e) => setNewMemberName(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 dark:text-zinc-200 outline-none focus:border-black dark:focus:border-white"
                                autoFocus
                              />
                              <div className="relative">
                                <span className="absolute left-2.5 top-1.5 text-xs text-gray-400">@</span>
                                <input
                                  type="text"
                                  placeholder="janedoe"
                                  value={newMemberUsername}
                                  onChange={(e) =>
                                    setNewMemberUsername(
                                      e.target.value.toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '')
                                    )
                                  }
                                  className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg pl-6 pr-2.5 py-1.5 text-xs text-gray-800 dark:text-zinc-200 font-mono outline-none focus:border-black dark:focus:border-white"
                                />
                              </div>
                              <input
                                type="text"
                                placeholder="Role (e.g. Developer)"
                                value={newMemberRole}
                                onChange={(e) => setNewMemberRole(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 dark:text-zinc-200 outline-none focus:border-black dark:focus:border-white"
                              />
                              <div className="flex items-center gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={handleCreateMember}
                                  className="flex-1 py-1 bg-gray-900 hover:bg-black dark:bg-white dark:text-black text-white rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                                >
                                  Add Member
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowAddMember(false)}
                                  className="py-1 px-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 rounded-md text-[11px] font-medium hover:bg-gray-100 transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowAddMember(true)}
                              className="w-full py-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-semibold flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add new member</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Row 4: Dates - Matching Pill Selector [ 📅 Jan 10 ] -> [ 📅 End ] */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-semibold">Dates</span>
                <div className="flex items-center gap-1.5">
                  {/* Start Date Pill */}
                  <DatePillPicker
                    value={startDate}
                    onChange={setStartDate}
                    placeholder="Start"
                    max={dueDate || undefined}
                    disabled={isFieldDisabled}
                  />

                  {/* Arrow Divider */}
                  <span className="text-gray-400 text-xs font-semibold px-0.5">→</span>

                  {/* End Date Pill */}
                  <DatePillPicker
                    value={dueDate}
                    onChange={setDueDate}
                    placeholder="End"
                    min={startDate || undefined}
                    disabled={isFieldDisabled}
                  />
                </div>
              </div>

              {/* Row 5: Labels */}
              <div className="flex items-start justify-between text-xs">
                <span className="text-gray-500 dark:text-zinc-400 font-semibold pt-1">Labels</span>
                <div className="flex items-center gap-1 flex-wrap justify-end max-w-[200px]">
                  {tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-md text-[11px] font-medium transition-colors"
                    >
                      <span>{t}</span>
                      {!isFieldDisabled && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                          title={`Remove label ${t}`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </span>
                  ))}
                  {!isFieldDisabled && (
                    showTagInput ? (
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                        onBlur={handleAddTag}
                        placeholder="New label..."
                        className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-zinc-100 rounded px-2 py-0.5 text-[11px] outline-none w-20"
                        autoFocus
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowTagInput(true)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-semibold cursor-pointer flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Add label
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Row 6: Created by */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100 dark:border-zinc-800">
                <span className="text-gray-500 dark:text-zinc-400 font-semibold">Created by</span>
                <div className="flex items-center gap-1.5 font-medium text-gray-800 dark:text-zinc-200">
                  <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold shadow-2xs">
                    {(creatorName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span>{formatMemberName(creatorName)}</span>
                </div>
              </div>
            </div>

            {/* Updates Card matching screenshot */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-1 text-xs font-bold text-gray-900 dark:text-zinc-100 pb-2 border-b border-gray-100 dark:border-zinc-800">
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
                Updates
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2 text-gray-600 dark:text-zinc-400">
                  <span className="text-pink-500 font-bold shrink-0">📶</span>
                  <div>
                    <span className="font-bold text-gray-900 dark:text-zinc-100 mr-1">You</span>
                    <span className="text-gray-500 dark:text-zinc-400">
                      changed priority from No priority to Ur...
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-gray-600 dark:text-zinc-400">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                    A
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 dark:text-zinc-100 mr-1">You</span>
                    <span className="text-gray-500 dark:text-zinc-400">
                      posted an update · Aug 2026
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-2.5 bg-gray-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {isSaving
                  ? 'Saving Task...'
                  : isFieldDisabled
                  ? 'Update Status'
                  : taskId
                  ? 'Update Task'
                  : 'Create Task'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="w-full py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
