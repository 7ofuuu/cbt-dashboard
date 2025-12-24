'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import GuruLayout from '../guruLayout';
import HasilUjianCard from './components/HasilUjianCard';

export default function HasilUjianPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Data mock - ganti dengan API call jika diperlukan
  const hasilUjianData = [
    {
      id: 1,
      mataPelajaran: 'Matematika',
      kelas: 'XII - IPA',
      jumlahKelas: 4,
      totalSiswa: 80,
      selesai: 76,
    },
    {
      id: 2,
      mataPelajaran: 'Kimia',
      kelas: 'XII - IPA',
      jumlahKelas: 4,
      totalSiswa: 80,
      selesai: 79,
    },
    {
      id: 3,
      mataPelajaran: 'Fisika',
      kelas: 'XII - IPA',
      jumlahKelas: 4,
      totalSiswa: 80,
      selesai: 80,
    },
  ];

  // Filter data berdasarkan search
  const filteredData = hasilUjianData.filter(ujian =>
    ujian.mataPelajaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ujian.kelas.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <GuruLayout>
      <div>
        {/* Header Section */}
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>Hasil Ujian</h1>

          {/* Search Bar */}
          <div className='relative'>
            <input
              type='text'
              placeholder='Cari Ujian'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
            />
            <Search className='absolute right-4 top-3 w-5 h-5 text-gray-400' />
          </div>
        </div>

        {/* Cards Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          {filteredData.length > 0 ? (
            filteredData.map(ujian => (
              <HasilUjianCard key={ujian.id} ujian={ujian} />
            ))
          ) : (
            <div className='col-span-full text-center py-12'>
              <p className='text-gray-500 text-lg'>Hasil ujian tidak ditemukan</p>
            </div>
          )}
        </div>
      </div>
    </GuruLayout>
  );
}
