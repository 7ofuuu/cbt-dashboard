'use client';

import Link from 'next/link';

export default function KelasCard({ kelas }) {
  return (
    <Link href={`/guru/hasil-ujian/list-siswa?mata=${encodeURIComponent(kelas.mataPelajaran || 'Matematika')}&kelas=${encodeURIComponent(kelas.nama)}`}>
    <div className='bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow h-full overflow-hidden cursor-pointer'>
      {/* Header dengan warna cyan */}
      <div className='bg-cyan-500 text-white px-5 py-3'>
        <h3 className='text-base font-semibold'>{kelas.nama}</h3>
      </div>

      {/* Content */}
      <div className='px-5 py-4 space-y-2'>
        <div className='flex justify-between text-sm'>
          <span className='text-gray-700'>Total siswa:</span>
          <span className='font-medium text-gray-900'>{kelas.totalSiswa}</span>
        </div>
        <div className='flex justify-between text-sm'>
          <span className='text-gray-700'>Selesai:</span>
          <span className='font-medium text-gray-900'>{kelas.selesai}</span>
        </div>
      </div>
    </div>
    </Link>
  );
}
