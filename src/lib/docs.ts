import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface DocMeta {
  title: string;
  description: string;
  date?: string;
  /** Path relative to the docs dir, without extension, e.g. 'getting-started/introduction' */
  slug: string;
  /** Route path, e.g. '/docs/getting-started/introduction' */
  url: string;
  /** MDX body without frontmatter */
  raw: string;
}

const DOCS_DIR = path.join(process.cwd(), 'docs');

// Skip the cache in dev so editing/adding an .mdx file shows up on refresh
// without restarting the dev server. In production the module is loaded
// once per build, so caching there is free.
const isDev = process.env.NODE_ENV !== 'production';

let cache: DocMeta[] | null = null;

function parseDate(value: unknown): string | undefined {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? undefined : value.toISOString();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }
  return undefined;
}

export function getAllDocs(): DocMeta[] {
  if (cache && !isDev) return cache;

  const entries = fs.readdirSync(DOCS_DIR, {
    withFileTypes: true,
    recursive: true,
  });

  const problems: string[] = [];
  const docs: DocMeta[] = [];
  const filesBySlug = new Map<string, string[]>();

  for (const entry of entries) {
    if (!entry.isFile() || !/\.(mdx|md)$/.test(entry.name)) continue;

    const filePath = path.join(entry.parentPath, entry.name);
    const relativePath = path
      .relative(DOCS_DIR, filePath)
      .split(path.sep)
      .join('/');
    const slug = relativePath.replace(/\.(mdx|md)$/, '');

    const { data, content } = matter(fs.readFileSync(filePath, 'utf8'));

    const title = typeof data.title === 'string' ? data.title.trim() : '';
    const description =
      typeof data.description === 'string' ? data.description.trim() : '';

    if (!title) problems.push(`${relativePath}: missing frontmatter "title"`);
    if (!description)
      problems.push(`${relativePath}: missing frontmatter "description"`);
    if (!title || !description) continue;

    const paths = filesBySlug.get(slug) ?? [];
    paths.push(relativePath);
    filesBySlug.set(slug, paths);

    docs.push({
      title,
      description,
      date: parseDate(data.date),
      slug,
      url: `/docs/${slug}`,
      raw: content,
    });
  }

  for (const [slug, paths] of filesBySlug) {
    if (paths.length > 1) {
      problems.push(`Duplicate slug "${slug}": ${paths.join(', ')}`);
    }
  }

  if (problems.length > 0) {
    throw new Error(
      'Invalid docs:\n' + problems.map((p) => `- ${p}`).join('\n')
    );
  }

  docs.sort((a, b) => a.slug.localeCompare(b.slug));
  cache = docs;
  return docs;
}

export function getDocBySlug(slug: string): DocMeta | undefined {
  return getAllDocs().find((doc) => doc.slug === slug);
}
