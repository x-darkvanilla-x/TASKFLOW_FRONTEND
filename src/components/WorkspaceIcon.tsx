'use client';

import React from 'react';
import {
  Building2,
  Briefcase,
  FolderKanban,
  Rocket,
  Zap,
  Laptop,
  Palette,
  Globe,
  Boxes,
  LucideIcon,
} from 'lucide-react';

export const WORKSPACE_ICON_MAP: Record<string, LucideIcon> = {
  building: Building2,
  briefcase: Briefcase,
  folder: FolderKanban,
  rocket: Rocket,
  zap: Zap,
  laptop: Laptop,
  palette: Palette,
  globe: Globe,
  boxes: Boxes,
};

export const AVAILABLE_WORKSPACE_ICONS = [
  { key: 'building', label: 'Company', Icon: Building2 },
  { key: 'briefcase', label: 'Work', Icon: Briefcase },
  { key: 'folder', label: 'Projects', Icon: FolderKanban },
  { key: 'rocket', label: 'Launch', Icon: Rocket },
  { key: 'zap', label: 'Sprint', Icon: Zap },
  { key: 'laptop', label: 'Engineering', Icon: Laptop },
  { key: 'palette', label: 'Design', Icon: Palette },
  { key: 'globe', label: 'Global', Icon: Globe },
  { key: 'boxes', label: 'Operations', Icon: Boxes },
];

interface WorkspaceIconProps {
  name?: string;
  className?: string;
}

export default function WorkspaceIcon({ name = 'building', className = 'w-4 h-4' }: WorkspaceIconProps) {
  const IconComponent = WORKSPACE_ICON_MAP[name] || Building2;
  return <IconComponent className={className} />;
}
