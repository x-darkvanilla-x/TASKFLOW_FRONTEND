'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  LayoutGrid,
} from 'lucide-react';

export default function ProjectsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAFA] dark:bg-[#121215] text-gray-900 dark:text-gray-100 p-4 sm:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] transition-colors duration-200">
      <div className="w-full max-w-2xl mx-auto text-center space-y-8 py-10">
        {/* Headings */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Nothing to see here... yet!
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">
            The <span className="font-semibold text-gray-900 dark:text-white">Projects</span> feature is actively being developed. Soon you&apos;ll be able to organize tasks into multi-phase projects, set milestones, and track workspace roadmaps with ease.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 font-semibold text-xs transition-all shadow-sm"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Go to Tasks Board</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        </div>

        {/* Bottom subtle note */}
        <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1.5 pt-4">
          <Clock className="w-3.5 h-3.5" />
          <span>Expected release in an upcoming update</span>
        </p>
      </div>
    </div>
  );
}
