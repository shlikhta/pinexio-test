import React from 'react';
import { getSidebarNav } from '@/lib/sidebar';
import DocsShell from './docs-shell';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sections = getSidebarNav();

  return <DocsShell sections={sections}>{children}</DocsShell>;
}
