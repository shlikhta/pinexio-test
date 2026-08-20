import React from 'react';
import { getSidebarNav } from '@/lib/sidebar';
import DocsShell from './docs-shell';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { rootPages, sections } = getSidebarNav();

  return (
    <DocsShell rootPages={rootPages} sections={sections}>
      {children}
    </DocsShell>
  );
}
