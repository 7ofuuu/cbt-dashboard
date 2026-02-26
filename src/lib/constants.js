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

/**
 * Get a tailwind color class for a given subject.
 * @param {string} subject
 * @returns {string} Tailwind background color class
 */
export const getSubjectColor = (subject) => {
  const colors = {
    Matematika: 'bg-blue-100 text-blue-800',
    'Bahasa Indonesia': 'bg-green-100 text-green-800',
    'Bahasa Inggris': 'bg-purple-100 text-purple-800',
    Fisika: 'bg-orange-100 text-orange-800',
    Kimia: 'bg-red-100 text-red-800',
    Biologi: 'bg-emerald-100 text-emerald-800',
    Sejarah: 'bg-amber-100 text-amber-800',
    Geografi: 'bg-teal-100 text-teal-800',
    Ekonomi: 'bg-cyan-100 text-cyan-800',
    Sosiologi: 'bg-indigo-100 text-indigo-800',
    PKN: 'bg-rose-100 text-rose-800',
    'Seni Budaya': 'bg-pink-100 text-pink-800',
    Penjaskes: 'bg-lime-100 text-lime-800',
    TIK: 'bg-violet-100 text-violet-800',
  };
  return colors[subject] || 'bg-gray-100 text-gray-800';
};
