'use client';

/**
 * useListPage - boilerplate-free state for any "search + filter + sort + list"
 * page. List pages were each reimplementing:
 *   - a query input
 *   - 2-4 selects that compare item fields against 'all'
 *   - a sort dropdown driven by a comparator map
 *   - an "active filter count" + reset
 *   - a `useMemo` that does search/filter/sort in one pass
 *
 * Usage:
 *   const list = useListPage(data, {
 *     searchFields: ['exam_name', 'subject'],
 *     filters: {
 *       grade: { field: 'grade_level' },
 *       major: { field: 'major' },
 *     },
 *     sortBy: {
 *       terbaru: (a, b) => new Date(b.start_date) - new Date(a.start_date),
 *       'nama-asc': (a, b) => a.exam_name.localeCompare(b.exam_name),
 *     },
 *     defaultSort: 'terbaru',
 *   });
 *
 * Then:
 *   list.items                       // filtered + sorted result
 *   list.query / list.setQuery
 *   list.filters[k] / list.setFilter(k, v)
 *   list.sort / list.setSort
 *   list.activeCount / list.reset()
 *
 * Existing pages stay in control of which UI to render - the hook only
 * tracks state and runs the standard filter/sort pipeline.
 */
import { useCallback, useMemo, useState } from 'react';

const ALL = 'all';

export default function useListPage(data, options = {}) {
  const {
    searchFields = [],
    filters: filterDefs = {},
    sortBy = {},
    defaultSort = '',
  } = options;

  const filterKeys = Object.keys(filterDefs);
  const initialFilters = useMemo(
    () => Object.fromEntries(filterKeys.map((k) => [k, ALL])),
    // The list of filter keys is the only thing that affects this - and it
    // never changes within a mounted page in practice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterKeys.join('|')],
  );

  const [query, setQuery] = useState('');
  const [filterState, setFilterState] = useState(initialFilters);
  const [sort, setSort] = useState(defaultSort);

  const setFilter = useCallback((key, value) => {
    setFilterState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setQuery('');
    setFilterState(initialFilters);
    setSort(defaultSort);
  }, [initialFilters, defaultSort]);

  const activeCount = useMemo(() => {
    let n = 0;
    if (query.trim()) n++;
    for (const k of filterKeys) if (filterState[k] !== ALL) n++;
    return n;
  }, [query, filterState, filterKeys]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = data || [];

    if (q && searchFields.length) {
      out = out.filter((item) =>
        searchFields.some((f) => String(item?.[f] ?? '').toLowerCase().includes(q)),
      );
    }

    for (const key of filterKeys) {
      const value = filterState[key];
      if (value === ALL) continue;
      const { field, match } = filterDefs[key];
      if (match) {
        out = out.filter((item) => match(item, value));
      } else if (field) {
        out = out.filter((item) => item?.[field] === value);
      }
    }

    const cmp = sortBy[sort];
    if (cmp) out = [...out].sort(cmp);
    return out;
  }, [data, query, filterState, filterKeys, filterDefs, sort, sortBy, searchFields]);

  return {
    items,
    query,
    setQuery,
    filters: filterState,
    setFilter,
    sort,
    setSort,
    activeCount,
    reset,
  };
}
