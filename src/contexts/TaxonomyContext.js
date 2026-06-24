'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import request from '@/utils/request';

// Taksonomi adalah satu-satunya sumber kebenaran (di-fetch dari backend). Tidak
// ada fallback hardcoded supaya tidak ada sumber data ganda: jika backend tidak
// terjangkau, dropdown kosong (jujur) daripada menampilkan data palsu.
const FALLBACK = { subjects: [], grade_levels: [], majors: [] };

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
