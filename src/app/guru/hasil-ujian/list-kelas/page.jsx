'use client';

import { useEffect, useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import GuruLayout from '../../guruLayout';
import KelasCard from './components/KelasCard';
import request from '@/utils/request';

export default function ListKelasPage() {
  const params = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [kelasData, setKelasData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const mataPelajaran = params?.get('mata') || 'Matematika';
  const ujianId = params?.get('ujianId');
  
  useEffect(() => {
    if (ujianId) {
      fetchKelasData();
    }
  }, [ujianId]);
  
  const fetchKelasData = async () => {
    setIsLoading(true);
    try {
      // Fetch semua hasil ujian yang completed
      const response = await request.get('/hasil-ujian/completed-ujian');
      console.log('Fetched all ujian data:', response.data);
      
      // Filter untuk ujian yang dipilih
      let selectedUjian = null;
      if (response?.data?.ujians && Array.isArray(response.data.ujians)) {
        selectedUjian = response.data.ujians.find(u => u.ujian_id === parseInt(ujianId));
      }
      
      if (selectedUjian && selectedUjian.peserta_results) {
        // Group by kelas untuk mendapatkan unique classes
        const kelasMap = new Map();
        
        selectedUjian.peserta_results.forEach(item => {
          const kelasKey = item.siswa?.kelas;
          if (kelasKey) {
            if (!kelasMap.has(kelasKey)) {
              kelasMap.set(kelasKey, {
                id: kelasKey,
                nama: `${item.siswa?.tingkat || 'X'} - ${kelasKey}`,
                mataPelajaran: mataPelajaran,
                totalSiswa: 0,
                selesai: 0,
              });
            }
            
            const kelasItem = kelasMap.get(kelasKey);
            kelasItem.totalSiswa += 1;
            if (item.nilai_akhir) {
              kelasItem.selesai += 1;
            }
          }
        });
        
        const result = Array.from(kelasMap.values());
        console.log('Processed kelas data:', result);
        setKelasData(result);
      } else {
        console.warn('No data found for ujian:', ujianId);
        setKelasData([]);
      }
    } catch (error) {
      console.error('Error fetching kelas data:', error);
      setKelasData([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getFilteredData = () => {
    return kelasData.filter(kelas =>
      kelas.nama.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

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
          {isLoading ? (
            <div className='col-span-full text-center py-12'>
              <p className='text-gray-500 text-lg'>Memuat data...</p>
            </div>
          ) : filteredData.length > 0 ? (
            filteredData.map(kelas => (
              <KelasCard key={kelas.id} kelas={kelas} mataPelajaran={mataPelajaran} ujianId={ujianId} />
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
