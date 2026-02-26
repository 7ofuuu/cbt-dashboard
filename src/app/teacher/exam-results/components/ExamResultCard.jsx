'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';

const CARD_COLORS = ['bg-teal-700', 'bg-orange-500', 'bg-pink-500', 'bg-blue-600'];

function getColor(index) {
  return CARD_COLORS[index % CARD_COLORS.length];
}

export default function HasilUjianCard({ ujian, index = 0 }) {
  const completionRate = ujian.totalSiswa > 0
    ? Math.round((ujian.selesai / ujian.totalSiswa) * 100)
    : 0;
  const avg = Number(ujian.avgScore || 0);

  return (
    <Link href={`/teacher/exam-results/by-class?mata=${encodeURIComponent(ujian.mataPelajaran)}&ujianId=${ujian.id}`}>
      <Card className='hover:shadow-lg transition-all cursor-pointer h-full overflow-hidden flex flex-col group'>
        <div className={`${getColor(index)} text-white px-5 py-4`}>
          <h3 className='text-base font-bold leading-tight'>{ujian.examName || ujian.mataPelajaran}</h3>
          {ujian.examName && ujian.mataPelajaran && (
            <p className='text-sm opacity-80 mt-0.5'>{ujian.mataPelajaran}</p>
          )}
        </div>

        <div className='px-5 py-4 space-y-3 flex-grow'>
          {ujian.teacher && (
            <div className='flex justify-between text-sm'>
              <span className='text-gray-500'>Pembuat</span>
              <span className='font-medium text-blue-600 truncate ml-2 max-w-[120px]'>{ujian.teacher.full_name}</span>
            </div>
          )}
          <div className='flex justify-between text-sm'>
            <span className='text-gray-500'>Kelas</span>
            <span className='font-medium text-gray-900'>{ujian.jumlahKelas} kelas</span>
          </div>

          {/* Completion */}
          <div>
            <div className='flex justify-between text-sm mb-1.5'>
              <span className='text-gray-500'>Peserta</span>
              <span className='font-medium text-gray-900'>{ujian.selesai}/{ujian.totalSiswa}</span>
            </div>
            <div className='w-full bg-gray-100 rounded-full h-1.5 overflow-hidden'>
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${completionRate === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* Average Score */}
          {ujian.avgScore !== undefined && ujian.avgScore !== null && (
            <div className='flex items-center justify-between pt-2 border-t border-gray-100'>
              <span className='text-sm text-gray-500'>Rata-rata</span>
              <span className={`text-lg font-bold ${
                avg >= 75 ? 'text-green-600' : avg >= 50 ? 'text-yellow-600' : 'text-red-500'
              }`}>
                {avg.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}