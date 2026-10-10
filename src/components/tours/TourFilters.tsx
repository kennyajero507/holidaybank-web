'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useState } from 'react';

const SORTS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'duration-asc', label: 'Shortest first' },
  { value: 'newest', label: 'Newest' },
] as const;

/**
 * Search, the match count and sort. Category, area and destination filters
 * arrive in the URL from the menu and other pages; "Clear filters" drops them.
 */
export function TourFilters({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');

  const setParams = useCallback(
    (changes: Record<string, string>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      next.delete('page'); // any filter change returns to the first page
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router]
  );

  const sort = params.get('sort') ?? 'recommended';
  const hasFilters = Boolean(params.get('category') || params.get('country') || params.get('q') || params.get('area') || params.get('destination'));

  return (
    <div className="mb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setParams({ q: q.trim() });
          }}
          className="flex min-w-[240px] flex-1 items-center gap-2 rounded-full border border-cream-300 bg-white px-4 py-2 sm:max-w-sm"
        >
          <label htmlFor="tour-search" className="sr-only">
            Search packages
          </label>
          <input
            id="tour-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search: Mara, Paris, gorillas…"
            className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
          />
          <button type="submit" className="text-xs font-medium text-leaf-700 hover:text-leaf-500">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-4">
          <p className="text-sm text-muted" aria-live="polite">
            {total} {total === 1 ? 'package' : 'packages'}
            {hasFilters ? ' match' : ''}
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={() => {
                setQ('');
                router.push(pathname, { scroll: false });
              }}
              className="text-sm text-muted underline transition-colors hover:text-charcoal-900"
            >
              Clear filters
            </button>
          ) : null}
          <label className="flex items-center gap-2 text-sm text-muted">
            <span className="sr-only sm:not-sr-only">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setParams({ sort: e.target.value })}
              className="rounded-full border border-cream-300 bg-white px-4 py-2 text-sm text-charcoal-900 focus:border-gold-500 focus:outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
