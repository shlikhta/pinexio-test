import MiniSearch from 'minisearch';
import { getAllDocs } from './docs';
import { searchIndexOptions, stripMdx, type SearchDoc } from './search-config';

// Same dev-bypass pattern as docs.ts: rebuild on every request in dev so
// content changes show up without a restart; cache for the life of the
// server process in production.
const isDev = process.env.NODE_ENV !== 'production';

let cachedIndexJSON: string | null = null;

export function getSearchIndexJSON(): string {
  if (cachedIndexJSON && !isDev) return cachedIndexJSON;

  const docs: SearchDoc[] = getAllDocs().map((doc) => ({
    slug: doc.slug,
    title: doc.title,
    description: doc.description ?? '',
    text: stripMdx(doc.raw),
  }));

  const miniSearch = new MiniSearch<SearchDoc>(searchIndexOptions);
  miniSearch.addAll(docs);

  cachedIndexJSON = JSON.stringify(miniSearch);
  return cachedIndexJSON;
}
