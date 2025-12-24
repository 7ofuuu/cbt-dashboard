'use client';

import Image from 'next/image';
import Link from 'next/link';
import GuruLayout from '../guruLayout';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';

export default function DashboardPage() {
  useAuth(['guru']);

  const ujian = [
    {
      id: 1,
      title: 'Matematika',
      kelas: 'XII - IPA',
      peserta: 86,
      status: 'Tidak Aktif',
      mulai: '08:30, 20 Juni 2025',
      akhir: '09:30, 20 Juni 2025',
      color: 'bg-teal-700 text-white',
    },
    {
      id: 2,
      title: 'Bahasa Indonesia',
      kelas: 'XII - IPA',
      peserta: 86,
      status: 'Tidak Aktif',
      mulai: '08:30, 20 Juni 2025',
      akhir: '09:30, 20 Juni 2025',
      color: 'bg-sky-700 text-white',
    },
  ];

  const bankSoal = [
    { id: 1, title: 'Sosiologi', kelas: 'XII - IPS', color: 'bg-orange-500' },
    { id: 2, title: 'Geografi', kelas: 'XII - IPS', color: 'bg-orange-500' },
    { id: 3, title: 'Ekonomi', kelas: 'XII - IPS', color: 'bg-orange-500' },
    { id: 4, title: 'Bahasa Indonesia', kelas: 'XII - Wajib', color: 'bg-violet-400' },
    { id: 5, title: 'Bahasa Inggris', kelas: 'XII - Wajib', color: 'bg-violet-400' },
  ];

  return (
    <GuruLayout>
      <div className='space-y-6'>
        {/* Hero */}
        <div className='rounded-xl p-6 bg-gradient-to-r from-blue-900 to-blue-700 text-white'>
          <div className='flex items-center gap-6'>
            <div className='w-24 h-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden'>
              <Image
                src='/dashboard_img.png'
                alt='Teacher'
                width={96}
                height={96}
                className='w-20 h-20 object-contain'
              />
            </div>
            <div>
              <h2 className='text-3xl font-bold mb-1'>Selamat Datang Guru</h2>
              <p className='text-blue-100 max-w-2xl'>Akses bank soal, jadwalkan ujian, dan hasilkan laporan nilai secara otomatis dalam beberapa klik.</p>
            </div>
          </div>
        </div>

        {/* Ujian Section */}
        <section>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-2xl font-bold'>Ujian</h3>
            <Link href='/guru/ujian' className='text-blue-800 font-medium hover:underline'>Lihat semua ››</Link>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {ujian.map(u => (
              <Card key={u.id} className='rounded-lg'>
                <div className='-mt-6 px-6'>
                  <div className={`rounded-t-lg px-4 py-3 ${u.color}`}>
                    <h4 className='text-white font-semibold'>{u.title}</h4>
                    <p className='text-white text-sm'>{u.kelas}</p>
                  </div>
                </div>
                <div className='px-6 pt-4 pb-6 bg-white rounded-b-lg -mt-2'>
                  <div className='text-sm text-gray-600 mb-1 flex justify-between'><span>Peserta :</span><span className='font-medium'>{u.peserta}</span></div>
                  <div className='text-sm text-gray-600 mb-1 flex justify-between'><span>Status :</span><span className='font-medium'>{u.status}</span></div>
                  <div className='text-sm text-gray-600 mb-1 flex justify-between'><span>Dimulai pada :</span><span className='font-medium'>{u.mulai}</span></div>
                  <div className='text-sm text-gray-600 flex justify-between'><span>Berakhir pada :</span><span className='font-medium'>{u.akhir}</span></div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Bank Soal Section */}
        <section>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-2xl font-bold'>Bank Soal</h3>
            <Link href='/guru/banksoal' className='text-blue-800 font-medium hover:underline'>Lihat semua ››</Link>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
            {bankSoal.map(b => (
              <Card key={b.id} className='rounded-lg'>
                <div className='-mt-6 px-6'>
                  <div className={`rounded-t-lg px-4 py-3 ${b.color} text-white` }>
                    <h4 className='font-semibold'>{b.title}</h4>
                    <p className='text-sm'>{b.kelas}</p>
                  </div>
                </div>
                <div className='px-6 pt-4 pb-6 bg-white rounded-b-lg -mt-2 text-sm text-gray-600'>
                  <div className='mb-2'>Isi Pilihan Ganda : <span className='font-medium'>98</span></div>
                  <div className='mb-2'>Isi Essay : <span className='font-medium'>5</span></div>
                  <div>Dibuat pada : <span className='font-medium'>20 Juni 2025</span></div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </GuruLayout>
  );
}
