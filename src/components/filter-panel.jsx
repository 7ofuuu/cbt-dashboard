'use client';

/**
 * FilterPanel — shared shell for the "Filter & Pencarian" card.
 *
 * Five list pages had reinvented the same chrome: header row with a Filter
 * icon, label, active-count badge, and a Reset button on the right; below it
 * a grid of inputs/selects supplied by the page. This component owns the
 * chrome; the page just composes its inputs as `children`.
 *
 * Pages stay in control of their filter state. `activeCount` and `onReset`
 * are wired explicitly so we don't have to bake any assumptions about
 * filter shape into the component itself.
 */
import { Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function FilterPanel({
  title = 'Filter & Pencarian',
  activeCount = 0,
  onReset,
  children,
  gridClassName = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3',
}) {
  return (
    <div className='bg-white border rounded-lg shadow-sm p-3 space-y-3'>
      <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
        <Filter className='w-4 h-4' />
        <span>{title}</span>
        {activeCount > 0 && (
          <Badge variant='secondary' className='ml-1 text-[10px] h-5'>
            {activeCount} aktif
          </Badge>
        )}
        <div className='flex-1' />
        {activeCount > 0 && onReset && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-8 text-xs'
            onClick={onReset}
          >
            <X className='w-3.5 h-3.5 mr-1' /> Reset
          </Button>
        )}
      </div>
      <div className={gridClassName}>{children}</div>
    </div>
  );
}
