'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import GuruLayout from '../../guruLayout';

export default function ListSiswaPage() {
  const params = useSearchParams();
  const mataPelajaran = params.get('mata') || 'Matematika';
  const kelas = params.get('kelas') || 'XII - IPA 1';

  const [query, setQuery] = useState('');

  // Mock data siswa
  const siswaData = [
    { id: 1, email: 'braum@gmail.com', nama: 'Braum Chad', nilai: null, kelas: 'IPA 01', selesai: '06 Apr 2025' },
    { id: 2, email: 'bradley@gmail.com', nama: 'Bradley Walker', nilai: 94, kelas: 'IPA 01', selesai: '06 Apr 2025' },
    { id: 3, email: 'allen@gmail.com', nama: 'Allen Wane', nilai: null, kelas: 'IPA 01', selesai: '06 Apr 2025' },
    { id: 4, email: 'bruce@gmail.com', nama: 'Bruce Ley', nilai: 86, kelas: 'IPA 01', selesai: '06 Apr 2025' },
    { id: 5, email: 'bruce@gmail.com', nama: 'Bruce Ley', nilai: 86, kelas: 'IPA 01', selesai: '06 Apr 2025' },
  ];

  const filtered = siswaData.filter((s) => {
    const target = `${s.email} ${s.nama} ${s.kelas}`.toLowerCase();
    return target.includes(query.toLowerCase());
  });

  return (
    <GuruLayout>
      <div>
        {/* Breadcrumb title */}
        <h1 className='text-2xl font-bold text-gray-900 mb-4'>
          <Link href='/guru/hasil-ujian' className='text-gray-600 hover:text-gray-900'>
            Hasil Ujian
          </Link>
          {' › '}
          <Link href={`/guru/hasil-ujian/list-kelas?mata=${encodeURIComponent(mataPelajaran)}`} className='text-gray-600 hover:text-gray-900'>
            {mataPelajaran}
          </Link>
          {' › '}<span>{kelas}</span>
        </h1>

        {/* Search */}
        <div className='relative mb-4'>
          <input
            type='text'
            placeholder='Cari Siswa'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className='w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
          />
          <Search className='absolute right-4 top-3 w-5 h-5 text-gray-400' />
        </div>

        {/* Table */}
        <div className='overflow-x-auto bg-white rounded-lg border border-gray-200'>
          <table className='min-w-full text-sm'>
            <thead className='bg-gray-100 text-gray-700'>
              <tr>
                <th className='text-left px-4 py-3 w-24'>Foto</th>
                <th className='text-left px-4 py-3'>Mapel</th>
                <th className='text-left px-4 py-3'>Nama</th>
                <th className='text-left px-4 py-3'>Nilai</th>
                <th className='text-left px-4 py-3'>Kelas</th>
                <th className='text-left px-4 py-3'>Selesai</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className='border-t hover:bg-gray-50 cursor-pointer' onClick={() => window.location.href = `/guru/hasil-ujian/list-siswa/detail?mata=${encodeURIComponent(mataPelajaran)}&kelas=${encodeURIComponent(kelas)}&siswaId=${s.id}&nama=${encodeURIComponent(s.nama)}&email=${encodeURIComponent(s.email)}&kelasCode=${encodeURIComponent(s.kelas)}`}>
                  <td className='px-4 py-3'>
                    <div className='w-10 h-10 rounded-full overflow-hidden bg-gray-200'>
                      <Image src='/next.svg' alt={s.nama} width={40} height={40} className='w-full h-full object-cover' />
                    </div>
                  </td>
                  <td className='px-4 py-3 text-gray-900'>{s.email}</td>
                  <td className='px-4 py-3 text-gray-900'>{s.nama}</td>
                  <td className='px-4 py-3 text-gray-900'>{s.nilai === null ? 'Not Reviewed' : s.nilai}</td>
                  <td className='px-4 py-3 text-gray-900'>{s.kelas}</td>
                  <td className='px-4 py-3 text-gray-900'>{s.selesai}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </GuruLayout>
  );
}
