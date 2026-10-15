'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Responsive sidebar handling
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

  // Auth protection for all workspace routes
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAFAFA] dark:bg-[#121215]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FAFAFA] dark:bg-[#121215] text-gray-900 dark:text-gray-100 font-sans overflow-hidden transition-colors">
      {/* Persistent Sidebar (stays mounted across all page navigations) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Container with Persistent Header Bar */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen((prev) => !prev)} />
        <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
