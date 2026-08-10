'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Toast, { ToastMessage } from '@/components/Toast';

export default function ProfilePage() {
  const { user, logout, updateUser, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

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
    <div className="flex h-screen bg-[#F9FAFB] text-gray-900 font-sans overflow-hidden">
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50">
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </div>

      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-auto">
        {/* Top Navigation Header Bar */}
        <Header onMenuClick={() => setSidebarOpen((o) => !o)} />

        {/* Profile Content Container */}
        <div className="flex-1 p-4 sm:p-8 bg-[#FAFAFA]">
          <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
            {/* Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Profile
              </h1>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"
              >
                <Check className="w-3.5 h-3.5" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* Profile Settings Card */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 sm:p-8 shadow-xs space-y-5 sm:space-y-6">
              {/* Row 1: Profile picture */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-700">
                  Profile picture
                </span>
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center text-xs font-bold shadow-xs cursor-pointer hover:opacity-90 transition-opacity">
                  {initial}
                </div>
              </div>

              {/* Row 2: Email */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-700">Email</span>
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
                      className="bg-gray-100 text-gray-800 text-xs px-3 py-1.5 rounded-lg outline-none border border-gray-300 focus:bg-white flex-1 sm:w-64"
                      autoFocus
                    />
                  ) : (
                    <span className="text-xs text-gray-700 font-medium truncate">{email}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditingEmail((prev) => !prev)}
                    className="p-1 text-gray-400 hover:text-gray-700 transition-colors shrink-0"
                    title="Edit Email"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Row 3: Full name */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-700">
                  Full name
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-[#F3F4F6] text-gray-800 text-xs px-4 py-2.5 rounded-xl w-full sm:w-64 outline-none border border-transparent focus:border-gray-300 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Row 4: Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-gray-100">
                <div>
                  <div className="text-xs font-semibold text-gray-700">Title</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    Your job title or role
                  </div>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-[#F3F4F6] text-gray-800 text-xs px-4 py-2.5 rounded-xl w-full sm:w-64 outline-none border border-transparent focus:border-gray-300 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Row 5: Username */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2">
                <div>
                  <div className="text-xs font-semibold text-gray-700">
                    Username
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    One word, like a nickname or first name
                  </div>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-[#F3F4F6] text-gray-800 text-xs px-4 py-2.5 rounded-xl w-full sm:w-64 outline-none border border-transparent focus:border-gray-300 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Save Button Row */}
              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </div>

            {/* Workspace Access Section */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Workspace access
              </h2>
              <div className="bg-white border border-gray-200/80 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs text-gray-400 font-medium">
                  Remove yourself from the workspace
                </span>
                <button
                  type="button"
                  onClick={handleLeaveWorkspace}
                  className="w-full sm:w-auto bg-[#FEE2E2] text-[#EF4444] hover:bg-red-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Leave Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
