'use client';

import Link from 'next/link';
import { Users } from 'lucide-react';
import { Card } from '@/components/ui/card';

const CARD_COLORS = [
  { bg: 'bg-teal-700', light: 'bg-teal-50', text: 'text-teal-700', bar: 'bg-teal-500' },
  { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-500' },
  { bg: 'bg-pink-500', light: 'bg-pink-50', text: 'text-pink-700', bar: 'bg-pink-500' },
  { bg: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500' },
];

function getColor(index) {
  return CARD_COLORS[index % CARD_COLORS.length];
}

export default function KelasCard({ classroom, mataPelajaran, ujianId, index = 0 }) {
  const color = getColor(index);
  const percentage = classroom.totalSiswa > 0
    ? Math.round((classroom.selesai / classroom.totalSiswa) * 100)
    : 0;

  return (
    <Link href={`/teacher/exam-results/student-list?mata=${encodeURIComponent(classroom.mataPelajaran || mataPelajaran || 'Matematika')}&classroom=${encodeURIComponent(classroom.full_name)}&ujianId=${ujianId}`}>
      <Card className='hover:shadow-lg transition-all h-full overflow-hidden cursor-pointer group'>
        <div className={`${color.bg} text-white px-5 py-4`}>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-bold tracking-wide'>{classroom.full_name}</h3>
            <div className='w-9 h-9 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition'>
              <Users className='w-4 h-4' />
            </div>
          </div>
        </div>

        <div className='px-5 py-4 space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-500'>Penyelesaian</span>
            <span className='text-sm font-semibold text-gray-900'>{classroom.selesai} / {classroom.totalSiswa}</span>
          </div>

          {/* Progress Bar */}
          <div className='w-full bg-gray-100 rounded-full h-2.5 overflow-hidden'>
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${percentage === 100 ? 'bg-green-500' : color.bar}`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className='flex items-center justify-between'>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              percentage === 100
                ? 'bg-green-100 text-green-700'
                : percentage > 0
                ? `${color.light} ${color.text}`
                : 'bg-gray-100 text-gray-500'
            }`}>
              {percentage}% selesai
            </span>
            <span className='text-xs text-gray-400'>{classroom.totalSiswa} siswa</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
