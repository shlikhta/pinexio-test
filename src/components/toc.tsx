'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlignLeft } from 'lucide-react';
import type { TocItem } from '@/lib/toc';

interface TocProps {
  items: TocItem[];
}

const Toc: React.FC<TocProps> = ({ items }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Reading window.location.hash during the render itself would mismatch
  // the server-rendered HTML (which has no window) and React does not
  // patch that mismatch up — so the hash is read post-hydration instead,
  // correcting a deep link (e.g. /docs/x#heading) to its matching item
  // right after the initial paint.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from a browser-only API (URL hash) that cannot be read during SSR/hydration
    if (hash) setActiveId(hash);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <aside className="fixed right-0 hidden xl:block w-64 p-6 top-16 border-l border-[var(--color-border)] h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="top-0 pb-2">
        <h2 className="flex flex-1 gap-2 item-center font-semibold text-[var(--color)]">
          <AlignLeft size={19} />
          On this page
        </h2>
      </div>
      <nav className="mt-4">
        <ul className="space-y-3">
          {items.map((item) => {
            const isActive = activeId === item.id;

            return (
              <li key={item.id} className="group">
                <Link
                  href={`#${item.id}`}
                  onClick={() => setActiveId(item.id)}
                  className={`transition-colors flex items-center ${
                    isActive
                      ? 'text-primary font-bold'
                      : 'text-gray-700 dark:text-gray-200 font-normal'
                  }`}
                >
                  {item.title}
                </Link>

                {item.pages && item.pages.length > 0 && (
                  <ul className="mt-2 ml-4 space-y-2 border-l-2 border-gray-300 pl-3">
                    {item.pages.map((subItem) => {
                      const isSubActive = activeId === subItem.id;

                      return (
                        <li key={subItem.id} className="text-sm">
                          <Link
                            href={`#${subItem.id}`}
                            onClick={() => setActiveId(subItem.id)}
                            className={`transition-colors block py-1 ${
                              isSubActive
                                ? 'text-primary font-bold'
                                : 'text-gray-600 dark:text-gray-200 font-regular'
                            }`}
                          >
                            {subItem.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Toc;
