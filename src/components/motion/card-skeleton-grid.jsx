'use client';

/**
 * CardSkeletonGrid - placeholder cards shown while a list is loading.
 *
 * Three pages were each inlining their own near-identical skeleton: a
 * gradient header bar over a few animated lines. This consolidates that
 * pattern. Variants intentionally stay narrow - anything that diverges
 * meaningfully should keep its own bespoke skeleton rather than balloon
 * this component with branching.
 */
import { motion } from 'framer-motion';

const VARIANTS = {
  // Exam result / activity cards: gradient header + label rows + button slot.
  exam: () => (
    <>
      <div className='h-16 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse' />
      <div className='px-5 py-4 space-y-3'>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow narrow />
        <div className='h-2 bg-gray-100 rounded animate-pulse' />
        <div className='h-9 bg-gray-100 rounded animate-pulse mt-2' />
      </div>
    </>
  ),
  // Question bank cards: gradient header + title line + count + body.
  bank: () => (
    <>
      <div className='h-20 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse' />
      <div className='px-5 py-4 space-y-3'>
        <div className='h-3 bg-gray-200 rounded animate-pulse w-3/4' />
        <div className='flex items-baseline justify-between'>
          <div className='h-3 bg-gray-200 rounded animate-pulse w-1/3' />
          <div className='h-7 bg-gray-300 rounded animate-pulse w-10' />
        </div>
        <div className='space-y-2'>
          <div className='h-3 bg-gray-100 rounded animate-pulse' />
          <div className='h-3 bg-gray-100 rounded animate-pulse w-5/6' />
        </div>
        <div className='h-8 bg-gray-100 rounded animate-pulse mt-2' />
      </div>
    </>
  ),
  // Exam schedule cards: header + four bordered rows + action buttons.
  schedule: () => (
    <>
      <div className='h-14 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse' />
      <div className='p-4 space-y-2.5'>
        <SkeletonRow narrow />
        <SkeletonRow />
        <SkeletonRow narrow />
        <div className='space-y-1.5 pt-1'>
          <div className='h-2.5 bg-gray-100 rounded animate-pulse w-1/4' />
          <div className='h-3 bg-gray-200 rounded animate-pulse w-3/4' />
        </div>
        <div className='flex gap-2 pt-2'>
          <div className='h-8 bg-gray-100 rounded animate-pulse flex-1' />
          <div className='h-8 bg-gray-100 rounded animate-pulse w-10' />
        </div>
      </div>
    </>
  ),
  // Activity cards: like exam but with two extra date rows.
  activity: () => (
    <>
      <div className='h-16 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse' />
      <div className='p-4 space-y-3'>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow narrow />
        <div className='h-3 w-32 bg-gray-100 rounded animate-pulse mt-2' />
        <div className='h-3 w-32 bg-gray-100 rounded animate-pulse' />
      </div>
    </>
  ),
};

function SkeletonRow({ narrow = false }) {
  return (
    <div className='flex justify-between'>
      <div className={`h-3 ${narrow ? 'w-16' : 'w-24'} bg-gray-200 rounded animate-pulse`} />
      <div className='h-3 w-16 bg-gray-200 rounded animate-pulse' />
    </div>
  );
}

export default function CardSkeletonGrid({
  count = 8,
  variant = 'exam',
  className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5',
}) {
  const renderBody = VARIANTS[variant] || VARIANTS.exam;
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.04 }}
          className='rounded-lg bg-white shadow-sm border overflow-hidden flex flex-col'
        >
          {renderBody()}
        </motion.div>
      ))}
    </div>
  );
}
