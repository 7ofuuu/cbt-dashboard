/**
 * Card accent colors used by exam-result, schedule, activity, and by-class
 * card grids. All four pages had their own `CARD_COLORS = [...]` + helper -
 * this is the single source of truth.
 *
 * The "solid" variant returns a Tailwind background class for cards whose
 * header is a flat color block. The "palette" variant returns a set of
 * matching tones (bg, light, text, bar) used by ClassCard where progress
 * bars and badges need to stay visually consistent with the header.
 */

const SOLID = ['bg-teal-700', 'bg-orange-500', 'bg-pink-500', 'bg-blue-600'];

const PALETTE = [
  { bg: 'bg-teal-700', light: 'bg-teal-50', text: 'text-teal-700', bar: 'bg-teal-500' },
  { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600', bar: 'bg-orange-500' },
  { bg: 'bg-pink-500', light: 'bg-pink-50', text: 'text-pink-600', bar: 'bg-pink-500' },
  { bg: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500' },
];

/** Cycle through the solid accent colors by zero-based index. */
export const getCardAccent = (index = 0) => SOLID[Math.abs(index) % SOLID.length];

/** Get a four-tone palette matching the same cycle as getCardAccent. */
export const getCardAccentPalette = (index = 0) => PALETTE[Math.abs(index) % PALETTE.length];
