'use client';

/**
 * useSubjectThemes - return a `themeFor(name)` lookup for use inside a list
 * render. Resolution order per call:
 *
 *   1. Subject row in TaxonomyContext carries a HEX `color` - preferred now
 *      that the master-data picker writes HEX. Renders via inline style.
 *   2. Legacy hardcoded `SUBJECT_THEMES` map keyed by subject name - kept so
 *      decks seeded before the migration still render with the Tailwind
 *      class palette.
 *   3. Default neutral theme.
 *
 * Why the function-returning shape: hooks can't be called inside a `.map`,
 * so the page calls the hook once at top level and then invokes `themeFor`
 * per item.
 */
import { useCallback, useMemo } from 'react';
import { useTaxonomy } from '@/contexts/TaxonomyContext';
import { getSubjectTheme as legacySubjectTheme } from '@/lib/constants';

const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

const mix = (hex, target, ratio) => {
  const [r, g, b] = hexToRgb(hex);
  const tr = (target >> 16) & 0xff;
  const tg = (target >> 8) & 0xff;
  const tb = target & 0xff;
  const m = (a, c) => Math.round(a + (c - a) * ratio);
  return `#${[m(r, tr), m(g, tg), m(b, tb)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
};

const themeFromHex = (hex) => {
  // We can't generate Tailwind classes from a runtime HEX, so callers that
  // need a className get an empty string and should use the `style` payload
  // instead. The shape matches the legacy theme for drop-in compatibility.
  const style = {
    badge: { backgroundColor: mix(hex, 0xffffff, 0.85), color: mix(hex, 0x000000, 0.4) },
    header: { backgroundColor: mix(hex, 0x000000, 0.15) },
    border: { borderColor: mix(hex, 0xffffff, 0.65) },
    button: { backgroundColor: mix(hex, 0xffffff, 0.85), color: mix(hex, 0x000000, 0.5) },
  };
  return { badge: '', header: '', border: '', button: '', hex, style };
};

export function useSubjectThemes() {
  const { subjects } = useTaxonomy();

  // Build a fast name -> hex map once per change.
  const colorMap = useMemo(() => {
    const map = new Map();
    for (const s of subjects || []) {
      if (s?.name && typeof s.color === 'string' && s.color.startsWith('#')) {
        map.set(s.name, s.color);
      }
    }
    return map;
  }, [subjects]);

  const themeFor = useCallback((subjectName) => {
    if (!subjectName) return { ...legacySubjectTheme(''), style: null };
    const hex = colorMap.get(subjectName);
    if (hex) return themeFromHex(hex);
    return { ...legacySubjectTheme(subjectName), style: null };
  }, [colorMap]);

  return { themeFor };
}

// Convenience single-subject hook for components that only render one subject.
export function useSubjectTheme(subjectName) {
  const { themeFor } = useSubjectThemes();
  return themeFor(subjectName);
}
