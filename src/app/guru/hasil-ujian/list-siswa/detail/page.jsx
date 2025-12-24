'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import GuruLayout from '../../../guruLayout';

export default function DetailNilaiPage() {
  const params = useSearchParams();
  const mataPelajaran = params.get('mata') || 'Matematika';
  const kelas = params.get('kelas') || 'XII - IPA 1';
  const siswaId = params.get('siswaId') || '2';
  const nama = params.get('nama') || 'Bradley Walker';
  const email = params.get('email') || 'bradley@gmail.com';
  const kelasCode = params.get('kelasCode') || 'IPA 01';

  return (
    <GuruLayout>
      <div>
        {}
        <div className='mb-6 text-sm'>
          <h1 className='text-lg font-semibold text-gray-600 mb-4'>
            <span className='text-gray-400'>...</span>
            {' › '}
            <Link href={`/guru/hasil-ujian/list-siswa?mata=${encodeURIComponent(mataPelajaran)}&kelas=${encodeURIComponent(kelas)}`} className='text-gray-600 hover:text-gray-900'>
              {kelas}
            </Link>
            {' › '}
            <span className='text-gray-900 font-bold'>Beri Nilai</span>
          </h1>
        </div>

        {}
        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
          {}
          <div className='flex border-b border-gray-200'>
            {}
            <div className='flex-1 flex items-center gap-3 p-4'>
              <div className='w-14 h-14 rounded-full overflow-hidden bg-gray-300 flex-shrink-0'>
                <Image src='/next.svg' alt={nama} width={56} height={56} className='w-full h-full object-cover' />
              </div>

              <div className='flex-1'>
                <div className='flex items-center gap-2'>
                  <h2 className='text-base font-semibold text-gray-900'>{nama}</h2>
                  <div className='bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium'>
                    Siswa
                  </div>
                </div>
                <p className='text-xs text-gray-600'>{email}</p>
              </div>
            </div>

            {}
            <div className='flex-1 flex items-center justify-center border-l border-gray-200'>
              <div className='text-center'>
                <p className='text-lg font-semibold text-gray-900'>{mataPelajaran}</p>
                <p className='text-sm text-gray-600'>{kelasCode}</p>
              </div>
            </div>
          </div>

          {}
          <div className='grid grid-cols-[220px_1fr] gap-y-4 p-6'>
            <div className='text-gray-700 text-sm self-center'>Mulai di</div>
            <input
              type='text'
              defaultValue='Saturday, 12 June 2025, 9:00 AM'
              readOnly
              className='w-[720px] ml-auto px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900'
            />

            <div className='text-gray-700 text-sm self-center'>Status</div>
            <input
              type='text'
              defaultValue='Selesai'
              readOnly
              className='w-[720px] ml-auto px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900'
            />

            <div className='text-gray-700 text-sm self-center'>Nilai Pilihan Ganda</div>
            <input
              type='text'
              defaultValue='94'
              className='w-[720px] ml-auto px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900'
            />

            <div className='text-gray-700 text-sm self-center'>Selesai di</div>
            <input
              type='text'
              defaultValue='Saturday, 12 June 2025, 10:30 AM'
              readOnly
              className='w-[720px] ml-auto px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900'
            />

            <div className='text-gray-700 text-sm self-center'>Nilai Essay</div>
            <input
              type='text'
              defaultValue='N/A'
              className='w-[720px] ml-auto px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900'
            />
          </div>
        </div>

        {/* Button */}
        <div className='mt-6'>
          <button
            className='bg-blue-900 hover:bg-blue-800 text-white px-6 py-2.5 rounded-lg font-semibold transition'
            onClick={() => {
              const url = `/guru/hasil-ujian/list-siswa/detail/essay?mata=${encodeURIComponent(mataPelajaran)}&kelas=${encodeURIComponent(kelas)}&siswaId=${encodeURIComponent(siswaId)}&page=1`;
              window.location.href = url;
            }}
          >
            Nilai Essay
          </button>
        </div>
      </div>
    </GuruLayout>
  );
}
