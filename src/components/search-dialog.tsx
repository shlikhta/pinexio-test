'use client';

import React, {
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from 'react';
import MiniSearch, { type SearchResult } from 'minisearch';
import { Dialog, DialogTrigger, DialogContent } from '@/components/dialog';
import { Input } from '@/components/input';
import SearchButton from '@/components/search-button';
import { Text, Search } from 'lucide-react';
import Link from 'next/link';
import {
  searchIndexOptions,
  searchOptions,
  escapeRegExp,
  type SearchDoc,
} from '@/lib/search-config';

export interface SearchDialogHandle {
  close: () => void;
  open: () => void;
}

type SearchHit = SearchResult & SearchDoc;

const MAX_RESULTS = 20;
const DEBOUNCE_MS = 200;

function highlightText(text: string, searchTerm: string): React.ReactNode {
  if (!searchTerm) return text;
  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="bg-yellow-300 dark:text-black rounded-sm">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

const SearchDialog = forwardRef<SearchDialogHandle>((_props, ref) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [indexStatus, setIndexStatus] = useState<
    'idle' | 'loading' | 'ready' | 'error'
  >('idle');
  const [miniSearch, setMiniSearch] = useState<MiniSearch<SearchDoc> | null>(
    null
  );

  useImperativeHandle(ref, () => ({
    close: () => setOpen(false),
    open: () => setOpen(true),
  }));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch + build the search index lazily on first open, so docs pages
  // don't ship the whole corpus on every load — only when search is used.
  useEffect(() => {
    if (!open || miniSearch || indexStatus === 'loading') return;
    setIndexStatus('loading');
    fetch('/api/search-index')
      .then((res) => {
        if (!res.ok)
          throw new Error(`Failed to load search index: ${res.status}`);
        return res.text();
      })
      .then((json) => {
        setMiniSearch(MiniSearch.loadJSON<SearchDoc>(json, searchIndexOptions));
        setIndexStatus('ready');
      })
      .catch(() => setIndexStatus('error'));
  }, [open, indexStatus, miniSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const filteredDocs = useMemo<SearchHit[]>(() => {
    if (!debouncedQuery || !miniSearch) return [];
    return miniSearch
      .search(debouncedQuery, searchOptions)
      .slice(0, MAX_RESULTS) as SearchHit[];
  }, [debouncedQuery, miniSearch]);

  return (
    <Dialog open={open} setOpen={setOpen}>
      <DialogTrigger className="hidden sm:block">
        <SearchButton size="sm" placeholder="Search documentation.." />
      </DialogTrigger>
      <DialogContent className="fixed h-auto sm:max-w-xl bg-muted p-2 top-40">
        <div className="relative">
          <Input
            type="text"
            className="w-full bg-transparent focus:outline-none rounded-none border-t-0 border-x-0 border-border pl-10 pr-4 py-2"
            placeholder="Search the docs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search />
          </div>
        </div>
        <div className="mt-2 max-h-[300px] overflow-y-auto">
          {indexStatus === 'loading' ? (
            <p className="text-sm text-center py-4">Завантаження пошуку…</p>
          ) : indexStatus === 'error' ? (
            <p className="text-sm text-center py-4">
              Не вдалося завантажити пошук. Спробуйте ще раз.
            </p>
          ) : filteredDocs.length > 0 ? (
            <ul className="list-none p-0">
              {filteredDocs.map((doc) => (
                <li
                  key={doc.slug}
                  className="gap-2 py-2 border-b border-border"
                >
                  <Link
                    href={`/docs/${doc.slug}`}
                    onClick={() => setOpen(false)}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2 font-bold">
                        <Text /> <div>{highlightText(doc.title, query)}</div>
                      </div>
                      <div className="text-sm">
                        {highlightText(
                          doc.description || 'No description',
                          query
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-center">
              {query.length > 0 ? 'No results found.' : 'Type to search'}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});

SearchDialog.displayName = 'SearchDialog';

export default SearchDialog;
