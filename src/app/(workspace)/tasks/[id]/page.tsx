'use client';

import { use } from 'react';
import TaskFormContent from '@/components/TaskFormContent';

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = use(params);
  return <TaskFormContent taskId={id} />;
}
