'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TaskFormContent from '@/components/TaskFormContent';
import { TaskStatus } from '@/services/tasks.service';

function NewTaskContent() {
  const searchParams = useSearchParams();
  const rawStatus = searchParams?.get('status') as TaskStatus | null;
  const validStatuses: TaskStatus[] = ['todo', 'doing', 'in-progress', 'completed', 'done', 'on-hold'];
  const defaultStatus = rawStatus && validStatuses.includes(rawStatus) ? rawStatus : 'todo';

  return <TaskFormContent defaultStatus={defaultStatus} />;
}

export default function NewTaskPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400 text-xs">Loading...</div>}>
      <NewTaskContent />
    </Suspense>
  );
}
