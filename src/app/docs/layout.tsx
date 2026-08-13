import React from 'react';
import { getAllDocs } from '@/lib/docs';
import DocsShell from './docs-shell';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchData = getAllDocs().map(({ title, slug, raw }) => ({
    title,
    slug,
    raw,
  }));

  return <DocsShell searchData={searchData}>{children}</DocsShell>;
}
