'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import request from '@/utils/request';

// Hard-coded fallback used if the API is unreachable on first paint — keeps
// dropdowns functional during dev (e.g. backend hasn't restarted after the
// taxonomy migration) and matches the values seeded by prisma seed.
const FALLBACK = {
  subjects: [
    { subject_id: -1, name: 'Matematika', color: 'blue', sort_order: 0, is_active: true },
    { subject_id: -2, name: 'Bahasa Indonesia', color: 'green', sort_order: 1, is_active: true },
    { subject_id: -3, name: 'Bahasa Inggris', color: 'pink', sort_order: 2, is_active: true },
    { subject_id: -4, name: 'Fisika', color: 'sky', sort_order: 3, is_active: true },
    { subject_id: -5, name: 'Kimia', color: 'fuchsia', sort_order: 4, is_active: true },
    { subject_id: -6, name: 'Biologi', color: 'emerald', sort_order: 5, is_active: true },
  ],
  grade_levels: [
    { grade_level_id: -1, value: 'X', label: 'Kelas 10', sort_order: 0, is_active: true },
    { grade_level_id: -2, value: 'XI', label: 'Kelas 11', sort_order: 1, is_active: true },
    { grade_level_id: -3, value: 'XII', label: 'Kelas 12', sort_order: 2, is_active: true },
  ],
  majors: [
    { major_id: -1, value: 'IPA', label: 'IPA', sort_order: 0, is_active: true },
    { major_id: -2, value: 'IPS', label: 'IPS', sort_order: 1, is_active: true },
    { major_id: -3, value: 'Bahasa', label: 'Bahasa', sort_order: 2, is_active: true },
  ],
};

const TaxonomyContext = createContext(null);

export function TaxonomyProvider({ children }) {
  const [data, setData] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Two-mode fetch: by default callers want active-only (dropdowns); the
  // admin master-data page passes includeInactive: true.
  const fetchTaxonomy = useCallback(async ({ includeInactive = false } = {}) => {
    try {
      const res = await request.get('/taxonomy', {
        params: includeInactive ? { include_inactive: 'true' } : undefined,
      });
      const next = {
        subjects: res.data?.subjects || [],
        grade_levels: res.data?.grade_levels || [],
        majors: res.data?.majors || [],
      };
      setData(next);
      setError(null);
      return next;
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Gagal memuat taksonomi');
      // Keep whatever we had (fallback or last good data)
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTaxonomy();
  }, [fetchTaxonomy]);

  const refresh = useCallback((opts) => fetchTaxonomy(opts), [fetchTaxonomy]);

  return (
    <TaxonomyContext.Provider
      value={{
        subjects: data.subjects,
        gradeLevels: data.grade_levels,
        majors: data.majors,
        loading,
        error,
        refresh,
      }}
    >
      {children}
    </TaxonomyContext.Provider>
  );
}

export function useTaxonomy() {
  const ctx = useContext(TaxonomyContext);
  if (!ctx) throw new Error('useTaxonomy must be used within a TaxonomyProvider');
  return ctx;
}
