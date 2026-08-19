import fs from 'fs';
import path from 'path';
import type { ComponentType, ReactElement } from 'react';
import * as Icons from 'lucide-react';
import { getAllDocs } from './docs';

export interface SidebarPage {
  title: string;
  href: string;
}

export interface SidebarSection {
  title: string;
  icon: ReactElement;
  pages: SidebarPage[];
}

interface FolderMeta {
  title?: string;
  icon?: string;
  order?: number;
}

const DOCS_DIR = path.join(process.cwd(), 'docs');
const DEFAULT_ICON_NAME = 'Component';

// Same dev-bypass pattern as docs.ts: rebuild on every request in dev so
// new folders/_meta.json edits show up without a restart; cache for the
// life of the server process in production.
const isDev = process.env.NODE_ENV !== 'production';

let cache: SidebarSection[] | null = null;

function titleCase(folder: string): string {
  return folder
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getIconComponent(
  name: string
): ComponentType<{ className?: string }> | undefined {
  return (Icons as Record<string, unknown>)[name] as
    | ComponentType<{ className?: string }>
    | undefined;
}

function readFolderMeta(folder: string, problems: string[]): FolderMeta | null {
  const metaPath = path.join(DOCS_DIR, folder, '_meta.json');
  if (!fs.existsSync(metaPath)) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  } catch {
    problems.push(`docs/${folder}/_meta.json: invalid JSON`);
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) {
    problems.push(`docs/${folder}/_meta.json: must be a JSON object`);
    return null;
  }

  const meta = parsed as FolderMeta;

  if (meta.order === undefined) {
    problems.push(`docs/${folder}/_meta.json: missing required "order"`);
  } else if (typeof meta.order !== 'number') {
    problems.push(`docs/${folder}/_meta.json: "order" must be a number`);
  }
  if (meta.title !== undefined && typeof meta.title !== 'string') {
    problems.push(`docs/${folder}/_meta.json: "title" must be a string`);
  }
  if (meta.icon !== undefined && !getIconComponent(meta.icon)) {
    problems.push(
      `docs/${folder}/_meta.json: unknown icon "${meta.icon}" (not exported by lucide-react)`
    );
  }

  return meta;
}

export function getSidebarNav(): SidebarSection[] {
  if (cache && !isDev) return cache;

  const problems: string[] = [];
  const pagesByFolder = new Map<string, SidebarPage[]>();

  for (const doc of getAllDocs()) {
    const slashIndex = doc.slug.indexOf('/');
    if (slashIndex === -1) {
      problems.push(
        `docs/${doc.slug}.md(x): content files must live inside a category folder (e.g. docs/general/${doc.slug}.mdx), not directly in docs/`
      );
      continue;
    }

    const folder = doc.slug.slice(0, slashIndex);
    const pages = pagesByFolder.get(folder) ?? [];
    pages.push({ title: doc.title, href: doc.url });
    pagesByFolder.set(folder, pages);
  }

  const sections: (SidebarSection & { order: number | null })[] = [];

  for (const [folder, pages] of pagesByFolder) {
    const meta = readFolderMeta(folder, problems);
    pages.sort((a, b) => a.title.localeCompare(b.title));

    const IconComponent =
      (meta?.icon && getIconComponent(meta.icon)) ??
      getIconComponent(DEFAULT_ICON_NAME);
    if (!IconComponent) {
      // Unreachable unless DEFAULT_ICON_NAME itself is wrong — fail loudly
      // rather than silently rendering no icon.
      problems.push(
        `Internal error: default icon "${DEFAULT_ICON_NAME}" not found in lucide-react`
      );
      continue;
    }

    sections.push({
      title: meta?.title ?? titleCase(folder),
      icon: <IconComponent className="h-5 w-5" />,
      pages,
      order: meta?.order ?? null,
    });
  }

  if (problems.length > 0) {
    throw new Error(
      'Invalid docs navigation:\n' + problems.map((p) => `- ${p}`).join('\n')
    );
  }

  sections.sort((a, b) => {
    if (a.order !== null && b.order !== null) return a.order - b.order;
    if (a.order !== null) return -1;
    if (b.order !== null) return 1;
    return a.title.localeCompare(b.title);
  });

  const result = sections.map((section) => ({
    title: section.title,
    icon: section.icon,
    pages: section.pages,
  }));
  cache = result;
  return result;
}
