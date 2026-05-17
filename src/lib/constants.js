/**
 * Shared constants used across the application.
 * Centralizes duplicated values like subject lists, grade levels, and majors.
 */

export const SUBJECT_OPTIONS = [
  'Matematika',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Fisika',
  'Kimia',
  'Biologi',
  'Sejarah',
  'Geografi',
  'Ekonomi',
  'Sosiologi',
  'PKN',
  'Seni Budaya',
  'Penjaskes',
  'TIK',
];

export const GRADE_LEVELS = [
  { value: 'X', label: 'Kelas 10' },
  { value: 'XI', label: 'Kelas 11' },
  { value: 'XII', label: 'Kelas 12' },
];

export const MAJOR_OPTIONS = [
  { value: 'IPA', label: 'IPA' },
  { value: 'IPS', label: 'IPS' },
  { value: 'Bahasa', label: 'Bahasa' },
];

const DEFAULT_SUBJECT_THEME = {
  badge: 'bg-gray-100 text-gray-800',
  header: 'bg-gray-700',
  border: 'border-gray-200',
  button: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
};

export const SUBJECT_THEMES = {
  Matematika: {
    badge: 'bg-blue-100 text-blue-800',
    header: 'bg-blue-700',
    border: 'border-blue-200',
    button: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  },
  'Bahasa Indonesia': {
    badge: 'bg-green-100 text-green-800',
    header: 'bg-green-700',
    border: 'border-green-200',
    button: 'bg-green-100 text-green-700 hover:bg-green-200',
  },
  'Bahasa Inggris': {
    badge: 'bg-purple-100 text-purple-800',
    header: 'bg-purple-700',
    border: 'border-purple-200',
    button: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
  },
  Fisika: {
    badge: 'bg-orange-100 text-orange-800',
    header: 'bg-orange-600',
    border: 'border-orange-200',
    button: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
  },
  Kimia: {
    badge: 'bg-red-100 text-red-800',
    header: 'bg-red-700',
    border: 'border-red-200',
    button: 'bg-red-100 text-red-700 hover:bg-red-200',
  },
  Biologi: {
    badge: 'bg-emerald-100 text-emerald-800',
    header: 'bg-emerald-700',
    border: 'border-emerald-200',
    button: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
  },
  Sejarah: {
    badge: 'bg-amber-100 text-amber-800',
    header: 'bg-amber-700',
    border: 'border-amber-200',
    button: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
  },
  Geografi: {
    badge: 'bg-teal-100 text-teal-800',
    header: 'bg-teal-700',
    border: 'border-teal-200',
    button: 'bg-teal-100 text-teal-700 hover:bg-teal-200',
  },
  Ekonomi: {
    badge: 'bg-cyan-100 text-cyan-800',
    header: 'bg-cyan-700',
    border: 'border-cyan-200',
    button: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200',
  },
  Sosiologi: {
    badge: 'bg-indigo-100 text-indigo-800',
    header: 'bg-indigo-700',
    border: 'border-indigo-200',
    button: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
  },
  PKN: {
    badge: 'bg-rose-100 text-rose-800',
    header: 'bg-rose-700',
    border: 'border-rose-200',
    button: 'bg-rose-100 text-rose-700 hover:bg-rose-200',
  },
  'Seni Budaya': {
    badge: 'bg-pink-100 text-pink-800',
    header: 'bg-pink-700',
    border: 'border-pink-200',
    button: 'bg-pink-100 text-pink-700 hover:bg-pink-200',
  },
  Penjaskes: {
    badge: 'bg-lime-100 text-lime-800',
    header: 'bg-lime-700',
    border: 'border-lime-200',
    button: 'bg-lime-100 text-lime-700 hover:bg-lime-200',
  },
  TIK: {
    badge: 'bg-violet-100 text-violet-800',
    header: 'bg-violet-700',
    border: 'border-violet-200',
    button: 'bg-violet-100 text-violet-700 hover:bg-violet-200',
  },
};

/**
 * Get subject theme for card/badge usage.
 * @param {string} subject
 * @returns {{badge:string, header:string, border:string, button:string}}
 */
export const getSubjectTheme = (subject) => {
  return SUBJECT_THEMES[subject] || DEFAULT_SUBJECT_THEME;
};

/**
 * Get a tailwind color class for a given subject.
 * @param {string} subject
 * @returns {string} Tailwind background color class
 */
export const getSubjectColor = (subject) => {
  return getSubjectTheme(subject).badge;
};

const DEFAULT_SHORTCUT_CARD_THEME = {
  container: 'border-gray-200 bg-gray-50',
  label: 'text-gray-700',
  value: 'text-gray-800',
};

export const SHORTCUT_CARD_THEMES = {
  sky: {
    container: 'border-sky-100 bg-sky-50',
    label: 'text-sky-700',
    value: 'text-sky-800',
  },
  indigo: {
    container: 'border-indigo-100 bg-indigo-50',
    label: 'text-indigo-700',
    value: 'text-indigo-800',
  },
  amber: {
    container: 'border-amber-100 bg-amber-50',
    label: 'text-amber-700',
    value: 'text-amber-800',
  },
  emerald: {
    container: 'border-emerald-100 bg-emerald-50',
    label: 'text-emerald-700',
    value: 'text-emerald-800',
  },
  orange: {
    container: 'border-orange-100 bg-orange-50',
    label: 'text-orange-700',
    value: 'text-orange-800',
  },
  rose: {
    container: 'border-rose-100 bg-rose-50',
    label: 'text-rose-700',
    value: 'text-rose-800',
  },
  violet: {
    container: 'border-violet-100 bg-violet-50',
    label: 'text-violet-700',
    value: 'text-violet-800',
  },
};

/**
 * Get semantic theme for dashboard shortcut/metric cards.
 * @param {'sky'|'indigo'|'amber'|'emerald'|'orange'|'rose'|'violet'|string} tone
 * @returns {{container:string, label:string, value:string}}
 */
export const getShortcutCardTheme = (tone = 'sky') => {
  return SHORTCUT_CARD_THEMES[tone] || DEFAULT_SHORTCUT_CARD_THEME;
};
