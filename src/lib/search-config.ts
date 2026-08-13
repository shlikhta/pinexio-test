import type { Options, SearchOptions } from 'minisearch';

/**
 * Shared between the server (builds the index) and the client (loads and
 * queries it) — must contain no Node-only imports (fs, path, etc.) since
 * it's bundled into the browser.
 */
export interface SearchDoc {
  slug: string;
  title: string;
  description: string;
  /** MDX body with markup stripped, used only for matching (not displayed). */
  text: string;
}

export const searchIndexOptions: Options<SearchDoc> = {
  idField: 'slug',
  fields: ['title', 'text'],
  storeFields: ['title', 'slug', 'description'],
};

export const searchOptions: SearchOptions = {
  prefix: true,
  fuzzy: 0.2,
  boost: { title: 2 },
};

export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Light MDX/Markdown stripping to keep noise out of the search index. */
export function stripMdx(source: string): string {
  return source
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_>~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
