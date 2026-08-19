'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlignLeft } from 'lucide-react';
import type { TocItem } from '@/lib/toc';

interface TocProps {
  items: TocItem[];
}

function flattenIds(items: TocItem[]): string[] {
  return items.flatMap((item) => [
    item.id,
    ...(item.pages?.map((page) => page.id) ?? []),
  ]);
}

function getScrollParent(el: HTMLElement): Element {
  let parent = el.parentElement;
  while (parent) {
    // Multiple ancestors can carry an `overflow-auto` class without all
    // of them actually overflowing — only count one that genuinely does.
    if (
      /(auto|scroll)/.test(getComputedStyle(parent).overflowY) &&
      parent.scrollHeight > parent.clientHeight
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return document.scrollingElement ?? document.documentElement;
}

const Toc: React.FC<TocProps> = ({ items }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const ids = flattenIds(items);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    // "Active" = the last heading (in document order) whose top has
    // scrolled above this line. Recomputed directly from live geometry
    // rather than from IntersectionObserver's isIntersecting flag, since
    // a short heading can otherwise skip past a narrow intersection band
    // entirely on a single scroll jump. Falls back to the first heading
    // so something is always highlighted, even before any scrolling.
    const HEADER_OFFSET = 100;
    const scrollParent = getScrollParent(elements[elements.length - 1]);

    const updateActive = () => {
      let current = elements[0].id;
      for (const el of elements) {
        if (el.getBoundingClientRect().top <= HEADER_OFFSET) {
          current = el.id;
        } else {
          break;
        }
      }

      // A short trailing section may never scroll past HEADER_OFFSET
      // before the page runs out of room — once scrolled to the bottom,
      // force the last heading active instead of getting stuck on an
      // earlier one.
      const atBottom =
        scrollParent.scrollTop + scrollParent.clientHeight >=
        scrollParent.scrollHeight - 2;
      if (atBottom) current = elements[elements.length - 1].id;

      setActiveId(current);
    };

    updateActive();

    // IntersectionObserver is just the efficient trigger for "something
    // near the top of the viewport changed" — it fires whenever a
    // heading's top crosses HEADER_OFFSET, regardless of which ancestor
    // element is actually scrolling (works through nested overflow
    // containers, unlike a plain window scroll listener).
    const observer = new IntersectionObserver(updateActive, {
      rootMargin: `-${HEADER_OFFSET}px 0px 0px 0px`,
    });
    elements.forEach((el) => observer.observe(el));

    // Also listen directly for the "reached bottom" case: the last
    // heading(s) may never cross HEADER_OFFSET at all (nothing left to
    // scroll below them), so the observer alone would never re-fire.
    scrollParent.addEventListener('scroll', updateActive, { passive: true });

    return () => {
      observer.disconnect();
      scrollParent.removeEventListener('scroll', updateActive);
    };
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
