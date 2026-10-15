'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Toast, { ToastMessage } from '@/components/Toast';

export default function ProfilePage() {
  const { user, logout, updateUser, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();


  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Editable Profile Form State
  const [fullName, setFullName] = useState(user?.name || 'Dexter');
  const [email, setEmail] = useState(user?.email || 'dexter@gmail.com');
  const [title, setTitle] = useState('Designer');
  const [username, setUsername] = useState('Dexuser');
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  // Sync state with logged in user or saved localStorage
  useEffect(() => {
    if (user?.name) setFullName(user.name);
    if (user?.email) setEmail(user.email);

    const savedExtra = localStorage.getItem('profile_extra');
    if (savedExtra) {
      try {
        const parsed = JSON.parse(savedExtra);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.username) setUsername(parsed.username);
      } catch {
        // ignore JSON parse error
      }
    }
  }, [user]);

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSaveProfile = () => {
    setIsSaving(true);
    // Update AuthContext user details
    updateUser({
      name: fullName.trim(),
      email: email.trim(),
    });

    // Save extra profile metadata to localStorage
    localStorage.setItem(
      'profile_extra',
      JSON.stringify({
        title: title.trim(),
        username: username.trim(),
      })
    );

    setIsSaving(false);
    addToast('success', 'Profile updated successfully!');
  };

  const handleLeaveWorkspace = () => {
    if (confirm('Are you sure you want to leave this workspace?')) {
      logout();
      router.push('/auth');
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const initial = (fullName || 'Dexter').charAt(0).toUpperCase();

  return (
    <div className="flex-1 p-4 sm:p-8 bg-[#FAFAFA] dark:bg-[#121215] text-gray-900 dark:text-gray-100 overflow-y-auto">
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50">
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </div>

      <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
            {/* Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Profile
              </h1>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="px-4 py-2 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"
              >
                <Check className="w-3.5 h-3.5" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* Profile Settings Card */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-8 shadow-xs space-y-5 sm:space-y-6">
              {/* Row 1: Profile picture */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-zinc-800">
                <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  Profile picture
                </span>
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center text-xs font-bold shadow-xs cursor-pointer hover:opacity-90 transition-opacity">
                  {initial}
                </div>
              </div>

              {/* Row 2: Email */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-gray-100 dark:border-zinc-800">
                <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Email</span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {isEditingEmail ? (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setIsEditingEmail(false);
                        }
                      }}
                      className="bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 text-xs px-3 py-1.5 rounded-lg outline-none border border-gray-300 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 flex-1 sm:w-64"
                      autoFocus
                    />
                  ) : (
                    <span className="text-xs text-gray-700 dark:text-zinc-300 font-medium truncate">{email}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditingEmail((prev) => !prev)}
                    className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors shrink-0"
                    title="Edit Email"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Row 3: Full name */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-gray-100 dark:border-zinc-800">
                <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  Full name
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-[#F3F4F6] dark:bg-zinc-800/80 text-gray-800 dark:text-zinc-200 text-xs px-4 py-2.5 rounded-xl w-full sm:w-64 outline-none border border-transparent dark:border-zinc-700/60 focus:border-gray-300 dark:focus:border-zinc-500 focus:bg-white dark:focus:bg-zinc-900 transition-all font-medium"
                />
              </div>

              {/* Row 4: Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-gray-100 dark:border-zinc-800">
                <div>
                  <div className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Title</div>
                  <div className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                    Your job title or role
                  </div>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-[#F3F4F6] dark:bg-zinc-800/80 text-gray-800 dark:text-zinc-200 text-xs px-4 py-2.5 rounded-xl w-full sm:w-64 outline-none border border-transparent dark:border-zinc-700/60 focus:border-gray-300 dark:focus:border-zinc-500 focus:bg-white dark:focus:bg-zinc-900 transition-all font-medium"
                />
              </div>

              {/* Row 5: Username */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2">
                <div>
                  <div className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                    Username
                  </div>
                  <div className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                    One word, like a nickname or first name
                  </div>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-[#F3F4F6] dark:bg-zinc-800/80 text-gray-800 dark:text-zinc-200 text-xs px-4 py-2.5 rounded-xl w-full sm:w-64 outline-none border border-transparent dark:border-zinc-700/60 focus:border-gray-300 dark:focus:border-zinc-500 focus:bg-white dark:focus:bg-zinc-900 transition-all font-medium"
                />
              </div>

              {/* Save Button Row */}
              <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </div>

            {/* Workspace Access Section */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Workspace access
              </h2>
              <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium">
                  Remove yourself from the workspace
                </span>
                <button
                  type="button"
                  onClick={handleLeaveWorkspace}
                  className="w-full sm:w-auto bg-[#FEE2E2] dark:bg-red-950/40 text-[#EF4444] dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-transparent dark:border-red-900/50"
                >
                  Leave Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
    );
  }
