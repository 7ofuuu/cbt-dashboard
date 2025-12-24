'use client';

import { useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import GuruLayout from '../../guruLayout';
import KelasCard from './components/KelasCard';

export default function ListKelasPage() {
  const params = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  
  const mataPelajaran = params?.get('mata') || 'Matematika';
  
  const getFilteredData = () => {
    return kelasData.filter(kelas =>
      kelas.nama.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const kelasData = [
    {
      id: 1,
      nama: 'XII - IPA 1',
      totalSiswa: 20,
      selesai: 19,
    },
    {
      id: 2,
      nama: 'XII - IPA 2',
      totalSiswa: 20,
      selesai: 20,
    },
    {
      id: 3,
      nama: 'XII - IPA 2',
      totalSiswa: 20,
      selesai: 20,
    },
    {
      id: 4,
      nama: 'XII - IPA 2',
      totalSiswa: 20,
      selesai: 20,
    },
  ];

  const filteredData = getFilteredData();

  return (
    <GuruLayout>
      <div>
        {/* Header Section */}
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            <Link href='/guru/hasil-ujian' className='text-gray-600 hover:text-gray-900'>
              Hasil Ujian
            </Link>
            {' › '}
            <span>{mataPelajaran}</span>
          </h1>

          {/* Search Bar */}
          <div className='relative'>
            <input
              type='text'
              placeholder='Cari Kelas'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
            />
            <Search className='absolute right-4 top-3 w-5 h-5 text-gray-400' />
          </div>
        </div>

        {/* Cards Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5'>
          {filteredData.length > 0 ? (
            filteredData.map(kelas => (
              <KelasCard key={kelas.id} kelas={kelas} />
            ))
          ) : (
            <div className='col-span-full text-center py-12'>
              <p className='text-gray-500 text-lg'>Kelas tidak ditemukan</p>
            </div>
          )}
        </div>
      </div>
    </GuruLayout>
  );
}
