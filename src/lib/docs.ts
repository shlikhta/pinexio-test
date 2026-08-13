import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface DocMeta {
  title: string;
  description?: string;
  date?: string;
  /** Path relative to the docs dir, without extension, e.g. 'getting-started/introduction' */
  slug: string;
  /** Route path, e.g. '/docs/getting-started/introduction' */
  url: string;
  /** MDX body without frontmatter */
  raw: string;
}

const DOCS_DIR = path.join(process.cwd(), 'docs');

let cache: DocMeta[] | null = null;

export function getAllDocs(): DocMeta[] {
  if (cache) return cache;

  const entries = fs.readdirSync(DOCS_DIR, {
    withFileTypes: true,
    recursive: true,
  });

  const docs: DocMeta[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !/\.(mdx|md)$/.test(entry.name)) continue;

    const filePath = path.join(entry.parentPath, entry.name);
    const slug = path
      .relative(DOCS_DIR, filePath)
      .replace(/\.(mdx|md)$/, '')
      .split(path.sep)
      .join('/');

    const { data, content } = matter(fs.readFileSync(filePath, 'utf8'));

    docs.push({
      title: data.title ?? slug,
      description: data.description,
      date:
        data.date instanceof Date
          ? data.date.toISOString()
          : data.date != null
            ? String(data.date)
            : undefined,
      slug,
      url: `/docs/${slug}`,
      raw: content,
    });
  }

  docs.sort((a, b) => a.slug.localeCompare(b.slug));
  cache = docs;
  return docs;
}

export function getDocBySlug(slug: string): DocMeta | undefined {
  return getAllDocs().find((doc) => doc.slug === slug);
}
