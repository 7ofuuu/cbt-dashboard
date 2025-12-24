'use client';

import Link from 'next/link';

export default function HasilUjianCard({ ujian }) {
  return (
    <Link href={`/guru/hasil-ujian/list-kelas?mata=${ujian.mataPelajaran}`}>
      <div className='bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer h-full overflow-hidden'>
        {}
        <div className='bg-cyan-500 text-white px-5 py-3 rounded-t-lg'>
          <h3 className='text-base font-semibold'>{ujian.mataPelajaran}</h3>
          <p className='text-sm opacity-90'>{ujian.kelas}</p>
        </div>

        {}
        <div className='px-5 py-4 space-y-2'>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-700'>Jumlah kelas:</span>
            <span className='font-medium text-gray-900'>{ujian.jumlahKelas}</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-700'>Total siswa:</span>
            <span className='font-medium text-gray-900'>{ujian.totalSiswa}</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-700'>Selesai:</span>
            <span className='font-medium text-gray-900'>{ujian.selesai}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
